import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserToken } from "../redux/slices/authSlice";
import { useTranslation } from 'react-i18next';
import google from "../assets/images/google-icon.png";
import { motion } from "framer-motion";

const SignupPage = () => {
  const googleAuth = () => {
		window.open(
			`http://localhost:4000/auth/google/callback`,
			"_self"
		);
	};
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t('signup.form.name.validation.required')),
      email: Yup.string()
        .email(t('signup.form.email.validation.invalid'))
        .required(t('signup.form.email.validation.required')),
      password: Yup.string()
        .min(6, t('signup.form.password.validation.minLength'))
        .required(t('signup.form.password.validation.required')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], t('signup.form.confirmPassword.validation.match'))
        .required(t('signup.form.confirmPassword.validation.required')),
    }),
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        const response = await axios.post(
          "https://backendlms-5992.onrender.com/register",
          {
            name: values.name,
            email: values.email,
            password: values.password,
          }
        );
        const { token, user } = response.data;
        if (!token) {
          throw new Error(t('signup.errors.tokenError'));
        }
        const userData = {
          name: values.name,
          email: values.email,
          ...(user || {}),
        };
        navigate("/login", {
          state: { message: t('signup.success.message') },
        });
      } catch (error) {
        console.error(t('navbar.auth.registrationError'), error);
        const errorMessage =
          error.response?.data?.message ||
          t('signup.errors.registrationFailed');

        setErrors({ form: errorMessage });
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f6ff]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200"
      >
        <div className="p-4 md:p-6 flex flex-col relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#1B45B4]"></div>
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-[#1B45B4] mb-2">
              {t('signup.title')}
            </h1>
            <p className="text-gray-600 text-lg">
              {t('signup.subtitle')}
            </p>
          </div>

          {formik.errors.form && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded"
            >
              <p>{formik.errors.form}</p>
            </motion.div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4 flex-grow">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t('signup.form.name.label')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${formik.errors.name ? "border-red-500 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-gray-50`}
                placeholder={t('signup.form.name.placeholder')}
              />
              {formik.errors.name && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('signup.form.email.label')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${formik.errors.email ? "border-red-500 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-gray-50`}
                placeholder={t('signup.form.email.placeholder')}
              />
              {formik.errors.email && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('signup.form.password.label')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${formik.errors.password ? "border-red-500 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-gray-50`}
                placeholder="••••••••"
              />
              {formik.errors.password && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('signup.form.confirmPassword.label')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                className={`w-full px-4 py-3 rounded-xl border ${formik.errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300"} focus:ring-2 focus:ring-[#1B45B4] focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-gray-50`}
                placeholder="••••••••"
              />
              {formik.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.confirmPassword}</p>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={formik.isSubmitting}
              className={`w-full bg-[#1B45B4] text-white py-3 rounded-xl font-medium text-base ${formik.isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-900"} transition-all duration-200 shadow-lg mt-2`}
            >
              {formik.isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('signup.form.submit.creating')}
                </div>
              ) : (
                t('signup.form.submit.create')
              )}
            </motion.button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {t('signup.haveAccount.text')} {" "}
              <Link to="/login" className="font-medium text-[#1B45B4] hover:underline">
                {t('signup.haveAccount.login')}
              </Link>
            </p>
          </div>

          <div className="mt-4">
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
              className="mt-4"
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
            <h2 className="text-4xl font-bold mb-6">{t('signup.banner.title')}</h2>
            <p className="text-xl mb-8 leading-relaxed">{t('signup.banner.description')}</p>
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

export default SignupPage;
