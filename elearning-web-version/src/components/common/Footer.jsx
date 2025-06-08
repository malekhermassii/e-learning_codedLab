import React from 'react';
import { Link } from 'react-router-dom';
import googlePlay from '../../assets/images/google-play.png';
import appStore from '../../assets/images/app-store.png';
import { useTranslation } from 'react-i18next';
import logo1 from "../../assets/images/logorg.png";

const Footer = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    return (
        <section className="bg-gradient-to-r from-[#1C2792] via-[#1B45B4] to-[#B14EDF] w-full py-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col items-center text-white">
                    {/* Logo and Social Links */}
                    <div className="flex items-center gap-8 mb-12">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="flex items-center">
                                <div className=" text-white p-2 rounded-lg">
                                    <img src={logo1} alt="Logo" className="h-15 w-15" />
                                </div>
                            </Link>
                        </div>
                        <div className="w-px h-8 bg-white/20" />
                        <div className="flex gap-4">
                            
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
                                </svg>
                            </a>
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </a>
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Newsletter Subscription */}
                    <div className="text-center mb-12">
                        <h3 className="text-[#B2B3CF] font-medium mb-6">{t('footer.newsletter.title')}</h3>
                        <div className="flex max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder={t('footer.newsletter.placeholder')}
                                className={`flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white
                                    ${isRTL ? 'rounded-r-full' : 'rounded-l-full'}`}
                            />
                            <button
                                className={`px-8 py-3 bg-[#0097FE] text-white hover:bg-blue-600 transition-colors
                                    ${isRTL ? 'rounded-l-full' : 'rounded-r-full'}`}
                            >
                                {t('footer.newsletter.button')}
                            </button>
                        </div>
                    </div>

                    {/* Download Apps */}
                    <div className="text-center mb-12">
                        <p className="mb-4">{t('footer.download.title')}</p>
                        <div className="flex justify-center gap-4">
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                <img src={googlePlay} alt="Get it on Google Play" className="h-10" />
                            </a>
                            <a href="#" className="hover:opacity-80 transition-opacity">
                                <img src={appStore} alt="Download on App Store" className="h-10" />
                            </a>
                        </div>
                    </div>

                    {/* Copyright */}
                    <p className="text-white/80 text-sm">
                        {t('footer.copyright')}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Footer;
