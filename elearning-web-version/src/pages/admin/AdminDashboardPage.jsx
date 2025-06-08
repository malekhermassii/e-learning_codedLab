import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUsers, FaChartLine, FaDollarSign, FaBook, FaFolderOpen, FaStar, FaUserGraduate } from 'react-icons/fa';
import { fetchCourses, fetchUsers, fetchabonnements, fetchpayement, fetchCategories } from '../../api';
import { useTranslation } from 'react-i18next';

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get data from Redux
  const courses = useSelector((state) => state.courses.courses) || [];
  const users = useSelector((state) => state.users.users) || [];
  const subscriptions = useSelector((state) => state.abonnement.subscriptions) || [];
  const payments = useSelector((state) => state.paiement.paiements) || [];
  const categories = useSelector((state) => state.categories.categories) || [];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          dispatch(fetchCourses()),
          dispatch(fetchUsers()),
          dispatch(fetchabonnements()),
          dispatch(fetchpayement()),
          dispatch(fetchCategories())
        ]);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError(t('adminDashboard.error'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dispatch, t]);

  // Calculate statistics with safe checks
  const statistics = {
    totalUsers: users.length,
    activeSubscriptions: subscriptions.filter(sub => {
      try {
        return sub && sub.abonnement_id && sub.abonnement_id.statut === 'actif';
      } catch (error) {
        console.error("Erreur lors du filtrage des abonnements:", error);
        return false;
      }
    }).length,
    totalRevenue: payments.reduce((sum, payment) => {
      try {
        return sum + (payment?.montant || 0);
      } catch (error) {
        console.error("Erreur lors du calcul du revenu:", error);
        return sum;
      }
    }, 0),
    totalCourses: courses.length,
    categories: categories.length,
    averageRating: courses.length > 0 
      ? (courses.reduce((sum, course) => {
          try {
            return sum + (course?.averageRating || 0);
          } catch (error) {
            console.error("Erreur lors du calcul de la moyenne des notes:", error);
            return sum;
          }
        }, 0) / courses.length).toFixed(1)
      : 0,
    totalEnrollments: courses.reduce((sum, course) => {
      try {
        return sum + (course?.enrolledCount || 0);
      } catch (error) {
        console.error("Erreur lors du calcul des inscriptions:", error);
        return sum;
      }
    }, 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-lg font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800">{t('adminDashboard.title')}</h1>
        <p className="text-gray-500 mt-1">{t('adminDashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title={t('adminDashboard.cards.totalUsers')} 
          value={statistics.totalUsers} 
          change={t('adminDashboard.changes.usersMonth', { percent: Math.round((statistics.totalUsers / 100) * 10) })}
          changeType="positive"
          icon={<FaUsers className="text-blue-600 h-5 w-5" />}
        />
        <StatCard 
          title={t('adminDashboard.cards.activeSubscriptions')} 
          value={statistics.activeSubscriptions} 
          change={t('adminDashboard.changes.activeSubscriptions', { percent: Math.round((statistics.activeSubscriptions / (statistics.totalUsers || 1)) * 100) })}
          changeType="positive"
          icon={<FaChartLine className="text-blue-600 h-5 w-5" />}
        />
        <StatCard 
          title={t('adminDashboard.cards.totalRevenue')} 
          value={`${statistics.totalRevenue.toLocaleString()} €`} 
          change={t('adminDashboard.changes.revenueMonth', { percent: Math.round((statistics.totalRevenue / 100) * 15) })}
          changeType="positive"
          icon={<FaDollarSign className="text-blue-600 h-5 w-5" />}
        />
        <StatCard 
          title={t('adminDashboard.cards.totalCourses')} 
          value={statistics.totalCourses} 
          change={t('adminDashboard.changes.coursesMonth', { count: Math.round((statistics.totalCourses / 100) * 5) })}
          changeType="positive"
          icon={<FaBook className="text-blue-600 h-5 w-5" />}
        />
        <StatCard 
          title={t('adminDashboard.cards.categories')} 
          value={statistics.categories} 
          change={t('adminDashboard.changes.categories')}
          changeType="neutral"
          icon={<FaFolderOpen className="text-blue-600 h-5 w-5" />}
        />
        <StatCard 
          title={t('adminDashboard.cards.averageRating')} 
          value={statistics.averageRating} 
          change={t('adminDashboard.changes.averageRating')}
          changeType="neutral"
          icon={<FaStar className="text-blue-500 h-5 w-5" />}
        />
        <StatCard 
          title={t('adminDashboard.cards.totalEnrollments')} 
          value={statistics.totalEnrollments} 
          change={t('adminDashboard.changes.enrollments', { percent: Math.round((statistics.totalEnrollments / (statistics.totalUsers || 1)) * 100) })}
          changeType="positive"
          icon={<FaUserGraduate className="text-blue-600 h-5 w-5" />}
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, change, changeType, icon }) => {
  const getTextColor = () => {
    if (changeType === 'positive') return 'text-green-600';
    if (changeType === 'negative') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="rounded-full bg-blue-100 p-2">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className={`text-sm mt-1 ${getTextColor()}`}>
          {change}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
