import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = location.state || {};
  const { t } = useTranslation();
  const [error, setError] = useState(null);


  // redirection vers la page de paiement
  useEffect(() => {
    const redirectToStripeCheckout = async () => {
      if (!plan) {
        navigate("/subscribe");
        return;
      }

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          setError(t('checkout.errorPaymentt'));
          return;
        }

        // appel à l'api pour la création de la session de paiement
        const response = await fetch(`http://192.168.70.148:4000/checkoutsession`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ planId: plan._id })
        });

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || t('checkout.errorPayment'));
        }

        // Rediriger vers la page de paiement Stripe
        window.location.href = responseData.url;

      } catch (err) {
        console.error(t('checkout.errorRedirection'), err);
        setError(err.message || t('checkout.errorPayment'));
      }
    };

    redirectToStripeCheckout();
  }, [plan, navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            {error}
          </h2>
          <button
            onClick={() => navigate("/subscribe")}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
            >
                {t('checkout.backToPlans')}
            </button>
        </div>
      </div>
    );
  }

  // affichage du message de redirection
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
       {t('checkout.redirecting')}
        </h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default CheckoutPage;