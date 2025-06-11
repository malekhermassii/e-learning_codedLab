import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const ModalContact = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const contactInfo = {
    phoneNumber: "+1234567890",
    instagram: "@DarsiInstagram",
    email: "Darsi@example.com",
    facebook: "https://facebook.com/myProfile",
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose} // Fermer le modal
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('modalContact.title')}</Text>

          {/* Affichage des informations avec icônes */}
          <View style={styles.contactItem}>
            <Ionicons name="call" size={24} color="#3949AB" />
            <Text style={styles.contactText}>{t('modalContact.phone')}: {contactInfo.phoneNumber}</Text>
          </View>

          <View style={styles.contactItem}>
            <FontAwesome name="instagram" size={24} color="#3949AB" />
            <Text style={styles.contactText}>{t('modalContact.instagram')}: {contactInfo.instagram}</Text>
          </View>

          <View style={styles.contactItem}>
            <Ionicons name="mail" size={24} color="#3949AB" />
            <Text style={styles.contactText}>{t('modalContact.email')}: {contactInfo.email}</Text>
          </View>

          <View style={styles.contactItem}>
            <FontAwesome name="facebook" size={24} color="#3949AB" />
            <Text style={styles.contactText}>{t('modalContact.facebook')}: {contactInfo.facebook}</Text>
          </View>

          {/* Bouton pour fermer */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('modalContact.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: 280,
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  closeButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ModalContact;
