import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAdminToken } from "../../redux/slices/adminSlice";
import axios from "axios";
import google from "../../assets/images/google-icon.png";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";


const LoginPageadmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const from = location.state?.from || "/admin";

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      const { from } = location.state;
      window.history.replaceState({ from }, document.title);
    }
    const adminToken = localStorage.getItem("adminToken");
    const currentadmin =
      JSON.parse(localStorage.getItem("currentadmin")) ||
      JSON.parse(sessionStorage.getItem("currentadmin"));
    if (adminToken && currentadmin) {
      navigate(from);
    }
  }, [location, navigate, from]);

  //validation du formulaire
  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),

  });

  //fonction de connexion
  const handleSubmit = async (values) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Nettoyer toutes les sessions existantes
      console.log("Tentative de connexion avec:", values);
      const response = await axios.post("https://backendlms-5992.onrender.com/adminlogin", {
        email: values.email,
        password: values.password,
      });

      console.log("Réponse du serveur:", response.data);
      const { token, admin } = response.data;
      console.log("reponse", response.data)
      if (!token) throw new Error("Token not received from server");

      const adminData = {
        name: admin?.name || "admin",
        email: admin?.email || values.email,
        _id: admin?._id,
        ...(admin || {}),
        
      };

      // Stocker les données dans le localStorage
      localStorage.setItem("adminToken", token);
      localStorage.setItem("currentadmin", JSON.stringify(adminData));
      console.log("Données stockées:", { token, adminData });
      localStorage.setItem("imageAdmin", response.data?.admin?.image);
      sessionStorage.setItem("imageAdmin", response.data?.admin?.image);

      // Mettre à jour le state Redux
      dispatch(setAdminToken({ token, admin: adminData }));
      console.log("State Redux mis à jour avec:", { token, admin: adminData });

      navigate(from, { replace: true });
    } catch (error) {
      console.error("Erreur de connexion:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Incorrect email or password.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6 flex items-center gap-3">
            <span className="bg-blue-100 text-blue-600 rounded-full p-2">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z" />
              </svg>
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Espace Administrateur</h1>
          </div>
          <p className="text-gray-600 mb-4">Log in to manage your administration area </p>
          {successMessage && (
            <p className="mt-2 text-green-600 text-sm font-semibold border border-green-200 bg-green-50 rounded px-3 py-2 mb-2">{successMessage}</p>
          )}
          {errorMessage && (
            <p className="mt-2 text-red-600 text-sm font-semibold border border-red-200 bg-red-50 rounded px-3 py-2 mb-2">{errorMessage}</p>
          )}
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form className="space-y-6 flex-grow">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                   Email
                  </label>
                  <div className="relative">
                    
                    <Field
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      className="w-full pl-5 px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500 text-base outline-none"
                    />
                  </div>
                  <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-5 px-4 py-3 rounded-xl border border-gray-300 bg-white shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500 text-base outline-none"
                    />
                  </div>
                  <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
                </div>
                <div className="flex justify-between items-center">
                  <div></div>
                
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-[#1B45B4] text-white py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"} transition-colors shadow-md`}
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
                      Login...
                    </div>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z" />
                      </svg>
                     Login
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>
        <div className="hidden md:block bg-gradient-to-br from-[#1B45B4] via-blue-700 to-blue-900 text-white flex items-center justify-center relative">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80)' }}></div>
          <div className="relative z-10 text-center px-10 py-6">
            <h2 className="text-3xl font-semibold mb-4 drop-shadow-lg">Administration Area</h2>
            <p className="text-lg mb-6 drop-shadow-lg">Manage users, content and system settings securely from your dashboard!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageadmin;
