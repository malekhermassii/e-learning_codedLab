import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getCourseById } from "../api";
import { useTranslation } from 'react-i18next';

const Overview = ({ course }) => {
  const [professor, setprofessor] = useState([]);
  const { t , i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const [isLoading, setIsLoading] = useState(false);  

  //récupérer les détails du cours
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setIsLoading(true); 
        const courseDetails = await getCourseById(course._id); //récupérer tous les détails du cours
        if (courseDetails && courseDetails.professeurId) {
          setprofessor(courseDetails.professeurId); //stocke l'objet professeur dans le state professor
          setIsLoading(false);
        }
      } catch (err) {
        console.error(t('overview.errorFetchingCourseDetails'), err);
        setIsLoading(false);
      } 
    };
    if (course && course._id) {
      fetchCourseDetails();
    }
  }, [course]);

  const totalVideos =
    course?.modules?.reduce((total, module) => {
      return total + (module.videos?.length || 0);
    }, 0) || 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3949AB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Instructor Section */}
      <Text style={styles.courseTitle}>{t('overview.instructor')}</Text>
      <View style={styles.blocInstructor}>
        <Image
          source={
            professor?.image
              ? {
                  uri: `http://192.168.70.148:4000/Public/Images/${professor.image}`,
                }
              : require("../assets/prof.png")
          }
          resizeMode="cover"
          style={styles.instructorImage}
        />
        <View>
          <Text style={styles.instructorTitle}>
            {currentLanguage === 'ar' ? professor?.name_ar : professor?.name}
          </Text>
          <Text style={styles.speciality}>
            {currentLanguage === 'ar' ? professor?.specialite_ar : professor?.specialite}
          </Text>
        </View>
      </View>

      <View style={styles.separator}></View>

      {/* Course Included */}
      <Text style={styles.courseTitle}>{t('overview.courseIncluded')}</Text>
      <View style={styles.courseDetails}>
        <View style={styles.courseItemContainer}>
          <Ionicons name="infinite" size={20} color="#6A36FF" />
          <Text style={styles.courseItem}>{t('overview.unlimitedAccess')}</Text>
        </View>
        <View style={styles.courseItemContainer}>
          <MaterialIcons name="verified" size={20} color="#6A36FF" />
          <Text style={styles.courseItem}>{t('overview.certificate')}</Text>
        </View>
        <View style={styles.courseItemContainer}>
          <Ionicons name="videocam" size={20} color="#6A36FF" />
          <Text style={styles.courseItem}>
            {t('overview.totalVideos')}: {totalVideos}
          </Text>
        </View>
      </View>

      <View style={styles.separator}></View>

      {/* By Numbers */}
      <Text style={styles.courseTitle}>{t('overview.byNumbers')}</Text>
      <View style={styles.courseDetails}>
        <View style={styles.courseItemContainer}>
          <Ionicons name="stats-chart" size={20} color="#6A36FF" />
          <Text style={styles.courseItem}>
            {t('overview.level')}: {course.level || t('overview.notSpecified')}
          </Text>
        </View>
        <View style={styles.courseItemContainer}>
          <Ionicons name="people" size={20} color="#6A36FF" />
          <Text style={styles.courseItem}>
            {t('overview.enrolledStudents')}: {course.enrolledCount || "0"}
          </Text>
        </View>
        <View style={styles.courseItemContainer}>
          <Ionicons name="language" size={20} color="#6A36FF" />
          <Text style={styles.courseItem}>
            {t('overview.language')}: {course.languages || t('overview.notSpecified')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom:-60,
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 20,
  },
  instructorTitle: {
    color: "#202244",
    fontSize: 17,
    fontWeight: "bold",
    paddingLeft: 20,
  },
  speciality: {
    color: "#545454",
    fontSize: 13,
    fontWeight: "300",
    paddingLeft: 20,
  },
  blocInstructor: {
    flexDirection: "row",
    alignItems: "center",
  },
  instructorImage: {
    width: 80,
    height: 80,
    marginTop: 7,
    marginLeft: 5,
    borderRadius: 40,
  },
  courseTitle: {
    color: "#202244",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },
  courseDetails: {
    paddingLeft: 10,
  },
  courseItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  courseItem: {
    color: "#545454",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
  },
  loadingText: {
    color: "#202244",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});

export default Overview;
