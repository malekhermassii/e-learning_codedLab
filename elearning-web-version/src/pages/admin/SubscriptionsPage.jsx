import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchabonnements, fetchpayement, fetchplan } from "../../api";
import axios from "axios";
import { addPlan, updatePlan, deletePlan } from "../../redux/slices/planSlice";
import * as Yup from "yup";
import { useTranslation } from 'react-i18next';

const SubscriptionsPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("plans");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAbonnement, setSelectedAbonnement] = useState(null);
  const [selectedPaiement, setSelectedPaiement] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    interval: "month",
    offers: "",
    duration: "",
  });

  // Récupération des données depuis Redux
  const plans = useSelector((state) => state.plans.plans);
  const abonnements = useSelector((state) => state.abonnement.subscriptions);
  const paiements = useSelector((state) => state.paiement.paiements);

  // Configuration axios
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await dispatch(fetchplan());
        await dispatch(fetchabonnements());
        await dispatch(fetchpayement());
        setError(null);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Le nom est requis"),
    price: Yup.number()
      .required("Le prix est requis")
      .positive("Le prix doit être positif"),
    interval: Yup.string().required("La durée est requise"),
    offers: Yup.string(),
    duration: Yup.number().required("La durée est requise"),
  });

  // Gestion des formulaires
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log("formData input change",formData)
  };

  const getPlanName = (planId) => {
    // Si planId est un objet peuplé
    if (planId && typeof planId === "object") {
      return planId.name || "Plan unknown";
    }
    // Si c'est juste un ID
    const plan = plans.find((p) => p._id === planId);
    return plan ? plan.name : "Plan unknown";
  };

  // Fonction pour obtenir les détails de l'apprenant
  const getApprenantDetails = (abonnement) => {
    if (!abonnement)
      return { name: "Utilisateur inconnu", email: "Email inconnu" };

    if (
      abonnement.apprenant_id &&
      typeof abonnement.apprenant_id === "object"
    ) {
      // Vérifier si l'apprenant a un userId peuplé
      if (
        abonnement.apprenant_id.userId &&
        typeof abonnement.apprenant_id.userId === "object"
      ) {
        return {
          name: abonnement.apprenant_id.userId.name || "Utilisateur inconnu",
          email: abonnement.apprenant_id.userId.email || "Email inconnu",
        };
      }
    }
    return {
      name: "Utilisateur inconnu",
      email: "Email inconnu",
    };
  };

  // Ouvrir modal d'ajout
  const handleAddClick = () => {
    setFormData({
      name: "",
      price: "",
      interval: "month",
      offers: "",
      duration: "",
    });
    setError(null);
    setIsAddModalOpen(true);
  };

  // Ouvrir modal d'édition
  const handleEditClick = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      interval: plan.interval,
      offers: plan.offers,
      duration: plan.duration,
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      console.log("formData",formData)

      // Validation des données
      if (
        !formData.name ||
        !formData.price ||
        !formData.interval ||
        !formData.offers ||
        !formData.duration
      ) {
        throw new Error("Tous les champs sont requis");
      }

      // Conversion du prix en nombre
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Le prix doit être un nombre positif");
      }

      // Préparation des données
      const planData = {
        name: formData.name.trim(),
        price: price,
        interval: formData.interval,
        offers: formData.offers.trim(),
        duration: formData.duration,
      };

      let response;
      if (selectedPlan) {
        // Mise à jour du plan
        const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
        response = await axios.put(
          `https://backendlms-5992.onrender.com/planabonnement/${selectedPlan._id}`,
          planData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        dispatch(updatePlan(response.data));
      } else {
        // Création d'un nouveau plan
        const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
        response = await axios.post(
          "https://backendlms-5992.onrender.com/planabonnement",
          planData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        dispatch(addPlan(response.data));
      }

      // Fermer les modals et réinitialiser
      setIsEditModalOpen(false);
      setIsAddModalOpen(false);
      setSelectedPlan(null);
      setFormData({
        name: "",
        price: "",
        interval: "month",
        offers: "", 
        duration: "",
      });

      // Recharger les données
      await dispatch(fetchplan());
    } catch (error) {
      console.error("Error saving plan:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Erreur lors de la sauvegarde"
      );
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un plan
  const handleDelete = async (planId) => {
    if (window.confirm(t('subscriptions.modals.delete'))) {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
        await axios.delete(
          `https://backendlms-5992.onrender.com/planabonnement/${planId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        dispatch(deletePlan(planId));
        await dispatch(fetchplan());
      } catch (error) {
        console.error("Error deleting plan:", error);
        setError(
          error.response?.data?.message || "Erreur lors de la suppression"
        );
      } finally {
        setLoading(false);
      }
    }
  };

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
    <div className="p-6">
      <div className="mb-6 mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('subscriptions.title')}
          </h1>
          <p className="text-gray-600">
            {t('subscriptions.subtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "plans"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("plans")}
          >
            {t('subscriptions.tabs.plans')}
          </button>
          <button
            className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "abonnements"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("abonnements")}
          >
            {t('subscriptions.tabs.abonnements')}
          </button>
          <button
            className={`py-4 px-2 border-b-2 font-medium text-sm ${
              activeTab === "paiements"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActiveTab("paiements")}
          >
            {t('subscriptions.tabs.paiements')}
          </button>
        </nav>
      </div>

      {/* Plans d'abonnement */}
      {activeTab === "plans" && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t('subscriptions.title')}</h2>
            <button
              onClick={handleAddClick}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t('subscriptions.modals.add')}
            </button>
          </div>
          {error && <div className="p-4 bg-red-100 text-red-700">{error}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {i18n.language === 'ar' ? (
                    <>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.type')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.price')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.interval')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.offers')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.actions')}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.price')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.interval')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.offers')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('subscriptions.table.actions')}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans?.map((plan) => (
                  <tr key={plan._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.price} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.interval}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {plan.offers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className={i18n.language === 'ar' ? "flex flex-row-reverse space-x-reverse space-x-2" : "flex space-x-2"}>
                        <button
                          onClick={() => handleEditClick(plan)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          disabled={loading}
                        >
                          {t('subscriptions.table.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(plan._id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          {t('subscriptions.table.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Abonnements actifs */}
      {activeTab === "abonnements" && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                {i18n.language === 'ar' ? (
                  <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.student')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.plan')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.startDate')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.endDate')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.status')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.actions')}
                  </th>
                  </>
                ) : (
                  <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.student')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.plan')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.startDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.endDate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.actions')}
                  </th>
                  </>
                )}

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {abonnements?.map((abonnement) => {
                  const apprenant = getApprenantDetails(abonnement);
                  return (
                    <tr key={abonnement._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {abonnement.userId.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {abonnement.userId.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getPlanName(abonnement?.abonnement_id?.planId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(abonnement?.abonnement_id?.dateDebut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(abonnement?.abonnement_id?.dateFin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            abonnement?.abonnement_id?.statut === "actif"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {abonnement?.abonnement_id?.statut === "actif" ? t('subscriptions.table.active') : t('subscriptions.table.inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedAbonnement(abonnement)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('subscriptions.table.view')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Modale de détails de l'abonnement */}
          {selectedAbonnement && (
            <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
              <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6 border-b pb-3">
                    <span className="bg-blue-100 text-blue-600 rounded-full p-2">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                      </svg>
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800">{t('subscriptions.table.view')}</h2>
                    <button
                      onClick={() => setSelectedAbonnement(null)}
                      className="ml-auto text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mb-2"><b>{t('subscriptions.table.student')}:</b> {selectedAbonnement.userId.name}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.plan')}:</b> {getPlanName(selectedAbonnement.abonnement_id.planId)}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.startDate')}:</b> {formatDate(selectedAbonnement.abonnement_id.dateDebut)}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.endDate')}:</b> {formatDate(selectedAbonnement.abonnement_id.dateFin)}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.status')}:</b> {selectedAbonnement.abonnement_id.statut === "actif" ? t('subscriptions.table.active') : t('subscriptions.table.inactive')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historique des paiements */}
      {activeTab === "paiements" && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                {i18n.language === 'ar' ? (
                  <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.students')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.plan')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.amount')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.method')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.date')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.actions')}
                  </th>
                  </>
                ) : (
                  <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.students')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.plan')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.method')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {t('subscriptions.table.actions')}
                  </th>
                  </>
                )}

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paiements?.map((paiement) => {
                  const abonnement = paiement.abonnement_id;
                  const apprenant = paiement?.user;
                  const plan = abonnement?.planId;

                  return (
                    <tr key={paiement._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {apprenant?.name || t('subscriptions.unknown.user')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {apprenant?.email || t('subscriptions.unknown.email')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {plan?.name || t('subscriptions.unknown.plan')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paiement.montant} €
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {paiement.methodePaiement}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(paiement.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span>{abonnement.statut}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedPaiement(paiement)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {t('subscriptions.table.viewPayment')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Modale de détails du paiement */}
          {selectedPaiement && (
            <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
              <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6 border-b pb-3">
                    <span className="bg-green-100 text-green-600 rounded-full p-2">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800">{t('subscriptions.table.viewPayment')}</h2>
                    <button
                      onClick={() => setSelectedPaiement(null)}
                      className="ml-auto text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mb-2"><b>{t('subscriptions.table.students')}:</b> {selectedPaiement?.user?.name || t('subscriptions.unknown.user')}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.plan')}:</b> {selectedPaiement?.abonnement_id?.planId?.name || t('subscriptions.unknown.plan')}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.amount')}:</b> {selectedPaiement.montant} €</div>
                  <div className="mb-2"><b>{t('subscriptions.table.method')}:</b> {selectedPaiement.methodePaiement}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.date')}:</b> {formatDate(selectedPaiement.createdAt)}</div>
                  <div className="mb-2"><b>{t('subscriptions.table.status')}:</b> {selectedPaiement.abonnement_id?.statut === "actif" ? t('subscriptions.table.active') : t('subscriptions.table.inactive')}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal d'ajout/édition */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-md relative animate-fadeIn">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b pb-3">
                <span className="bg-blue-100 text-blue-600 rounded-full p-2">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
                <h2 className="text-2xl font-bold text-gray-800">
                  {selectedPlan ? t('subscriptions.modals.edit') : t('subscriptions.modals.add')}
                </h2>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedPlan(null);
                    setError(null);
                  }}
                  className="ml-auto text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t('subscriptions.modals.planType')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base rounded-xl border border-gray-300 bg-white shadow-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                    placeholder={t('subscriptions.placeholders.planType')}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t('subscriptions.modals.price')}
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base rounded-xl border border-gray-300 bg-white shadow-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                    min="0"
                    step="0.01"
                    placeholder={t('subscriptions.placeholders.price')}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t('subscriptions.modals.duration')}
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base rounded-xl border border-gray-300 bg-white shadow-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t('subscriptions.modals.interval')}
                  </label>
                  <select
                    name="interval"
                    value={formData.interval}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base rounded-xl border border-gray-300 bg-white shadow-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                    required
                    disabled={loading}
                  >
                    <option value="month">{t('subscriptions.table.monthly')}</option>
                    <option value="year">{t('subscriptions.table.yearly')}</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t('subscriptions.table.offers')}
                  </label>
                  <input
                    type="text"
                    name="offers"
                    value={formData.offers}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 text-base rounded-xl border border-gray-300 bg-white shadow-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                    placeholder={t('subscriptions.placeholders.offers')}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      setSelectedPlan(null);
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition"
                    disabled={loading}
                  >
                    {t('subscriptions.modals.exit')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                    disabled={loading}
                  >
                    {loading
                      ? t('subscriptions.modals.inProgress')
                      : selectedPlan
                      ? t('subscriptions.modals.toUpdate')
                      : t('subscriptions.modals.add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
