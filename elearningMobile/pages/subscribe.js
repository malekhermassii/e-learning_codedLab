import React, { useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,

} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchplan } from "../api";
import { setPlan } from "../redux/slices/planSlice";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Utilisation de AsyncStorage pour React Native
import { useTranslation } from 'react-i18next';
import { hasActiveSubscriptionServer } from "../utils/auth";
import { isAuthenticated } from "../utils/auth";
import { Ionicons } from "@expo/vector-icons";


export default function Subscribe({ navigation }) {
  const dispatch = useDispatch();
  const plans = useSelector((state) => state.plans.plans);
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await dispatch(fetchplan()); // Si pas de données stockées, récupérer les données via l'API
      } catch (error) {
        console.error(
          t('subscribe.errorLoadingStoredData'),
          error
        );
      }
    };
    loadInitialData();
  }, [dispatch]);

  // handle payment
  const handlePayment = async (plan) => {
    const hasActiveSubscription =  await hasActiveSubscriptionServer();
    const isauthentified = await isAuthenticated();
    if (
      hasActiveSubscription && isauthentified
      ) {
      Alert.alert(t('subscribe.alreadyActiveSubscription'));
      return;
    }
    else if (!isauthentified) {
      Alert.alert(t('subscribe.mustBeLoggedInToSubscribe'));
      navigation.navigate("Login");
      return;
    }
    navigation.navigate("Checkout", { plan });
  };

  return (
    <SafeAreaView style={styles.container}>
<View style={styles.header}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.column}>
          <Text style={styles.title}>{t('subscribe.title')}</Text>
          <Text style={styles.description}>{t('subscribe.description')}</Text>
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <View key={plan._id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <ImageBackground
                    source={{ uri: plan.image }}
                    resizeMode="stretch"
                    imageStyle={styles.imageBackground}
                    style={styles.headerBackground}
                  >
                    <Text style={styles.planTitle}>{currentLanguage === 'ar' ? plan.name_ar : plan.name}</Text>
                  </ImageBackground>
                </View>

                <View style={styles.planContent}>
                  <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color="#6A36FF"
                      />
                      <Text style={styles.featureText}>
                        {t('subscribe.unlimitedAccess', { offers: plan.offers })}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color="#6A36FF"
                      />
                      <Text style={styles.featureText}>
                        {t('subscribe.learnAnytime')}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color="#6A36FF"
                      />
                      <Text style={styles.featureText}>
                        {t('subscribe.certificates')}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color="#6A36FF"
                      />
                      <Text style={styles.featureText}>
                        {t('subscribe.accessWebMobile')}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color="#6A36FF"
                      />
                      <Text style={styles.featureText}>
                        {t('subscribe.accessQuiz')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.priceText}>
                    {t('subscribe.price', { price: plan.price })}
                  </Text>
                  <Text style={styles.billingText}>
                  {currentLanguage === 'ar' ? plan.interval_ar : plan.interval}
                  </Text>

                  <TouchableOpacity
                    style={styles.buttonContainer}
                    onPress={() => handlePayment(plan)}
                    
                  >
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      colors={["#6A36FF", "#AC5FE6"]}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>{t('subscribe.subscribeButton')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    marginBottom: 70, // Added to ensure content is visible without cutting off at the bottom
  },
  header: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    paddingTop:20
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#333",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    marginTop:7

  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 20,
  },
  column: {
    alignItems: "center",
    backgroundColor: "#F4F8FE",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    color: "#14358A",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    color: "#14358A",
    fontSize: 15,
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  plansContainer: {
    width: "100%",
    maxWidth: 400,
  },
  headerBackground: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 15,
  },
  imageBackground: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 20,
    overflow: "hidden",
  },
  planHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    overflow: "hidden",
  },
  planTitle: {
    color: "#006EBA",
    fontSize: 20,
    fontWeight: "bold",
  },
  planContent: {
    padding: 20,
  },
  featuresList: {
    marginBottom: 15,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  featureText: {
    color: "#333333",
    fontSize: 14,
    marginLeft: 5,
  },
  priceText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  billingText: {
    color: "#666666",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    width: 200,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
