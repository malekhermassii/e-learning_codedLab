import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
const CertificatePage = () => {
  const { courseId } = useParams();
  const { score } = useLocation().state || {};
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificatInfo, setCertificatInfo] = useState(null);
  const { t } = useTranslation();

  //fetch certificate info
  useEffect(() => {
    const fetchCertificateInfo = async () => {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get(
          `http://192.168.70.148:4000/certificat/course/${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        setCertificatInfo(response.data);
        setError(null);
      } catch (err) {
        console.error(t('certificate.errorCertificate'), err);
        setError(err.response?.data?.message || t('certificate.errorCertificate'));
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateInfo();
  }, [courseId, navigate]);

  //handle download certificate
  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await axios.get(
        `http://192.168.70.148:4000/certificats/${certificatInfo.certificat.id}/telecharger`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificat_${certificatInfo.courseInfo.nom}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(t('certificate.download.success'));
    } catch (error) {
      console.error(t('certificate.download.error'), error);
      alert(t('certificate.download.error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 text-center px-4">
        <h2 className="text-2xl text-red-600 mb-4">{t('certificate.error.title')}</h2>
        <p className="text-gray-600 mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pt-16 pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-end space-x-4 mb-6 print:hidden">
          <button
            onClick={handleDownload}
            className="px-4 py-2 flex items-center space-x-2 bg-[#3f51b5] text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
          >
            <span>{t('certificate.download.button')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl mx-auto max-w-3xl certificate-container relative overflow-hidden">
          <div className="text-center">
            <div className="medal mb-4">
              <span className="text-4xl">🏅</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Certificate of Achievement</h1>
            <div className="flex justify-center mb-4">
              <div className="h-1 w-16 bg-indigo-600"></div>
            </div>
            <p className="text-gray-500 text-sm uppercase tracking-wider mb-4">Awarded to</p>
            <h2 className="text-2xl font-bold text-indigo-700 mb-6">
              {certificatInfo?.apprenantInfo?.name || t('certificate.unknownStudent')}
            </h2>
            <p className="text-gray-600 mb-3">
            for successfully completing the course
            </p>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {certificatInfo?.courseInfo?.nom || t('certificate.unknownCourse')}
            </h3>
            <div className="flex justify-center mb-4">
              <p className="text-gray-600 mb-3"> with final score of : </p>
              <span className="text-l font-bold text-indigo-700 mb-3"> {score} / 20</span>
            </div>

            <div className="mt-8 bg-indigo-50 rounded-2xl p-6 mx-auto max-w-xs border border-indigo-100">
              <p className="text-gray-600 text-sm mb-2">Instructors Signature</p>
              <p className="text-indigo-700 font-bold mb-2">{certificatInfo?.courseInfo?.professeur || 'Instructeur'}</p>
              <p className="text-gray-500 text-sm">
                Issued on {new Date(certificatInfo?.certificat?.date_obtention).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="absolute right-8 bottom-8 bg-purple-50 border-2 border-purple-300 rounded-full w-16 h-16 flex items-center justify-center text-purple-500 font-bold text-sm opacity-85 shadow-md">
              CERTIFIED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePage;