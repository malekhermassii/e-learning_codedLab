import React, { useEffect } from 'react';
import PricingCard from './PricingCard';
import { fetchplan } from '../../api';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const PricingPlans = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language; // Obtenir la langue actuelle
  const { plans, loading, error } = useSelector((state) => state.plans);
 

  useEffect(() => {
    dispatch(fetchplan());
  }, [dispatch]);

  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">{t('pricing.title')}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t('subscribe.description')}
        </p>
      </div>
      {!loading && !error && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-2 max-w-5xl mx-auto justify-items-center">

        {plans.map((plan, index) => (
          <PricingCard
            _id={plan._id}
            key={index}
            name={currentLanguage === 'ar' ? plan.name_ar : plan.name}
            price={plan.price}
            interval  ={currentLanguage === 'ar' ? plan.interval_ar : plan.interval}
            offers={plan.offers}
            stripePriceId={plan.stripePriceId}
          />
        ))}
      </div>
       )}
    </section>
  );
};

export default PricingPlans;
