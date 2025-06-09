import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { fetchprofesseur } from "../../api";
import {  addProfesseur, updateProfesseur, deleteProfesseur } from '../../redux/slices/professorSlice';
import { useTranslation } from 'react-i18next';

const InstructorManagementPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const professeurs = useSelector((state) => state.professors.professors);

    useEffect(() => {
      const loadInitialData = async () => {
        try {
          setLoading(true);
          await dispatch(fetchprofesseur());
          setError(null);
          setShouldRefresh(false);
        } catch (error) {
          console.error("Error loading instructors:", error);
          setError(t('instructorManagement.errorLoading'));
        } finally {
          setLoading(false);
        }
      };
  
      loadInitialData();
    }, [dispatch, t, shouldRefresh]);


    
  const handleEditInstructor = async () => {
    if (!selectedInstructor?.id) {
      alert(t('instructorManagement.errors.noId'));
      return;
    }
    
    try {
      // Vérifier si l'email existe déjà pour un autre professeur
      const existingProfessor = professeurs.find(
        (prof) => prof.email === selectedInstructor.email && 
        (prof._id !== selectedInstructor.id && prof.id !== selectedInstructor.id)
      );
      
      if (existingProfessor) {
        alert(t('instructorManagement.errors.emailExists'));
        return;
      }

      const response = await axios.put(
        `https://backendlms-5992.onrender.com/professeur/${selectedInstructor.id}`,
        {
          name: selectedInstructor.name,
          email: selectedInstructor.email,
          password: selectedInstructor.password || undefined
        }
      );

      if (response.status === 200) {
        // Mettre à jour le state Redux
        dispatch(updateProfesseur({
          _id: selectedInstructor.id,
          name: selectedInstructor.name,
          email: selectedInstructor.email
        }));
        
        // Mettre à jour le localStorage
        const updatedProfessors = professeurs.map(prof => 
          (prof._id === selectedInstructor.id || prof.id === selectedInstructor.id) 
            ? { ...prof, name: selectedInstructor.name, email: selectedInstructor.email }
            : prof
        );
        localStorage.setItem("professeurs", JSON.stringify(updatedProfessors));
        
        setIsEditModalOpen(false);
        setSelectedInstructor(null);
        alert(t('instructorManagement.success.update'));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      alert(error.response?.data?.message || t('instructorManagement.errors.update'));
    }
  };

  const handleDeleteInstructor = async () => {
    if (!selectedInstructor) return;
    
    try {
      const response = await axios.delete(
        `https://backendlms-5992.onrender.com/professeur/${selectedInstructor.id}`
      );

      if (response.status === 200) {
        // Mettre à jour le state Redux
        dispatch(deleteProfesseur(selectedInstructor.id));
        
        // Mettre à jour le localStorage
        const updatedProfessors = professeurs.filter(prof => prof.id !== selectedInstructor.id);
        localStorage.setItem("professeurs", JSON.stringify(updatedProfessors));
        
        setIsDeleteModalOpen(false);
        setShouldRefresh(true);
        setSelectedInstructor(null);
        alert(t('instructorManagement.success.delete'));
      }
    } catch (error) {
      console.error("Error deleting instructor:", error);
      if (error.response?.status === 404) {
        alert(t('instructorManagement.errors.notFound'));
      } else if (error.response?.status === 403) {
        alert(t('instructorManagement.errors.noPermission'));
      } else {
        alert(error.response?.data?.message || t('instructorManagement.errors.delete'));
      }
    }
  };

  const handleAddInstructor = async (values, { resetForm }) => {
    try {
      // Vérifier si l'email existe déjà
      const existingProfessor = professeurs.find(
        (prof) => prof.email === values.email
      );
      if (existingProfessor) {
        alert(t('instructorManagement.errors.emailExists'));
        return;
      }

      const response = await axios.post("https://backendlms-5992.onrender.com/professeurcreate", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      if (response.status === 201) {
        // Créer l'objet professeur avec les données de la réponse
        const newProfessor = {
          id: response.data.userId,
          name: response.data.name,
          email: response.data.email,
        };
        
        // Mettre à jour le state Redux
        dispatch(addProfesseur(newProfessor));
        
        // Mettre à jour le localStorage
        const updatedProfessors = [...professeurs, newProfessor];
        localStorage.setItem("professeurs", JSON.stringify(updatedProfessors));
        
        // Réinitialiser le formulaire et fermer la modal
        resetForm();
        setIsAddModalOpen(false);
        
        // Déclencher le rechargement des données
        setShouldRefresh(true);
        
        // Afficher un message de succès
        alert(t('instructorManagement.success.create'));
      }
    } catch (error) {
      console.error("Erreur lors de la création du professeur:", error);
      alert(error.response?.data?.message || t('instructorManagement.errors.create'));
    }
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string().required(t('instructorManagement.form.name.required')),
    email: Yup.string().email(t('instructorManagement.form.email.invalid')).required(t('instructorManagement.form.email.required')),
    password: Yup.string()
      .min(6, t('instructorManagement.form.password.min'))
      .required(t('instructorManagement.form.password.required')),
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
  <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('instructorManagement.title')}</h1>
          <p className="text-gray-600">{t('instructorManagement.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t('instructorManagement.addButton')}
        </button>
      </div>

      {/* Tableau des professeurs */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('instructorManagement.table.name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('instructorManagement.table.email')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('instructorManagement.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {professeurs.map((professeur) => (
              <tr key={professeur._id || professeur.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{professeur.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{professeur.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {(() => {
                    const isRTL = i18n.language === 'ar';
                    return (
                      <>
                        <button
                          onClick={() => {
                            setSelectedInstructor({
                              id: professeur._id || professeur.id,
                              name: professeur.name,
                              email: professeur.email
                            });
                            setIsEditModalOpen(true);
                          }}
                          className={isRTL ? "text-blue-600 hover:text-blue-900 ml-2" : "text-blue-600 hover:text-blue-900 mr-2"}
                        >
                          {t('instructorManagement.viewButton')}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInstructor({
                              id: professeur._id || professeur.id,
                              name: professeur.name
                            });
                            setIsDeleteModalOpen(true);
                          }}
                          className={isRTL ? "text-red-600 hover:text-red-900 mr-2" : "text-red-600 hover:text-red-900 ml-2"}
                        >
                          {t('instructorManagement.deleteButton')}
                        </button>
                      </>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal d'ajout */}
      {isAddModalOpen && (
  <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
    <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 rounded-full p-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 7v-6m0 0l-9-5m9 5l9-5" />
            </svg>
          </span>
          <h2 className="text-2xl font-bold text-gray-800">{t('instructorManagement.addModal.title')}</h2>
        </div>
        <button
          onClick={() => setIsAddModalOpen(false)}
          className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <Formik
        initialValues={{ name: "", email: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={handleAddInstructor}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('instructorManagement.form.name.label')}
              </label>
              <Field
                name="name"
                type="text"
                className={`mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 ${errors.name && touched.name ? 'border-red-500' : ''}`}
                placeholder={t('instructorManagement.form.name.placeholder')}
              />
              <ErrorMessage
                name="name"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('instructorManagement.form.email.label')}
              </label>
              <Field
                name="email"
                type="email"
                className={`mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 ${errors.email && touched.email ? 'border-red-500' : ''}`}
                placeholder={t('instructorManagement.form.email.placeholder')}
              />
              <ErrorMessage
                name="email"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('instructorManagement.form.password.label')}
              </label>
              <Field
                name="password"
                type="password"
                className={`mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 ${errors.password && touched.password ? 'border-red-500' : ''}`}
                placeholder={t('instructorManagement.form.password.placeholder')}
              />
              <ErrorMessage
                name="password"
                component="div"
                className="text-red-500 text-xs mt-1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                {t('instructorManagement.cancelButton')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-50 transition ${isSubmitting ? 'cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('instructorManagement.form.creating')}
                  </span>
                ) : (
                  t('instructorManagement.form.create')
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  </div>
      )}

      {/* Modal de modification */}
      {isEditModalOpen && selectedInstructor && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-600 rounded-full p-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11-11a2.828 2.828 0 00-4-4L5 17v4z" />
                  </svg>
                </span>
                <h2 className="text-2xl font-bold text-gray-800">{t('instructorManagement.viewModalTitle')}</h2>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('instructorManagement.form.name.label')}
                </label>
                <div className="relative">
                  
                  <input
                    type="text"
                    value={selectedInstructor.name}
                    onChange={(e) =>
                      setSelectedInstructor({
                        ...selectedInstructor,
                        name: e.target.value,
                      })
                    }
                    disabled={true}
                    className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 ${errors.name && touched.name ? 'border-red-500' : ''}`"
                    placeholder={t('instructorManagement.form.name.placeholder')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('instructorManagement.form.email.label')}
                </label>
                <div className="relative">
                 
                  <input
                    type="email"
                    value={selectedInstructor.email}
                    onChange={(e) =>
                      setSelectedInstructor({
                        ...selectedInstructor,
                        email: e.target.value,
                      })
                    }
                    disabled={true}
                    className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 ${errors.name && touched.name ? 'border-red-500' : ''}`"
                    placeholder={t('instructorManagement.form.email.placeholder')}
                  />
                </div>
              </div>
            </div>
           
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {isDeleteModalOpen && selectedInstructor && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <span className="bg-red-100 text-red-600 rounded-full p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </span>
              <h2 className="text-2xl font-bold text-gray-800">{t('instructorManagement.deleteModal.title')}</h2>
            </div>
            <p className="text-gray-600 mb-8 text-base">
              {t('instructorManagement.deleteModal.confirm', { name: selectedInstructor.name })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                {t('instructorManagement.cancelButton')}
              </button>
              <button
                onClick={handleDeleteInstructor}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              >
                {t('instructorManagement.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorManagementPage;
