import React, { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "react-toastify";
import axios from "../../../../../api/axiosInstance";

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const plans = [
  {
    title: "Free Plan",
    price: "$0",
    credits: "50 Student Credits",
    features: ["Basic Dashboard Access", "Limited Email Support"],
    button: "Choose Free Plan",
    cardBg: "from-blue-50/80 to-blue-100/50",
    borderColor: "border-blue-200",
    titleColor: "text-blue-700",
    priceColor: "text-blue-900",
    buttonColor: "bg-white text-blue-700 border-2 border-blue-400 hover:bg-blue-50 shadow-sm",
    creditIconColor: "text-blue-600",
    checkmarkColor: "text-blue-600",
  },
  {
    title: "Standard Plan",
    price: "$10",
    credits: "500 Student Credits",
    features: ["Full Dashboard Access", "Priority Email Support"],
    button: "Choose Standard Plan",
    cardBg: "from-purple-50/80 to-purple-100/50",
    borderColor: "border-purple-200",
    titleColor: "text-purple-700",
    priceColor: "text-purple-900",
    buttonColor: "bg-white text-purple-700 border-2 border-purple-400 hover:bg-purple-50 shadow-sm",
    creditIconColor: "text-purple-600",
    checkmarkColor: "text-purple-600",
    paypalAmount: "10.00",
  },
  {
    title: "Premium Plan",
    price: "$25",
    credits: "2000 Student Credits",
    features: [
      "Full Dashboard Access",
      "Advanced Analytics",
      "Priority Email Support",
      "Early Access to Features",
    ],
    button: "Choose Premium Plan",
    cardBg: "from-emerald-50/80 to-emerald-100/50",
    borderColor: "border-emerald-300",
    titleColor: "text-emerald-700",
    priceColor: "text-emerald-900",
    buttonColor: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",
    creditIconColor: "text-emerald-600",
    checkmarkColor: "text-emerald-600",
    badge: "Most Popular",
    paypalAmount: "25.00",
  },
  {
    title: "Custom Plan",
    price: "Custom",
    credits: "Unlimited Credits",
    features: ["API & Bulk Upload Support", "Dedicated Success Manager"],
    button: "Choose Custom Plan",
    cardBg: "from-amber-50/80 to-amber-100/50",
    borderColor: "border-amber-200",
    titleColor: "text-amber-800",
    priceColor: "text-amber-900",
    buttonColor: "bg-white text-amber-800 border-2 border-amber-400 hover:bg-amber-50 shadow-sm",
    creditIconColor: "text-amber-600",
    checkmarkColor: "text-amber-600",
  },
];

const SubscriptionPlans = () => {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState(null);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const token = localStorage.getItem("schoolAdminToken");
        const { data } = await axios.get("/api/school-admin/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCurrentPlan(data.plan);
      } catch (error) {
        console.error("Failed to fetch current plan:", error);
        toast.error("Failed to load current plan");
      }
    };
    fetchCurrentPlan();
  }, []);

  const handleFreePlanActivation = async () => {
    if (currentPlan === "Free Plan") return;
    try {
      const token = localStorage.getItem("schoolAdminToken");
      await axios.post(
        "/api/school-admin/activate-free",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("✅ Free Plan Activated Successfully!");
      setCurrentPlan("Free Plan");
    } catch (err) {
      console.error("Free Plan activation error:", err);
      const errorMessage = err.response?.data?.message || "Something went wrong.";
      toast.error(`❌ Activation failed: ${errorMessage}`);
    }
  };

  const handlePaidPlanActivation = async (planTitle, orderId) => {
    try {
      const token = localStorage.getItem("schoolAdminToken");
      await axios.post(
        "/api/school-admin/payments/subscribe",
        {
          plan: planTitle,
          orderId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`✅ ${planTitle} activated successfully!`);
      setCurrentPlan(planTitle);
      setSelectedPlanForPayment(null);
    } catch (err) {
      console.error("Paid Plan activation error:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to activate plan after payment.";
      toast.error(`❌ Activation error: ${errorMessage}`);
    }
  };

  const handleContactSales = () => {
    toast.info("📞 Please contact sales at support@example.com");
  };

  const paypalClientIdToUse = PAYPAL_CLIENT_ID || "test";
  const selectedPlan = plans.find((p) => p.title === selectedPlanForPayment);

  return (
    <PayPalScriptProvider options={{ "client-id": paypalClientIdToUse }}>
      <div className="w-full bg-slate-50/50 py-4 px-2 sm:px-4 min-w-0 font-poppins">
        {/* Cohesive Header Aligned with Plans Grid */}
        <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-left">
              <span className="inline-block text-xs font-bold text-indigo-600 tracking-wider uppercase mb-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Internship Credit Plans
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Choose the Right Plan for Your Institution
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Unlock student credentials, automated onboarding, and verified certificate features.
              </p>
            </div>
            {currentPlan && (
              <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 shrink-0">
                <div className="text-xs text-slate-500 font-medium">Current Plan:</div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  {currentPlan}
                </div>
              </div>
            )}
          </div>
          {!PAYPAL_CLIENT_ID && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2 rounded-xl mt-3 font-medium">
              ⚠️ PayPal Client ID missing in frontend environment.
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const isCurrent = currentPlan === plan.title;

            return (
              <div
                key={index}
                className={`relative bg-gradient-to-b ${plan.cardBg} border-2 ${plan.borderColor} rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 w-full h-full`}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm border border-emerald-400">
                    {plan.badge}
                  </div>
                )}

                <div className="flex-1 flex flex-col">
                  {/* Plan Title */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-extrabold ${plan.titleColor}`}>
                      {plan.title}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-3 flex items-baseline gap-1">
                    <p className={`font-black ${plan.priceColor} ${plan.price === "Custom" ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
                      {plan.price}
                    </p>
                    {plan.price !== "Custom" && (
                      <span className="text-xs text-slate-500 font-medium">/ package</span>
                    )}
                  </div>

                  {/* Credits Badge */}
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200/60">
                    <svg
                      className={`w-4 h-4 flex-shrink-0 ${plan.creditIconColor}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    <p className={`text-xs font-bold ${plan.creditIconColor} truncate`}>
                      {plan.credits}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg
                          className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.checkmarkColor}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs text-slate-700 font-medium leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Uniformly Aligned Button Section */}
                <div className="mt-auto pt-4 border-t border-slate-200/60 w-full">
                  {plan.title === "Free Plan" ? (
                    <button
                      onClick={handleFreePlanActivation}
                      disabled={isCurrent}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${plan.buttonColor} ${
                        isCurrent ? "opacity-60 cursor-not-allowed border-slate-300 text-slate-500 bg-slate-100" : ""
                      }`}
                    >
                      {isCurrent ? "Current Plan" : plan.button}
                    </button>
                  ) : plan.title === "Standard Plan" || plan.title === "Premium Plan" ? (
                    <button
                      onClick={() => setSelectedPlanForPayment(plan.title)}
                      disabled={isCurrent}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${plan.buttonColor} ${
                        isCurrent ? "opacity-60 cursor-not-allowed border-slate-300 text-slate-500 bg-slate-100" : ""
                      }`}
                    >
                      {isCurrent ? "Current Plan" : plan.button}
                    </button>
                  ) : (
                    <button
                      onClick={handleContactSales}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${plan.buttonColor}`}
                    >
                      {plan.button}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dedicated Payment Modal for Perfect Alignment on iPad Mini and all devices */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 max-w-md w-full relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedPlanForPayment(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
                aria-label="Close"
              >
                &times;
              </button>

              <div className="text-center mb-6">
                <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 ${selectedPlan.creditIconColor} bg-slate-100`}>
                  {selectedPlan.credits}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Subscribe to {selectedPlan.title}
                </h3>
                <p className="text-3xl font-black text-indigo-600 mt-2">
                  {selectedPlan.price}
                  <span className="text-xs font-medium text-slate-500"> / package</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 mb-5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                {selectedPlan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="w-full">
                <PayPalButtons
                  style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "paypal",
                    height: 44,
                  }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: {
                            value: selectedPlan.paypalAmount,
                            currency_code: "USD",
                          },
                          description: `${selectedPlan.credits} - ${selectedPlan.title}`,
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    try {
                      const order = await actions.order.capture();
                      await handlePaidPlanActivation(selectedPlan.title, order.id);
                    } catch (err) {
                      console.error("PayPal capture error:", err);
                      toast.error("❌ Payment capture failed.");
                    }
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    toast.error("❌ Payment failed. Please try again.");
                  }}
                />
              </div>

              <button
                onClick={() => setSelectedPlanForPayment(null)}
                className="w-full mt-3 text-xs font-semibold text-slate-500 hover:text-slate-800 text-center py-2 transition hover:underline"
              >
                Cancel & Return to Plans
              </button>
            </div>
          </div>
        )}
      </div>
    </PayPalScriptProvider>
  );
};

export default SubscriptionPlans;