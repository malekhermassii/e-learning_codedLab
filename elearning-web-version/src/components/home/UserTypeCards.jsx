import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const UserTypeCard = ({ type, imageSrc }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  //handle click on button 
  const handleClick = () => {
    if (type === "instructor") {
      navigate("/apply-instructor");
    } else {
      navigate("/subscribe");
    }
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md bg-white relative h-64">
      {/* Background image with overlay */}
      <div className="relative h-full">
        <img
          src={imageSrc}
          alt={t(`userTypes.${type}.title`)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-opacity-30 flex flex-col justify-center items-center p-6 text-white">
          <h3 className="text-xl font-bold mb-6">{t(`userTypes.${type}.title`)}</h3>

          <button
            onClick={handleClick}
            className={`px-5 py-2 rounded-full ${
              type === "instructor"
                ? "border border-white bg-transparent text-white-800"
                : "bg-[#0097FEE5] text-white"
            } font-medium hover:shadow-lg transition duration-300`}
          >
            {t(`userTypes.${type}.buttonText`)}
          </button>
        </div>
      </div>
    </div>
  );
};

//user type cards
const UserTypeCards = () => {
  const userTypes = [
    {
      type: "instructor",
      imageSrc: "/images/Instructor.png",
    },
    {
      type: "student",
      imageSrc: "/images/Students.png",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {userTypes.map((userType) => (
        <UserTypeCard
          key={userType.type}
          type={userType.type}
          imageSrc={userType.imageSrc}
        />
      ))}
    </div>
  );
};

export default UserTypeCards;
