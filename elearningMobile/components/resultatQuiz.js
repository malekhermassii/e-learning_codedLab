// ResultModal.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';

const ResultQuiz = ({ 
  visible, 
  score, 
  isPassed, 
  onReturnToCourse, 
  onGetCertificate,
  certificat,
  showCertificateButton,
  onRetryQuiz
}) => {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.backButton}>
              <Text style={styles.backButtonText}>{t('resultQuiz.quizTitle')}</Text>
            </View>
           
          </View>

          <View style={styles.modalContent}>
            {/* Score Circle */}
            <View style={styles.scoreCircleContainer}>
              <View style={styles.scoreCircleOuter}>
                <View style={styles.scoreCircleInner}>
                  <Text style={styles.scoreLabel}>{t('resultQuiz.yourScore')}</Text>
                  <Text style={styles.scoreValue}>{score}/20</Text>
                </View>
              </View>
            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
              {isPassed ? (
                <View style={{flexDirection:'column', alignItems:'center'}}>
                <Text style={styles.message}>
                  {t('resultQuiz.successMessage')}
                </Text>
                </View>
              ) : (
                <Text style={styles.message}>
                  {t('resultQuiz.failureMessage')}
                </Text>
              )}
            </View>

            {/* Button */}
            {certificat && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onGetCertificate}
              >
                <Text style={styles.actionButtonText}>
                  {t('resultQuiz.getCertificate')}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="white"
                  style={styles.buttonIcon}
                />
              </TouchableOpacity>
            )}

            {!isPassed ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRetryQuiz}
              >
                <Text style={styles.actionButtonText}>
                  {t('quiz.retryQuiz')}
                </Text>
                <Ionicons
                  name="refresh"
                  size={20}
                  color="white"
                  style={styles.buttonIcon}
                />
              </TouchableOpacity>
            ): <TouchableOpacity style={styles.actionButton} onPress={onGetCertificate}>
            <Text style={styles.actionButtonText}>
              {t('resultQuiz.getCertificate')}
            </Text>
          </TouchableOpacity>  }
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "white",
  },
  modalHeader: {
      backgroundColor: "#3949AB",
    padding: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
  },
  headerSubtitle: {
    color: "white",
    opacity: 0.7,
    fontSize: 14,
    marginTop: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  scoreCircleContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
      backgroundColor: "#3949AB",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreCircleInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreLabel: {
    color: "white",
    fontSize: 14,
  },
  scoreValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  messageContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  highlightText: {
    color: "#2563EB",
  },
  actionButton: {
    marginTop: 24,
      backgroundColor: "#3949AB",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default ResultQuiz;