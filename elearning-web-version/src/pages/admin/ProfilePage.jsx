import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateProfil, updateProfilStart, updateProfilError } from "../../redux/slices/adminSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("The email is required"),
  password: Yup.string()
    .min(6, "The password must contain at least 6 characters")
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  confirmPassword: Yup.string()
    .nullable()
    .test(
      "passwords-match",
      "The passwords must match",
      function (value) {
        return !this.parent.password || value === this.parent.password;
      }
    ),
});

const ProfilePageadmin = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.authadmin);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    // Vérifier si l'admin est connecté
    const token = localStorage.getItem("adminToken");
    const storedAdmin = JSON.parse(localStorage.getItem("currentadmin"));
    
    if (!token) {
      navigate("/loginadmin");
      return;
    }

    if (storedAdmin && (!adminState?.adminInfo?.name)) {
      dispatch(updateProfil(storedAdmin));
    }
  }, [navigate, dispatch, adminState?.adminInfo]);

  useEffect(() => {
    console.log("État actuel de l'admin:", adminState?.adminInfo);
    if (adminState?.adminInfo?.image) {
      const imageUrl = `https://backendlms-5992.onrender.com/Public/Images/${adminState.adminInfo.image}`;
      console.log("URL de l'image:", imageUrl);
      setProfileImage(imageUrl);
    }
  }, [adminState?.adminInfo]);

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
      console.log("Start handleSubmit with values:", values);
      dispatch(updateProfilStart());
      setLoading(true);
      const formData = new FormData();

      formData.append("name", values.name);
      formData.append("email", values.email);

      if (values.password && values.password.trim() !== "") {
        if (values.password !== values.confirmPassword) {
          toast.error("These words do not correspond to each other");
          return;
        }
        formData.append("password", values.password);
      }

      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const token = localStorage.getItem("adminToken");
      console.log("Token récupéré:", token ? "Présent" : "Absent");
      
      if (!token) {
        toast.error(t("adminProfile.profile.errors.loginRequired"));
        navigate("/loginadmin");
        return;
      }

      console.log("Sending request to the API with the token:", token);
      const response = await axios.put(
        "https://backendlms-5992.onrender.com/adminprofile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Réponse reçue:", response.data);

      if (response.data) {
        // Mettre à jour les données dans Redux
        const updatedData = {
          ...response.data,
          _id: adminState?.adminInfo?._id
        };
        
        // Mettre à jour Redux
        dispatch(updateProfil(updatedData));
        
        // Mettre à jour le localStorage
        localStorage.setItem("currentadmin", JSON.stringify(updatedData));
        
        toast.success(t("adminProfile.success"));
        console.log("État actuel de l'admin:", adminState?.adminInfo);

        // Réinitialiser le formulaire
        resetForm({
          values: {
            name: response.data.name,
            email: response.data.email,
            password: "",
            confirmPassword: "",
          },
        });

        // Mettre à jour l'image si elle a été modifiée
        if (response.data.image) {
          const imageUrl = `https://backendlms-5992.onrender.com/Public/Images/${response.data.image}`;
          setProfileImage(imageUrl);
        }
      } else {
        throw new Error("Error updating profile");
      }
    } catch (error) {
      console.error("Detailed error:", error);
      console.error("Response error:", error.response);
      dispatch(updateProfilError(error.response?.data?.message || t("adminProfile.error")));
      toast.error(
        error?.response?.data?.message ||
          t("adminProfile.error")
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("adminProfile.title")}</h1>
        <p className="text-gray-600">{t("adminProfile.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t("adminProfile.sidebar.menu")}
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
                  {t("adminProfile.sidebar.profileInfo")}
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
                {t("adminProfile.profile.title")}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t("adminProfile.profile.subtitle")}
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <Formik
                initialValues={{
                  name: adminState?.adminInfo?.name || "",
                  email: adminState?.adminInfo?.email || "",
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
                              {t("adminProfile.profile.changeImage")}
                             
                              </label>
                              <button
                                type="button"
                                className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                                onClick={() => {
                                  setProfileImage(null);
                                  setSelectedFile(null);
                                }}
                              >
                                {t("adminProfile.profile.removeImage")}
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              {t("adminProfile.profile.imageRecommendation")}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          {t("adminProfile.profile.fullName")}
                        </label>
                        <Field
                          name="name"
                          type="text"
                          placeholder={t("adminProfile.profile.placeholderName")}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.name && touched.name && (
                          <div className="text-red-500 text-sm mt-1">{errors.name}</div>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          {t("adminProfile.profile.email")}
                        </label>
                        <Field
                          name="email"
                          type="email"
                          placeholder={t("adminProfile.profile.placeholderEmail")}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.email && touched.email && (
                          <div className="text-red-500 text-sm mt-1">{errors.email}</div>
                        )}
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          {t("adminProfile.profile.newPassword")}
                        </label>
                        <Field
                          name="password"
                          type="password"
                          placeholder={t("adminProfile.profile.placeholderPassword")}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.password && touched.password && (
                          <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                        )}
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          {t("adminProfile.profile.confirmPassword")}
                        </label>
                        <Field
                          name="confirmPassword"
                          type="password"
                          placeholder={t("adminProfile.profile.placeholderConfirmPassword")}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        {errors.confirmPassword && touched.confirmPassword && (
                          <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || loading}
                        className="py-2 px-4 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {loading ? t("adminProfile.profile.buttons.saving") : t("adminProfile.profile.save")}
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

export default ProfilePageadmin;
