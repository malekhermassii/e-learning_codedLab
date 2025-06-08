import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const useCountUp = (end, duration = 2) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);
  const isInView = useInView(nodeRef, { once: true });

  //count up
  useEffect(() => {
    let startTimestamp = null;
    const endValue = parseInt(end);
    
    const animate = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 800), 1);
      
      setCount(Math.floor(progress * endValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    if (isInView) {
      requestAnimationFrame(animate);
    }

    return () => setCount(0);
  }, [end, duration, isInView]);

  return { count, ref: nodeRef };
};

//stat card 
const StatCard = ({ number, label, suffix = "" }) => {
  const { count, ref } = useCountUp(number);
  const controls = useAnimation();
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      variants={{
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-4xl md:text-5xl font-bold text-blue-600 mb-2 flex items-baseline"
      >
        <span>{count}</span>
        <span className="text-blue-600">{suffix}</span>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-gray-600 text-lg text-center"
      >
        {label}
      </motion.p>
    </motion.div>
  );
};

const SuccessStats = () => {
  const { t } = useTranslation();

  const stats = [
    { number: "15", suffix: "K+", label: t('successStats.students') },
    { number: "20", suffix: "K+", label: t('successStats.courses') },
    { number: "10", suffix: "Y+", label: t('successStats.experience') },
    { number: "10", suffix: "K+", label: t('successStats.achievements') }
  ];

  return (
    <section className="py-16 px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto relative"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-bold text-blue-900 text-center mb-16"
        >
          {t('successStats.title')}
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              number={stat.number}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-50 rounded-full filter blur-3xl opacity-20 -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-50 rounded-full filter blur-3xl opacity-20 -z-10" />
      </motion.div>
    </section>
  );
};

export default SuccessStats;
