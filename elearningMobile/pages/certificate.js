import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as IntentLauncher from 'expo-intent-launcher';

const windowWidth = Dimensions.get("window").width;

const Certificate = ({ route }) => {
  const { courseId, score } = route.params;
  const [userName, setUserName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [profName, setProfName] = useState("");
  const [loading, setLoading] = useState(true);
  const [certificatId, setCertificatId] = useState(null);
  const navigation = useNavigation();

  //fetch certif info
  useEffect(() => {
    const fetchCertifInfo = async () => {
      try {
        // Appel à l'API pour récupérer les infos du certificat
        const response = await fetch(`http://192.168.70.148:4000/certificat/course/${courseId}`, {
          headers: {
            "Authorization": `Bearer ${await AsyncStorage.getItem("userToken")}`
          }
        });
        const data = await response.json();
        console.log("Données du certificat reçues:", data);
        
        if (data?.certificat?.id) {
          setCertificatId(data.certificat.id);
          setUserName(data?.apprenantInfo?.name);
          setCourseName(data?.courseInfo?.nom);
          setProfName(data?.courseInfo?.professeur);
        } else {
          console.error(t('certificate.certificateNotFound'), data);
          alert(t('certificate.error.notFound'));
        }
      } catch (error) {
        console.error(t('certificate.error.loading'), error);
        alert(t('certificate.error.loading'));
      } finally {
        setLoading(false);
      }
    };
    fetchCertifInfo();
  }, [courseId]);

  // Date de délivrance (aujourd'hui par défaut)
  const today = new Date();
  const formattedDate = `${today.toLocaleString("default", {
    month: "long",
  })} ${today.getDate()}, ${today.getFullYear()}`;

  const { t } = useTranslation();

  // Fonction pour générer le PDF
  const generatePDF = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Certificate of Achievement</title>
          <style>
            body {
              background: #f0f4ff;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 700px;
              margin: 40px auto;
              background: #fff;
              border-radius: 24px;
              box-shadow: 0 4px 24px rgba(79,70,229,0.08);
              border: 1px solid #e5e7eb;
              padding: 40px 32px 80px 32px;
              position: relative;
              overflow: hidden;
            }
            .medal {
              text-align: center;
              margin-bottom: 18px;
            }
            .medal-icon {
              font-size: 48px;
              color: #4f46e5;
              background: #fff;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(79,70,229,0.08);
              padding: 10px;
              display: inline-block;
            }
            .title {
              font-size: 2.2rem;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 8px;
              text-align: center;
            }
            .divider {
              height: 4px;
              width: 64px;
              background: #6366f1;
              margin: 0 auto 24px auto;
              border-radius: 2px;
            }
            .awarded {
              color: #64748b;
              font-size: 1rem;
              text-transform: uppercase;
              letter-spacing: 2px;
              text-align: center;
              margin-bottom: 18px;
            }
            .student {
              font-size: 2rem;
              font-weight: bold;
              color: #6366f1;
              text-align: center;
              margin-bottom: 18px;
            }
            .for-completing {
              color: #334155;
              font-size: 1.1rem;
              text-align: center;
              margin-bottom: 10px;
            }
            .course {
              font-size: 1.5rem;
              font-weight: bold;
              color: #0f172a;
              text-align: center;
              margin-bottom: 24px;
            }
            .score {
              font-size: 1.1rem;
              color: #334155;
              text-align: center;
              margin-bottom: 24px;
            }
            .score strong {
              color: #6366f1;
            }
            .signature-block {
              background: #f6f8ff;
              border-radius: 16px;
              padding: 20px 12px 12px 12px;
              margin: 32px auto 0 auto;
              width: 320px;
              border: 1px solid #e0e7ff;
              text-align: center;
            }
            .signature-label {
              font-size: 0.95rem;
              color: #64748b;
              margin-bottom: 8px;
            }
            .prof-name {
              font-size: 1.1rem;
              color: #4338ca;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .date {
              font-size: 1rem;
              color: #64748b;
              margin-bottom: 0;
            }
            .certified-stamp {
              position: absolute;
              right: 32px;
              bottom: 16px;
              background: #f3e8ff;
              border: 2px solid #a78bfa;
              border-radius: 50%;
              width: 70px;
              height: 70px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #a78bfa;
              font-weight: bold;
              font-size: 13px;
              opacity: 0.85;
              z-index: 2;
              box-shadow: 0 2px 8px rgba(126,34,206,0.08);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="medal">
              <span class="medal-icon">🏅</span>
            </div>
            <div class="title">Certificate of Achievement</div>
            <div class="divider"></div>
            <div class="awarded">This certificate is awarded to</div>
            <div class="student">${userName}</div>
            <div class="for-completing">for successfully completing the course</div>
            <div class="course">${courseName}</div>
            <div class="score">Score: <strong>${score}/20</strong></div>
            <div class="signature-block">
              <div class="signature-label">Instructor's signature</div>
              <div class="prof-name">${profName}</div>
              <div class="date">Issued on ${formattedDate}</div>
            </div>
            <div class="certified-stamp">CERTIFIED</div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
      });

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            `certificat_${courseName}.pdf`,
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
          alert(t('certificate.downloadSuccess'));
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: fileUri,
            flags: 1,
            type: 'application/pdf',
          });
        } else {
          alert(t('certificate.permissionDenied'));
        }
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error(t('certificate.error.pdfError'), error);
      alert(t('certificate.error.pdfError'));
    }
  };

  // Fonction pour télécharger depuis le backend
  const handleDownloadFromBackend = async () => {
    try {
      if (!certificatId) {
        console.error("certificate.missingCertificateId:", { certificatId, courseId });
        alert(t('certificate.downloadError'));
        return;
      }
      console.log(t('certificate.attemptToDownloadCertificateWithId'), certificatId);
      const token = await AsyncStorage.getItem("userToken");
      
      if (!token) {
        console.error(t('certificate.missingToken'));
        alert(t('certificate.downloadError'));
        return;
      }
      const response = await fetch(
        `http://192.168.70.148:4000/certificats/${certificatId}/telecharger`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erreur serveur:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.message || t('certificate.downloadError'));
      }
      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        console.error(t('certificate.emptyResponse'));
        throw new Error(t('certificate.emptyResponse'));
      }
      const fileUri = FileSystem.documentDirectory + `certificat_${courseName}.pdf`;
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
          });

          const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            `certificat_${courseName}.pdf`,
            'application/pdf'
          );
          await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
          alert(t('certificate.downloadSuccess'));
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: fileUri,
            flags: 1,
            type: 'application/pdf',
          });
        } else {
          console.error(t('certificate.permissionDenied'));
          alert(t('certificate.permissionDenied'));
        }
      } else {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
          await Sharing.shareAsync(fileUri);
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error(t('certificate.detailedDownloadError'), {
        message: error.message,
        stack: error.stack,
        certificatId,
        courseId
      });
      alert(t('certificate.downloadError'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#f0f4ff", "#ffffff"]}
        style={styles.background}
      />

      <View style={styles.header}>
        <View style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('certificate.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.certificateContainer}>
          <View style={styles.certificateCardImproved}>
            <View style={styles.medalContainer}>
            <Text style={styles.medalIcon}>🏅</Text>
            </View>

            <Text style={styles.certificateTitleImproved}>
            Certificate of Achievement
            </Text>

            <View style={styles.dividerImproved} />

            <Text style={styles.certifiesTextImproved}>THIS CERTIFIES THAT</Text>

            {loading ? (
              <Text>Loading...</Text>
            ) : (
              <>
                <Text style={styles.userNameImproved}>{userName}</Text>
                <Text style={styles.completedTextImproved}>
                has successfully completed the course
                </Text>
                <Text style={styles.courseNameImproved}>{courseName}</Text>
                <Text style={styles.scoreTextImproved}>
                with a final score of{" "}
                  <Text style={styles.scoreBoldImproved}>{score || "17"}/20</Text>
                </Text>

                <View style={styles.signatureBlockImproved}>
                  <Text style={styles.signatureLabelImproved}>
                  Instructor's signature
                  </Text>
                  <Text style={styles.instructorNameImproved}>{profName}</Text>
                  <Text style={styles.dateTextImproved}>
                  Issued on {formattedDate}
                  </Text>
                </View>

                <View style={styles.certStampImproved}>
                  <Text style={styles.stampTextImproved}>CERTIFIED</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.downloadButton, { backgroundColor: '#7e22ce' }]}
              onPress={handleDownloadFromBackend}
            >
              <LinearGradient
                colors={["#7e22ce", "#a78bfa"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.downloadButtonText}>
                  {t('certificate.download')}
                </Text>
                <Ionicons name="cloud-download-outline" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginBottom:50

  },
  background: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
  scrollView: {
    flex: 1,
    
   
  },
  certificateContainer: {
    padding: 20,
    alignItems: "center",
    
  },
  certificateCardImproved: {
    width: '98%',
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginVertical: 18,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  medalContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  medalIcon: {
    fontSize: 48,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateTitleImproved: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  dividerImproved: {
    height: 3,
    width: 80,
    backgroundColor: '#6366f1',
    marginBottom: 18,
    borderRadius: 2,
  },
  certifiesTextImproved: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  userNameImproved: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 12,
    textAlign: 'center',
  },
  completedTextImproved: {
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  courseNameImproved: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 14,
    textAlign: 'center',
  },
  scoreTextImproved: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 28,
    textAlign: 'center',
  },
  scoreBoldImproved: {
    fontWeight: 'bold',
    color: '#6366f1',
  },
  signatureBlockImproved: {
    backgroundColor: '#f6f8ff',
    borderRadius: 16,
    padding: 18,
    marginTop: 0,
    width: '90%',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    alignItems: 'center',
    marginBottom:50
  },
  signatureLabelImproved: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  instructorNameImproved: {
    fontSize: 16,
    color: '#4338ca',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dateTextImproved: {
    fontSize: 13,
    color: '#64748b',
  },
  certStampImproved: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    backgroundColor: '#f3e8ff',
    borderWidth: 2,
    borderColor: '#a78bfa',
    borderRadius: 40,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
    zIndex: 2,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  stampTextImproved: {
    color: '#a78bfa',
    fontWeight: 'bold',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonContainer: {
    alignItems:'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  downloadButton: {
    marginTop:0,
  alignItems:'center',
marginBottom:5,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#3730a3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  downloadButtonText: {
    color: "white",
    fontWeight: "bold",
    marginRight: 8,
  },
  profLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
    textAlign: "center",
  },
});

export default Certificate;
