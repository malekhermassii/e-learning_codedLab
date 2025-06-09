import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addDemande } from "../redux/slices/demandeSlice";
import { useTranslation } from 'react-i18next';

// Configuration de l'URL de base pour axios (adapter selon votre configuration)
const API_BASE_URL = "https://backendlms-5992.onrender.com";

const ApplyInstructorPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [cv, setCv] = useState(null);
  const [cvName, setCvName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cvTriedSubmit, setCvTriedSubmit] = useState(false);
  const { t } = useTranslation();

  const initialValues = {
    name: "",
    email: "",
    country: "",
    speciality: "",
    birthDate: "",
    topic: "",
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, t('instructorApplication.validation.name.min'))
      .required(t('instructorApplication.validation.name.required')),
    email: Yup.string()
      .email(t('instructorApplication.validation.email.invalid'))
      .required(t('instructorApplication.validation.email.required')),
    country: Yup.string().required("Country is required"),
    speciality: Yup.string().required("Area of specialty is required"),
    birthDate: Yup.date()
      .required("Birth date is required"),
    topic: Yup.string().required("Teaching topics are required"),
  });
//handle submit demande
  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      setError("");
      if (!cv) {
        setCvTriedSubmit(true);
        alert(t('instructorApplication.professionalInfo.cv.required'));
        setSubmitting(false);
        return;
      }
      setCvTriedSubmit(false);
      setLoading(true);
      const formData = new FormData();
      // Formater la date au format ISO
      const formattedDate = new Date(values.birthDate).toISOString();
      // Ajouter les champs de base
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("country", values.country);
      formData.append("speciality", values.speciality);
      formData.append("birthDate", formattedDate);
      formData.append("topic", values.topic);

      // Ajouter le fichier CV - s'assurer que le nom du champ correspond exactement à ce que le backend attend
      formData.append("cv", cv, cv.name);

      console.log("Sending data:", {
        name: values.name,
        email: values.email,
        country: values.country,
        speciality: values.speciality,
        birthDate: formattedDate,
        topic: values.topic,
        cv: cv.name
      });
      
      // Vérifier le contenu du FormData
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

      // Envoi de la demande
      const response = await axios.post(
        `${API_BASE_URL}/demandes`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        }
      );

      if (response.data) {
        dispatch(addDemande(response.data.demande));
        alert(t('instructorApplication.submit.success.success'));
      
        setStatus({ success: true });
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (error) {
      console.error(t('instructorApplication.errorSendingApplication'), error);
      setError(t('instructorApplication.submit.error.title'));
      
      if (error.response) {
        console.error(t('instructorApplication.errorResponse'), error.response.data);
        console.error(t('instructorApplication.statuss'), error.response.status);
        setError(`Error ${error.response.status}: ${error.response.data.message || "Unknown error"}`);
      } else if (error.request) {
        console.error(t('instructorApplication.errorRequest'), error.request);
        setError(t('instructorApplication.submit.error.noResponse'));
      } else {
        console.error(t('instructorApplication.errorMessage'), error.message);
        setError(`Error: ${error.message}`);
      }
      
      alert(
        t('instructorApplication.submit.error.unknown')
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <section>
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('instructorApplication.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('instructorApplication.subtitle')}
            </p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, status, setFieldValue }) =>
              status?.success ? (
                <div className="bg-white p-8 rounded-xl shadow-lg text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {t('instructorApplication.submit.success.title')}
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    {t('instructorApplication.pagetitre')}
                .
                  </p>
                  <div className="animate-pulse">
                    <p className="text-sm text-gray-500">
                      {t('instructorApplication.submit.success.redirecting')}
                    </p>
                  </div>
                </div>
              ) : (
                <Form className="bg-gradient-to-r from-[#6572EB29] to-[#6572EB00] shadow-xl rounded-xl p-8">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      <p><strong>{t('instructorApplication.submit.error.title')}:</strong> {error}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Information */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b">
                        {t('instructorApplication.personalInfo.title')}
                      </h3>

                      <FieldWithError
                        name="name"
                        label={t('instructorApplication.personalInfo.fullName')}
                        placeholder={t('instructorApplication.personalInfo.fullName')}
                      />
                      <FieldWithError
                        name="email"
                        label={t('instructorApplication.personalInfo.email')}
                        type="email"
                        placeholder={t('instructorApplication.personalInfo.email')}
                      />
                 
                      <FieldWithError
                        name="country"
                        label={t('instructorApplication.personalInfo.country')}
                        placeholder={t('instructorApplication.personalInfo.country')}
                      />
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b">
                        {t('instructorApplication.professionalInfo.title')}
                      </h3>

                      <FieldWithError
                        name="speciality"
                        label={t('instructorApplication.professionalInfo.speciality')}
                        placeholder={t('instructorApplication.professionalInfo.speciality')}
                      />
                      <FieldWithError
                        name="birthDate"
                        label={t('instructorApplication.personalInfo.birthDate')}
                        type="date"
                        placeholder={t('instructorApplication.professionalInfo.birthDatePlaceholder')}
                      />
                      <FieldWithError
                        name="topic"
                        label={t('instructorApplication.professionalInfo.topics')}
                        placeholder={t('instructorApplication.professionalInfo.topics')}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('instructorApplication.professionalInfo.cv.label')} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-col">
                          <input
                            type="file"
                            name="cv"
                            accept=".pdf,.docx"
                            onChange={(event) => {
                              const file = event.currentTarget.files[0];
                              if (file) {
                                setCv(file);
                                setCvName(file.name);
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          {cvName && (
                            <p className="mt-1 text-sm text-green-500">
                              {t('instructorApplication.professionalInfo.cv.selected')} {cvName}
                            </p>
                          )}
                          {!cv && cvTriedSubmit && (
                            <p className="mt-1 text-sm text-red-500">
                              {t('instructorApplication.professionalInfo.cv.required')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || loading}
                      className={`px-8 py-3 bg-[#1B45B4] text-white rounded-lg font-medium hover:bg-blue-700 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                        transition-all transform hover:scale-105 ${
                          (isSubmitting || loading) ? "opacity-75 cursor-not-allowed" : ""
                        }`}
                    >
                      {(isSubmitting || loading) ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          {t('instructorApplication.submit.processing')}
                        </span>
                      ) : (
                        t('instructorApplication.submit.button')
                      )}
                    </button>
                  </div>
                </Form>
              )
            }
          </Formik>
        </div>
      </div>
    </section>
  );
};

// 👇 Helper component to render fields with errors
const FieldWithError = ({
  name,
  label,
  type = "text",
  placeholder = "",
  required = true,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Field
      name={name}
      type={type}
      placeholder={placeholder}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    <ErrorMessage
      name={name}
      component="p"
      className="mt-1 text-sm text-red-500"
    />
  </div>
);

export default ApplyInstructorPage;
