import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses, getCourseByInstructor } from "../../api";
import { deleteCourse, setCourses } from "../../redux/slices/courseSlice";
import axios from "axios";
import { toast } from "react-toastify";

const API_URL = "https://backendlms-5992.onrender.com";

const InstructorCoursesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Récupérer le professeur connecté et tous les cours
  const currentProfessor = useSelector((state) => state.authprof.prof);
  const allCourses = useSelector((state) => state.courses.courses || []);
  const coursesByInstructor = useSelector((state) => state.courses.coursesByInstructor || []);

  // Vérifier l'authentification
  useEffect(() => {
    if (!currentProfessor) {
      toast.warning("Vous devez être connecté pour accéder à cette page");
      navigate("/loginprof");
      return;
    }
  }, [currentProfessor, navigate]);

  // Filtrer les cours pour n'afficher que ceux du professeur connecté
  useEffect(() => {
    loadCourses();
  }, [dispatch]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const courses = await getCourseByInstructor(currentProfessor._id);
      dispatch(setCourses(courses));
      setError(null);
    } catch (err) {
      console.error("Error loading courses:", err);
      setError("Error loading courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (course) => {
    if (!course || !course._id) {
      setDeleteError("Cannot delete this course: Missing or invalid ID");
      return;
    }
    setCourseToDelete(course);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete || !courseToDelete._id) {
      setDeleteError("Invalid course ID");
      return;
    }

    try {
      const token = localStorage.getItem('profToken') || sessionStorage.getItem('profToken');
      
      if (!token) {
        setDeleteError("Session expired, please log in again");
        return;
      }

      console.log("Attempting to delete course:", courseToDelete._id);

      const response = await axios.delete(`${API_URL}/course/${courseToDelete._id}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status === 200) {
        // Mise à jour du state Redux
        dispatch(deleteCourse(courseToDelete._id));
        // Recharger la liste des cours
        await loadCourses();
        setShowDeleteModal(false);
        setCourseToDelete(null);
        toast.success("Course deleted successfully!");
      } else {
        console.warn("Delete request successful but status is not 200:", response.status);
        setDeleteError(response.data?.message || `Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur détaillée lors de la suppression:", error);
      console.error("Response de l'erreur:", error.response);
      
      if (error.response?.status === 404) {
        setDeleteError("Course no longer exists");
      } else if (error.response?.status === 403) {
        setDeleteError("You do not have permission to delete this course");
      } else if (error.response?.status === 401) {
        setDeleteError("Session expired, please log in again");
      } else {
        setDeleteError(error.response?.data?.message || "An error occurred while deleting the course");
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCourseToDelete(null);
    setDeleteError(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600">Manage and track all your courses</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div />
        <Link
          to="/instructor/courses/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          Create New Course
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Course Name", "Picture", "Description", "Category", "Level", "Language", "Modules", "Status", "Actions"].map((title) => (
                  <th key={title} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center">Loading...</td>
                </tr>
              ) : coursesByInstructor.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center">No courses found</td>
                </tr>
              ) : (
                coursesByInstructor.map((course) => (
                  <tr key={course._id}>
                    <td className="px-6 py-4">
                      <h3 className="text-base font-semibold text-gray-900">{course.nom}</h3>
                    </td>
                    <td className="px-6 py-4">
                      <img
                        className="h-14 w-24 object-cover rounded"
                        src={`https://backendlms-5992.onrender.com/Public/Images/${course.image}`}
                        alt={course.nom}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                    </td>
                    <td className="px-6 py-4">{course.categorieId?.titre || "-"}</td>
                    <td className="px-6 py-4">{course.level}</td>
                    <td className="px-6 py-4">{course.languages}</td>
                    <td className="px-6 py-4">
                      {course.modules?.map((module, index) => (
                        <div key={index} className="text-sm">{module.titre}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        course.statut === "accepted" ? "bg-green-100 text-green-800" 
                        : course.statut === "rejected" ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {course.statut || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/instructor/courses/${course._id}`} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(course)}
                        className="text-red-600 hover:text-red-900 ml-2"
                        title="Delete course"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 bg-semi-transparent bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-gray-100 rounded-2xl shadow-2xl p-8 max-w-md mx-auto relative animate-fadeIn">
            <div className="flex items-center gap-2 mb-6 border-b pb-3">
              <span className="bg-red-100 text-red-600 rounded-full p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
              </span>
              <h3 className="text-xl font-bold text-gray-800">Delete Course</h3>
              <button
                onClick={cancelDelete}
                className="ml-auto text-gray-400 hover:text-red-500 bg-white rounded-full p-1 shadow transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete "{courseToDelete.nom}"? This action cannot be undone.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{deleteError}</div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCoursesPage;
