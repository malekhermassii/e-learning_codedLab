# Guide d'Implémentation de la Version Web

Ce document sert de guide étape par étape pour l'implémentation de la version web de notre plateforme e-learning. Il documente chaque étape du processus de développement, depuis la configuration initiale jusqu'au déploiement final.

## Table des matières

1. [Configuration initiale du projet](#1-configuration-initiale-du-projet)
2. [Structure du projet](#2-structure-du-projet)
3. [Authentification et gestion des utilisateurs](#3-authentification-et-gestion-des-utilisateurs)
4. [Gestion des cours](#4-gestion-des-cours)
5. [Expérience d'apprentissage](#5-expérience-dapprentissage)
6. [Système de paiement](#6-système-de-paiement)
7. [Déploiement](#7-déploiement)

## 1. Configuration initiale du projet

### 1.1 Prérequis

Avant de commencer, assurez-vous d'avoir installé les outils suivants :

- Node.js (version 18.x ou supérieure)
- npm (version 8.x ou supérieure) ou yarn (version 1.22.x ou supérieure)
- Git

### 1.2 Création du projet avec Vite

```bash
# Créer un nouveau projet React avec Vite (sans template)
npm create vite@latest elearning-web -- --template react

# Naviguer vers le répertoire du projet
cd elearning-web

# Installer les dépendances
npm install
```

### 1.3 Installation des dépendances principales

```bash
# Installer les dépendances principales
npm install react-router-dom@6 @reduxjs/toolkit react-redux axios jwt-decode

# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Installer les dépendances pour les formulaires
npm install react-hook-form zod @hookform/resolvers


# Installer les dépendances pour l'UI
npm install @headlessui/react @heroicons/react
```

### 1.4 Configuration de Tailwind CSS

Modifiez le fichier `tailwind.config.js` :

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          // Définir votre palette de couleurs secondaires
        },
      },
    },
  },
  plugins: [],
}
```

Mettez à jour le fichier `src/index.css` :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors;
  }
  
  .input-field {
    @apply w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }
}
```

### 1.5 Configuration de l'environnement de développement

Créez un fichier `.env.development` à la racine du projet :

```
VITE_API_BASE_URL=http://localhost:4000/api
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

## 2. Structure du projet

### 2.1 Organisation des dossiers

Créez la structure de dossiers suivante :

```bash
mkdir -p src/{assets,components,features,hooks,layouts,pages,services,store,utils}
```

Voici une explication de chaque dossier :

- `assets` : Contient les ressources statiques (images, fonts, etc.)
- `components` : Composants UI réutilisables
- `features` : Fonctionnalités spécifiques organisées par domaine
- `hooks` : Hooks personnalisés
- `layouts` : Composants de mise en page
- `pages` : Composants de page
- `services` : Services d'API et autres services
- `store` : Configuration Redux et slices
- `utils` : Fonctions utilitaires

### 2.2 Configuration du routage

Créez un fichier `src/App.jsx` :

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy-loaded pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
```

### 2.3 Configuration du store Redux

Créez un fichier `src/store/index.js` :

```javascript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Ajoutez d'autres reducers ici
  },
});
```

Mettez à jour `src/main.jsx` :

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
```

## 3. Authentification et gestion des utilisateurs

### 3.1 Configuration du service d'API

Créez un fichier `src/services/api.js` :

```javascript
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3.2 Définition des constantes utilisateur

Créez un fichier `src/utils/constants.js` :

```javascript
export const USER_ROLES = {
  STUDENT: 'student',
  TUTOR: 'tutor',
  ADMIN: 'admin',
};

export const TUTOR_APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};
```

### 3.3 Implémentation du slice d'authentification

Créez un fichier `src/features/auth/authSlice.js` :

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      if (credentials.rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }
      
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to login');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      return { token, user };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to logout');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
```

### 3.4 Création des composants d'authentification de base

Créez un fichier `src/components/common/LoadingSpinner.jsx` :

```jsx
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>
  );
};

export default LoadingSpinner;
```

Créez un fichier `src/layouts/MainLayout.jsx` :

```jsx
import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser } from '../features/auth/authSlice';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';

const MainLayout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  
  useEffect(() => {
    if (localStorage.getItem('token') && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
```

## Prochaines étapes

Dans les prochaines sections, nous implémenterons :

- Les composants d'authentification (login, register, profil)
- Le processus de demande pour devenir tuteur
- La gestion des cours
- Le système de paiement
- Et plus encore...

Suivez ce guide étape par étape pour construire la version web complète de notre plateforme e-learning.
