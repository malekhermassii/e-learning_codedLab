/**
 * Quiz utility functions
 */

/**
 * Check if a quiz for a course has been completed
 * 
 * @param {string} courseId - The course ID to check
 * @returns {boolean} True if the quiz is completed
 */
export const isQuizCompleted = (courseId) => {
  const quizResultsStr = localStorage.getItem(`course_${courseId}_quiz_results`);
  if (!quizResultsStr) return false;
  
  try {
    const quizResults = JSON.parse(quizResultsStr);
    return quizResults.completed === true;
  } catch {
    return false;
  }
};

/**
 * Check if a course is completed (all lessons marked as complete)
 * 
 * @param {string|number} courseId - The course ID to check
 * @param {object} course - The course object with modules and lessons
 * @returns {boolean} True if all lessons are completed
 */
export const isCourseCompleted = (courseId, course) => {
  if (!course) return false;
  
  const savedProgressStr = localStorage.getItem(`course_${courseId}_progress`);
  if (!savedProgressStr) return false;
  
  try {
    const completedLessons = JSON.parse(savedProgressStr);
    
    // Count total lessons in the course
    const totalLessons = course.modules.reduce(
      (total, module) => total + module.lessons.length, 
      0
    );
    
    // If all lessons are completed
    return completedLessons.length === totalLessons;
  } catch {
    return false;
  }
};

/**
 * Save quiz results to localStorage
 * 
 * @param {string|number} courseId - The course ID
 * @param {object} results - The quiz results object
 */
export const saveQuizResults = (courseId, results) => {
  localStorage.setItem(
    `course_${courseId}_quiz_results`, 
    JSON.stringify({
      ...results,
      timestamp: new Date().toISOString(),
      completed: true
    })
  );
};

/**
 * Get quiz results for a course
 * 
 * @param {string|number} courseId - The course ID
 * @returns {object|null} The quiz results or null if not found
 */
export const getQuizResults = (courseId) => {
  const quizResultsStr = localStorage.getItem(`course_${courseId}_quiz_results`);
  if (!quizResultsStr) return null;
  
  try {
    return JSON.parse(quizResultsStr);
  } catch {
    return null;
  }
};

/**
 * Generate a certificate ID for a completed course
 * 
 * @param {string|number} courseId - The course ID
 * @param {string} userId - The user ID
 * @returns {string} A unique certificate ID
 */
export const generateCertificateId = (courseId, userId) => {
  const timestamp = Date.now();
  return `CERT-${courseId}-${userId.substring(0, 5)}-${timestamp.toString().substring(7)}`;
}; 