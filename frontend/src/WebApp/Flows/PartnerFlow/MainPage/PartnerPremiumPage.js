// src/components/Partner/PartnerPremiumPage.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Check from "../../../../assets/check.svg";
import { useSelector } from "react-redux";

// ─── Module-level PayPal cross-origin error suppressor ────────────────────────
// Registered once when this module loads — BEFORE React's own error listeners.
// Intercepts "Script error." that fires when user closes the PayPal popup (✕).
// Without this, React DevTools shows a red error overlay even though nothing
// actually went wrong. stopImmediatePropagation() prevents React from seeing it.
(function suppressPayPalCrossOriginErrors() {
  const handler = (event) => {
    if (
      event.message === "Script error." ||
      event.message === "Script error" ||
      (event.message === "" && !event.filename && event.lineno === 0)
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };
  window.addEventListener("error", handler, true); // capture phase
})();

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
    btnText: "You're Already on Free",
    disabled: true,
    bg: "bg-gray-50",
    border: "border-gray-200",
  },
  {
    title: "Premium Basic",
    price: "9.99",
    duration: 2,
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
    duration: 5,
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
  const [alert, setAlert]       = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [paymentData, setPaymentData]     = useState(null);
  // FIX #6: force re-render every minute so countdown ticks
  const [, setTick] = useState(0);
  const paypalInstanceRef = useRef(null);

  const reduxPartner = useSelector((s) => s.auth?.partnerInfo);
  const stored  = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const partner = reduxPartner || stored;

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // ─── Load PayPal SDK ──────────────────────────────────────────────────────
  // Key rules:
  //  1. Never delete window.paypal — it breaks re-mounts.
  //  2. If script already injected (StrictMode / hot-reload), just listen for load.
  //  3. On cleanup only reset sdkReady state, don't touch the global.
  useEffect(() => {
    if (!PAYPAL_CLIENT_ID) {
      setAlert({ type: "error", message: "PayPal Client ID not set. Check .env" });
      return;
    }

    // Already loaded
    if (window.paypal) {
      setSdkReady(true);
      return () => setSdkReady(false);
    }

    // Script tag already in DOM but still loading (StrictMode double-invoke)
    const existing = document.querySelector(
      'script[src*="paypal.com/sdk/js"]'
    );
    if (existing) {
      const onLoad = () => setSdkReady(true);
      existing.addEventListener("load", onLoad);
      return () => {
        existing.removeEventListener("load", onLoad);
        setSdkReady(false);
      };
    }

    // Fresh inject
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;
    script.onload  = () => setSdkReady(true);
    script.onerror = () =>
      setAlert({ type: "error", message: "Failed to load PayPal SDK. Check your Client ID." });
    document.body.appendChild(script);

    return () => {
      setSdkReady(false);
      // Only remove the script we injected in this effect
      if (script?.parentNode) script.parentNode.removeChild(script);
    };
  }, []);


  // ─── Suppress PayPal cross-origin "Script error." ────────────────────────
  // When the user clicks ✕ to close the PayPal popup, the browser fires a
  // cross-origin "Script error." event. React DevTools listens via
  // window.addEventListener('error', ..., true) in CAPTURE phase — so
  // window.onerror alone cannot stop it. We must also use a capture-phase
  // listener registered BEFORE React's (i.e. at module load time, outside
  // component) to intercept and stop propagation before React sees it.
  useEffect(() => {
    if (selectedIndex === null) return;

    // Capture-phase listener — runs BEFORE React's error overlay listener
    const suppressScriptError = (event) => {
      if (
        event.message === "Script error." ||
        event.message === "Script error" ||
        (event.message === "" && !event.filename && event.lineno === 0)
      ) {
        event.stopImmediatePropagation(); // block all subsequent listeners (incl. React)
        event.preventDefault();           // prevent default browser error handling
        console.warn("Suppressed cross-origin PayPal Script error (popup close)");
      }
    };

    // true = capture phase, so we run before React's bubble-phase handler
    window.addEventListener("error", suppressScriptError, true);

    return () => {
      window.removeEventListener("error", suppressScriptError, true);
    };
  }, [selectedIndex]);
  // ─── Render PayPal Buttons ────────────────────────────────────────────────
  // Runs whenever a plan is selected AND the SDK is ready.
  // createOrder uses a normal async function — this is fine because PayPal's
  // Buttons SDK manages its own popup internally; popup trust chain is NOT
  // broken by async createOrder when using window.paypal.Buttons().
  useEffect(() => {
    const renderButtons = async () => {
      if (selectedIndex === null || !sdkReady || !paymentData) return;

    // Hard runtime guard — sdkReady state can briefly be true while window.paypal
    // is still undefined (React StrictMode double-invoke race)
    if (!window.paypal?.Buttons) {
      console.warn("window.paypal not available yet, skipping button render");
      return;
    }

    const containerId = `paypal-button-container-${selectedIndex}`;
    const container   = document.getElementById(containerId);
    if (!container) return;

    // Destroy any previously rendered PayPal instance BEFORE clearing the container.
    // PayPal's .close() is async-ish internally — we must call it and wait a tick
    // before wiping innerHTML, otherwise PayPal's cleanup tries to removeChild
    // a node that React has already removed → crash.
    if (paypalInstanceRef.current) {
      try { paypalInstanceRef.current.close(); } catch (_) {}
      paypalInstanceRef.current = null;
      // Give PayPal one tick to finish its internal cleanup before we clear
      await new Promise((r) => setTimeout(r, 0));
    }
    // Only clear if container still exists (may have unmounted during the tick)
    if (!document.getElementById(containerId)) return;
    container.innerHTML = "";

    const buttons = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color:  "gold",
        shape:  "rect",
        label:  "paypal",
      },

      // async createOrder is completely safe with window.paypal.Buttons —
      // PayPal opens the popup from its own button's click handler, not ours.
      createOrder: async () => {
        try {
          const { data } = await axios.post("/api/partner/payments/paypal/order", {
            amount:    paymentData.amount,
            partnerId: paymentData.partner._id,
            planType:  paymentData.planType,
            email:     paymentData.partner.email,
            duration:  paymentData.duration,
          });
          return data.id;
        } catch (err) {
          console.error("Order creation failed:", err);
          setAlert({ type: "error", message: "Unable to create PayPal order. Please try again." });
          throw err;
        }
      },

      onApprove: async (data) => {
        try {
          const { data: verify } = await axios.post("/api/partner/payments/paypal/verify", {
            orderID:   data.orderID,
            partnerId: paymentData.partner._id,
            planType:  paymentData.planType,
            amount:    paymentData.amount,
            email:     paymentData.partner.email,
            duration:  paymentData.duration,
          });

          if (verify.success) {
            setAlert({ type: "success", message: "Payment successful! You are now Premium." });
            const updated = {
              ...paymentData.partner,
              isPremium:          true,
              planType:           verify.partner.planType,
              premiumExpiration:  verify.partner.premiumExpiration,
            };
            localStorage.setItem("userInfo", JSON.stringify(updated));
            // FIX #1: parse JSON string before reading .isPremium
            const storedAfter = JSON.parse(localStorage.getItem("userInfo") || "{}");
            if (storedAfter?.isPremium) {
              setSelectedIndex(null);
            }
          } else if (verify.retry) {
            setAlert({ type: "error", message: verify.message || "Payment declined. Try another payment method." });
            // Leave buttons visible so user can retry
          } else {
            setAlert({ type: "error", message: verify.message || "Payment verification failed." });
            setSelectedIndex(null);
          }
        } catch (err) {
          console.error("Verification error:", err);
          const info = err.response?.data;
          if (info?.retry) {
            setAlert({ type: "error", message: info.message || "Payment declined. Try another funding source." });
            return; // leave buttons open for retry
          }
          setAlert({ type: "error", message: "Payment verification error. Please contact support." });
          setSelectedIndex(null);
        }
      },

      onCancel: () => {
        // Delay unmount so PayPal SDK finishes its own DOM cleanup first.
        // Calling setSelectedIndex(null) immediately causes React to removeChild
        // the container while PayPal is still removing its iframe — crash.
        setTimeout(() => setSelectedIndex(null), 300);
      },

      onError: (err) => {
        const msg = err?.message || String(err);

        // "Window closed before response" fires when user clicks ✕ on PayPal popup.
        // This is a user cancellation, NOT a payment failure — ignore silently.
        // Also swallow "Script error." (cross-origin noise) and empty messages.
        if (
          !msg ||
          msg === "Script error." ||
          msg.includes("Window closed before response") ||
          msg.includes("window closed") ||
          msg.includes("popup closed")
        ) {
          console.warn("PayPal popup closed by user (non-critical):", msg);
          setTimeout(() => setSelectedIndex(null), 300);
          return;
        }

        console.error("PayPal SDK error:", err);
        setAlert({ type: "error", message: "Payment failed. Please try again." });
        setTimeout(() => setSelectedIndex(null), 300);
      },
    });

    if (buttons.isEligible()) {
      buttons.render(`#${containerId}`);
      paypalInstanceRef.current = buttons;
    } else {
      container.innerHTML =
        '<p class="text-red-500 text-sm mt-2">PayPal is not available. Try a different browser or disable ad blockers.</p>';
    }
    }; // end renderButtons
    renderButtons();
  }, [selectedIndex, paymentData, sdkReady]);

  // ─── Select a plan ────────────────────────────────────────────────────────
  const selectPlan = (plan, idx) => {
    if (!sdkReady) {
      setAlert({ type: "error", message: "PayPal is still loading. Please wait a moment." });
      return;
    }
    if (plan.price === "0.00") return;

    setPaymentData({ amount: plan.price, planType: plan.title, duration: plan.duration, partner });
    setSelectedIndex(idx);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 font-poppins min-h-screen bg-white">

      {/* Alert toast */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-3 rounded shadow flex items-center gap-2 ${
            alert.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <span>{alert.message}</span>
          <button onClick={() => setAlert(null)} className="ml-2 font-bold text-lg leading-none">×</button>
        </div>
      )}

      <h2 className="text-2xl font-semibold text-center mb-8">Choose Your Partner Plan</h2>

      {/* Premium status banner */}
      {partner.isPremium && (() => {
        const exp = partner.premiumExpiration ? new Date(partner.premiumExpiration) : null;
        const now = new Date();
        let remainingText = "Expired";
        if (exp && exp > now) {
          const diff = exp - now;
          const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          remainingText = `${days}d ${hours}h ${mins}m`;
        }
        return (
          <div className="max-w-2xl mx-auto mb-6 p-5 rounded-lg shadow-md border-l-4 border-indigo-500 bg-indigo-50">
            <h3 className="text-lg font-semibold text-indigo-800">
              ⭐ Partner Premium Active — {partner.planType}
            </h3>
            <p className="text-indigo-700 mt-1">
              Expires on:{" "}
              <span className="font-semibold">
                {exp
                  ? exp.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "N/A"}
              </span>
            </p>
            <p className="text-indigo-600 mt-1 font-medium">Time Left: {remainingText}</p>
            {/* FIX #5: scroll to plans instead of wrongly calling setSelectedIndex(null) */}
            {exp && exp < now && (
              <button
                className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                onClick={() => document.getElementById("plan-cards")?.scrollIntoView({ behavior: "smooth" })}
              >
                Renew Partner Premium
              </button>
            )}
          </div>
        );
      })()}

      {/* Plan cards */}
      <div id="plan-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, idx) => {
          const isCurrentPlan =
            partner.isPremium &&
            partner.planType === plan.title &&
            new Date(partner.premiumExpiration) > new Date();

          return (
            <div
              key={idx}
              className={`border rounded-lg p-6 flex flex-col justify-between ${plan.bg} ${plan.border}`}
            >
              <div>
                <h3 className="text-xl font-semibold mb-2">{plan.title}</h3>
                {isCurrentPlan && (
                  <p className="text-sm text-green-600 mb-2">
                    Subscribed until {new Date(partner.premiumExpiration).toLocaleDateString()}
                  </p>
                )}
                <p className="text-2xl font-bold text-orange-600 mb-1">${plan.price}</p>
                <p className="text-sm text-gray-600 mb-4">
                  Duration: {plan.duration ? `${plan.duration} Days` : "Unlimited"}
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
                disabled={plan.disabled || isCurrentPlan}
                className={`mt-4 py-2 rounded text-white ${
                  plan.disabled || isCurrentPlan
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isCurrentPlan
                  ? "Subscribed"
                  : plan.disabled
                  ? `On ${plan.title}`
                  : plan.btnText}
              </button>

              {/* PayPal button container — rendered by SDK into this div */}
              {selectedIndex === idx && (
                <div id={`paypal-button-container-${idx}`} className="mt-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}