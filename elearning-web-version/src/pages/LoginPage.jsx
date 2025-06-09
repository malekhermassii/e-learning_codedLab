import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import google from "../assets/images/google-icon.png";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setUserToken } from '../redux/slices/authSlice';
import { motion } from "framer-motion";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fromRef = useRef(location.state?.from || "/courses");
  const dispatch = useDispatch();
  //CHECK IF USER IS LOGGED IN
  useEffect(() => {
    const currentUser =
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(sessionStorage.getItem("currentUser"));

    if (currentUser) {
      navigate(fromRef.current);
     return
    }
    // Gestion de l'authentification Google
    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        dispatch(setUserToken(userData));
        
        // Stockage des données utilisateur
        localStorage.setItem("currentUser", JSON.stringify(userData));
        localStorage.setItem("image", userData.image);
        
        // Nettoyage de l'URL
        window.history.replaceState({}, document.title, "/home");
        
        // Redirection vers la page d'accueil
        navigate("/home", { replace: true });
      } catch (error) {
        console.error(t('login.errorUserProcessing'), error);
        setErrorMessage(t('login.errorGoogleConnection'));
      }
    }

    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const { from } = location.state;
      fromRef.current = from;
      window.history.replaceState({ from }, document.title);
    }
  }, [location.state?.message, navigate, dispatch]);

  // Google Auth
  const googleAuth = () => {
		window.open(
			`https://backendlms-5992.onrender.comauth/google/callback`,
			"_self"
      
		);
	};

  const validationSchema = Yup.object({
    email: Yup.string().email(t('login.form.email.validation.invalid')).required(t('login.form.email.validation.required')),
    password: Yup.string()
      .min(6, t('login.form.password.validation.minLength'))
      .required(t('login.form.password.validation.required')),
    rememberMe: Yup.boolean(),
  });

  //HANDLE SUBMIT LOGIN 
  const handleSubmit = async (values) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await axios.post("https://backendlms-5992.onrender.com/login", {
        email: values.email,
        password: values.password,
      });

      const { token, user } = response.data;

      if (!token) throw new Error(t('login.errors.tokenError'));

      const userData = {
        name: response.data?.name || "User",
        email: user?.email || values.email,
        _id: response.data?.userId || "",
        ...(user || {}),
      };
      const userInfo = {
        name: response.data?.name,
        image: response.data?.image,
        
      };  
      console.log('response', response.data);
      dispatch(setUserToken(userData));
      localStorage.setItem("currentUser", JSON.stringify(userData));
      localStorage.setItem("token", token); 
      localStorage.setItem("image", response.data?.image);

      navigate("/home", { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        t('login.errors.incorrectCredentials');
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6ff]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 md:p-12 flex flex-col relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#1B45B4]"></div>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#1B45B4] mb-3">
              {t('login.title')}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('login.subtitle')}
            </p>
            {successMessage && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-green-600 text-sm bg-green-50 p-2 rounded-lg"
              >
                {successMessage}
              </motion.p>
            )}
            {errorMessage && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg"
              >
                {errorMessage}
              </motion.p>
            )}
          </div>

          <Formik
            initialValues={{ email: "", password: "", rememberMe: false }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form className="space-y-6 flex-grow">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('login.form.email.label')}
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('login.form.email.placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                  <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('login.form.password.label')}
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                  <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Field
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      className="h-4 w-4 text-[#1B45B4] focus:ring-[#1B45B4] border-gray-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                      {t('login.form.rememberMe')}
                    </label>
                  </div>
                
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-[#1B45B4] text-white py-3 rounded-xl font-medium text-base ${
                    isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-900"
                  } transition-all duration-200 shadow-lg`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {t('login.form.submit.loggingIn')}
                    </div>
                  ) : (
                    t('login.form.submit.login')
                  )}
                </motion.button>
                <Link to="/forgot-password" className="text-sm text-[#1B45B4] hover:underline mb-14">
                  {t('login.form.forgotPassword')}
                </Link>
              </Form>
            )}
          </Formik>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {t('login.noAccount.text')} {" "}
              <Link to="/signup" className="font-medium text-[#1B45B4] hover:underline">
                {t('login.noAccount.signup')}
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t('login.social.divider')}</span>
              </div>
            </div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6"
            >
              <button
                type="button"
                onClick={googleAuth}
                className="w-full py-3 px-6 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:shadow-md"
              >
                <img src={google} alt="Google" className="h-5 w-5 mr-2" />
                {t('login.social.google')}
              </button>
            </motion.div>
          </div>
        </div>

        <div className="hidden md:block relative bg-[#1B45B4] text-white flex items-center justify-center overflow-hidden">
          <div className="relative text-center px-10 py-6 z-10">
            <h2 className="text-4xl font-bold mb-6">{t('login.banner.title')}</h2>
            <p className="text-xl mb-8 leading-relaxed">{t('login.banner.description')}</p>
            <div className="grid grid-cols-2 gap-4 mt-8">
          
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <h3 className="font-semibold mb-2"> {t('login.flexibleLearning.title')} </h3>
                <p className="text-sm"> {t('login.learnAtYourOwnPace.title')} </p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <h3 className="font-semibold mb-2"> {t('login.qualityContent.title')} </h3>
                <p className="text-sm"> {t('login.certifiedCourses.title')} </p>
              </div>
           
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
