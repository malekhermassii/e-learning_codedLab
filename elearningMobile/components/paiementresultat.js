import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from 'react-i18next';

const PaiementResultat = ({ success, onReturn }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {success ? t('checkout.alerts.success') : t('checkout.alerts.failed')}
      </Text>
      <Text style={styles.message}>
        {success ? t('checkout.alerts.successMessage') : t('checkout.alerts.failedMessage')}
      </Text>
      <TouchableOpacity style={styles.button} onPress={onReturn}>
        <Text style={styles.buttonText}>{t('bottomMenu.home')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... vos styles ici ...
});

export default PaiementResultat;
