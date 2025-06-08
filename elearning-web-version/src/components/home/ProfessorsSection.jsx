import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_URL = "http://192.168.70.148:4000";

const ProfessorsSection = () => {
  const { t } = useTranslation();
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);

  //fetch professors
  useEffect(() => {
    axios.get(`${API_URL}/professeur`)
      .then(res => {
        setProfessors(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>{t('whoIsElearning.loading')}</div>;

  return (
    <section className="py-12 bg-gray-50">
      <h2 className="text-2xl font-bold text-center text-blue-900 mb-8">{t('whoIsElearning.ourTeachers')}</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-6 px-4 pb-4" style={{ minHeight: 260 }}>
          {professors.map(prof => (
            <div
              className="flex-shrink-0 bg-white rounded-xl shadow-md p-6 flex flex-col items-center min-w-[220px] max-w-[220px] transition-transform hover:scale-105"
              key={prof._id}
            >
              <img
                src={
                  prof.image
                    ? `${API_URL}/Public/Images/${prof.image}`
                    : "../assets/images/Instructor.png"
                }
                alt={prof.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-800 mb-4"
              />
              <h3 className="text-lg font-semibold text-blue-900">{prof.name}</h3>
              <p className="text-gray-600 text-center">{prof.specialite}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfessorsSection;
