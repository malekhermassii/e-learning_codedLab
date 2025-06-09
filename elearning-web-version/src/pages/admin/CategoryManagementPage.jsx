import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { fetchCategories } from "../../api";
import {
  addCategorie,
  updateCategorie,
  deleteCategorie,
} from "../../redux/slices/categorieSlice";
import { useTranslation } from 'react-i18next';

const CategoryManagementPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategorie, setSelectedCategorie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const categories = useSelector((state) => state.categories.categories);
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log("Selected file:", file);
    // Add your logic here (e.g., upload the file, preview it, etc.)
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await dispatch(fetchCategories());
        setError(null);
        setShouldRefresh(false);
      } catch (error) {
        setError(t('categoryManagement.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [dispatch, t, shouldRefresh]);


  const handleEditCategorie = async () => {
    if (!selectedCategorie?.id) {
      alert(t('categoryManagement.errors.noId'));
      return;
    }
    try {
      const existingCategorie = categories.find(
        (cat) =>
          cat.titre === selectedCategorie.titre &&
          cat._id !== selectedCategorie.id &&
          cat.id !== selectedCategorie.id
      );

      if (existingCategorie) {
        alert(t('categoryManagement.errors.duplicateTitle'));
        return;
      }
      const formData = new FormData();
      formData.append("titre", selectedCategorie.titre);

      // Check si l'image est un fichier (sinon on ne la modifie pas)
      if (selectedCategorie.image instanceof File) {
        formData.append("image", selectedCategorie.image);
      }
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.put(
        `https://backendlms-5992.onrender.com/categorie/${selectedCategorie.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        const updatedCategorie = {
          _id: selectedCategorie.id,
          titre: selectedCategorie.titre,
          image: response.data.image, // updated image filename from server
        };

        dispatch(updateCategorie(updatedCategorie));
        const updatedcategories = categories.map((cat) =>
          cat._id === selectedCategorie.id || cat.id === selectedCategorie.id
            ? updatedCategorie
            : cat
        );
        localStorage.setItem("categories", JSON.stringify(updatedcategories));

        setIsEditModalOpen(false);
        setSelectedCategorie(null);
        setShouldRefresh(true);
        alert(t('categoryManagement.alerts.updated'));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      if (error.response?.status === 404) {
        alert(t('categoryManagement.errors.notFound'));
      } else if (error.response?.status === 403) {
        alert(t('categoryManagement.errors.noPermission'));
      } else {
        alert(error.response?.data?.message || t('categoryManagement.errors.update'));
      }
    }
  };
  const handleDeleteCategorie = async () => {
    if (!selectedCategorie) return;

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.delete(
        `https://backendlms-5992.onrender.com/categorie/${selectedCategorie.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        // Mettre à jour le state Redux
        dispatch(deleteCategorie(selectedCategorie.id));

        // Mettre à jour le localStorage
        const updatedcategories = categories.filter(
          (cat) => cat._id !== selectedCategorie.id && cat.id !== selectedCategorie.id
        );
        localStorage.setItem("categories", JSON.stringify(updatedcategories));

        // Fermer la modal et réinitialiser l'état
        setIsDeleteModalOpen(false);
        setSelectedCategorie(null);
        setShouldRefresh(true);
        
        // Rafraîchir la liste des catégories
        await dispatch(fetchCategories());
        
        alert(t('categoryManagement.alerts.deleted'));
      }
    } catch (error) {
      console.error("Error deleting Categorie:", error);
      if (error.response?.status === 404) {
        alert(t('categoryManagement.errors.notFound'));
      } else if (error.response?.status === 403) {
        alert(t('categoryManagement.errors.noPermission'));
      } else {
        alert(error.response?.data?.message || t('categoryManagement.errors.delete'));
      }
    }
  };
  const handleAddCategorie = async (values, { resetForm }) => {
    try {
      const formData = new FormData();
      formData.append("titre", values.titre);
      formData.append("image", values.image);
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.post(
        "https://backendlms-5992.onrender.com/categorie",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
  

      if (response.status === 200) {
        const newCategorie = response.data;
        dispatch(addCategorie(newCategorie));
        setShouldRefresh(true);
     
      }
    
      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  

  const validationSchema = Yup.object().shape({
    titre: Yup.string().required(t('categoryManagement.validation.titleRequired')),
    image: Yup.mixed().required(t('categoryManagement.validation.imageRequired')),
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
          <h1 className="text-2xl font-bold text-gray-900">
            {t('categoryManagement.title')}
          </h1>
          <p className="text-gray-600">{t('categoryManagement.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {t('categoryManagement.addCategory')}
        </button>
      </div>

      {/* Tableau des categories */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
        <thead className="bg-gray-50">
            <tr>
              {i18n.language === 'ar' ? (
                <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('categoryManagement.table.actions')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('categoryManagement.table.picture')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('categoryManagement.table.title')}
                  </th>
                </>
              ) : (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('categoryManagement.table.title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('categoryManagement.table.picture')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('categoryManagement.table.actions')}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((categorie) => (
              <tr key={categorie._id || categorie.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{categorie.titre}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={`https://backendlms-5992.onrender.com/Public/Images/${categorie.image}`}
                    alt={categorie.titre}
                    className="h-12 w-12 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className={i18n.language === 'ar' ? "flex flex-row-reverse space-x-reverse space-x-2" : "flex space-x-2"}>
                    <button
                      onClick={() => {
                        setSelectedCategorie({
                          id: categorie._id || categorie.id,
                          titre: categorie.titre,
                          image: categorie.image,
                        });
                        setIsEditModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {t('categoryManagement.table.edit')}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCategorie({
                          id: categorie._id || categorie.id,
                          titre: categorie.titre,
                          image: categorie.image,
                        });
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('categoryManagement.table.delete')}
                    </button>
                  </div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <h2 className="text-2xl font-bold text-gray-800">{t('categoryManagement.modals.add.title')}</h2>
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
              initialValues={{ titre: "", image: "" }}
              validationSchema={validationSchema}
              onSubmit={handleAddCategorie}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('categoryManagement.form.title')}
                    </label>
                    <Field
                      name="titre"
                      type="text"
                      className={`mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none ${errors.titre && touched.titre ? "border-red-500" : ""}`}
                      placeholder={t('categoryManagement.form.titlePlaceholder')}
                    />
                    <ErrorMessage
                      name="titre"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('categoryManagement.form.picture')}
                    </label>
                    <Field name="image">
                      {({ field, form }) => (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            form.setFieldValue(
                              "image",
                              event.currentTarget.files[0]
                            );
                          }}
                          className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="image"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      {t('categoryManagement.form.exit')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 ${
                        isSubmitting ? "cursor-not-allowed" : ""
                      }`}
                    >
                      {isSubmitting ? (
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          {t('categoryManagement.form.creating')}
                        </span>
                      ) : (
                        t('categoryManagement.form.save')
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedCategorie && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-100 text-yellow-600 rounded-full p-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11-11a2.828 2.828 0 00-4-4L5 17v4z" />
                  </svg>
                </span>
                <h2 className="text-2xl font-bold text-gray-800">{t('categoryManagement.modals.edit.title')}</h2>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedCategorie(null);
                }}
                className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditCategorie();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('categoryManagement.form.title')}
                </label>
                <input
                  type="text"
                  value={selectedCategorie.titre}
                  onChange={(e) =>
                    setSelectedCategorie({
                      ...selectedCategorie,
                      titre: e.target.value,
                    })
                  }
                  className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('categoryManagement.form.picture')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedCategorie({
                      ...selectedCategorie,
                      image: e.target.files[0],
                    })
                  }
                  className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none cursor-pointer"
                />
                {/* Afficher un aperçu si l'image existante est présente */}
                {typeof selectedCategorie.image === "string" && (
                  <img
                    src={`https://backendlms-5992.onrender.com/Public/Images/${selectedCategorie.image}`}
                    alt="Preview"
                    className="h-16 w-16 mt-2 object-cover rounded"
                  />
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {t('categoryManagement.form.update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {isDeleteModalOpen && selectedCategorie && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <span className="bg-red-100 text-red-600 rounded-full p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </span>
              <h2 className="text-2xl font-bold text-gray-800">{t('categoryManagement.modals.delete.title')}</h2>
            </div>
            <p className="text-gray-600 mb-8 text-base">
              {t('categoryManagement.modals.delete.message', { name: selectedCategorie.titre })}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                {t('categoryManagement.modals.delete.cancel')}
              </button>
              <button
                onClick={handleDeleteCategorie}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              >
                {t('categoryManagement.modals.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagementPage;
