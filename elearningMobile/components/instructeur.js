import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Import d'icônes pour améliorer l'affichage
import { getCourseById } from "../api";
const Instructor = ({course}) => {
    const [professor, setprofessor] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchCourseDetails = async () => {
        try {
          console.log("Fetching course details for ID:", course._id);
          const courseDetails = await getCourseById(course._id); //récupérer tous les détails du cours
          console.log(
            "Course details received:",
            JSON.stringify(courseDetails, null, 2)
          );
          if (courseDetails && courseDetails.professeurId) {
            setprofessor(courseDetails.professeurId); //stocke l’objet professeur dans le state professor
          }
        } catch (err) {
          console.error(t('overview.errorFetchingCourseDetails'), err);
          setError(t('overview.errorFetchingCourseDetails'));
        } finally {
          setLoading(false);
        }
      };
  
      if (course && course._id) {
        fetchCourseDetails();
      }
    }, [course]);
  // Liste des éléments à afficher
  const courseDetails = [
    "Unlimited access",
    "Certificate of completion",
    "32 Modules",
    "Lifetime updates",
    "Expert instructor",
  ];
 if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement des informations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
    >
      <View style={styles.container}>
        {/* Section Instructor */}
        <Text style={styles.instructor}>Instructor</Text>
        <View style={styles.blocInstructor}>
        <Image
                    source={
                      professor?.image
                        ? {
                            uri: `http://192.168.70.148:4000/images/${professor.image}`,
                          }
                        : require("../assets/prof.png")
                    }
                    resizeMode="cover"
                    style={styles.instructorImage}
                  />
          <View>
            <Text style={styles.instructorTitle}>  {professor?.name || "Nom non disponible"}</Text>
            <Text style={styles.speciality}> {professor?.specialite || "Aucune spécialité disponible"}</Text>
          </View>
        </View>
        <View style={styles.separator}></View>

        {/* Section Description */}
        <Text style={styles.instructor}> {professor?.description || "Aucune spécialité disponible"}</Text>
        <Text style={styles.profdesc}>
          This is a detailed description of the course. It covers all the
          important topics.
        </Text>
     

       
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    marginBottom: 70, 
  },
  scrollViewContent: {
    flexGrow: 1, 
    paddingBottom: 20,
  },
  container: {
    backgroundColor: "#fff",
    padding: 16,
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 20,
  },
  instructor: {
    color: "#202244",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
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
    fontWeight: "400",
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
  profdesc: {
    fontSize: 14,
    color: "#68718B",
    marginBottom: 20,
    lineHeight: 20,
  },
  courseDetails: {
    marginTop: 10,
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  courseText: {
    fontSize: 14,
    color: "#545454",
    marginLeft: 8,
  },
});

export default Instructor;
