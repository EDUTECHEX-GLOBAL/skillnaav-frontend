import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import Check from "../../../../assets/check.svg";

function PremiumPage() {
  const { skillnaavData } = useSelector((state) => state.root);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [isPremium, setIsPremium] = useState(false);
  const [planType, setPlanType] = useState("Free");
  const [sdkReady, setSdkReady] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  // Fetch premium status on mount and sync localStorage & state
  useEffect(() => {
    const fetchPremiumStatus = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("userToken"));
        if (!token) return;
        const { data } = await axios.get("/api/users/premium-status", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const storedUserInfo = JSON.parse(localStorage.getItem("userInfo")) || {};

        // Update localStorage with fresh premium info
        const updatedUserInfo = {
          ...storedUserInfo,
          isPremium: data.isPremium,
          planType: data.planType,
          premiumExpiration: data.premiumExpiration,
        };
        localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));

        setIsPremium(data.isPremium);
        setPlanType(data.planType || "Free");
      } catch (err) {
        console.error("Failed to fetch premium status:", err);
      }
    };

    fetchPremiumStatus();
  }, []);

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
            const orderRes = await axios.post("/api/payments/paypal/order", {
              amount: paymentData.amount,
              planType: paymentData.planType,
              duration: paymentData.duration,
              userId: paymentData.userInfo._id,
              email: paymentData.userInfo.email,
            });
            return orderRes.data.id;
          } catch (err) {
            console.error("Create order failed:", err);
            showAlert("Unable to create PayPal order.", "error");
          }
        },
        onApprove: async (data) => {
          try {
            const verifyRes = await axios.post("/api/payments/paypal/verify", {
              orderID: data.orderID,
              amount: paymentData.amount,
              planType: paymentData.planType,
              duration: paymentData.duration,
              userId: paymentData.userInfo._id,
              email: paymentData.userInfo.email,
            });

            if (verifyRes.data.success) {
              showAlert("Payment verified successfully!", "success");

              // Save new premium info in localStorage & state
              paymentData.userInfo.isPremium = true;
              paymentData.userInfo.planType = verifyRes.data.user.planType;
              paymentData.userInfo.premiumExpiration = verifyRes.data.user.premiumExpiration;

              localStorage.setItem("userInfo", JSON.stringify(paymentData.userInfo));
              setIsPremium(true);
              setPlanType(verifyRes.data.user.planType);
              setSelectedPlanIndex(null);
            } else {
              showAlert("Payment verification failed.", "error");
            }
          } catch (err) {
            console.error("Verify failed:", err);
            showAlert("Payment verification error.", "error");
          }
        },
        onError: (err) => {
          console.error("PayPal error:", err);
          showAlert("Payment failed. Try again.", "error");
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
    const amount = parseFloat(amountString.replace(/[^0-9.]/g, ""));
    setSelectedPlanIndex(index);
    setPaymentData({ amount, planType, duration, userInfo });
  };

  const pricingcard = [
    {
      plantype: "Free",
      plantypesubhead: "Basic access to explore internships",
      price: "$0",
      duration: "1 month",
      pricebtn: "Start Free",
      pricepoint1: "Apply to 5 internships",
      pricepoint2: "Save 3 internships",
      pricepoint3: "Basic AI suggestions",
    },
    {
      plantype: "Premium Basic",
      plantypesubhead: "Tools for active internship seekers",
      price: "$2.99",
      duration: "2 days",
      pricebtn: "Subscribe",
      pricepoint1: "Apply up to 25 internships",
      pricepoint2: "Resume builder + career assistant",
      pricepoint3: "Monthly mentorship + interview tips",
    },
    {
      plantype: "Premium Plus",
      plantypesubhead: "Everything you need to succeed",
      price: "$6.99",
      duration: "7 days",
      pricebtn: "Subscribe",
      pricepoint1: "Unlimited applications & saves",
      pricepoint2: "Mock AI interviews & resume AI",
      pricepoint3: "Mentorship + full AI insights",
    },
  ];

  const colorStyles = [
    {
      bg: "bg-teal-100",
      text: "text-teal-700",
      subtext: "text-teal-900",
      hoverBg: "hover:bg-teal-200",
    },
    {
      bg: "bg-purple-100",
      text: "text-purple-700",
      subtext: "text-purple-900",
      hoverBg: "hover:bg-purple-200",
    },
    {
      bg: "bg-orange-100",
      text: "text-orange-700",
      subtext: "text-orange-900",
      hoverBg: "hover:bg-orange-200",
    },
  ];

  return (
    <div id="pricing" className="py-12 my-12 pb-12 lg:py-16 relative">
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

      <h1 className="text-center font-medium text-2xl lg:text-4xl text-gray-900 mb-6">
        Choose Your Plan
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row flex-wrap justify-center">
        {pricingcard.map((card, index) => {
          const color = colorStyles[index % colorStyles.length];
          const localUser = JSON.parse(localStorage.getItem("userInfo")) || {};
          const isCurrentActivePlan = localUser.isPremium && card.plantype === localUser.planType;

          return (
            <div
              key={index}
              className={`w-full max-w-md ${color.bg} p-6 flex flex-col justify-between shadow-lg rounded-lg`}
              style={{ marginTop: "20px" }}
            >
              <div>
                <h3 className={`font-medium ${color.text} text-xl lg:text-2xl`}>
                  {card.plantype}
                </h3>
                <p className={`pt-3 ${color.subtext} lg:text-lg`}>
                  {card.plantypesubhead}
                </p>
                <h2 className={`pt-4 text-2xl font-medium ${color.text} lg:text-3xl`}>
                  {card.price}
                </h2>
                <p className={`pt-2 ${color.subtext} lg:text-lg`}>
                  Duration: {card.duration}
                </p>

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
                className={`mt-4 bg-white py-3 text-center ${color.text} font-medium rounded ${color.hoverBg} transition`}
                disabled={isCurrentActivePlan}
              >
                {isCurrentActivePlan ? "Subscribed" : card.pricebtn}
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
