import React from "react";
import Check from "../assets/check.svg";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PageLoader from "./PageLoader";

function Pricing() {
  const navigate = useNavigate();
  const { skillnaavData } = useSelector((state) => state.root);

  if (!skillnaavData) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[300px]">
        <PageLoader />
      </div>
    );
  }

  const { pricing, pricingcard } = skillnaavData;

  if (
    !pricing ||
    pricing.length === 0 ||
    !pricingcard ||
    pricingcard.length === 0
  ) {
    return (
      <div className="text-center py-12 text-gray-600">
        No pricing data available.
      </div>
    );
  }

  const { priceheading } = pricing[0];

  const colorClasses = {
    teal: {
      bg: "bg-teal-100",
      text: "text-teal-700",
      subtext: "text-teal-900",
      hoverBg: "hover:bg-teal-200",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      subtext: "text-purple-900",
      hoverBg: "hover:bg-purple-200",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      subtext: "text-orange-900",
      hoverBg: "hover:bg-orange-200",
    },
  };

  const getColorClass = (index) => {
    const colors = Object.values(colorClasses);
    const colorIndex = index % colors.length;
    return colors[colorIndex];
  };

  const formatPrice = (priceStr) => {
    if (!priceStr) return "";
    let str = priceStr.trim();

    // If text like "Contact Us", return as is
    if (/contact/i.test(str)) return str;

    // Fix spaces around dollar sign: "$ 10" -> "$10", "10 $" -> "10$"
    str = str.replace(/\$\s+/g, "$").replace(/\s+\$/g, "$");

    // If $ is misplaced after digits: "10$" -> "$10", "10$/mo" -> "$10/mo"
    str = str.replace(/^(\d+(?:\.\d+)?)\$/, "$$$1");

    // If price starts with digits and has no $, prepend $
    if (!str.includes("$") && /^\d/.test(str)) {
      str = "$" + str;
    }

    return str;
  };

  return (
    <div id="pricing" className="py-12 my-6 pb-12 lg:py-16 scroll-mt-28 lg:scroll-mt-32">
      <h1 className="text-center font-medium text-2xl lg:text-4xl text-gray-900 mb-6">
        {priceheading}
      </h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        {pricingcard.map((card, index) => {
          const colorClass = getColorClass(index);

          return (
            <div
              key={index}
              className={`w-full ${colorClass.bg} p-6 flex flex-col justify-between shadow-lg rounded-lg`}
              style={{ marginTop: "20px" }}
            >
              <div>
                <h3 className={`font-medium ${colorClass.text} text-xl lg:text-2xl`}>
                  {card.plantype}
                </h3>
                <p className={`pt-3 ${colorClass.subtext} lg:text-lg`}>
                  {card.plantypesubhead}
                </p>
                <h2 className={`pt-4 text-2xl font-medium ${colorClass.text} lg:text-3xl`}>
                  {card.plantype === "Institutional (B2B)" ? (
                    <span className="text-orange-700">Contact Us</span>
                  ) : (
                    formatPrice(card.price)
                  )}
                </h2>
                <ul className={`flex flex-col gap-2 pt-4 ${colorClass.subtext}`}>
                  <li className="flex items-center gap-2">
                    <img src={Check} alt="included" width={16} height={16} />
                    {card.pricepoint1}
                  </li>
                  <li className="flex items-center gap-2">
                    <img src={Check} alt="included" width={16} height={16} />
                    {card.pricepoint2}
                  </li>
                  <li className="flex items-center gap-2">
                    <img src={Check} alt="included" width={16} height={16} />
                    {card.pricepoint3}
                  </li>
                </ul>
              </div>
              {card.plantype === "Institutional (B2B)" ? (
                <button
                  onClick={() => navigate("/contact")}
                  className={`mt-4 bg-white py-3 text-center ${colorClass.text} font-medium rounded ${colorClass.hoverBg} transition cursor-pointer w-full`}
                >
                  Contact Us
                </button>
              ) : (
                <button
                  className={`mt-4 bg-white py-3 ${colorClass.text} font-medium rounded ${colorClass.hoverBg} transition cursor-pointer w-full`}
                  onClick={() => {
                    const btnText = (card.pricebtn || "").toLowerCase();
                    const planText = (card.plantype || "").toLowerCase();
                    if (btnText.includes("student") || planText.includes("b2c") || planText.includes("student")) {
                      navigate("/user-create-account");
                    } else {
                      navigate("/choose-role");
                    }
                  }}
                >
                  {card.pricebtn && card.pricebtn.toLowerCase().includes("student")
                    ? "Get Started"
                    : card.pricebtn || "Get Started"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Pricing;
