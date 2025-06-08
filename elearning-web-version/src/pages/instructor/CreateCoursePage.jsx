import React, { useState, useEffect } from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { addCourse } from "../../redux/slices/courseSlice";
import { toast } from "react-toastify";
import { fetchCategories } from "../../api";
import { useNavigate } from "react-router-dom";

// Base API URL - adjust according to environment
const API_BASE_URL = "http://192.168.70.148:4000";

const CreateCoursePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get authentication data from Redux store with verification
  const categories = useSelector((state) => state.categories.categories);
  const profState = useSelector((state) => state.authprof) || {};
  
  // Secure data extraction
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [videoPreviews, setVideoPreviews] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Display current Redux store state for debugging
  useEffect(() => {
    console.log("Current Redux state:", {
      profState,
      hasToken: Boolean(profState?.token),
      hasProf: Boolean(profState?.prof)
    });
  }, [profState]);

  // Authentication check with structure validation
  const checkAuthentication = () => {
    try {
      console.log("Complete prof state structure:", profState);
      
      // Use Redux state properties directly now that we have access to authprof
      let token = profState?.profToken || null;
      let prof = profState?.prof || null;
      
      console.log("Redux structure check after extraction:", {
        token: token ? "Present" : "Absent",
        prof: prof ? "Present" : "Absent",
        profId: prof?._id || "Not found",
        isAuthenticated: profState?.isAuthenticated
      });
      
      // If not in Redux, try localStorage as fallback
      if (!token) {
        token = localStorage.getItem("profToken");
        console.log("Token retrieved from localStorage:", token ? "Present" : "Absent");
      }
      
      if (!prof || !prof._id) {
        try {
          const profData = localStorage.getItem("currentprof");
          if (profData) {
            prof = JSON.parse(profData);
            console.log("Prof retrieved from localStorage:", prof ? "Present" : "Absent", 
                        "ID:", prof?._id || "Not found");
          }
        } catch (e) {
          console.error("JSON parsing error for currentprof:", e);
        }
      }
      
      // Check if we have a professor ID
      const isValid = Boolean(token && prof && prof._id);
      
      console.log("Final authentication check result:", {
        token: token ? `${token.substring(0, 10)}...` : "Absent",
        profId: prof?._id || "Absent",
        profName: prof?.name || "Absent",
        isValid: isValid
      });
      
      setIsAuthenticated(isValid);
      
      // Adapt for backend compatibility expecting userId
      if (prof && prof._id && !prof.userId) {
        // Clone the prof object before adding a property
        // to avoid "Cannot add property userId, object is not extensible" error
        const profClone = { ...prof };
        profClone.userId = prof._id;
        prof = profClone;
      }
      
      return { isValid, token, prof };
    } catch (error) {
      console.error("Error during authentication check:", error);
      setIsAuthenticated(false);
      return { isValid: false, token: null, prof: null };
    }
  };

  useEffect(() => {
    dispatch(fetchCategories());
    
    // Check authentication on every Redux store change
    const { isValid } = checkAuthentication();
    
    if (!isValid) {
      console.warn("User not authenticated, redirecting...");
      toast.warning("You must be logged in to access this page");
      navigate("/loginprof");
    }
    
  }, [profState, navigate, dispatch]);

  const validationSchema = Yup.object({
    nom: Yup.string()
      .required("Title is required")
      .min(3, "Title must be at least 3 characters long")
      .max(100, "Title must not exceed 100 characters"),
    categorieId: Yup.string().required("Category is required"),
    image: Yup.mixed()
      .required("Image is required"),
    description: Yup.string()
      .required("Description is required")
      .min(10, "Description must be at least 10 characters long")
      .max(1000, "Description must not exceed 1000 characters"),
    level: Yup.string().required("Level is required"),
    languages: Yup.string().required("Language is required"),
    modules: Yup.array()
      .min(1, "At least one module is required")
      .of(
        Yup.object().shape({
          titre: Yup.string()
            .required("Module title is required")
            .min(3, "Module title must be at least 3 characters long"),
          videos: Yup.array()
            .min(1, "At least one video is required per module")
            .of(
              Yup.object().shape({
                titrevd: Yup.string()
                  .required("Video title is required")
                  .min(3, "Video title must be at least 3 characters long"),
                duree: Yup.string()
                  .required("Duration is required")
                  .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid duration format (HH:MM)"),
                url: Yup.mixed()
                  .required("Video is required")
              })
            )
        })
      )
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Check authentication
      const { isValid, token, prof } = checkAuthentication();
      
      if (!isValid) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        navigate("/loginprof");
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // 1. Prepare FormData
      const formData = new FormData();
      
      // Text fields
      formData.append("nom", values.nom);
      formData.append("description", values.description);
      formData.append("categorieId", values.categorieId);
      formData.append("level", values.level);
      formData.append("languages", values.languages);
      formData.append("professeurId", prof._id);
      
      // Course image
      if (values.image instanceof File) {
        console.log("Adding image:", values.image.name);
        formData.append("image", values.image);
      } else {
        toast.error("L'image du cours est requise");
        setError("L'image du cours est requise");
        setLoading(false);
        setSubmitting(false);
        return;
      }
      
      // Modules data - Make sure it's properly structured for the backend
      const modulesData = values.modules.map(module => ({
        titre: module.titre,
        videos: module.videos.map(video => ({
          titrevd: video.titrevd,
          duree: video.duree
        }))
      }));
      
      formData.append("modules", JSON.stringify(modulesData));
      
      // 2. Count and add video files
      let videoCount = 0;
      let invalidVideoFormats = [];
      values.modules.forEach((module, moduleIndex) => {
        module.videos.forEach((video, videoIndex) => {
          if (video.url instanceof File) {
            // Check if format is accepted by backend
            const fileExtension = video.url.name.split('.').pop().toLowerCase();
            const acceptedFormats = ['mp4', 'avi', 'mkv'];

            if (!acceptedFormats.includes(fileExtension)) {
              invalidVideoFormats.push(`${video.url.name} (format non accepté, utilisez mp4, avi, ou mkv)`);
            } else {
              console.log(`Adding video ${videoCount}:`, video.url.name);
              // Use plain "url" as field name to match backend expectations
              formData.append("url", video.url);
              videoCount++;
            }
          }
        });
      });

      // Handle invalid video formats if any
      if (invalidVideoFormats.length > 0) {
        toast.error(`Formats vidéo invalides: ${invalidVideoFormats.join(', ')}`);
        setError(`Formats vidéo invalides: ${invalidVideoFormats.join(', ')}`);
        setLoading(false);
        setSubmitting(false);
        return;
      }
      
      // Check if at least one video was provided
      if (videoCount === 0) {
        toast.error("Aucun fichier vidéo n'a été fourni.");
        setError("Veuillez ajouter au moins une vidéo.");
        setLoading(false);
        setSubmitting(false);
        return;
      }
      
      // 3. Log FormData content for debugging
      console.log(`Sending ${videoCount} videos and course data:`, values.nom);
      
      // For debugging, log all form data entries
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `(File: ${pair[1].name})` : pair[1]);
      }
      
      // 4. Send request with axios instead of XMLHttpRequest for better error handling
      const response = await axios.post(`${API_BASE_URL}/course`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            console.log(`Upload in progress: ${percentComplete}%`);
          }
        }
      });
      
      console.log("Response received:", response.data);
      
      // 6. Process response
      dispatch(addCourse(response.data));
      
      // Update professor profile in localStorage
      if (prof) {
        const updatedProf = {
          ...prof,
          courseId: [...(prof.courseId || []), response.data.course?._id || response.data._id]
        };
        localStorage.setItem("currentprof", JSON.stringify(updatedProf));
      }
      
      // 7. Finalization
      toast.success("Cours créé avec succès!");
      resetForm();
      setPreviewImage(null);
      setVideoPreviews({});
      navigate("/instructor/courses");
      
    } catch (error) {
      console.error("Error creating course:", error);
      
      // Provide detailed error feedback
      let errorMessage = "Erreur lors de la création du cours";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response:", error.response);
        errorMessage = error.response.data?.message || 
                      `Erreur serveur: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
        errorMessage = "Aucune réponse du serveur. Vérifiez votre connexion internet.";
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }
      
      // Display error message to user
      toast.error(errorMessage);
      setError(errorMessage);
      
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleImagePreview = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    if (file) {
      // Vérifier le format de l'image
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const acceptedImageFormats = ['jpg', 'jpeg', 'png'];
      
      if (!acceptedImageFormats.includes(fileExtension)) {
        toast.error(`Format d'image non accepté. Utilisez JPG, JPEG ou PNG.`);
        event.target.value = null; // Réinitialiser l'input file
        return;
      }
      
      setFieldValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoPreview = (event, setFieldValue, moduleIndex, videoIndex) => {
    const file = event.currentTarget.files[0];
    if (file) {
      // Vérifier le format de la vidéo
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const acceptedVideoFormats = ['mp4', 'avi', 'mkv'];
      
      if (!acceptedVideoFormats.includes(fileExtension)) {
        toast.error(`Format vidéo non accepté. Utilisez MP4, AVI ou MKV.`);
        event.target.value = null; // Réinitialiser l'input file
        return;
      }
      
      setFieldValue(`modules.${moduleIndex}.videos.${videoIndex}.url`, file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreviews(prev => ({
          ...prev,
          [`${moduleIndex}-${videoIndex}`]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="bg-blue-100 text-blue-600 rounded-full p-2">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold">Create a new course</h1>
      </div>
      <Formik
        initialValues={{
          nom: "",
          categorieId: "",
          image: null,
          description: "",
          level: "",
          languages: "",
          modules: [
            {
              titre: "",
              videos: [{ titrevd: "", duree: "", url: null }]
            }
          ]
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course title</label>
                <Field
                  name="nom"
                  type="text"
                  className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                  placeholder="Course title"
                />
                <ErrorMessage name="nom" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => handleImagePreview(e, setFieldValue)}
                  className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                />
                {previewImage && (
                  <img src={previewImage} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-xl shadow" />
                )}
                <div className="text-xs text-gray-500 mt-1">Accepted formats: JPG, JPEG, PNG</div>
                <ErrorMessage name="image" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <Field
                  as="select"
                  name="categorieId"
                  className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                >
                  <option value="">Select a category</option>
                  {categories?.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.titre}</option>
                  ))}
                </Field>
                <ErrorMessage name="categorieId" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Level</label>
                <Field
                  as="select"
                  name="level"
                  className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                >
                  <option value="">Select a level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Field>
                <ErrorMessage name="level" component="div" className="text-red-500 text-sm mt-1" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                <Field
                  as="select"
                  name="languages"
                  className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                >
                  <option value="">Select a language</option>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </Field>
                <ErrorMessage name="languages" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <Field
                as="textarea"
                name="description"
                rows="4"
                className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                placeholder="Describe the course content..."
              />
              <ErrorMessage name="description" component="div" className="text-red-500 text-sm mt-1" />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Modules</h2>
              <FieldArray name="modules">
                {({ push: pushModule, remove: removeModule }) => (
                  <div className="space-y-4">
                    {values.modules.map((module, moduleIndex) => (
                      <div key={moduleIndex} className="border rounded-2xl p-4 bg-gray-50 shadow">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-md font-semibold">Module {moduleIndex + 1}</h3>
                          {moduleIndex > 0 && (
                            <button
                              type="button"
                              onClick={() => removeModule(moduleIndex)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove module
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <Field
                            name={`modules.${moduleIndex}.titre`}
                            placeholder="Module title"
                            className="block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                          />
                          <ErrorMessage
                            name={`modules.${moduleIndex}.titre`}
                            component="div"
                            className="text-red-500 text-sm"
                          />
                          <FieldArray name={`modules.${moduleIndex}.videos`}>
                            {({ push: pushVideo, remove: removeVideo }) => (
                              <div className="space-y-4">
                                {module.videos.map((video, videoIndex) => (
                                  <div key={videoIndex} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                      <Field
                                        name={`modules.${moduleIndex}.videos.${videoIndex}.titrevd`}
                                        placeholder="Video title"
                                        className="block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                                      />
                                      <ErrorMessage
                                        name={`modules.${moduleIndex}.videos.${videoIndex}.titrevd`}
                                        component="div"
                                        className="text-red-500 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Field
                                        name={`modules.${moduleIndex}.videos.${videoIndex}.duree`}
                                        placeholder="Duration (e.g., 10:30)"
                                        className="block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none"
                                      />
                                      <ErrorMessage
                                        name={`modules.${moduleIndex}.videos.${videoIndex}.duree`}
                                        component="div"
                                        className="text-red-500 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Video file</label>
                                      <input
                                        type="file"
                                        accept="video/mp4,video/x-msvideo,video/x-matroska"
                                        onChange={(e) => handleVideoPreview(e, setFieldValue, moduleIndex, videoIndex)}
                                        className="mt-1 block w-full text-base rounded-xl border border-gray-300 bg-white shadow-md px-4 py-2 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition placeholder-gray-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">Accepted formats: MP4, AVI, MKV</div>
                                      {videoPreviews[`${moduleIndex}-${videoIndex}`] && (
                                        <video
                                          src={videoPreviews[`${moduleIndex}-${videoIndex}`]}
                                          controls
                                          className="mt-2 h-32 w-full object-cover rounded-xl shadow"
                                        />
                                      )}
                                      <ErrorMessage
                                        name={`modules.${moduleIndex}.videos.${videoIndex}.url`}
                                        component="div"
                                        className="text-red-500 text-sm mt-1"
                                      />
                                    </div>
                                    {module.videos.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeVideo(videoIndex)}
                                        className="text-red-600 hover:text-red-800 mt-2 self-start text-sm"
                                      >
                                        Remove video
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => pushVideo({ titrevd: "", duree: "", url: null })}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  + Add video
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
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      + Add module
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={() => navigate("/instructor/courses")}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting || loading ? "Creating course..." : "Create course"}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateCoursePage;