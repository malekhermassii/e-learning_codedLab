import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import profilePicture from '../assets/images/profile-picture.svg';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { hasActiveSubscriptionServer, isAuthenticated } from '../utils/auth';

const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const fileInputRef = useRef(null);
  const [abonnement, setAbonnement] = useState(null);
  const [alertMessage, setAlertMessage] = useState({ type: '', message: '' });
  //FETCH USER DATA
  useEffect(() => {
    fetchUserData();
  }, []);

  //FETCH USER DATA profile 
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')||sessionStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get('https://backendlms-5992.onrender.com/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Formater la date de naissance pour l'input de type date (YYYY-MM-DD)
      const formattedData = {
        ...response.data,
        dateNaissance: response.data.dateNaissance 
          ? new Date(response.data.dateNaissance).toISOString().split('T')[0] 
          : ''
      };

      setUserData(formattedData);
      if (!response.data.image.includes('https')) {
        setProfileImage(`https://backendlms-5992.onrender.com/Public/Images/${response.data.image}`);
      }
      else{
        setProfileImage(response.data.image);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const validationSchema = Yup.object({
    fullName: Yup.string().required(t('profile.validation.fullName.required')),
    email: Yup.string().email(t('profile.validation.email.invalid')).required(t('profile.validation.email.required')),
    telephone: Yup.string().matches(/^[0-9]{8}$/, t('profile.validation.telephone')).nullable(),
    dateNaissance: Yup.date().nullable().max(new Date(), t('profile.validation.dateNaissance')),
    password: Yup.string().min(6, t('profile.validation.password.strength')).nullable(),
    confirmPassword: Yup.string().nullable().test(
      "passwords-match",
      t('profile.validation.confirmPassword.match'),
      function (value) {
        return !this.parent.password || value === this.parent.password;
      }
    ),
  });

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  //HANDLE IMAGE CHANGE
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  //HANDLE PROFILE IMAGE CLICK
  const handleProfileImageClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  //HANDLE SUBMIT PROFILE EDIT
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      setAlertMessage({ type: '', message: '' }); // Reset alert message

      const formData = new FormData();

      // Ajouter les champs de base
      formData.append('name', values.fullName);
      formData.append('email', values.email);
      formData.append('telephone', values.telephone);
      
      // Formater la date de naissance
      if (values.dateNaissance) {
        formData.append('dateNaissance', new Date(values.dateNaissance).toISOString());
      }

      // Gérer le mot de passe si fourni
      if (values.password) {
        formData.append('password', values.password);
      }

      // Gérer l'image si une nouvelle a été sélectionnée
      if (previewImage) {
        const file = fileInputRef.current.files[0];
        formData.append('image', file);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setAlertMessage({ 
          type: 'error', 
          message: t('profile.error.token') 
        });
        return;
      }

      const response = await axios.put(
        'https://backendlms-5992.onrender.com/profile',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Mettre à jour le token si un nouveau est fourni
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      // Formater les données reçues
      const formattedData = {
        ...response.data,
        dateNaissance: response.data.dateNaissance 
          ? new Date(response.data.dateNaissance).toISOString().split('T')[0] 
          : ''
      };
      // Mettre à jour les données locales
      setUserData(formattedData);
      // Mettre à jour l'image si elle a été modifiée
      if (response.data.image) {
        setProfileImage(`https://backendlms-5992.onrender.com/Public/Images/${response.data.image}`);
      }

      localStorage.setItem("image", response.data.image);
      sessionStorage.setItem("image", response.data.image);

      // Émettre un événement personnalisé pour mettre à jour l'image dans la navbar
      const updateEvent = new CustomEvent('profileImageUpdated', {
        detail: { image: response.data.image }
      });
      window.dispatchEvent(updateEvent);

      setIsEditing(false);
      setAlertMessage({ 
        type: 'success', 
        message: t('profile.accountInfo.updateSuccess') 
      });

    } catch (error) {
      console.error(t('profile.validation.error'));
      setAlertMessage({ 
        type: 'error', 
        message: t('profile.accountInfo.updateError') 
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  //HANDLE GET SUBSCRIPTION
  const handleGetSubscription = async() => {
    const hasActiveSubscription = await hasActiveSubscriptionServer();
   
    if (hasActiveSubscription) {
      try {
        const token = localStorage.getItem('token')||sessionStorage.getItem('token');
    
        const response = await axios.get('https://backendlms-5992.onrender.com/abonnement', {
          withCredentials: false,
          headers: {
          Authorization: `Bearer ${token}`
        }

      });
      setAbonnement(response.data.abonnement);
      } catch (error) {
        console.error(t('profile.validation.fetchingSubscription'), error);
      }
    } else if (isAuthenticated()) {
      navigate('/subscribe');
    }
    else{
      navigate('/subscribe');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Alert Message */}
        {alertMessage.message && (
          <div className={`mb-4 p-4 rounded-md ${
            alertMessage.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-400' 
              : 'bg-red-100 text-red-700 border border-red-400'
          }`}>
            <div className="flex justify-between items-center">
              <span>{alertMessage.message}</span>
              <button 
                onClick={() => setAlertMessage({ type: '', message: '' })}
                className="ml-4 text-sm font-medium hover:opacity-75"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-[#3f51b5] p-6 text-center">
            <div 
              className={`inline-block bg-white p-2 rounded-full mb-4 ${isEditing ? 'cursor-pointer relative group' : ''}`}
              onClick={handleProfileImageClick}
            >
              <img
                src={previewImage || profileImage || profilePicture}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">{t('profile.accountInfo.profileImage.changePhoto')}</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">{userData.name}</h1>
            <p className="text-blue-100">{userData.email}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">{t('profile.accountInfo.title')}</h2>
                  <button 
                    onClick={handleEditToggle}
                    className={`text-sm px-3 py-1 rounded-md ${
                      isEditing 
                        ? 'bg-gray-200 text-gray-700' 
                        : 'bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] text-white hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? t('profile.accountInfo.cancel') : t('profile.accountInfo.editProfile')}
                  </button>
                </div>
                
                {isEditing ? (
                  <Formik
                    initialValues={{
                      fullName: userData?.name || '',
                      email: userData?.email || '',
                      telephone: userData?.telephone || '',
                      dateNaissance: userData?.dateNaissance || '',
                      password: '',
                      confirmPassword: ''
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize={true}
                  >
                    {({ isSubmitting, errors, touched }) => (
                      <Form className="space-y-4">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('profile.accountInfo.fullName')}
                          </label>
                          <Field
                            type="text"
                            id="fullName"
                            name="fullName"
                            className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              errors.fullName && touched.fullName ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <ErrorMessage name="fullName" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('profile.accountInfo.email')}
                          </label>
                          <Field
                            type="email"
                            id="email"
                            name="email"
                            disabled={true}
                            className={`w-full p-2 border rounded-md bg-gray-100 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('profile.accountInfo.telephone')}
                          </label>
                          <Field
                            type="tel"
                            id="telephone"
                            name="telephone"
                            placeholder="0123456789"
                            className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              errors.telephone && touched.telephone ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <ErrorMessage name="telephone" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="dateNaissance" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('profile.accountInfo.dateNaissance')}
                          </label>
                          <Field
                            type="date"
                            id="dateNaissance"
                            name="dateNaissance"
                            className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              errors.dateNaissance && touched.dateNaissance ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <ErrorMessage name="dateNaissance" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('profile.accountInfo.password.new')}
                          </label>
                          <Field
                            type="password"
                            id="password"
                            name="password"
                            className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              errors.password && touched.password ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('profile.accountInfo.password.confirm')}
                          </label>
                          <Field
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                              errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full mt-4 bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70"
                        >
                          {isSubmitting ? t('profile.accountInfo.saving') : t('profile.accountInfo.saveChanges')}
                        </button>
                      </Form>
                    )}
                  </Formik>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">{t('profile.accountInfo.fullName')}</p>
                      <p className="font-medium">{userData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('profile.accountInfo.email')}</p>
                      <p className="font-medium">{userData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('profile.accountInfo.telephone')}</p>
                      <p className="font-medium">{userData.telephone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('profile.accountInfo.dateNaissance')}</p>
                      <p className="font-medium">
                        {userData.dateNaissance 
                          ? new Date(userData.dateNaissance).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : t('profile.accountInfo.notProvided')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {/* Subscription Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('profile.subscription.title')}</h2>
                {abonnement ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <h3 className="font-medium text-gray-800 mb-2">{t('profile.subscription.details')}</h3>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-600">{t('profile.subscription.type')}: </span>
                          <span className="font-medium">{abonnement?.planId?.name}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-600">{t('profile.subscription.status')}: </span>
                          <span className={`font-medium ${abonnement.statut === 'actif' ? 'text-green-600' : 'text-red-600'}`}>
                            {abonnement.statut}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-600">{t('profile.subscription.startDate')}: </span>
                          <span className="font-medium">
                            {new Date(abonnement.dateDebut).toLocaleDateString('fr-FR')}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-600">{t('profile.subscription.endDate')}: </span>
                          <span className="font-medium">
                            {new Date(abonnement.dateFin).toLocaleDateString('fr-FR')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500 mb-4">{t('profile.subscription.noSubscription')}</p>
                    <button
                      onClick={handleGetSubscription}
                      className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      {t('profile.subscription.getSubscription')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default ProfilePage;