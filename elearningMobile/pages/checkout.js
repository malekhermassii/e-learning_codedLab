import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView , Alert} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from "@react-navigation/native";

const Checkout = ({ route }) => {
  const { plan } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigation = useNavigation();
  // gestion de la navigation dans le webview CREE SESSION
  useEffect(() => {
    const initializeCheckout = async () => {
      if (!isAuthenticated) {
        setError(t('checkout.alerts.notLoggedIn'));
        setLoading(false);
        return;
      }
      try {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch('http://192.168.70.148:4000/checkoutsession', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Platform': 'mobile'
          },
          body: JSON.stringify({ planId: plan._id })
        });

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.error || t('checkout.alerts.failedMessage'));
        }
        setCheckoutUrl(responseData.url);
      } catch (error) {
        console.error('Erreur de paiement:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [plan._id, isAuthenticated, t]);

  // SUCCESS AND CANCEL PAIEMENT
  const handleWebViewNavigationStateChange = (navState) => {
    if (navState.url.startsWith('https://success.stripe.mobile')) {
      setCheckoutUrl(null);
      navigation.navigate('Home');
      Alert.alert('Payment successful');
      
    }
    if (navState.url.startsWith('https://cancel.stripe.mobile')) {
      setCheckoutUrl(null);
      navigation.navigate('Home');
      Alert.alert('Payment canceled');
    }
  };

  if (checkoutUrl) {
    return (
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        style={styles.webview}
      />
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B45B4" />
        <Text style={styles.loadingText}>{t('checkout.loading')}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 40,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
});

export default Checkout;
