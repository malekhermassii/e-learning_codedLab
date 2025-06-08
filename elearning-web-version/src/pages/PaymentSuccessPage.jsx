import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { addSubscription } from '../utils/auth';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = location.state || {};
  const [animate, setAnimate] = useState(false);// état utilisé pour ajouter des effets visuels progressifs.
  
  useEffect(() => {
    // Trigger  pour Active une animation 100ms après le montage du composant
    setTimeout(() => setAnimate(true), 100);
    
    // Save subscription to user profile
    if (plan) {
      addSubscription({
        planId: plan.id,
        title: plan.title,
        price: plan.price,
        period: plan.period,
        featured: plan.featured || false,
        purchaseDate: new Date().toISOString(),
        expiryDate: calculateExpiryDate(plan.period)
      });
    }
  }, [plan]);
  
  // Calculate expiry date based on period
  const calculateExpiryDate = (period) => {
    const now = new Date();
    
    if (!period) return now.toISOString(); // Vérification de sécurité
  
    const num = parseInt(period, 10); // Convertit la période en entier
    if (isNaN(num)) return now.toISOString(); // Sécurité contre une valeur invalide
  
    if (period.includes('month')) {
      now.setMonth(now.getMonth() + num);
    } else if (period.includes('year')) {
      now.setFullYear(now.getFullYear() + num);
    } else {
      return now.toISOString(); // Retourne la date actuelle si la période est incorrecte
    }
  
    return now.toISOString();
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className={`max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transition-all duration-500 transform ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-6 inline-flex items-center justify-center">
            <div className="rounded-full bg-[#1B45B4] p-4">
              <svg
                className={`w-14 h-14 text-white transition-transform duration-700 ${animate ? 'transform scale-100' : 'transform scale-0'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                  className={`transition-all duration-700 ${animate ? 'opacity-100 stroke-dashoffset-0' : 'opacity-0 stroke-dashoffset-100'}`}
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: animate ? 0 : 100,
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <div className="bg-gradient-to-r from-[#6572EB29] to-[#6572EB00] border border-blue-100 rounded-lg p-4 mb-6 mt-4">
            <p className="text-gray-700 mb-2">
              Thank you for your subscription. Your account has been successfully upgraded to:
            </p>
            {plan ? (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Plan:</span>
                  <span className="font-bold text-blue-600">{plan.title}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Duration:</span>
                  <span className="text-gray-900">{plan.period}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Amount Paid:</span>
                  <span className="text-gray-900">${plan.price}</span>
                </div>
                
                {plan.featured && (
                  <div className="mt-3 bg-yellow-50 rounded-md p-2 border border-yellow-100">
                    <span className="text-sm text-yellow-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      You've selected our premium plan!
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">Your subscription details are not available.</p>
            )}
          </div>
          

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={() => navigate('/courses')}
              className="flex-1 bg-[#1B45B4] text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Learning
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage; 