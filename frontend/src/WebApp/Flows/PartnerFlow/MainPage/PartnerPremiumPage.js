// components/Partner/PartnerPremiumPage.js
import React from "react";
import Check from "../../../../assets/check.svg"; // Ensure this icon exists

const PartnerPremiumPage = () => {
  const plans = [
    {
      title: "Freemium Partner",
      price: "$0",
      duration: "Unlimited",
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
      bg: "bg-gray-50",
      border: "border-gray-200",
    },
    {
      title: "Premium Basic",
      price: "$9.99",
      duration: "1 Month",
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
      bg: "bg-purple-50",
      border: "border-purple-300",
    },
    {
      title: "Premium Plus",
      price: "$19.99",
      duration: "1 Month",
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
      bg: "bg-orange-50",
      border: "border-orange-300",
    },
  ];

  return (
    <div className="p-6 font-poppins min-h-screen bg-white">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
        Choose Your Partner Plan
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`border rounded-lg shadow-md p-6 flex flex-col justify-between transition-transform duration-300 hover:scale-105 ${plan.bg} ${plan.border}`}
          >
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{plan.title}</h3>
              <p className="text-2xl font-bold text-orange-600 mb-1">{plan.price}</p>
              <p className="text-sm text-gray-600 mb-4">Duration: {plan.duration}</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <img src={Check} alt="check" className="w-4 h-4 mt-1" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {plan.title !== "Freemium Partner" && (
              <button
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded w-full"
                onClick={() => {
                  // TODO: Trigger payment or upgrade logic here
                }}
                aria-label={`Upgrade to ${plan.title} plan`}
              >
                Upgrade to {plan.title}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerPremiumPage;
