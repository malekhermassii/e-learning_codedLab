import React from 'react';
import pattern from '../../assets/images/Patern.svg';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { hasActiveSubscriptionServer, isAuthenticated } from '../../utils/auth';
import { useNavigate } from 'react-router-dom';

// Définir les fonctionnalités statiques
const staticFeatures = [
  "Learn anytime, anywhere",
  "Certificates verified",
  "Access via web & mobile",
  "Access the quiz"
];

const PricingCard = ({_id, name, price, interval, offers,stripePriceId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    t('pricing.features.learnAnytime'),
    t('pricing.features.certification'),
    t('pricing.features.webMobile'),
    t('pricing.features.quiz')
  ];

  //handle TEST HAVEN'T SUBSCRIPTION OR NO
  const handleOnClick = async () => {
    console.log("isAuthenticated()",isAuthenticated())
    const hasActiveSubscription = await  hasActiveSubscriptionServer()
    console.log("hasActiveSubscriptionServer()",hasActiveSubscription)
    if (isAuthenticated() && !hasActiveSubscription) {
    navigate('/checkout', { state: { plan: { _id, name, price, offers, interval, stripePriceId } } });
    }else if (isAuthenticated() && hasActiveSubscription) {
      alert(t('pricing.alert.alreadyHaveSubscription'));
    }
    else {
      navigate('/login');
    }
  };

  return (
    <div className="bg-white rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col w-[90%] md:w-[380px]">
      {/* Pattern background */}
      <img 
        src={pattern} 
        alt=""
        className="absolute top-0 left-0 w-full pointer-events-none"
      />
      
      <div className="p-6 relative flex flex-col flex-grow">
        {/* Plan title */}
        <h3 className="text-2xl font-semibold text-blue-900 mb-6 z-10 text-center truncate">{name}</h3>
        
        {/* Features list */}
        <ul className="space-y-3 mb-8 flex-grow">
          {/* Premier élément dynamique */}
          <li className="flex items-start text-gray-600 mt-10 ">
            <svg className="w-5 h-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span className="text-gray-500">
              {t('pricing.features.unlimitedAccess')} {offers ? `${t('pricing.save')} ${offers}` : ''}
            </span>
          </li>
          {/* Éléments statiques */}
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-gray-600">
              <svg className="w-5 h-5 mr-3 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-gray-500">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Price section */}
        <div className="mb-12 mt-auto">
          <div className="flex items-baseline mb-2">
            <span className="text-4xl font-bold text-gray-900">{price}</span>
            <span className="text-xl text-gray-600 ml-1">{t('pricing.currency')}</span>
          </div>
          <p className="text-sm text-gray-500">
            {interval === 'month' ? t('pricing.perMonth') : t('pricing.perYear')}
          </p>
        </div>
        
        {/* Subscribe button */}
        
          <button className="w-full px-8 py-3 bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] text-white font-medium rounded-lg hover:bg-purple-700 transition duration-300 shadow-lg"
          onClick={handleOnClick}>
            {t('pricing.subscribe')}
          </button>
        
        
        {/* offers badge */}
        {offers && (
          <div className="absolute top-15 right-8 bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full z-10">
            {t('pricing.save')} {offers}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
