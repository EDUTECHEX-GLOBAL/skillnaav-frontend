import React, { useState, useEffect } from "react";
import axios from "../../../../api/axiosInstance";

function PremiumPage() {
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

    <div className="max-w-7xl mx-auto mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

  {/* LEFT SIDE */}
  <div>
    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 mb-4">
      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
      <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase">
        Student Premium Plans
      </span>
    </div>

    {/* Title */}
    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
      Choose Your Student Plan
    </h1>

    {/* Accent line */}
    <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mt-3 rounded-full"></div>
  </div>

  {/* RIGHT SIDE - ACTIVE PLAN */}
  {isPremium && (() => {
    const { expDate, timeLeftText } = getBannerData();

    return (
      <div className="w-full lg:w-auto bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center">

        {/* Plan Info */}
        <div>
          <p className="text-xs font-bold tracking-widest text-purple-600 uppercase mb-1">
            Student Premium Active
          </p>
          <h2 className="text-xl font-bold text-purple-700">
            {planType || "Premium"}
          </h2>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 bg-purple-200"></div>

        {/* Time Left */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase">
            Time Left
          </p>
          <p className="text-sm font-bold text-purple-700">
            {timeLeftText}
          </p>
        </div>

        {/* Expiry */}
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase">
            Expires On
          </p>
          <p className="text-sm font-semibold text-gray-700">
            {expDate && !isNaN(expDate)
              ? expDate.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "N/A"}
          </p>
        </div>
      </div>
    );
  })()}

</div>

      {/* ✅ Premium Active Banner */}
      {/* {isPremium && (() => {
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
      })()} */}

     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
  {pricingcard.map((card, index) => {
    const isCurrentActivePlan = isPremium && card.plantype === planType;

    const themes = [
      {
        bg: "from-green-50 to-green-100",
        border: "border-green-200",
        title: "text-green-700",
        price: "text-green-900",
        btn: "bg-white text-green-700 border-2 border-green-400 hover:bg-green-50",
      },
      {
        bg: "from-purple-50 to-purple-100",
        border: "border-purple-200",
        title: "text-purple-700",
        price: "text-purple-900",
        btn: "bg-white text-purple-700 border-2 border-purple-400 hover:bg-purple-50",
      },
      {
        bg: "from-orange-50 to-orange-100",
        border: "border-orange-200",
        title: "text-orange-700",
        price: "text-orange-900",
        btn: "bg-white text-orange-700 border-2 border-orange-400 hover:bg-orange-50",
      },
    ];

    const theme = themes[index % themes.length];

    return (
      <div
        key={index}
        className={`bg-gradient-to-b ${theme.bg} border-2 ${theme.border} rounded-3xl p-8 flex flex-col justify-between transition-all hover:shadow-xl hover:scale-105`}
      >
        {/* Top Section */}
        <div>
          <h3 className={`text-2xl font-bold ${theme.title} mb-4`}>
            {card.plantype}
          </h3>

          <p className="text-gray-600 text-sm mb-4">
            {card.plantypesubhead}
          </p>

          <p className={`text-5xl font-bold ${theme.price} mb-2`}>
            {card.price}
          </p>

          <p className="text-sm text-gray-600 mb-6">
            Duration: {card.durationLabel}
          </p>

          <div className="border-t border-gray-200 my-4"></div>

          <ul className="space-y-3">
            {[card.pricepoint1, card.pricepoint2, card.pricepoint3].map(
              (point, i) =>
                point && (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-green-500">✔</span>
                    {point}
                  </li>
                )
            )}
          </ul>
        </div>

        {/* Button */}
        <button
          onClick={() =>
            handlePayment(card.price, card.plantype, card.duration, index)
          }
          disabled={isCurrentActivePlan || isProcessing}
          className={`mt-8 py-3 rounded-lg font-semibold transition-all ${theme.btn} ${
            isCurrentActivePlan ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {isCurrentActivePlan ? "✓ Subscribed" : card.pricebtn}
        </button>

        {/* PayPal container (UNCHANGED LOGIC) */}
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