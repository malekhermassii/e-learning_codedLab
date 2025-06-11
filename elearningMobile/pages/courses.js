import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  Text,
  Image,
} from "react-native";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import Course from "../components/cours";
import { useSelector, useDispatch } from "react-redux";
import { fetchCourses } from "../api";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { isApprenant } from "../api";
import { isAuthenticated } from "../utils/auth";

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const courses = useSelector((state) => state.courses.courses);
  const dispatch = useDispatch();
  const { t ,i18n} = useTranslation();
  const currentLanguage = i18n.language;
  const [modalVisible, setModalVisible] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isAuthentified, setIsAuthentified] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const navigation = useNavigation();

  // Logging pour déboguer la structure des cours
  useEffect(() => {
    if (courses.length > 0) {
      console.log(t('courses.structure'), courses[0]);
    }
  }, [courses]);

  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // Récupérer les informations de l'utilisateur
  useEffect(() => {
    const getUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      setUser(JSON.parse(userData));
    }
    getUser();
  }, []);

  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const checkIsAuthentified = async () => {
      const isAuthentified = await isAuthenticated();
      setIsAuthentified(isAuthentified);
    };
    checkIsAuthentified();
  }, []);

  // Vérifier si l'utilisateur est un apprenant
  useEffect(() => {
    const checkApprenant = async () => {
      const isStudent1 = await isApprenant(user?.userId);
      console.log('isStudent:', isStudent1);
      setIsStudent(isStudent1);
    };
    checkApprenant();
  }, [user]);

  // Récupérer les recommandations
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (isStudent && isAuthentified) {
        setLoadingRecommendations(true);
        try {
          await fetchRecommendations();
          setModalVisible(true);
        } catch (error) {
          console.error(t('courses.errorRecommendations'), error);
        } finally {
          setLoadingRecommendations(false);
        }
      }
    });

    return unsubscribe;
  }, [navigation, isStudent, isAuthentified]);

  // Récupérer 
  useEffect(() => {
    if (isStudent && isAuthentified) {
      fetchRecommendations();
    }
  }, [isStudent, isAuthentified]);

  // Filtrer les cours acceptés
  const acceptedCourses = courses.filter(course => course.statut === 'accepted');

  // Fonction de recherche/filtrage
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://192.168.70.148:4000/course/search`, {
        params: {
          nom: searchQuery
        }
      });
      // Filtrer les résultats de recherche pour n'avoir que les cours acceptés
      const filteredAcceptedCourses = response.data.filter(course => course.statut === 'accepted');
      setFilteredCourses(filteredAcceptedCourses);
    } catch (error) {
      console.error(t('courses.errorLoadingSearch'), error);
      Alert.alert(t('errors.error'), t('errors.errorDetails'));
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les recommandations
  const fetchRecommendations = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!user?.userId) {
        Alert.alert(t('course.userNotConnected'));
        return;
      }
      // 1. Récupérer l'apprenant
      const apprenantRes = await fetch(`http://192.168.70.148:4000/apprenant/by-user/${user.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!apprenantRes.ok) {
        const errorData = await apprenantRes.text();
        // console.error('Réponse du serveur:', errorData);
        throw new Error(`Erreur serveur: ${apprenantRes.status} - ${errorData}`);
      }
      const apprenant = await apprenantRes.json();
      if (!apprenant?._id) {
        console.error(t('courses.apprenantNotFound'));
        setError(t('courses.apprenantNotFound'));
        return;
      }
      // 2. Récupérer les recommandations
      const recRes = await fetch(`http://192.168.70.148:5000/recommend/${apprenant._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!recRes.ok) {
        const errorData = await recRes.text();
        console.error(t('course.errorRecommendations'), errorData);
        throw new Error(t('course.errorRecommendations'));
      }
      const data = await recRes.json();

      setModalVisible(true);

      if (!data?.recommendations?.length) {
        setError(t('courses.noRecommendations'));
      } else {
        const cleanedRecommendations = data.recommendations.map((rec, index) => ({
          ...rec,
          _id: rec._id || rec.course_id || rec.id || `temp-id-${index}`
        }));
        setRecommendations(cleanedRecommendations);
        console.log('Recommendations nettoyées:', cleanedRecommendations);
      }
    } catch (e) {
      console.error(t('courses.completeError'), e);
      Alert.alert(
        t('courses.completeError'),
        t('courses.completeErrorMessage')
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.column}>
          {/* Barre de recherche */}
          <View style={styles.searchBar}>
            <TextInput
              placeholder={t('progressionCours.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.input}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch}>
              <AntDesign name="search1" size={24} color="#1B45B4" />
            </TouchableOpacity>
          </View>

          {/* Liste des cours */}
          <View style={styles.whiteSection}>
            {loading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : (
              <ScrollView contentContainerStyle={styles.coursesContainer}>
                {(searchQuery ? filteredCourses : acceptedCourses).map((course) => (
                  <Course
                    key={course._id}
                    course={course}
                  />
                ))}
              </ScrollView>
            )}
          </View>


        </View>
      </ScrollView>

      {/* Modal pour les recommandations */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            width: "90%",
            maxHeight: "80%"
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>{t('course.RecommendedCourses')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {loadingRecommendations ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="large" color="#3f51b5" />
                <Text style={{ marginTop: 10, color: '#666' }}>{t('course.loadingRecommendations')}</Text>
              </View>
            ) : (
              <FlatList
                data={recommendations}
                keyExtractor={(item, index) => {
                  if (item && item._id) {
                    return item._id.toString();
                  }
                  return `recommendation-${index}`;
                }}
                horizontal
                showsHorizontalScrollIndicator={true}
                style={{ marginTop: 20 }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      width: Dimensions.get('window').width * 0.7,
                      marginRight: 16,
                      backgroundColor: "#f4f8fe",
                      borderRadius: 16,
                      padding: 12,
                    }}
                  >
                    <Image
                      source={{ uri: `http://192.168.70.148:4000/Public/Images/${item.image}` }}
                      style={{ width: "100%", height: 120, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    <Text style={{ fontWeight: "bold", fontSize: 16, marginTop: 8 }}>{item.nom}</Text>
                    <Text numberOfLines={2} style={{ color: "#666", fontSize: 13, marginVertical: 4 }}>{item.description}</Text>
                    <Text style={{ color: "#e6913c", fontSize: 12, fontWeight: "bold" }}>{t('course.level')} : {item.level}</Text>
                    <Text style={{ color: "#888", fontSize: 12 }}>{t('course.language')} : {item.languages}</Text>
                    <TouchableOpacity
                      style={styles.btn}
                      onPress={async () => {
                        try {
                          setLoadingRecommendations(true);
                          const token = await AsyncStorage.getItem('userToken');

                          // Vérification du token
                          if (!token) {
                            throw new Error(t('course.tokenNotFound'));
                          }
                          // Vérification de l'ID du cours
                          if (!item._id) {
                            throw new Error(t('course.courseNotFound'));
                          }

                          console.log('Tentative d\'accès au cours:', {
                            courseId: item._id,
                            url: `http://192.168.70.148:4000/course/${item._id}`,
                            token: token.substring(0, 10) + '...' // Log partiel du token pour la sécurité
                          });

                          // Ajout d'un timeout et de retry
                          const response = await axios.get(
                            `http://192.168.70.148:4000/course/${item._id}`,
                            {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              timeout: 10000, // 10 secondes de timeout
                              validateStatus: function (status) {
                                return status >= 200 && status < 500; // Accepter tous les statuts < 500
                              }
                            }
                          );
                          if (response.status === 404) {
                            throw new Error(t('course.courseNotFound'));
                          }
                          if (response.status === 401) {
                            throw new Error(t('course.unauthorized'));
                          }
                          if (response.status === 500) {
                            console.error(t('course.errorServer'), response.data);
                            throw new Error(t('course.errorServer'));
                          }
                          if (response.data) {
                            navigation.navigate('coursecontent', {
                              courseId: item._id,
                              courseData: response.data
                            });
                            setModalVisible(false);
                          } else {
                            throw new Error(t('course.courseNotFound'));
                          }
                        } catch (error) {
                          console.error('Erreur détaillée:', {
                            message: error.message,
                            response: error.response?.data,
                            status: error.response?.status,
                            headers: error.response?.headers
                          });
                          let errorMessage = t('course.errorAccessCourse');
                          if (error.message === 'Token non trouvé') {
                            errorMessage += t('course.pleaseReconnect');
                          } else if (error.message === 'ID du cours non trouvé') {
                            errorMessage += t('course.invalidCourse');
                          } else if (error.message === 'Cours non trouvé') {
                            errorMessage += t('course.courseDoesNotExist');
                          } else if (error.message === 'Non autorisé') {
                            errorMessage += t('course.pleaseReconnect');
                          } else if (error.message === 'Erreur serveur') {
                            errorMessage += t('course.serverError');
                          }
                          Alert.alert(
                            "Erreur",
                            errorMessage,
                            [
                              {
                                text: t('course.retry'),
                                onPress: () => {
                                  // Réessayer la requête
                                  setLoadingRecommendations(false);
                                }
                              },
                              {
                                text: t('course.cancel'),
                                style: "cancel"
                              }
                            ]
                          );
                        } finally {
                          setLoadingRecommendations(false);
                        }
                      }}
                    >
                      <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "bold" }}>
                        {loadingRecommendations ? t('course.loadingRecommendations') : t('course.startCourse')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                removeClippedSubviews={true}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={3}
              />
            )}
          </View>
        </View>
      </Modal>
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
  },
  column: {
    backgroundColor: "#F4F8FE",
    paddingBottom: 21,
  },
  btn: {
    backgroundColor: "#3f51b5",
    marginTop: 10,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 10,
    marginBottom: 26,
    marginTop: 29,
    marginHorizontal: 31,
    shadowColor: "#0000001A",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 12,
    elevation: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    paddingVertical: 6,
  },
  whiteSection: {
    backgroundColor: "#FFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  coursesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});
