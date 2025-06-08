import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { email, code } = useLocation().state;
  const navigate = useNavigate();

  //HANDLE RESET PASSWORD
  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(t('resetPassword.error.passwordsDoNotMatch'));
      return;
    }
    setIsLoading(true);
    try {
      await axios.post('http://192.168.70.148:4000/reset-password', { 
        email, 
        code, 
        newPassword: password 
      });
      setMessage(t('resetPassword.success'));
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setMessage(t('resetPassword.error') + (err.response?.data?.message || t('resetPassword.error.unableToResetPassword')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6ff]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 md:p-12 flex flex-col relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#1B45B4]"></div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1B45B4] mb-3">
              {t('resetPassword.title')}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('resetPassword.subtitle')}
            </p>
            {message && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-2 text-sm p-2 rounded-lg ${
                  message.includes('Error') 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-green-600 bg-green-50'
                }`}
              >
                {message}
              </motion.p>
            )}
          </div>

          <form onSubmit={handleReset} className="space-y-6 flex-grow">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('resetPassword.form.password.label')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder={t('resetPassword.form.password.placeholder')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('resetPassword.form.confirmPassword.label')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder={t('resetPassword.form.confirmPassword.placeholder')}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#1B45B4] text-white py-3 rounded-xl font-medium text-base ${
                isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-900"
              } transition-all duration-200 shadow-lg`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('resetPassword.form.submit.resetting')}
                </div>
              ) : (
                t('resetPassword.form.submit.reset')
              )}
            </motion.button>

            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-[#1B45B4] hover:underline">
                {t('resetPassword.form.backToLogin')}
              </Link>
            </div>
          </form>
        </div>

        <div className="hidden md:block relative bg-[#1B45B4] text-white flex items-center justify-center overflow-hidden">
          <div className="relative text-center px-10 py-6 z-10">
            <h2 className="text-4xl font-bold mb-6">{t('resetPassword.banner.title')}</h2>
            <p className="text-xl mb-8 leading-relaxed">
              {t('resetPassword.banner.description')}
            </p>
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <h3 className="font-semibold mb-2">{t('resetPassword.banner.security.title')}</h3>
                <p className="text-sm">{t('resetPassword.banner.security.description')}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <h3 className="font-semibold mb-2">{t('resetPassword.banner.requirements.title')}</h3>
                <p className="text-sm">{t('resetPassword.banner.requirements.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
