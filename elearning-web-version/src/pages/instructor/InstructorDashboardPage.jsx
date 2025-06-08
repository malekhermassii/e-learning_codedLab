import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios"; // Assurez-vous d'avoir axios installé
import { fetchCourses } from "../../api"; // Assurez-vous que le chemin est correct
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InstructorDashboardPage = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [socket, setSocket] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Récupérer le professeur connecté et les cours depuis Redux
  const currentProfessor = useSelector((state) => state.authprof.prof);
  const courses = useSelector((state) => state.courses.courses || []);


  // Filtrer les cours du professeur connecté
  const instructorCourses = currentProfessor
    ? courses.filter((course) => {
        // Accéder à l'_id dans l'objet professeurId du cours
        const courseProf = String(course.professeurId?._id);
        const currentProf = String(currentProfessor._id);
        // console.log(`Comparaison: courseProf=${courseProf}, currentProf=${currentProf}`); // Log précédent, peut être décommenté si besoin
        return courseProf === currentProf;
      })
    : [];

  // Initialisation de Socket.IO
  useEffect(() => {
    if (currentProfessor) {


      // Configuration Socket.IO avec options de reconnexion
      const newSocket = io("http://192.168.70.148:4000", {
        reconnection: true, //si la connexion est coupée, essayer de se reconnecter.
        reconnectionAttempts: 5,
        reconnectionDelay: 1000, //attendre 1 seconde entre chaque tentative.
        reconnectionDelayMax: 4000, //maximum 5 secondes d'attente.
        timeout: 20000,
      });

      newSocket.on("connect", () => {
        // console.log("[Socket] Connecté au serveur Socket.IO");
        setSocket(newSocket);
      });

      newSocket.on("connect_error", (error) => {
        console.error("[Socket] Erreur de connexion:", error.message);
        toast.error("Erreur de connexion au serveur de notifications");
      });

      newSocket.on("disconnect", (reason) => {
        // console.log("[Socket] Déconnecté:", reason);
        if (reason === "io server disconnect") {
          newSocket.connect();
        }
      });

      newSocket.on("reconnect", (attemptNumber) => {
        // console.log(
        //   "[Socket] Reconnexion réussie après",
        //   attemptNumber,
        //   "tentatives"
        // );
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("[Socket] Erreur de reconnexion:", error);
      });

      newSocket.on("reconnect_failed", () => {
        console.error(
          "[Socket] Échec de la reconnexion après plusieurs tentatives"
        );
        toast.error("Impossible de se reconnecter au serveur de notifications");
      });

      // Connexion du professeur une fois connecté
      newSocket.on("connect", () => {
        // console.log(
        //   "[Socket] Émission de l'événement professeurConnect avec ID:",
        //   currentProfessor._id
        // );
        newSocket.emit("professeurConnect", currentProfessor._id);
      });

      // Écouter les notifications d'approbation de cours
      newSocket.on("courseApproved", (data) => {
        console.log("[Socket] Notification reçue :", data);
        if (data.professeurId === currentProfessor._id) {
          console.log(
            "[Socket] Notification correspond au professeur connecté"
          );

          // Incrémenter le compteur de notifications non lues
          setUnreadNotifications((prev) => {
            console.log(
              "[Socket] Mise à jour du compteur de notifications:",
              prev + 1
            );
            return prev + 1;
          });

          // Sauvegarder la notification
          const savedNotifications = JSON.parse(
            localStorage.getItem("notifications") || "[]"
          );
          savedNotifications.push({
            ...data,
            timestamp: new Date().toISOString(),
            read: false,
          });
          localStorage.setItem(
            "notificationsProf",
            JSON.stringify(savedNotifications)
          );
          console.log("[Socket] Notification sauvegardée dans le localStorage");

          // Afficher la notification toast
          toast.success(data.message, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Mettre à jour la liste des cours
          console.log("[Socket] Mise à jour de la liste des cours...");
          dispatch(fetchCourses());
        } else {
          console.log(
            "[Socket] Notification ne correspond pas au professeur connecté"
          );
        }
      });

      // Écouter les notifications de refus de cours
      newSocket.on("courseRejected", (data) => {
        console.log("[Socket] Notification de refus reçue:", data);
        if (data.professeurId === currentProfessor._id) {
          // Incrémenter le compteur de notifications non lues
          setUnreadNotifications((prev) => prev + 1);

          // Sauvegarder la notification
          const savedNotifications = JSON.parse(
            localStorage.getItem("notificationsProf") || "[]"
          );
          savedNotifications.push({
            ...data,
            timestamp: new Date().toISOString(),
            read: false,
          });
          localStorage.setItem(
            "notificationsProf",
            JSON.stringify(savedNotifications)
          );

          // Afficher la notification toast
          toast.error(data.message, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Mettre à jour la liste des notifications affichées
          loadNotifications();
        }
      });

      // Écouter les notifications de nouvelles questions
      newSocket.on("newQuestion", (data) => {
        console.log("[Socket] Nouvelle question reçue:", data);
        if (data.courseId) {
          // Incrémenter le compteur de notifications non lues
          setUnreadNotifications((prev) => prev + 1);

          const savedNotifications = JSON.parse(
            localStorage.getItem("notificationsProf") || "[]"
          );
          savedNotifications.push({
            ...data,
            type: "question",
            professeurId: currentProfessor._id,
            timestamp: new Date().toISOString(),
            read: false,
          });
          localStorage.setItem("notificationsProf", JSON.stringify(savedNotifications));

          // Afficher la notification toast
          toast.info(data.message, {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          console.log("Notification sauvegardée dans le localStorage", savedNotifications);

          // Mettre à jour la liste des notifications affichées
          loadNotifications();
        }
      });

      // Charger les notifications non lues depuis le localStorage
      const loadUnreadNotifications = () => {
        console.log("[Socket] Chargement des notifications non lues...");
        const savedNotifications = JSON.parse(
          localStorage.getItem("notificationsProf") || "[]"
        );
        console.log("[Socket] Notifications sauvegardées:", savedNotifications);
        const unread = savedNotifications.filter(
          (n) => !n.read && n.professeurId === currentProfessor._id
        ).length;
        console.log("[Socket] Nombre de notifications non lues:", unread);
        setUnreadNotifications(unread);
      };

      loadUnreadNotifications();

      return () => {
        console.log("[Socket] Déconnexion du socket...");
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [currentProfessor, dispatch]);

  const loadNotifications = () => {
    const savedNotifications = JSON.parse(
      localStorage.getItem("notificationsProf") || "[]"
    );
    // Filtrer pour ce professeur uniquement
    const filtered = savedNotifications.filter(
      (n) => n.professeurId === currentProfessor._id
    );
    setNotifications(filtered.reverse()); // Les plus récentes en haut
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Dispatch l'action pour charger les cours
        await dispatch(fetchCourses());
        setError(null);
      } catch (err) {
        console.error("Error loading courses:", err);
        setError("Error loading dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    // Charger les données uniquement si un professeur est potentiellement connecté
    // (fetchCourses chargera tous les cours, le filtrage se fait ensuite)
    loadData();
  }, [dispatch]);

  useEffect(() => {
    if (currentProfessor) {
      loadNotifications();
    }
  }, [currentProfessor]);

  // Calculer les statistiques spécifiques demandées
  const numberOfCourses = instructorCourses.length;
  const totalStudents = instructorCourses.reduce(
    (sum, course) =>
      sum + (course.apprenantEnroll?.length || course.enrolledCount || 0),
    0
  );
  const averageRating =
    instructorCourses.length > 0
      ? (
          instructorCourses.reduce(
            (sum, course) => sum + (course.averageRating || 0),
            0
          ) / numberOfCourses
        ).toFixed(1)
      : "0.0";

  console.log("[Dashboard] Nombre de cours:", numberOfCourses);
  console.log("[Dashboard] Total étudiants:", totalStudents);
  console.log("[Dashboard] Note moyenne:", averageRating);

  // État de chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // Si aucun professeur n'est connecté
  if (!currentProfessor) {
    return (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-yellow-600">
          Please log in as an instructor to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Instructor Dashboard
          </h1>
          <p className="text-gray-600">Welcome, {currentProfessor?.name}</p>
        </div>

        {/* Badge de notifications */}
        <div className="relative">
          <button
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadNotifications(0);
              // Marquer toutes les notifications comme lues
              const notifications = JSON.parse(
                localStorage.getItem("notificationsProf") || "[]"
              );
              notifications.forEach((n) => {
                if (n.professeurId === currentProfessor._id) n.read = true;
              });
              localStorage.setItem(
                "notificationsProf",
                JSON.stringify(notifications)
              );
              loadNotifications();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {unreadNotifications}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 font-bold border-b">Notifications</div>
              {notifications.length === 0 ? (
                <div className="p-2 text-gray-500">Aucune notification</div>
              ) : (
                notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className={`p-2 border-b ${
                      notif.read ? "bg-gray-50" : "bg-yellow-50"
                    }`}
                  >
                    <div className="text-sm">{notif.message}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ToastContainer />

      {/* Métriques Résumées Spécifiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Nombre de cours */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Number of courses created
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {numberOfCourses}
              </p>
            </div>
          </div>
        </div>

        {/* Total des étudiants */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Total students enrolled
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>
          </div>
        </div>

        {/* Note moyenne */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">
                Average course rating
              </p>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-900">
                  {averageRating}
                </p>
                <p className="ml-1 text-gray-500">/5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vous pouvez ajouter ici d'autres sections si nécessaire, par exemple un lien vers la gestion des cours */}
    </div>
  );
};

export default InstructorDashboardPage;
