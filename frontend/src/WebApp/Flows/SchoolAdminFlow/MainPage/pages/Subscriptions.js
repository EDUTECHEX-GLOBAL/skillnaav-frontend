import React from 'react';

const plans = [
  {
    title: 'Free Plan',
    price: '₹0',
    period: '/ Month',
    credits: '50 Student Credits',
    features: ['Basic Dashboard Access', 'Limited Email Support'],
    button: 'Get Started',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    buttonColor: 'bg-white text-blue-700 border border-blue-500',
  },
  {
    title: 'Standard Plan',
    price: '₹999',
    period: '/ Month',
    credits: '500 Student Credits',
    features: ['Full Dashboard Access', 'Priority Email Support'],
    button: 'Choose Standard Plan',
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
    buttonColor: 'bg-white text-purple-700 border border-purple-500',
  },
  {
    title: 'Premium Plan',
    price: 'Custom Pricing',
    period: '',
    credits: 'Unlimited Student Credits',
    features: ['API & Bulk Upload Support', 'Dedicated Success Manager'],
    button: 'Contact Sales',
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
    buttonColor: 'bg-white text-orange-700 border border-orange-500',
  },
];

const SubscriptionPlans = () => {
  return (
    <div className="py-12 px-6 bg-gray-50 min-h-screen font-poppins">
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
            <button
              className={`mt-auto py-2 px-4 rounded ${plan.buttonColor} font-medium hover:opacity-90`}
            >
              {plan.button}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
