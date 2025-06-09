import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "../../utils/auth";
import profilePicture from "../../assets/images/profile-picture.svg";
import { io } from "socket.io-client";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import logo1 from "../../assets/images/logorg.png";
import logo2 from "../../assets/images/logo(2).png";

const Navbar = () => {
  //state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
  const savedNotifications = localStorage.getItem('notifications');
    return savedNotifications ? JSON.parse(savedNotifications) : [];
  });
  const [language, setLanguage] = useState("en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState('');
  const [hasNewNotification, setHasNewNotification] = useState(() => {
    return localStorage.getItem('hasNewNotification') === 'true';
  });
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { t, i18n } = useTranslation();

  const userRedux = useSelector(state => state.auth.userToken);
  const userLocal = JSON.parse(localStorage.getItem("currentUser"));
  const user = userRedux || userLocal;

  //effect pour la connexion et la déconnexion
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setIsLoggedIn(authStatus);
      setCurrentUser(user);
      console.log('currentUser',currentUser);     
      if (authStatus) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    };
    checkAuth();

    //effect pour la mise à jour de l'image de profil
    const handleStorageChange = (event) => {
      if (event.key && event.key.includes("_profile_image")) {
        checkAuth();
      } else {
        checkAuth();
      }
    };
    const handleProfileUpdate = () => {
      checkAuth();
    };
    //effet pour la mise à jour de l'image de profil
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userProfileUpdated", handleProfileUpdate);
    //effet pour la suppression des écouteurs
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    };
  }, [location]);

//effet pour la sauvegarde des notifications
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('hasNewNotification', hasNewNotification.toString());

    console.log("notifications :", localStorage.getItem('notifications'));
  }, [notifications, hasNewNotification]);

  //effet pour la connexion au serveur Socket.IO
  useEffect(() => {
    console.log("Initialisation de la connexion Socket.IO");
    const socket = io("https://backendlms-5992.onrender.com", {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });
    socket.on("connect", () => {
      console.log("Connecté au serveur Socket.IO - Socket ID:", socket.id);

      if (currentUser && currentUser.role === "apprenant") {
        const userId = currentUser._id || currentUser.id;
        console.log("Émission de l'événement apprenantConnect pour l'ID:", userId);
        socket.emit("apprenantConnect", userId);
      } else if (currentUser && currentUser.role === "professeur") {
        const profId = currentUser._id || currentUser.id;
        console.log("Émission de l'événement professeurConnect pour l'ID:", profId);
        socket.emit("professeurConnect", profId);
      }
    });
    socket.on("connect_error", (error) => {
      console.error("Erreur de connexion Socket.IO:", error);
    });

    //notification de nouvelle ENROLLEMENT
    socket.on("newEnrollment", (data) => {
      const newNotification = {
        ...data,
        id: data.apprenantId + '_' + data.courseId + '_' + data.message,
        type: "newEnrollment",
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotification.id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });
      setHasNewNotification(true);

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Nouvelle inscription", {
            body: data.message,
            icon: "/logo192.png"
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification("Nouvelle inscription", {
                body: data.message,
                icon: "/logo192.png"
              });
            }
          });
        }
      }
    });

    //notification de nouveau cours disponible
    socket.on("newCourseAvailable", (data) => {
      const newNotification = {
        ...data,
        id: 'new_course_' + data.courseId,
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotification.id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });
      setHasNewNotification(true);

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Nouveau cours disponible", {
            body: data.message,
            icon: "/logo192.png"
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification("Nouveau cours disponible", {
                body: data.message,
                icon: "/logo192.png"
              });
            }
          });
        }
      }
    });

    //notification d'approbation de cours
    socket.on("courseApproved", (data) => {
      const newNotification = {
        ...data,
        id: 'prof_course_approved_' + data.courseId,
        timestamp: new Date().toISOString()
      };
      setNotifications(prev => {
        if (prev.some(n => n.id === newNotification.id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });
      setHasNewNotification(true);

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Cours approuvé", {
            body: data.message,
            icon: "/logo192.png"
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then(permission => {
            if (permission === "granted") {
              new Notification("Cours approuvé", {
                body: data.message,
                icon: "/logo192.png"
              });
            }
          });
        }
      }
    });

    //effet pour la suppression des écouteurs
    return () => {
      console.log("Déconnexion de Socket.IO");
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, []);

  //effet pour la mise à jour de l'image de profil
  useEffect(() => {
    const image = localStorage.getItem('image') || sessionStorage.getItem('image');
    console.log("image",image);
    
    if (image && !image.includes('https')) {
      setUserProfileImage(`https://backendlms-5992.onrender.com/Public/Images/${image}`);
    }
    else {
      setUserProfileImage(image);
    }
    console.log('userProfileimmage', userProfileImage)
    
  }, []);

  // Ajouter l'écouteur d'événement pour la mise à jour de l'image
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      const { image } = event.detail;
      if (image) {
        setUserProfileImage(`https://backendlms-5992.onrender.com/Public/Images/${image}`);
      }
    };
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  //effet pour le menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isProfileMenuOpen) setIsProfileMenuOpen(false);
  };

  //effet pour le menu de profil
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  //effet pour le menu de langue
  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  //effet pour le menu de notification
  const toggleNotificationMenu = () => {
    setIsNotificationMenuOpen(!isNotificationMenuOpen);
    if (!isNotificationMenuOpen) {
      setHasNewNotification(false);
    }
  };

  //effet pour la suppression des notifications
  const clearNotifications = () => {
    setNotifications([]);
    setHasNewNotification(false);
    localStorage.removeItem('notifications');
    localStorage.removeItem('hasNewNotification');
  };
 
  let filteredNotifications = [];

  //effet pour le filtrage des notifications
  if (currentUser && currentUser.type === "professeur") {
    filteredNotifications = notifications.filter(
      n => n.type === "professeur" && n.professeurId === currentUser._id
    );
  } else if (currentUser && currentUser.type === "apprenant") {
    filteredNotifications = notifications.filter(
      n =>
        n.type === "apprenant" ||
        n.type === "general" ||
        n.type === "new_course_available" ||
        n.type === "newEnrollment" ||
        n.type === "question_reponse"
    );
  } else {
    filteredNotifications = notifications.filter(
      n => n.type === "general" || n.type === "new_course_available" || n.type === "newEnrollment"
    );
  }
  
  return (
    <nav className="bg-transparent sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={isHomePage ? logo1 : logo2} 
                alt="logo" 
                className="h-17 w-17 pb-2 pt-2" 
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-4 mr-4">
              {["Home", "Courses", "Contact"].map((item) => (
                <Link
                  key={item}
                  to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                  className={`${isHomePage ? "text-white" : "text-gray-800"
                    } hover:text-blue-300 px-3 py-2 text-sm font-medium`}
                >
                  {t(`navbar.menu.${item.toLowerCase()}`)}
                </Link>
              ))}
            </div>
            <LanguageSwitcher isHomePage={isHomePage} />

            {isLoggedIn ? (
              <div className="relative flex items-center space-x-4 ">
                  <div className="relative mt-3">
              <button
                onClick={toggleNotificationMenu}
                className={`${isHomePage ? "text-white" : "text-gray-800"
                  } hover:text-blue-300 text-sm font-medium relative`}
                aria-label="Notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
                {hasNewNotification && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>

              {/* menu de notification */}
              {isNotificationMenuOpen && (
                <div className={`absolute ${i18n.dir() === 'rtl' ? 'left-4' : 'right-4'} z-50 mt-2 w-full max-w-xs md:w-80 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5`}>
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-900">{t('navbar.notifications.title')}</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
                        >
                          {notification.type === 'newEnrollment' ? (
                            <p className="text-sm text-gray-700">{t('navbar.notifications.newEnrollement', { studentName: notification.studentName, courseName: notification.courseName })}</p>
                          ) : notification.type === 'new_course_available' ? ( 
                            <p className="text-sm text-gray-700">{t('navbar.notifications.newCourse', { courseName: notification.courseName })}</p>
                          ) : ( 
                            null
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500">
                        {t('navbar.notifications.noNotifications')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
                <div className="relative">
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center focus:outline-none"
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    <span className="sr-only">{t('navbar.openUserMenu')}</span>
                    <img
                      className="h-8 w-8 rounded-full border-2 border-blue-300"
                      src={userProfileImage}
                      alt="Profile"
                    />
                    <span
                      className={`ml-2 font-medium ${isHomePage ? "text-white" : "text-gray-800"
                        }`}
                    >
                      {currentUser?.fullName?.split(" ")[0]}
                    </span>
                    <svg
                      className={`ml-1 h-4 w-4 ${isHomePage ? "text-white" : "text-gray-800"
                        }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {currentUser?.fullName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {currentUser?.email}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {t('navbar.auth.profile')}
                      </Link>
                      <Link
                        to="/profile"
                        state={{ editMode: true }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {t('navbar.auth.editProfile')}
                      </Link>
                      <Link
                        to="/my-courses"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {t('navbar.auth.myCourses')}
                      </Link>
                      <Link
                        to="/logout"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        {t('navbar.auth.signOut')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className={`inline-flex items-center justify-center rounded-md border bg-transparent px-4 py-2 text-sm font-medium ${isHomePage ? "text-white" : "border-black text-black"
                  } shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                {t('navbar.auth.signIn')}
              </Link>
            )}
          </div>

          <div className="flex md:hidden items-center">
            {isLoggedIn && (
              <button
                type="button"
                className="mr-2 flex items-center focus:outline-none"
                onClick={toggleProfileMenu}
              >
                <img
                  className="h-8 w-8 rounded-full border-2 border-blue-300"
                  src={userProfileImage}
                  alt="Profile"
                />
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-dark hover:text-blue-300 hover:bg-blue-600/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              {/* menu mobile */}
              <span className="sr-only">{t('navbar.openMainMenu')}</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* menu de profil */}
      {isProfileMenuOpen && isLoggedIn && (
        <div className="md:hidden bg-white shadow-lg rounded-b-lg mx-2">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {currentUser?.fullName}
            </p>
            <p className="text-xs text-gray-500">{currentUser?.email}</p>
          </div>
          <div className="py-1">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {t('navbar.auth.profile')}
            </Link>
            <Link
              to="/profile"
              state={{ editMode: true }}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {t('navbar.auth.editProfile')}
            </Link>
            <Link
              to="/my-courses"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {t('navbar.auth.myCourses')}
            </Link>
            <Link
              to="/logout"
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {t('navbar.auth.signOut')}
            </Link>
          </div>
        </div>
      )}

      {/* menu mobile */}
      {isMenuOpen && (
        <div
          className="md:hidden bg-gray-900/80 backdrop-blur-sm"
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {["Home", "Courses", "Contact"].map((item) => (
              <Link
                key={item}
                to={item === "Home" ? "/" : `/${item.toLowerCase()}`}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-blue-300 hover:bg-blue-600/20"
              >
                {t(`navbar.menu.${item.toLowerCase()}`)}
              </Link>
            ))}

            <div className="mt-4 flex flex-col space-y-3 px-3">
              <LanguageSwitcher isHomePage={isHomePage} />

              {!isLoggedIn && (
                <Link
                  to="/login"
                  className={`inline-flex items-center justify-center rounded-md border border-white bg-transparent px-4 py-2 text-sm font-medium ${isHomePage ? "text-white" : "text-white"
                    } shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  {t('navbar.auth.signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
