// src/components/Partner/PartnerPremiumPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Check from "../../../../assets/check.svg";
import { useSelector } from "react-redux";

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const plans = [
  {
    title: "Freemium Partner",
    price: "0.00",
    duration: 0,
    features: [
      "Post up to 2 active internships",
      "Free & Stipend-Based internships only",
      "Manual shortlisting of applicants",
      "Basic internship scheduling tools",
      "Send standard offer letters",
      "Mentor details visible on listing",
      "Admin approval required for posting",
      "Email-only support",
      "Application notifications (basic)",
    ],
    btnText: "You’re Already on Free",
    disabled: true,
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  {
    title: "Premium Basic",
    price: "9.99",
    duration: 1,
    features: [
      "Unlimited internship postings",
      "Free, Stipend-Based & Paid internships",
      "Manual + Basic AI shortlisting tool",
      "Structured internship scheduling",
      "Customizable offer letter templates",
      "Logo visibility on internship cards",
      "Priority admin approval for job posts",
      "View basic analytics (views, applications)",
      "Priority email support",
    ],
    btnText: "Upgrade to Premium Basic",
    disabled: false,
    bg: "bg-purple-50",
    border: "border-purple-300",
  },
  {
    title: "Premium Plus",
    price: "19.99",
    duration: 1,
    features: [
      "All Premium Basic features",
      "Advanced AI-powered shortlisting",
      "Calendar-synced scheduling with auto updates",
      "Smart offer letters with acceptance tracking",
      "Featured internship posts with highlight badge",
      "Full analytics: engagement & drop-off metrics",
      "Downloadable resume books",
      "Monthly insight reports to email",
      "Real-time notifications for applications",
      "Live chat & email support",
    ],
    btnText: "Upgrade to Premium Plus",
    disabled: false,
    bg: "bg-orange-50",
    border: "border-orange-300",
  },
];

export default function PartnerPremiumPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  const reduxPartner = useSelector((s) => s.auth?.partnerInfo);
  const stored = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const partner = reduxPartner || stored;

  // 1) Dynamically load the PayPal SDK
useEffect(() => {
  if (!PAYPAL_CLIENT_ID) {
    setAlert({ type: "error", message: "PayPal Client ID not set. Check .env" });
    return;
  }

  if (window.paypal) {
    setSdkReady(true);
    return;
  }

  const script = document.createElement("script");
  script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
  script.async = true;
  script.onload = () => setSdkReady(true);
  script.onerror = () =>
    setAlert({ type: "error", message: "Failed to load PayPal SDK. Check Client ID." });

  document.body.appendChild(script);

  return () => {
    // 💡 SAFELY remove script tag
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  };
}, []);


  // 2) Whenever a plan is selected & SDK is ready, render its PayPalButtons
  useEffect(() => {
    if (selectedIndex === null || !sdkReady || !paymentData) return;
    const containerId = `paypal-button-container-${selectedIndex}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    window.paypal
      .Buttons({
        createOrder: async () => {
          try {
            const { data } = await axios.post("/api/partner/payments/paypal/order", {
              amount: paymentData.amount,
              partnerId: paymentData.partner._id,
              planType: paymentData.planType,
              email: paymentData.partner.email,
              duration: paymentData.duration,
            });
            return data.id;
          } catch (err) {
            console.error("Order creation failed:", err);
            setAlert({ type: "error", message: "Unable to create PayPal order." });
            throw err;
          }
        },
        onApprove: async (data) => {
          try {
            const { data: verify } = await axios.post("/api/partner/payments/paypal/verify", {
              orderID: data.orderID,
              partnerId: paymentData.partner._id,
              planType: paymentData.planType,
              amount: paymentData.amount,
              email: paymentData.partner.email,
              duration: paymentData.duration,
            });
            if (verify.success) {
              setAlert({ type: "success", message: "Payment verified successfully!" });
              // update localStorage so UI reflects premium status
              const updated = {
                ...paymentData.partner,
                isPremium: true,
                planType: verify.partner.planType,
                premiumExpiration: verify.partner.premiumExpiration,
              };
              localStorage.setItem("userInfo", JSON.stringify(updated));
            } else {
              setAlert({ type: "error", message: "Payment verification failed." });
            }
          } catch (err) {
            console.error("Verification failed:", err);
            setAlert({ type: "error", message: "Payment verification error." });
          } finally {
            setSelectedIndex(null);
          }
        },
        onCancel: () => {
          console.log("User canceled the payment");
          setSelectedIndex(null);
        },
        onError: (err) => {
          console.error("PayPal error:", err);
          setAlert({ type: "error", message: "Payment failed. Try again." });
          setSelectedIndex(null);
        },
      })
      .render(`#${containerId}`);
  }, [selectedIndex, paymentData, sdkReady]);

  const selectPlan = (plan, idx) => {
    if (!sdkReady) {
      setAlert({ type: "error", message: "PayPal is still loading. Try again shortly." });
      return;
    }
    // don’t re-render the free tier
    if (plan.price === "0.00") return;
    setPaymentData({ amount: plan.price, planType: plan.title, duration: plan.duration, partner });
    setSelectedIndex(idx);
  };

  return (
    <div className="p-6 font-poppins min-h-screen bg-white">
      {alert && (
        <div
          className={`fixed top-4 right-4 p-3 rounded shadow ${
            alert.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {alert.message}
        </div>
      )}
      <h2 className="text-2xl font-semibold text-center mb-8">Choose Your Partner Plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-6 flex flex-col justify-between ${plan.bg} ${plan.border}`}
          >
            <div>
              <h3 className="text-xl font-semibold mb-2">{plan.title}</h3>
              <p className="text-2xl font-bold text-orange-600 mb-1">${plan.price}</p>
              <p className="text-sm text-gray-600 mb-4">
                Duration: {plan.duration ? `${plan.duration} month` : "Unlimited"}
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <img src={Check} alt="✓" className="w-4 h-4 mt-1" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => selectPlan(plan, idx)}
              disabled={plan.disabled}
              className={`mt-4 py-2 rounded text-white ${
                plan.disabled ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {plan.disabled ? `On ${plan.title}` : plan.btnText}
            </button>
            {selectedIndex === idx && (
              <div id={`paypal-button-container-${idx}`} className="mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
