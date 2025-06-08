import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

//definit navbar et footor
const MainLayout = () => {
    return (
        <div className="flex flex-col min-h-screen relative">
            {/* Navbar positioned absolutely to overlay content */}
            <div className="absolute top-0 left-0 right-0 z-50">
                <Navbar />
            </div>
            
            {/* Main content with padding to account for navbar */}
            <main className="flex-grow">
                <Outlet />
            </main>
            
            <Footer />
        </div>
    );
};

export default MainLayout;