import React from 'react';
import UserTypeCards from './UserTypeCards';
import { useTranslation } from 'react-i18next';

const WhoIsElearning = () => {
    const { t } = useTranslation();

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-blue-900 mb-6">
                        {t('whoIsElearning.title')}
                    </h2>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        {t('whoIsElearning.description')}
                    </p>
                </div>
                
                <UserTypeCards />
            </div>
        </section>
    );
};

export default WhoIsElearning;