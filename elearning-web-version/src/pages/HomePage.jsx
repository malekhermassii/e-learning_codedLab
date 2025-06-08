import React, { useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import WhoIsElearning from '../components/home/WhoIsElearning';
import PopularCourses from '../components/home/PopularCourses';
import PricingPlans from '../components/home/PricingPlans';
import SuccessStats from '../components/home/SuccessStats';
import ProfessorsSection from "../components/home/ProfessorsSection";
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
const HomePage = () => {
    const location = useLocation();
    const userRedux = useSelector(state => state.auth.userToken);
    const userLocal = JSON.parse(localStorage.getItem("currentUser"));
    const { t, i18n } = useTranslation();
    const currentUser = userRedux || userLocal;
    console.log("currentUser:", currentUser);
    

    //toast for payment status
    useEffect(() => {
        // Gestion des paramètres de paiement dans l'URL
        const searchParams = new URLSearchParams(location.search);
        const paymentStatus = searchParams.get('payment');

        if (paymentStatus === 'success') {
            toast.success(t('navbar.menu.toast.success'), {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } else if (paymentStatus === 'failed') {
            toast.error(t('navbar.menu.toast.error'), {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }

        // Handle hash navigation for scrolling to specific sections
        if (location.hash) {
            const element = document.getElementById(location.hash.substring(1));
            if (element) {
                // Add a slight delay to ensure the element is properly rendered
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        } else {
            // If no hash is present, scroll to the top
            window.scrollTo(0, 0);
        }
    }, [location]);

    return (
        //toast 
        <div className="min-h-screen">
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <HeroSection />
            <CategorySection />
            <WhoIsElearning />
            <PopularCourses />
            <PricingPlans />
            <ProfessorsSection />
            <SuccessStats />
          
            {/* Other sections will be added here */}
        </div>
    );
};

export default HomePage;