import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

const AuthDebug = () => {
  const authState = useSelector(state => state.authprof) || {};
  const dispatch = useDispatch();

  useEffect(() => {
    // Fonction pour récupérer les données du localStorage
    const getLocalStorageData = () => {
      try {
        const token = localStorage.getItem('profToken');
        const profData = localStorage.getItem('currentprof');
        let prof = null;
        
        if (profData) {
          prof = JSON.parse(profData);
        }
        
        return { token, prof };
      } catch (error) {
        console.error("Erreur lors de la récupération des données du localStorage:", error);
        return { token: null, prof: null };
      }
    };

    // Récupérer les données du localStorage
    const { token, prof } = getLocalStorageData();

    // Log détaillé
    console.log("=== DÉBOGAGE AUTHENTIFICATION ===");
    console.log("LocalStorage token:", token ? "Présent" : "Absent");
    console.log("LocalStorage prof:", prof ? "Présent" : "Absent", prof);
    console.log("Redux state:", authState);
    
    // Vérifier si le Redux store est vide mais le localStorage a des données
    if (!authState.profToken && token && prof) {
      console.log("ALERTE: Redux store vide mais localStorage contient des données");
      console.log("Si vous voyez ceci, il y a un problème avec l'initialisation de Redux");
    }
  }, [authState]);

  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '20px', background: '#fff8f8' }}>
      <h2>Débogage Authentification</h2>
      
      <h3>Redux State</h3>
      <pre>{JSON.stringify(authState, null, 2)}</pre>
      
      <h3>LocalStorage</h3>
      <div>
        <strong>Token:</strong> {localStorage.getItem('profToken') ? "Présent" : "Absent"}
      </div>
      <div>
        <strong>Prof:</strong> {localStorage.getItem('currentprof') ? "Présent" : "Absent"}
      </div>
      
      {localStorage.getItem('currentprof') && (
        <pre>{JSON.stringify(JSON.parse(localStorage.getItem('currentprof')), null, 2)}</pre>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => {
            const localData = {
              token: localStorage.getItem('profToken'),
              prof: JSON.parse(localStorage.getItem('currentprof') || '{}')
            };
            console.log("Tentative de dispatch manuel:", localData);
            // Cette fonction simule l'action setprofToken
            dispatch({
              type: 'authprof/setprofToken',
              payload: localData
            });
          }}
          style={{ padding: '10px', background: '#d00', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          Essayer une réparation manuelle
        </button>
      </div>
    </div>
  );
};

export default AuthDebug; 