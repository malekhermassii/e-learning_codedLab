
// SubscribePage.jsx
import React, { useState, useEffect } from 'react';
import PricingCard from '../components/home/PricingCard';
import { useNavigate  } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const SubscribePage = () => {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(null);
  // const [plans, setPlans] = useState([]);
  const navigate = useNavigate();
  const { t, i18n }  = useTranslation();
  const currentLanguage = i18n.language; // Obtenir la langue actuelle

  // const plans = [
  //   {
  //     _id : 1,
  //     title: "Monthly Plan",
  //     price: "0",
  //     period: "month",
  //     discount: 0,
  //     features: [
  //       "Unlimited access",
  //       "Learn anytime, anywhere",
  //       "Certification after completion",
  //       "Access via web & mobile",
  //       "Access the quiz"
  //     ]
  //   },
  //   {
  //     _id : 2,
  //     title: "Three-Month Plan",
  //     price: "12",
  //     period: "month",
  //     discount: 5,
  //     features: [
  //       "Unlimited access",
  //       "Learn anytime, anywhere",
  //       "Certification after completion",
  //       "Access via web & mobile",
  //       "Access the quiz"
  //     ]
  //   },
  //   {
  //     _id : 3,
  //     title: "Annual Plan",
  //     price: "20",
  //     period: "Year",
  //     discount: 20,
  //     features: [
  //      "Unlimited access",
  //       "Learn anytime, anywhere",
  //       "Certification after completion",
  //       "Access via web & mobile",
  //       "Access the quiz"
  //     ]
  //   }
  // ];
  const [plans, setPlans] = useState([]);
  //HANDLE FETCH PLANS
  useEffect(() => {
    fetch("https://backendlms-5992.onrender.com/planabonnement")
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(console.error);
  }, []);
  
  //HANDLE PLAN CLICK
  const handlePlanClick = (index) => {
    setSelectedPlanIndex(index);
  };

  //HANDLE SUBSCRIBE
  const handleSubscribe = (plan) => {
    navigate('/checkout', { state: { plan } });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-dark-900 mb-4 mt-12">
            {t('subscribe.title')}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            {t('subscribe.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-5xl mx-auto justify-items-center">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan._id}
              {...plan}
              name={currentLanguage === 'ar' ? plan.name_ar : plan.name}
              interval={currentLanguage === 'ar' ? plan.interval_ar : plan.interval}
              features={[
                t('subscribe.features.unlimitedAccess'),
                t('subscribe.features.learnAnytime'),
                t('subscribe.features.certification'),
                t('subscribe.features.webMobile'),
                t('subscribe.features.quiz')
              ]}         
              isActive={selectedPlanIndex === index}
              onCardClick={() => handlePlanClick(index)}
              onSubscribe={() => handleSubscribe(plan)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;