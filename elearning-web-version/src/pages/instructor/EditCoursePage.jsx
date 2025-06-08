import React, { useState, useEffect } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateCourse } from "../../redux/slices/courseSlice";
import { toast } from "react-toastify";
import { fetchCategories } from "../../api";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE_URL ="http://192.168.70.148:4000";

const EditCoursePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courseId } = useParams();
  
  const categories = useSelector((state) => state.categories.categories);
  const profState = useSelector((state) => state.authprof) || {};
  
  const [initialCourseData, setInitialCourseData] = useState(null);
  const lastCourseDataRef = React.useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [videoPreviews, setVideoPreviews] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);
        await dispatch(fetchCategories());

        if (courseId) {
          const response = await axios.get(`${API_BASE_URL}/course/${courseId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("profToken")}` }
          });

          const course = response.data;
          const formData = {
            nom: course.nom || "",
            categorieId: course.categorieId?._id || course.categorieId || "",
            description: course.description || "",
            level: course.level || "",
            languages: course.languages || "",
            image: course.image || null,
            modules: course.modules?.map(mod => ({
              titre: mod.titre || "",
              videos: mod.videos?.map(vid => ({
                titrevd: vid.titrevd || "",
                duree: vid.duree || "",
                url: vid.url || null
              })) || [{ titrevd: "", duree: "", url: null }]
            })) || [{ titre: "", videos: [{ titrevd: "", duree: "", url: null }] }]
          };

          if (JSON.stringify(lastCourseDataRef.current) !== JSON.stringify(formData)) {
            setInitialCourseData(formData);
            lastCourseDataRef.current = formData;
          }

          if (formData.image) {
            setPreviewImage(`${API_BASE_URL}/Public/Images/${formData.image}`);
          }

          const initialVideoPreviews = {};
          formData.modules.forEach((mod, modIndex) => {
            mod.videos.forEach((vid, vidIndex) => {
              if (vid.url) {
                initialVideoPreviews[`${modIndex}-${vidIndex}`] = `${API_BASE_URL}/Public/videos/${vid.url}`;
              }
            });
          });
          setVideoPreviews(initialVideoPreviews);
        }
      } catch (err) {
        setError("Failed to load course data");
        toast.error("Failed to load course data");
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [courseId, dispatch]);

  const validationSchema = Yup.object({
    nom: Yup.string()
      .required("Title is required")
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters"),
    categorieId: Yup.string().required("Category is required"),
    description: Yup.string()
      .required("Description is required")
      .min(10, "Description must be at least 10 characters")
      .max(1000, "Description must not exceed 1000 characters"),
    level: Yup.string().required("Level is required"),
    languages: Yup.string().required("Language is required"),
    modules: Yup.array()
      .min(1, "At least one module is required")
      .of(
        Yup.object().shape({
          titre: Yup.string()
            .required("Module title is required")
            .min(3, "Module title must be at least 3 characters"),
          videos: Yup.array()
            .min(1, "At least one video is required per module")
            .of(
              Yup.object().shape({
                titrevd: Yup.string()
                  .required("Video title is required")
                  .min(3, "Video title must be at least 3 characters"),
                duree: Yup.string()
                  .required("La durée est requise")
                  .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format de durée invalide (HH:MM)"),
                url: Yup.mixed()
                  .nullable()
                  .test('fileSize', 'La taille du fichier est trop grande', function(value) {
                    if (!value || !(value instanceof File)) return true;
                    return value.size <= 100 * 1024 * 1024; // 100MB max
                  })
                  .test('fileType', 'Format de fichier non supporté', function(value) {
                    if (!value || !(value instanceof File)) return true;
                    return ['video/mp4', 'video/webm', 'video/ogg'].includes(value.type);
                  })
              })
            )
        })
      )
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      formData.append("nom", values.nom);
      formData.append("description", values.description);
      formData.append("categorieId", values.categorieId);
      formData.append("level", values.level);
      formData.append("languages", values.languages);

      if (values.image instanceof File) {
        formData.append("image", values.image);
        console.log('imager',values.image);
      }

      const modulesData = values.modules.map(module => ({
        titre: module.titre,
        videos: module.videos.map(video => ({
          titrevd: video.titrevd,
          duree: video.duree,
          url: video.url instanceof File ? 'NEW_VIDEO_PLACEHOLDER' : video.url
        }))
      }));
      
      formData.append("modules", JSON.stringify(modulesData));

      values.modules.forEach((module, moduleIndex) => {
        module.videos.forEach((video, videoIndex) => {
          if (video.url instanceof File) {
            formData.append("url", video.url);
          }
        });
      });

      const response = await axios.put(
        `${API_BASE_URL}/course/${courseId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("profToken")}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      dispatch(updateCourse(response.data));
      toast.success("Course updated successfully");
      navigate("/instructor/courses");
    } catch (err) {
      console.error("Error updating course:", err);
      setError(err.response?.data?.message || "Failed to update course");
      toast.error(err.response?.data?.message || "Failed to update course");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleImagePreview = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      setFieldValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFieldValue("image", initialCourseData?.image || null);
      if (initialCourseData?.image) {
        setPreviewImage(`${API_BASE_URL}/images/${initialCourseData.image}`);
      } else {
        setPreviewImage(null);
      }
    }
  };

  const handleVideoPreview = (event, setFieldValue, moduleIndex, videoIndex) => {
    const file = event.currentTarget.files[0];
    const fieldName = `modules.${moduleIndex}.videos.${videoIndex}.url`;
    
    if (file) {
      setFieldValue(fieldName, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreviews(prev => ({
          ...prev,
          [`${moduleIndex}-${videoIndex}`]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    } else {
      const initialVideoUrl = initialCourseData?.modules?.[moduleIndex]?.videos?.[videoIndex]?.url;
      setFieldValue(fieldName, initialVideoUrl || null);
      if (initialVideoUrl) {
        setVideoPreviews(prev => ({
          ...prev,
          [`${moduleIndex}-${videoIndex}`]: `${API_BASE_URL}/Public/videos/${initialVideoUrl}`
        }));
      } else {
        setVideoPreviews(prev => ({
          ...prev,
          [`${moduleIndex}-${videoIndex}`]: null
        }));
      }
    }
  };

  if (fetchLoading || !initialCourseData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-4">Loading course data...</p>
      </div>
    );
  }

  if (error && !initialCourseData) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: {error}
        <button
          onClick={() => navigate("/instructor/courses")}
          className="ml-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Course</h1>
      
      <Formik
        initialValues={initialCourseData}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <Field
                    name="nom"
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <ErrorMessage
                    name="nom"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Course Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImagePreview(e, setFieldValue)}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Course preview"
                      className="mt-2 h-32 w-full object-cover rounded"
                      onError={(e) => {
                        console.error("Error loading image:", e);
                        e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                      }}
                    />
                  )}
                  <ErrorMessage
                    name="image"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="categorieId"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.titre}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="categorieId"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="level"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </Field>
                  <ErrorMessage
                    name="level"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    name="languages"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a language</option>
                    <option value="fr">French</option>
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </Field>
                  <ErrorMessage
                    name="languages"
                    component="p"
                    className="mt-1 text-sm text-red-600"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <Field
                  as="textarea"
                  name="description"
                  rows="4"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <ErrorMessage
                  name="description"
                  component="p"
                  className="mt-1 text-sm text-red-600"
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Course Modules</h2>
              </div>
              
              <FieldArray name="modules">
                {({ push: pushModule, remove: removeModule }) => (
                  <div className="p-6 space-y-6">
                    {values.modules.map((module, moduleIndex) => (
                      <div key={moduleIndex} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Module {moduleIndex + 1}</h3>
                          {values.modules.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeModule(moduleIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove Module
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Module Title <span className="text-red-500">*</span>
                            </label>
                            <Field
                              name={`modules.${moduleIndex}.titre`}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <ErrorMessage
                              name={`modules.${moduleIndex}.titre`}
                              component="p"
                              className="mt-1 text-sm text-red-600"
                            />
                          </div>

                          <FieldArray name={`modules.${moduleIndex}.videos`}>
                            {({ push: pushVideo, remove: removeVideo }) => (
                              <div className="space-y-4">
                                {module.videos.map((video, videoIndex) => (
                                  <div key={videoIndex} className="border rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                          Video Title <span className="text-red-500">*</span>
                                        </label>
                                        <Field
                                          name={`modules.${moduleIndex}.videos.${videoIndex}.titrevd`}
                                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                        <ErrorMessage
                                          name={`modules.${moduleIndex}.videos.${videoIndex}.titrevd`}
                                          component="p"
                                          className="mt-1 text-sm text-red-600"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                          Duration (HH:MM) <span className="text-red-500">*</span>
                                        </label>
                                        <Field
                                          name={`modules.${moduleIndex}.videos.${videoIndex}.duree`}
                                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                        <ErrorMessage
                                          name={`modules.${moduleIndex}.videos.${videoIndex}.duree`}
                                          component="p"
                                          className="mt-1 text-sm text-red-600"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                          Video File
                                        </label>
                                        <input
                                          type="file"
                                          accept="video/*"
                                          onChange={(e) => handleVideoPreview(e, setFieldValue, moduleIndex, videoIndex)}
                                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {videoPreviews[`${moduleIndex}-${videoIndex}`] && (
                                          <video
                                            src={videoPreviews[`${moduleIndex}-${videoIndex}`]}
                                            controls
                                            className="mt-2 h-32 w-full object-cover rounded"
                                            onError={(e) => {
                                              console.error("Error loading video:", e);
                                              e.target.src = "https://via.placeholder.com/300x200?text=Video+Not+Found";
                                            }}
                                          />
                                        )}
                                        <ErrorMessage
                                          name={`modules.${moduleIndex}.videos.${videoIndex}.url`}
                                          component="p"
                                          className="mt-1 text-sm text-red-600"
                                        />
                                      </div>
                                    </div>

                                    {module.videos.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeVideo(videoIndex)}
                                        className="mt-2 text-red-600 hover:text-red-800"
                                      >
                                        Remove Video
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => pushVideo({ titrevd: "", duree: "", url: null })}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  + Add Video
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => pushModule({ titre: "", videos: [{ titrevd: "", duree: "", url: null }] })}
                      className="text-green-600 hover:text-green-800"
                    >
                      + Add Module
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate("/instructor/courses")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting || loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting || loading ? "Updating..." : "Update Course"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditCoursePage;