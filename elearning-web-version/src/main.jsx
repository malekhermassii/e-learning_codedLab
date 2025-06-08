import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import './index.css';
import store from './redux/store';
import { syncProfAuthData } from './redux/authSync';


// Synchroniser les données d'authentification au démarrage
try {
  console.log('Tentative de synchronisation des données d\'authentification au démarrage...');
  syncProfAuthData();
} catch (error) {
  console.error('Erreur lors de la synchronisation au démarrage:', error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);