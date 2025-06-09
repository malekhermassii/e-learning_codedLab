import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  updateProfil,
  updateProfilStart,
  updateProfilError,
} from "../../redux/slices/profSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  confirmPassword: Yup.string()
    .nullable()
    .test(
      "passwords-match",
      "Passwords must match",
      function (value) {
        return !this.parent.password || value === this.parent.password;
      }
    ),
  dateNaissance: Yup.date().required("Birth date is required"),
  specialite: Yup.string().required("Speciality is required"),
});

const SettingsPage = () => {
  const dispatch = useDispatch();
  const profState = useSelector((state) => state.authprof);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [alertMessage, setAlertMessage] = useState({ type: '', message: '' });

  useEffect(() => {
    // Vérifier si l'instructeur est connecté
    const token = localStorage.getItem("profToken");
    const storedprof = JSON.parse(localStorage.getItem("currentprof"));

    if (!token) {
      navigate("/loginprof");
      return;
    }

    // Mettre à jour Redux avec les données du localStorage si nécessaire
    if (storedprof) {
      dispatch(updateProfil(storedprof));
    }
  }, [navigate, dispatch]);

  // Effet pour mettre à jour l'image de profil
  useEffect(() => {
    if (profState?.profInfo?.image) {
      const timestamp = new Date().getTime();
      const imageUrl = `https://backendlms-5992.onrender.com/Public/Images/${profState.profInfo.image}?t=${timestamp}`;
      setProfileImage(imageUrl);
    }
  }, [profState?.profInfo?.image]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      dispatch(updateProfilStart());
      setLoading(true);
      setAlertMessage({ type: '', message: '' });

      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("dateNaissance", values.dateNaissance);
      formData.append("telephone", values.telephone);
      formData.append("specialite", values.specialite);

      if (values.password && values.password.trim() !== "") {
        if (values.password !== values.confirmPassword) {
          setAlertMessage({ 
            type: 'error', 
            message: 'Les mots de passe ne correspondent pas' 
          });
          return;
        }
        formData.append("password", values.password);
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const token = localStorage.getItem("profToken");
      
      if (!token) {
        setAlertMessage({ 
          type: 'error', 
          message: 'Veuillez vous reconnecter pour modifier votre profil' 
        });
        navigate("/loginprof");
        return;
      }

      const response = await axios.put(
        "https://backendlms-5992.onrender.com/updateprofile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        const updatedData = {
          ...response.data,
          _id: profState?.profInfo?._id,
        };

        localStorage.setItem("currentprof", JSON.stringify(updatedData));
        dispatch(updateProfil(updatedData));
        
        setAlertMessage({ 
          type: 'success', 
          message: 'Profil mis à jour avec succès' 
        });

        setTimeout(() => {
          resetForm({
            values: {
              name: updatedData.name,
              email: updatedData.email,
              dateNaissance: updatedData.dateNaissance,
              telephone: updatedData.telephone,
              specialite: updatedData.specialite,
              password: "",
              confirmPassword: "",
            },
          });
        }, 0);

        if (updatedData.image) {
          const timestamp = new Date().getTime();
          const imageUrl = `https://backendlms-5992.onrender.com/Public/Images/${updatedData.image}?t=${timestamp}`;
          setProfileImage(imageUrl);
        }
      }
    } catch (error) {
      dispatch(updateProfilError(error.response?.data?.message || "Erreur lors de la mise à jour du profil"));
      setAlertMessage({ 
        type: 'error', 
        message: error?.response?.data?.message || "Une erreur est survenue lors de la mise à jour de votre profil" 
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Simple Alert Message */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Settings Menu
              </h3>
            </div>
            <nav className="px-3 py-3">
              <div className="space-y-1">
                <a
                  href="#profile"
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                >
                  <svg
                    className="mr-3 h-5 w-5 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile Information
                </a>
                
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div
            id="profile"
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Profile Information
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal information
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <Formik
                initialValues={{
                  name: profState?.profInfo?.name || "",
                  email: profState?.profInfo?.email || "",
                  dateNaissance: profState?.profInfo?.dateNaissance 
                    ? new Date(profState.profInfo.dateNaissance).toISOString().split('T')[0]
                    : "",
                  telephone: profState?.profInfo?.telephone || "",
                  specialite: profState?.profInfo?.specialite || "",
                  password: "",
                  confirmPassword: "",
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize={true}
              >
                {({ errors, touched, isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-6 gap-6">
                      <div className="col-span-6">
                        <div className="flex items-center">
                          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="Profile"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="h-12 w-12"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-5">
                            <div className="flex items-center space-x-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                id="profile-image"
                              />
                              <label
                                htmlFor="profile-image"
                                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                              >
                                Change
                              </label>
                              <button
                                type="button"
                                className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                onClick={() => {
                                  setProfileImage(null);
                                  setSelectedFile(null);
                                }}
                              >
                                Remove
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              Recommended dimensions: 400px x 400px. Max size: 1MB.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Full Name
                        </label>
                        <Field
                          name="name"
                          type="text"
                          placeholder={profState?.profInfo?.name || "Your name"}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.name && touched.name && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors.name}
                          </div>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email Address
                        </label>
                        <Field
                          name="email"
                          type="email"
                          disabled={true}
                          placeholder={
                            profState?.profInfo?.email || "Your email"
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.email && touched.email && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors.email}
                          </div>
                        )}
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700"
                        >
                          New Password
                        </label>
                        <Field
                          name="password"
                          type="password"
                          placeholder="Leave blank to keep current"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.password && touched.password && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors.password}
                          </div>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Confirm Password
                        </label>
                        <Field
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm new password"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.confirmPassword && touched.confirmPassword && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors.confirmPassword}
                          </div>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="dateNaissance"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Date de naissance
                        </label>
                        <Field
                          name="dateNaissance"
                          type="date"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.dateNaissance && touched.dateNaissance && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors.dateNaissance}
                          </div>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="telephone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Phone
                        </label>
                        <Field
                          name="telephone"
                          type="tel"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.telephone && touched.telephone && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors.telephone}
                          </div>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label
                          htmlFor="specialite"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Speciality
                        </label>
                        <Field
                          name="specialite"
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.specialite && touched.specialite && (
                          <div className="text-red-500 text-sm mt-1">
                            {errors.specialite}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || loading}
                        className="py-2 px-4 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {loading
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
