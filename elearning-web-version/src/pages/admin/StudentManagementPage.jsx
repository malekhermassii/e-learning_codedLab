import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { fetchapprenants } from "../../api";
import { deleteApprenant } from "../../redux/slices/apprenantSlice";
import { useTranslation } from 'react-i18next';

const StudentManagementPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apprenants = useSelector((state) => state.apprenants.apprenants);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await dispatch(fetchapprenants());
        setError(null);
      } catch (error) {
        console.error(t('studentManagement.error'), error);
        setError(t('studentManagement.error'));
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [dispatch, t]);

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.delete(
        `http://192.168.70.148:4000/apprenant/${selectedStudent._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        dispatch(deleteApprenant(selectedStudent._id));
        setIsDeleteModalOpen(false);
        setSelectedStudent(null);
        alert(t('studentManagement.alerts.success.deleted'));
      }
    } catch (error) {
      console.error(t('studentManagement.alerts.error.deleting'), error);
      alert(
        error.response?.data?.message ||
          t('studentManagement.alerts.error.deleting')
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return " ";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('studentManagement.title')}</h1>
        <p className="text-gray-600">{t('studentManagement.subtitle')}</p>
      </div>

      {loading ? (
        <p>{t('studentManagement.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('studentManagement.table.name')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    {t('studentManagement.table.email')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    {t('studentManagement.table.dateOfBirth')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    {t('studentManagement.table.phone')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    {t('studentManagement.table.certificate')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    {t('studentManagement.table.course')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    {t('studentManagement.table.subscription')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('studentManagement.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(apprenants) && apprenants.length > 0 ? (
                  apprenants.map((student) => (
                    <tr
                      key={student._id || student.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {student.userId?.name || t('studentManagement.notSpecified')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {student.userId?.email || t('studentManagement.notSpecified')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(student.userId?.dateNaissance) || t('studentManagement.notSpecified')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {student.userId?.telephone || t('studentManagement.notSpecified')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {student.certificat_id?.length > 0 ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {Array.isArray(student.certificat_id) &&
                        student.certificat_id.length > 0
                          ? student.certificat_id.map((cert, index) => (
                              <span key={index}>
                                {cert.courseId?.nom ||
                                  cert.courseName ||
                                  t('studentManagement.notSpecified')}
                                <br />
                              </span>
                            ))
                          : t('studentManagement.notSpecified')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {student.abonnement_id?.planId?.name || t('studentManagement.notSpecified')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className={i18n.language === 'ar' ? "flex flex-row-reverse space-x-reverse space-x-2" : "flex space-x-2"}>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsViewModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {t('studentManagement.table.view')}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t('studentManagement.table.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      {t('studentManagement.noLearners')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal de visualisation */}
      {isViewModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full p-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </span>
                <h2 className="text-2xl font-bold text-gray-800">{t('studentManagement.modals.view.title')}</h2>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t('studentManagement.modals.view.name')}</p>
                <p className="font-medium">
                  {selectedStudent.userId?.name || t('studentManagement.notSpecified')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('studentManagement.modals.view.email')}</p>
                <p className="font-medium">
                  {selectedStudent.userId?.email || t('studentManagement.notSpecified')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('studentManagement.modals.view.dateOfBirth')}</p>
                <p className="font-medium">
                  {selectedStudent.userId?.dateNaissance || t('studentManagement.notSpecified')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('studentManagement.modals.view.phone')}</p>
                <p className="font-medium">
                  {selectedStudent.userId?.telephone || t('studentManagement.notSpecified')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('studentManagement.modals.view.certificate')}</p>
                <p className="font-medium">
                  {selectedStudent.certificat_id?.length > 0 ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('studentManagement.modals.view.course')}</p>
                <p className="font-medium">
                  {Array.isArray(selectedStudent.certificat_id) &&
                  selectedStudent.certificat_id.length > 0
                    ? selectedStudent.certificat_id
                        .map(
                          (cert) =>
                            cert.courseId?.nom ||
                            cert.courseName ||
                            t('studentManagement.notSpecified')
                        )
                        .filter(Boolean)
                        .join("\n ")
                    : t('studentManagement.notSpecified')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('studentManagement.modals.view.subscriptionType')}</p>
                <p className="font-medium">
                  {selectedStudent.abonnement_id?.planId?.name ||
                    t('studentManagement.notSpecified')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {isDeleteModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fadeIn">
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <span className="bg-red-100 text-red-600 rounded-full p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </span>
              <h2 className="text-2xl font-bold text-gray-800">{t('studentManagement.modals.delete.title')}</h2>
            </div>
            <p className="mb-8 text-gray-600 text-base">
            Are you sure you want to delete the learner {selectedStudent.userId?.name || t('studentManagement.notSpecified')}? This action is irreversible.
            </p>
            <div className={i18n.language === 'ar' ? "flex flex-row-reverse space-x-reverse space-x-4" : "flex justify-end space-x-4"}>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                {t('studentManagement.modals.delete.cancel')}
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              >
                {t('studentManagement.modals.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagementPage;
