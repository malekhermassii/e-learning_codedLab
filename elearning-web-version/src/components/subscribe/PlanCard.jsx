// import React from 'react';
// import PropTypes from 'prop-types';
// import { useNavigate } from 'react-router-dom';

// const PlanCard = ({ 
//   title, 
//   price, 
//   period, 
//   discount, 
//   features, 
//   isActive,
//   onCardClick
// }) => {
//   const navigate = useNavigate();

//   const handleSubscribe = (e) => {
//     e.stopPropagation(); // Prevent card click event
//     navigate('/checkout', {
//       state: {
//         plan: {
//           title,
//           price,
//           period,
//           features
//         }
//       }
//     });
//   };

//   return (
//     <div 
//       onClick={onCardClick}
//       className={`rounded-2xl p-8 transition-all duration-300 h-full flex flex-col cursor-pointer 
//         ${isActive 
//           ? 'bg-[#1B45B4] text-white shadow-lg transform scale-[1.02]' 
//           : 'bg-white hover:shadow-lg hover:transform hover:scale-[1.02]'
//         }`}
//     >
//       {/* Plan Title */}
//       <h3 className={`text-lg font-semibold mb-6 ${
//         isActive ? 'text-white' : 'text-[#006FBA]'
//       }`}>
//         {title}
//       </h3>

//       {/* Price */}
//       <div className="mb-4">
//         <div className="flex items-baseline">
//           <span className="text-[32px] font-bold">$</span>
//           <span className="text-[32px] font-bold">{price}</span>
//           <span className="text-lg ml-1">/{period}</span>
//         </div>
//         <p className={`text-sm mt-2 ${
//           isActive ? 'text-white/80' : 'text-gray-600'
//         }`}>
//             Save {discount}%
//         </p>
//       </div>

//       {/* Features */}
//       <div className="mt-8 flex-grow">
//         <p className={`text-sm font-medium mb-4 ${
//           isActive ? 'text-white' : 'text-gray-900'
//         }`}>
//           WHAT'S INCLUDED
//         </p>
//         <ul className="space-y-3">
//           {features.map((feature, index) => (
//             <li key={index} className="flex items-start">
//               <svg 
//                 className={`w-4 h-4 mr-3 flex-shrink-0 mt-1 ${
//                   isActive ? 'text-white' : 'text-gray-400'
//                 }`} 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//               >
//                 <path 
//                   strokeLinecap="round" 
//                   strokeLinejoin="round" 
//                   strokeWidth="2" 
//                   d="M5 13l4 4L19 7"
//                 />
//               </svg>
//               <span className={`text-sm leading-tight ${
//                 isActive ? 'text-white/90' : 'text-gray-600'
//               }`}>
//                 {feature}
//               </span>
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* Subscribe Button */}
//       <button
//         onClick={handleSubscribe}
//         className={`w-full mt-8 py-3 px-6 bg-gradient-to-r from-[#6A36FF] to-[#AC5FE6] rounded-lg font-medium text-sm transition-all duration-200 
//           ${isActive
//             ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md hover:transform hover:scale-[1.02]'
//             : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md hover:transform hover:scale-[1.02]'
//           } cursor-pointer`}
//       >
//         Subscribe
//       </button>
//     </div>
//   );
// };
// //valider les types des propriétés (props)
// PlanCard.propTypes = {
//   title: PropTypes.string.isRequired,
//   price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
//   period: PropTypes.string.isRequired,
//   description: PropTypes.string.isRequired,
//   features: PropTypes.arrayOf(PropTypes.string).isRequired,
//   isActive: PropTypes.bool,
//   onCardClick: PropTypes.func.isRequired
// };

// PlanCard.defaultProps = {
//   isActive: false
// };

// export default PlanCard; 










import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';


const PlanCard = ({
  _id,
  name,
  price,
  offers,
  duration,
  interval,
  isActive,
  onCardClick,
  onSubscribe,
  features,
   // Add this prop
})  => {
  const navigate = useNavigate();

  const handleSubscribe = (e) => {
    e.stopPropagation();
    navigate('/checkout', {
      state: { plan: { _id, name, price, offers, duration, interval } }
    });
    onSubscribe();
  };

  return (
    <div
      onClick={onCardClick}
      className={`rounded-2xl p-8 transition-all duration-300 h-full flex flex-col cursor-pointer max-w-[400px] max-h-[800px]
        ${isActive
          ? 'bg-[#1B45B4] text-white shadow-lg scale-105'
          : 'bg-white hover:shadow-lg hover:scale-105'
        }`}
    >
         {/* Plan Title */}
       <h3 className={`text-lg font-semibold mb-6 ${
         isActive ? 'text-white' : 'text-[#006FBA]'
       }`}>
         {name}
       </h3>

       {/* Price */}
       <div className="mb-4">
         <div className="flex items-baseline">
           <span className="text-[32px] font-bold">$</span>
           <span className="text-[32px] font-bold">{price}</span>
           <span className="text-lg ml-1">/{interval}</span>
         </div>
         <p className={`text-sm mt-2 ${
           isActive ? 'text-white/80' : 'text-gray-600'
         }`}>
             Save {offers}%
         </p>
       </div>

       {/* Features */}
       <div className="mt-8 flex-grow">
         <p className={`text-sm font-medium mb-4 ${
           isActive ? 'text-white' : 'text-gray-900'
         }`}>
           WHAT'S INCLUDED
         </p>
         <ul className="space-y-3">
           {features.map((feature, index) => (
             <li key={index} className="flex items-start">
               <svg 
                 className={`w-4 h-4 mr-3 flex-shrink-0 mt-1 ${
                   isActive ? 'text-white' : 'text-gray-400'
                 }`} 
                 fill="none" 
                 stroke="currentColor" 
                 viewBox="0 0 24 24"
            >
                 <path 
                   strokeLinecap="round" 
                   strokeLinejoin="round" 
                   strokeWidth="2" 
                   d="M5 13l4 4L19 7"
                 />
               </svg>
               <span className={`text-sm leading-tight ${
                 isActive ? 'text-white/90' : 'text-gray-600'
               }`}>
                 {feature}
               </span>
             </li>
           ))}
         </ul>
      </div>
      {/* Subscribe Button */}
      <button
        onClick={handleSubscribe}
        className={`mt-[50px] w-full py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 
          ${isActive
            ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
            : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
          }`}
      >
        Subscribe
      </button>
    </div>
  );
};

PlanCard.propTypes = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  offers: PropTypes.string,
  duration: PropTypes.string.isRequired,
  interval: PropTypes.oneOf(['month', 'year']).isRequired,
  isActive: PropTypes.bool,
  onCardClick: PropTypes.func.isRequired
};

PlanCard.defaultProps = {
  offers: '',
  isActive: false
};

export default PlanCard;
