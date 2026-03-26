import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import Check from "../../../../assets/check.svg";

function PremiumPage() {
  const { skillnaavData } = useSelector((state) => state.root);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState("Free");
  const [premiumExpiration, setPremiumExpiration] = useState(null); // ✅ State-driven
  const [sdkReady, setSdkReady] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // ✅ Loading state

  // ─── Fetch premium status on mount ───
  useEffect(() => {
    const fetchPremiumStatus = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (!token) return;

        const { data } = await axios.get("/api/users/premium-status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success && data.user) {
          const updatedUser = {
            ...(JSON.parse(localStorage.getItem("userInfo")) || {}),
            isPremium: data.user.isPremium,
            planType: data.user.planType,
            premiumExpiration: data.user.premiumExpiration,
          };

          localStorage.setItem("userInfo", JSON.stringify(updatedUser));

          // ✅ Fixed: use actual API value, not hardcoded true
          setIsPremium(data.user.isPremium);
          setPlanType(data.user.planType || "Free");
          setPremiumExpiration(data.user.premiumExpiration || null);
        }
      } catch (err) {
        console.error("Failed to fetch premium status:", err);
      }
    };

    fetchPremiumStatus();
  }, []);

  // ─── Load PayPal SDK ───
  useEffect(() => {
    if (!process.env.REACT_APP_PAYPAL_CLIENT_ID) {
      setAlert({
        show: true,
        message: "PayPal Client ID not set. Please check your .env file.",
        type: "error",
      });
      return;
    }

    if (window.paypal) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => {
      setAlert({
        show: true,
        message: "Failed to load PayPal SDK. Check your Client ID.",
        type: "error",
      });
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // ─── Render PayPal Buttons ───
  useEffect(() => {
    if (selectedPlanIndex === null || !paymentData || !sdkReady) return;

    const containerId = `paypal-button-container-${selectedPlanIndex}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    window.paypal
      .Buttons({
        createOrder: async () => {
          try {
            const token = localStorage.getItem("userToken");
            const orderRes = await axios.post(
              "/api/payments/paypal/order",
              {
                amount: paymentData.amount,
                planType: paymentData.planType,
                duration: paymentData.duration,
                userId: paymentData.userInfo._id,
                email: paymentData.userInfo.email,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return orderRes.data.id;
          } catch (err) {
            console.error("Create order failed:", err);
            showAlert("Unable to create PayPal order.", "error");
            throw err; // ✅ Fixed: throw so PayPal SDK doesn't receive undefined
          }
        },

        onApprove: async (data, actions) => {
          setIsProcessing(true); // ✅ Show processing overlay
          try {
            const token = localStorage.getItem("userToken");
            const verifyRes = await axios.post(
              "/api/payments/paypal/verify",
              {
                orderID: data.orderID,
                amount: paymentData.amount,
                planType: paymentData.planType,
                duration: paymentData.duration,
                userId: paymentData.userInfo._id,
                email: paymentData.userInfo.email,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              showAlert("Payment verified successfully!", "success");

              const updatedUser = {
                ...paymentData.userInfo,
                isPremium: true,
                planType: verifyRes.data.user.planType,
                premiumExpiration: verifyRes.data.user.premiumExpiration,
              };

              localStorage.setItem("userInfo", JSON.stringify(updatedUser));

              // ✅ Update React state from server response
              setIsPremium(true);
              setPlanType(updatedUser.planType);
              setPremiumExpiration(updatedUser.premiumExpiration);
              setSelectedPlanIndex(null);
              setPaymentData(null);

              // ✅ Notify Navbar to re-read updated userInfo
              window.dispatchEvent(new Event("userInfoUpdated"));
            } else {
              showAlert("Payment verification failed.", "error");
            }
          } catch (err) {
            const issue =
              err.response?.data?.details?.details?.[0]?.issue ||
              err.response?.data?.details?.[0]?.issue;

            if (issue === "INSTRUMENT_DECLINED") {
              setIsProcessing(false);
              return actions.restart();
            }

            console.error("Verify failed:", err);
            showAlert("Payment failed. Please try again.", "error");
          } finally {
            setIsProcessing(false); // ✅ Always clear loading
          }
        },

        onError: (err) => {
          console.error("PayPal button error:", err);
          showAlert("PayPal encountered an error. Please try again.", "error");
          setIsProcessing(false);
        },

        onCancel: () => {
          showAlert("Payment cancelled.", "error");
          setSelectedPlanIndex(null);
          setPaymentData(null);
        },
      })
      .render(`#${containerId}`);
  }, [selectedPlanIndex, paymentData, sdkReady]);

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const handlePayment = (amountString, planType, duration, index) => {
    if (!sdkReady) {
      showAlert("PayPal is still loading. Try again shortly.", "error");
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo?._id) {
      showAlert("User session not found. Please log in again.", "error");
      return;
    }

    const amount = parseFloat(amountString.replace(/[^0-9.]/g, ""));
    setSelectedPlanIndex(index);
    setPaymentData({ amount, planType, duration, userInfo });
  };

  // ✅ Fixed: duration is now a clean numeric string — parseInt("30") = 30 days
  const pricingcard = [
    {
      plantype: "Free",
      plantypesubhead: "Basic access to explore internships",
      price: "$0",
      duration: "30",         // ✅ Was "1 month" → parseInt gave only 1 day
      durationLabel: "30 days",
      pricebtn: "Start Free",
      pricepoint1: "Apply to 5 internships",
      pricepoint2: "Save 3 internships",
      pricepoint3: "Basic AI suggestions",
    },
    {
      plantype: "Premium Basic",
      plantypesubhead: "Tools for active internship seekers",
      price: "$2.99",
      duration: "2",
      durationLabel: "2 days",
      pricebtn: "Subscribe",
      pricepoint1: "Apply up to 25 internships",
      pricepoint2: "Resume builder + career assistant",
      pricepoint3: "Monthly mentorship + interview tips",
    },
    {
      plantype: "Premium Plus",
      plantypesubhead: "Everything you need to succeed",
      price: "$6.99",
      duration: "7",
      durationLabel: "7 days",
      pricebtn: "Subscribe",
      pricepoint1: "Unlimited applications & saves",
      pricepoint2: "Mock AI interviews & resume AI",
      pricepoint3: "Mentorship + full AI insights",
    },
  ];

  const colorStyles = [
    { bg: "bg-teal-100", text: "text-teal-700", subtext: "text-teal-900", hoverBg: "hover:bg-teal-200" },
    { bg: "bg-purple-100", text: "text-purple-700", subtext: "text-purple-900", hoverBg: "hover:bg-purple-200" },
    { bg: "bg-orange-100", text: "text-orange-700", subtext: "text-orange-900", hoverBg: "hover:bg-orange-200" },
  ];

  // ✅ Banner reads from React state, not localStorage
  const getBannerData = () => {
    const rawExp = premiumExpiration;
    const expDate = rawExp ? new Date(rawExp?.$date || rawExp) : null;
    const now = new Date();
    let timeLeftText = "Expired";

    if (expDate && !isNaN(expDate) && expDate > now) {
      const diff = expDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      timeLeftText = `${days}d ${hours}h ${mins}m`;
    }

    return { expDate, timeLeftText };
  };

  return (
    <div id="pricing" className="py-12 my-12 pb-12 lg:py-16 relative">
      {/* Alert */}
      {alert.show && (
        <div
          className={`fixed top-4 right-4 border-l-4 p-4 ${
            alert.type === "success"
              ? "bg-green-100 border-green-400 text-green-700"
              : "bg-red-100 border-red-400 text-red-700"
          } rounded-lg shadow-lg z-50`}
          role="alert"
        >
          <p className="font-medium">{alert.message}</p>
        </div>
      )}

      {/* ✅ Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-purple-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-700 font-medium">Verifying payment...</p>
          </div>
        </div>
      )}

      <h1 className="text-center font-medium text-2xl lg:text-4xl text-gray-900 mb-6">
        Choose Your Plan
      </h1>

      {/* ✅ Premium Active Banner */}
      {isPremium && (() => {
        const { expDate, timeLeftText } = getBannerData();
        return (
          <div className="max-w-xl mx-auto p-4 mb-8 rounded-lg shadow-md bg-gradient-to-r from-yellow-100 to-yellow-200 border-l-4 border-yellow-500">
            <h2 className="text-lg font-semibold text-yellow-900">
              🌟 Premium Active — {planType}
            </h2>
            <p className="text-yellow-800 mt-1">
              Expires on:{" "}
              <span className="font-semibold">
                {expDate && !isNaN(expDate)
                  ? expDate.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </span>
            </p>
            <p className="text-yellow-700 mt-1">
              Time left: <span className="font-medium">{timeLeftText}</span>
            </p>
          </div>
        );
      })()}

      <div className="flex flex-col gap-6 lg:flex-row flex-wrap justify-center">
        {pricingcard.map((card, index) => {
          const color = colorStyles[index % colorStyles.length];
          // ✅ Use React state, not localStorage
          const isCurrentActivePlan = isPremium && card.plantype === planType;

          return (
            <div
              key={index}
              className={`w-full max-w-md ${color.bg} p-6 flex flex-col justify-between shadow-lg rounded-lg`}
              style={{ marginTop: "20px" }}
            >
              <div>
                <h3 className={`font-medium ${color.text} text-xl lg:text-2xl`}>{card.plantype}</h3>
                <p className={`pt-3 ${color.subtext} lg:text-lg`}>{card.plantypesubhead}</p>
                <h2 className={`pt-4 text-2xl font-medium ${color.text} lg:text-3xl`}>{card.price}</h2>
                <p className={`pt-2 ${color.subtext} lg:text-lg`}>Duration: {card.durationLabel}</p>

                <ul className={`flex flex-col gap-2 pt-4 ${color.subtext}`}>
                  {[card.pricepoint1, card.pricepoint2, card.pricepoint3].map(
                    (point, i) =>
                      point && (
                        <li key={i} className="flex items-center gap-2">
                          <img src={Check} alt="included" width={16} height={16} />
                          {point}
                        </li>
                      )
                  )}
                </ul>
              </div>

              <button
                onClick={() => handlePayment(card.price, card.plantype, card.duration, index)}
                className={`mt-4 bg-white py-3 text-center ${color.text} font-medium rounded ${color.hoverBg} transition disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isCurrentActivePlan || isProcessing}
              >
                {isCurrentActivePlan ? "✓ Subscribed" : card.pricebtn}
              </button>

              {selectedPlanIndex === index && (
                <div id={`paypal-button-container-${index}`} className="mt-4"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PremiumPage;
