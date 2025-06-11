import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';

const Course = ({ course }) => {
  const navigation = useNavigation();
  const { t , i18n } = useTranslation();
  const currentLanguage = i18n.language;

  // Check that the course exists and contains the necessary data
  if (!course) {
    return null;
  }
// Gérer la pression sur la carte
  const handlePress = () => {
    navigation.navigate('coursecontent', { courseId: course._id });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
    >
      <Image
        source={
          course?.image
            ? { uri: `http://192.168.70.148:4000/Public/Images/${course.image}` }
            : require("../assets/prof.png")
        }
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {currentLanguage === 'ar' ? course?.nom_ar : course?.nom}
        </Text>
        <Text style={styles.cardcat} numberOfLines={1}>
          {currentLanguage === 'ar' ? course?.categorieId?.titre_ar : course?.categorieId?.titre}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {currentLanguage === 'ar' ? course?.description_ar : course?.description}
        </Text>
        <View style={styles.courseInfoContainer}>
          <View style={styles.infoItem}>
            <Icon
              name="play-circle-outline"
              size={18}
              color="#777"
              style={styles.infoicon}
            />
            <Text style={styles.infoText}>
              {course?.modules?.length || 0} {t('course.modules')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon
              name="people"
              size={18}
              color="#777"
              style={styles.infoicon}
            />
            <Text style={styles.infoText}>
              {course?.enrolledCount || 0} {t('course.students')}
            </Text>
          </View>
        </View>
        <View style={styles.buttonRatingContainer}>
          <TouchableOpacity style={styles.startButton}>
            <Text style={styles.buttonText} onPress={() => navigation.navigate("Subscribe")}>
              {t('course.startCourse')}
            </Text>
            <Icon name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{course?.averageRating?.toFixed(1) || "0.0"}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
    alignSelf: "center",
  },
  cardImage: {
    width: "100%",
    height: 150,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#14348A",
    marginBottom: 5,
  },
  cardcat: {
    fontSize: 12,
    fontWeight: "400",
    color: "#FF991F",
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
    color: "#68718B",
    marginBottom: 10,
  },
  courseInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#777",
    marginLeft: 5,
  },
  infoicon: {
    marginRight: 3,
  },
  buttonRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#3f51b5",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#14348A",
    marginLeft: 5,
  },
});

export default Course;
