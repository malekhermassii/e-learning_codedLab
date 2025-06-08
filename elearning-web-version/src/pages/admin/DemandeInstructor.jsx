import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { downloadCV, fetchdemandes } from "../../api";
import { accepterDemande, refuserDemande } from "../../redux/slices/demandeSlice";
import { useTranslation } from 'react-i18next';

const InstructorApplicationsPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const demandes = useSelector((state) => state.demandes.demandes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newInstructorData, setNewInstructorData] = useState({
    meetLink: "",
    dateEntretien: "",
  });

  const statusKeyMap = {
    "approved": "approved",
    "acceptée": "approved",
    "rejetée": "rejected",
    "en attente": "pending",
   
    "rejected": "rejected",
    "pending": "pending"
  };

  useEffect(() => {
    const loadDemandes = async () => {
      try {
        setLoading(true);
        await dispatch(fetchdemandes());
        setError(null);
      } catch (err) {
        console.error(t('instructorApplications.errorLoading'), err);
        setError(t('instructorApplications.errorLoading'));
      } finally {
        setLoading(false);
      }
    };

    loadDemandes();
  }, [dispatch, t]);

  const handleInputChange = (e) => {
    setNewInstructorData({ ...newInstructorData, [e.target.name]: e.target.value });
  };

  const generateMeetLink = () => {
    const randomLink = "https://meet.google.com/" + Math.random().toString(36).substring(2, 7);
    setNewInstructorData({ ...newInstructorData, meetLink: randomLink });
  };

  const handleScheduleInterview = async () => {
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.put(
        `http://192.168.70.148:4000/demandes/${selectedApplication._id}/accepter`,
        newInstructorData,  
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        alert(t('instructorApplications.alerts.scheduled'));
        dispatch(accepterDemande({ id: selectedApplication._id }));
        setIsCreateModalOpen(false);
        setSelectedApplication(null);
        await dispatch(fetchdemandes());
      }
    } catch (err) {
      console.error(t('instructorApplications.alerts.errorScheduling'), err);
      alert(t('instructorApplications.alerts.errorScheduling'));
    }
  };

  const rejectApplication = async (id) => {
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const response = await axios.put(
        `http://192.168.70.148:4000/demandes/${id}/refuser`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,

          },
        }
      );
      if (response.status === 200) {
        alert(t('instructorApplications.alerts.rejected'));
        dispatch(refuserDemande(id));
        closeViewModal();
        await dispatch(fetchdemandes());
      }
    } catch (err) {
      console.error(t('instructorApplications.alerts.errorRejecting'), err);
      alert(t('instructorApplications.alerts.errorRejecting'));
    }
  };

  const openViewModal = (application) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedApplication(null);
    setIsViewModalOpen(false);
  };

  const handleDownloadCV = async () => {
    try {
      console.log(selectedApplication._id);
      await downloadCV(selectedApplication._id);
    } catch (error) {
      console.error("Erreur lors du téléchargement du CV:", error);
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
    <div className="p-6">
      <div className="mb-6 mt-10">
        <h1 className="text-2xl font-bold text-gray-900">{t('instructorApplications.title')}</h1>
        <p className="text-gray-600">{t('instructorApplications.subtitle')}</p>
      </div>

      {loading ? (
        <p>{t('instructorApplications.loading')}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[t('instructorApplications.table.instructor'), t('instructorApplications.table.speciality'), t('instructorApplications.table.country'), t('instructorApplications.table.birthDate'), t('instructorApplications.table.cv'), t('instructorApplications.table.topic'), t('instructorApplications.table.status'), t('instructorApplications.table.actions')].map(
                    (heading, i) => (
                      <th
                        key={i}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {demandes?.map((application) => (
                  <tr key={application._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          {application.name?.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-semibold text-gray-900">
                            {application.name}
                          </div>
                          <div className="text-xs text-gray-500">{application.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{application.speciality}</td>
                    <td className="px-6 py-4">{application.country}</td>
                    <td className="px-6 py-4">{formatDate(application.birthDate)}</td>
                    <td className="px-6 py-4">{application.cv}</td>
                    <td className="px-6 py-4">{application.topic}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        application.statut === "approved"
                          ? "bg-green-100 text-green-800"
                          : application.statut === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-yellow-800"
                      }`}>
                        {t(`instructorApplications.status.${statusKeyMap[application.statut] || application.statut}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className={i18n.language === 'ar' ? "flex flex-row-reverse space-x-reverse space-x-2" : "flex space-x-2"}>
                        <button
                          onClick={() => openViewModal(application)}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          {t('instructorApplications.table.view')}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsCreateModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                        >
                          {t('instructorApplications.table.approve')}
                        </button>
                        <button
                          onClick={() => rejectApplication(application._id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                        >
                          {t('instructorApplications.table.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {demandes?.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-gray-500">
                      {t('instructorApplications.noApplications')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-semi-transparent bg-opacity-50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full p-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </span>
                <h2 className="text-2xl font-bold text-gray-800">{t('instructorApplications.modals.details.title')}</h2>
              </div>
              <button onClick={closeViewModal} className="text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              <p><strong>{t('instructorApplications.modals.details.name')}:</strong> {selectedApplication.name}</p>
              <p><strong>{t('instructorApplications.modals.details.email')}:</strong> {selectedApplication.email}</p>
              <p><strong>{t('instructorApplications.modals.details.speciality')}:</strong> {selectedApplication.speciality}</p>
              <p><strong>{t('instructorApplications.modals.details.country')}:</strong> {selectedApplication.country}</p>
              <p><strong>{t('instructorApplications.modals.details.birthDate')}:</strong> {selectedApplication.birthDate}</p>
              <p>
                <strong>{t('instructorApplications.modals.details.cv')}:</strong>
                {selectedApplication.cv ? (
                  <a
                    href={`http://192.168.70.148:4000/Public/CV/${selectedApplication.cv}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline ml-2"
                    onClick={handleDownloadCV}
                  >
                    {selectedApplication.cv}
                  </a>
                ) : (
                  <span className="ml-2 text-gray-500">{t('instructorApplications.modals.details.noCv')}</span>
                )}
              </p>
              <p><strong>{t('instructorApplications.modals.details.topic')}:</strong> {selectedApplication.topic}</p>
              <p><strong>{t('instructorApplications.modals.details.status')}:</strong> {selectedApplication.statut}</p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {isCreateModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-semi-transparent bg-opacity-50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 w-full max-w-xl mx-auto relative animate-fadeIn">
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <span className="bg-green-100 text-green-600 rounded-full p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <h2 className="text-2xl font-bold text-gray-800">{t('instructorApplications.modals.schedule.title')}</h2>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('instructorApplications.modals.schedule.meetLink')}</label>
              <div className="flex">
                {i18n.language === 'ar' ? (
                  <>
                    <input
                      type="text"
                      name="meetLink"
                      value={newInstructorData.meetLink}
                      onChange={handleInputChange}
                      placeholder="https://meet.google.com/xxx"
                      className="flex-1 border px-3 py-2 rounded-r-md"
                      dir="ltr"
                    />
                    <button
                      onClick={generateMeetLink}
                      className="bg-blue-600 text-white px-4 py-2 rounded-l-md hover:bg-blue-700"
                    >
                      {t('instructorApplications.modals.schedule.generate')}
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      name="meetLink"
                      value={newInstructorData.meetLink}
                      onChange={handleInputChange}
                      placeholder="https://meet.google.com/xxx"
                      className="flex-1 border px-3 py-2 rounded-l-md"
                      dir="ltr"
                    />
                    <button
                      onClick={generateMeetLink}
                      className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                    >
                      {t('instructorApplications.modals.schedule.generate')}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">{t('instructorApplications.modals.schedule.date')}</label>
              <input
                type="datetime-local"
                name="dateEntretien"
                value={newInstructorData.dateEntretien}
                onChange={handleInputChange}
                className="w-full border px-3 py-2 rounded-xl shadow focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                {t('instructorApplications.modals.schedule.cancel')}
              </button>
              <button
                onClick={handleScheduleInterview}
                className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
              >
                {t('instructorApplications.modals.schedule.schedule')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorApplicationsPage;
