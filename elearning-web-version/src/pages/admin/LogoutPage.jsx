import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../../api';

const LogoutPageadmin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logoutAdmin();
        // Rediriger vers la page de connexion admin
        navigate('/loginadmin', { replace: true });
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Déconnexion en cours...</h1>
        <p className="text-gray-600">Merci d'utiliser notre plateforme. Vous serez redirigé dans quelques instants.</p>
      </div>
    </div>
  );
};

export default LogoutPageadmin; 