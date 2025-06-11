import React, { useState, useEffect,useContext, } from "react";
import { NavigationContainer, } from "@react-navigation/native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,

} from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, Text, Alert, ScrollView, Image, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons, AntDesign, Feather } from "@expo/vector-icons";
import Home from "./pages/home";
import Login from "./pages/login";
import Profile from "./pages/profile";
import Courses from "./pages/courses";
import Subscribe from "./pages/subscribe";
import Quiz from "./pages/quiz";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyCode from "./pages/VerifyCode";
import ResetPassword from "./pages/ResetPassword";
import BottomMenu from "./components/menuBottom";
import CourseContent from "./pages/coursecontent";
import * as Localization from "expo-localization";
import ModalContact from "./pages/ModalContact";
import Demande from "./pages/demande";
import Certificate from "./pages/certificate";
import Coursprogress from "./pages/progressioncours"
import Checkout from "./pages/checkout";
import { Provider } from 'react-redux';
import { store } from './redux/store'; 
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearUser,setUserToken } from './redux/slices/authSlice';
import LanguageSwitcher from './components/LanguageSwitcher';
import i18n from './pages/i18n/i18n';
import { useTranslation } from 'react-i18next';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as Notifications from 'expo-notifications';




// Créer un Context pour la langue
const LanguageContext = React.createContext();

// Stack and Drawer Navigators
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Custom Drawer Content
const CustomDrawerContent = (props) => {

  const [modalVisible, setModalVisible] = useState(false);
  const { language, setLanguage } = useContext(LanguageContext);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { isAuthenticated, userInfo } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const user = await AsyncStorage.getItem("user");
        console.log(user);
        if (token && user) {
          dispatch(setUserToken({ token, user: JSON.parse(user) }));
        }
      } catch (error) {
        console.log("Error loading user from storage:", error);
      }
    };

    loadUserFromStorage();
  }, [dispatch]);

  useEffect(() => {
    const unsubscribe = props.navigation.addListener('drawerOpen', async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        dispatch(setUserToken({ user: JSON.parse(user) }));
      }
    });
    return unsubscribe;
  }, [props.navigation, dispatch]);

//logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      dispatch(clearUser());
      navigation.replace("Login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      {/* Affichage des informations utilisateur si connecté */}
      {isAuthenticated && (
        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatar}>
            <Image source={{ uri:`http://192.168.70.148:4000/Public/Images/${userInfo.image}` }} 
            style={{ width: 50, height: 50, borderRadius: 25 }} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userInfo.name}</Text>
            <Text style={styles.userEmail}>{userInfo.email}</Text>
          </View>
        </View>
      )}

      

      <DrawerItemList {...props} />
      
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.drawerItem}
      >
        <AntDesign name="contacts" size={20} color="#828282" />
        <Text style={styles.drawerItemText}>{t('modalContact.title')}</Text>
      </TouchableOpacity>

      <ModalContact
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <LanguageSwitcher language={language} setLanguage={setLanguage} />

      {/* Bouton de connexion/déconnexion conditionnel */}
      {isAuthenticated ? (
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.drawerItem}
        >
          <Ionicons name="exit" size={24} color="#828282" />
          <Text style={styles.drawerItemText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.drawerItem}
        >
          <Ionicons name="log-in" size={24} color="#828282" />
          <Text style={styles.drawerItemText}>{t('login.loginButton')}</Text>
        </TouchableOpacity>
      )}
    </DrawerContentScrollView>
  );
};

// Drawer navigation
const DrawerMenu = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          backgroundColor: "#fff",
          width: 300,
        },
        drawerLabelStyle: {
          marginLeft: -20,
        },
        drawerItemStyle: {
          paddingVertical: 5,
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{
          drawerLabel: t('drawer.home'),
          headerLeft: () => null,
          headerTitle: () => null,
          headerShown: false,
          drawerIcon: ({ color }) => (
            <AntDesign name="home" size={23} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Courses"
        component={Courses}
        options={({ navigation }) => ({
          drawerLabel: t('drawer.courses'),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
          drawerIcon: ({ color }) => (
            <Feather name="book-open" size={23} color={color} />
          ),
          headerTitle: () => <Text style={{fontSize:18,fontWeight:"bold"}}>{t('drawer.popularCourses')}</Text>,
        })}
      />
      {isAuthenticated && (
        <Drawer.Screen
          name="Profile"
          component={Profile}
          options={({ navigation }) => ({
            drawerLabel: t('drawer.profile'),
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
            ),
            drawerIcon: ({ color }) => (
              <AntDesign name="user" size={23} color={color} />
            ),
            headerTitle: () => <Text style={{fontSize:18,fontWeight:"bold"}}>{t('profile.title')}</Text>,
          })}
        />
      )}
      
    </Drawer.Navigator>
  );
};

//stack navigagteur
const App = () => {
  const [isLoginPage, setIsLoginPage] = useState(false);
  const [language, setLanguage] = useState(
    (Localization.locale && Localization.locale.startsWith("ar")) ? "ar" : "en"
  );

  return (
    <Provider store={store}>
   
        <LanguageContext.Provider value={{ language, setLanguage }}>
          <StripeProvider
            publishableKey="pk_test_51QzxbZJe7b3Unj16KcbfvRhumtBKo3NRBFgQR3dqH9s8st4dX17wAvFU2Ik3BN2d4YvLC9rZV6bTd1e9xPtvt3vw00Ahesy24D"
            merchantIdentifier="merchant.com.yourapp"
          >
            <AppContent isLoginPage={isLoginPage} setIsLoginPage={setIsLoginPage} />
          </StripeProvider>
        </LanguageContext.Provider>
      
    </Provider>
  );
};

const AppContent = ({ isLoginPage, setIsLoginPage }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoginPage(false);
    }
  }, [isAuthenticated, setIsLoginPage]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            height: 40,
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: { fontSize: 16 },
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen
          name="DrawerMenu"
          component={DrawerMenu}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="My Courses"
          component={Coursprogress}
          options={() => ({
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="coursecontent"
          component={CourseContent}
          options={() => ({
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="Subscribe"
          component={Subscribe}
          options={() => ({
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="Checkout"
          component={Checkout}
          options={() => ({
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="Demande"
          component={Demande}
          options={() => ({
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="Quiz"
          component={Quiz}
          options={() => ({
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="Certificate"
          component={Certificate}
          options={() => ({
            headerShown: false,
          })}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VerifyCode"
          component={VerifyCode}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResetPassword"
          component={ResetPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
          listeners={{
            focus: () => setIsLoginPage(true),
            blur: () => setIsLoginPage(false),
          }}
        />
      </Stack.Navigator>
      {(!isLoginPage || isAuthenticated) && <BottomMenu />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  userInfoContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  drawerItem: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center' },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#77777B',
  },
  languageSelector: {
    marginLeft: 15,
    marginRight: 15,
  },
  languageOption: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedLanguage: {
    backgroundColor: '#ddd',
  },
  flagIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  languageText: {
    fontSize: 14,
    color: '#000',
  },
});

export default App;
