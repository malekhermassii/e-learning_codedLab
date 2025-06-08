import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Mail, MessageSquare, Instagram, Linkedin, ExternalLink, MapPin, Phone, Clock, Calendar, Headphones } from "lucide-react";



const ContactPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 py-30 px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1B45B4] mb-4">
            {t('contactPage.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('contactPage.subtitle')}
          </p>
        </div>

        {/* Main Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Email Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-[#1B45B4]/10 rounded-full flex items-center justify-center mb-6">
                <Mail className="h-8 w-8 text-[#1B45B4]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('contactPage.email')}</h3>
              <p className="text-gray-600 mb-4">{t('contactPage.emailDesc')}</p>
              <a href="mailto:Darsi@e-learning.com" className="text-[#1B45B4] font-medium text-lg hover:underline">
                Darsi@e-learning.com
              </a>
              <div className="mt-6">
                <a href="mailto:Darsi@e-learning.com" className="inline-flex items-center px-5 py-2 border border-[#1B45B4] text-[#1B45B4] rounded-full hover:bg-[#1B45B4] hover:text-white transition duration-300">
                  {t('contactPage.sendEmail')} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-[#1B45B4]/10 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8 text-[#1B45B4]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('contactPage.whatsapp')}</h3>
              <p className="text-gray-600 mb-4">{t('contactPage.whatsappDesc')}</p>
              <p className="text-[#1B45B4] font-medium text-lg">+212 661 234 567</p>
              <div className="mt-6">
                <a href="https://wa.me/212661234567" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-5 py-2 border border-[#1B45B4] text-[#1B45B4] rounded-full hover:bg-[#1B45B4] hover:text-white transition duration-300">
                  {t('contactPage.startChat')} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Phone Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-[#1B45B4]/10 rounded-full flex items-center justify-center mb-6">
                <Phone className="h-8 w-8 text-[#1B45B4]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('contactPage.phone')}</h3>
              <p className="text-gray-600 mb-4">{t('contactPage.phoneDesc')}</p>
              <p className="text-[#1B45B4] font-medium text-lg">+212 522 123 456</p>
              <div className="mt-6">
                <a href="tel:+212522123456" className="inline-flex items-center px-5 py-2 border border-[#1B45B4] text-[#1B45B4] rounded-full hover:bg-[#1B45B4] hover:text-white transition duration-300">
                  {t('contactPage.callNow')} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Location & Hours Map Section */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 bg-gray-200 relative">
              {/* Replace with actual map */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
                <MapPin className="h-20 w-10 text-[#1B45B4]" />
              </div>
              <div className="absolute bottom-0 right-0 m-4 bg-white p-3 rounded-lg shadow-md">
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center text-[#1B45B4] font-medium">
                  {t('contactPage.viewLargerMap')} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-start mb-5">
                    <div className="flex-shrink-0 bg-[#1B45B4]/10 p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-[#1B45B4]" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-800">{t('contactPage.location')}</h3>
                      <p className="mt-1 text-gray-600">
                        {t('contactPage.address')}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-start mb-5">
                    <div className="flex-shrink-0 bg-[#1B45B4]/10 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-[#1B45B4]" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-800">{t('contactPage.businessHours')}</h3>
                      <p className="mt-1 text-gray-600">
                        {t('contactPage.businessHoursValue')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-[#1B45B4] to-[#6A36FF] text-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-8">{t('contactPage.connectWithUs')}</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-white/20 p-3 rounded-full">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">{t('contactPage.responseTime')}</h3>
                    <p className="mt-1 opacity-90">{t('contactPage.responseTimeDesc')}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-white/20 p-3 rounded-full">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium">{t('contactPage.supportHours')}</h3>
                    <p className="mt-1 opacity-90">{t('contactPage.supportHoursDesc')}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-10">
                <h3 className="text-lg font-medium mb-4">{t('contactPage.followUs')}</h3>
                <div className="flex space-x-4">
                  <a href="https://instagram.com/elearning" target="_blank" rel="noopener noreferrer" 
                     className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition duration-300">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="https://linkedin.com/company/elearning" target="_blank" rel="noopener noreferrer" 
                     className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition duration-300">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="mt-10">
                <Link to="/subscribe">
                  <button className="w-full px-6 py-3 bg-white text-[#1B45B4] font-medium rounded-lg hover:bg-white/90 transition duration-300 shadow-lg">
                    {t('contactPage.subscribe')}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="relative bg-gradient-to-r from-[#1B45B4] to-[#6A36FF] rounded-xl shadow-lg overflow-hidden mb-12">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="relative p-8">
            <h2 className="text-2xl font-bold text-white mb-8">{t('contactPage.aboutPlatform')}</h2>
            <p className="text-white/90 mb-6">
              {t('contactPage.aboutPlatformDesc')}
            </p>
          </div>
        </div>

        {/* About Platform Preview */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">{t('contactPage.aboutPlatform')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('contactPage.mission')}</h3>
              <p className="text-gray-600">
                {t('contactPage.missionDesc')}
              </p>
            </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('contactPage.vision')}</h3>
                <p className="text-gray-600">
                  {t('contactPage.visionDesc')}
                </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('contactPage.values')}</h3>
              <p className="text-gray-600">
                {t('contactPage.valuesDesc')}
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <Link to="/about">
              <button className="px-6 py-2 border border-[#1B45B4] text-[#1B45B4] font-medium rounded-lg hover:bg-blue-50 transition duration-300">
                {t('contactPage.learnMore')}
              </button>
            </Link>
          </div>
        </div>
      
      </div>
    </div>

  
  );
};

export default ContactPage;