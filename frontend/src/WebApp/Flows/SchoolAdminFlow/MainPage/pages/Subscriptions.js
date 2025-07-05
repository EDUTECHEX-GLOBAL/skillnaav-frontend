import React, { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

const plans = [
  {
    title: "Free Plan",
    price: "$0",
    period: "/ Month",
    credits: "50 Student Credits",
    features: ["Basic Dashboard Access", "Limited Email Support"],
    button: "Get Started",
    color: "bg-blue-100",
    textColor: "text-blue-800",
    buttonColor: "bg-white text-blue-700 border border-blue-500",
  },
  {
    title: "Standard Plan",
    price: "$10",
    period: "/ Month",
    credits: "500 Student Credits",
    features: ["Full Dashboard Access", "Priority Email Support"],
    button: "Choose Standard Plan",
    color: "bg-purple-100",
    textColor: "text-purple-800",
    buttonColor: "bg-white text-purple-700 border border-purple-500",
  },
  {
    title: "Premium Plan",
    price: "Custom Pricing",
    period: "",
    credits: "Unlimited Student Credits",
    features: ["API & Bulk Upload Support", "Dedicated Success Manager"],
    button: "Contact Sales",
    color: "bg-orange-100",
    textColor: "text-orange-800",
    buttonColor: "bg-white text-orange-700 border border-orange-500",
  },
];

const SubscriptionPlans = () => {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null); // 👈 store current subscribed plan

  // 🔁 Fetch current plan from API on mount
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const token = localStorage.getItem("schoolAdminToken");
        const res = await fetch("/api/school-admin/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCurrentPlan(data.plan); // "Free Plan", "Standard Plan", etc.
      } catch (error) {
        console.error("Failed to fetch current plan:", error);
      }
    };
    fetchCurrentPlan();
  }, []);

  const handleFreePlanActivation = async () => {
    if (loading || currentPlan === "Free Plan") return;
    setLoading(true);
    try {
      const token = localStorage.getItem("schoolAdminToken");
      const res = await fetch("/api/school-admin/activate-free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("✅ Free Plan Activated Successfully!");
        setCurrentPlan("Free Plan");
      } else {
        toast.error(`❌ Activation failed: ${result.message}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaidPlanActivation = async (planTitle, orderId) => {
    try {
      const token = localStorage.getItem("schoolAdminToken");
      const res = await fetch("/api/school-admin/payments/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planTitle, orderId }),
      });

      if (res.ok) {
        toast.success(`✅ ${planTitle} activated successfully!`);
        setCurrentPlan(planTitle);
      } else {
        const errData = await res.json();
        toast.error(`❌ Activation failed: ${errData.message}`);
      }
    } catch (err) {
      console.error("Paid Plan activation error:", err);
      toast.error("Something went wrong while activating paid plan.");
    }
  };

  if (!PAYPAL_CLIENT_ID) {
    console.error("❌ Missing PayPal Client ID. Check .env file.");
    return <p className="text-red-600 text-center">PayPal is not configured.</p>;
  }

  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID }}>
      <div className="py-12 px-6 bg-gray-50 min-h-screen font-poppins">
        <ToastContainer position="top-center" autoClose={3000} />
        <h2 className="text-2xl font-semibold text-center mb-10">
          Admin Dashboard – Subscription Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`${plan.color} rounded-xl shadow-md p-6 text-center flex flex-col justify-between`}
            >
              <div>
                <h3 className={`text-xl font-semibold mb-2 ${plan.textColor}`}>
                  {plan.title}
                </h3>
                <p className="text-2xl font-bold mb-1">{plan.price}</p>
                <p className="text-sm text-gray-600 mb-4">{plan.period}</p>
                <p className="text-base font-medium text-gray-700 mb-4">
                  {plan.credits}
                </p>

                <ul className="text-sm text-gray-600 space-y-1 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
              </div>

              {plan.title === "Free Plan" ? (
                <button
                  onClick={handleFreePlanActivation}
                  disabled={loading || currentPlan === "Free Plan"}
                  className={`mt-auto py-2 px-4 rounded ${plan.buttonColor} font-medium ${
                    loading || currentPlan === "Free Plan"
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:opacity-90"
                  }`}
                >
                  {currentPlan === "Free Plan"
                    ? "Already Subscribed"
                    : loading
                    ? "Activating..."
                    : plan.button}
                </button>
              ) : plan.title === "Standard Plan" ? (
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      purchase_units: [
                        {
                          amount: {
                            value: "10.00",
                            currency_code: "USD",
                          },
                          description: "Standard Plan Subscription",
                        },
                      ],
                    });
                  }}
                  onApprove={async (data, actions) => {
                    const order = await actions.order.capture();
                    await handlePaidPlanActivation("Standard Plan", order.id);
                  }}
                  onError={(err) => {
                    console.error("PayPal error:", err);
                    toast.error("❌ Payment failed. Please try again.");
                  }}
                />
              ) : (
                <button
                  onClick={() =>
                    toast.info("📞 Please contact sales at support@example.com")
                  }
                  className={`mt-auto py-2 px-4 rounded ${plan.buttonColor} font-medium hover:opacity-90`}
                >
                  {plan.button}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default SubscriptionPlans;
