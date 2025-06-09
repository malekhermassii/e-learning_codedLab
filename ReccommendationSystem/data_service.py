from data import MongoDBService
from huggingface_recommender import HuggingFaceRecommender

class DataService:
    #initialisation des données et du modèle
    def __init__(self):
        self.db_service = MongoDBService()#initialisation de la base de données
        self.recommender = HuggingFaceRecommender()#initialisation du modèle
        self.courses_df = None#initialisation des données des cours
        self._initialize_data()#initialisation des données et du modèle

    #initialisation des données et du modèle
    def _initialize_data(self):
        """Initialise les données et le modèle"""
        print("Chargement des données depuis MongoDB...")
        self.courses_df = self.db_service.fetch_courses()#récupérer les cours depuis la base de données
        print(f"Nombre total de cours chargés: {len(self.courses_df)}")#afficher le nombre de cours chargés
        
        print("\nInitialisation du modèle Hugging Face...")
        self.recommender.fit(self.courses_df)#entraîner le modèle sur les données des cours
        print(self.courses_df)
        print("Modèle chargé avec succès!")

    # appel de la fonction récupérer les cours suivis par un apprenant
    def get_apprenant_courses(self, apprenant_id):
        """Récupère les cours suivis par un apprenant"""
        return self.db_service.get_apprenant_courses(apprenant_id)
        

    # appel de la fonction récupérer les détails d'un cours
    def get_course_details(self, course_id):
        """Récupère les détails d'un cours"""
        return self.db_service.get_course_details(course_id, self.courses_df)

    # appel de la fonction générer des recommandations pour un apprenant
    def get_recommendations(self, apprenant_id, top_n=5):
        """Génère des recommandations pour un apprenant"""
        enrolled_courses = self.get_apprenant_courses(apprenant_id)
        if not enrolled_courses:
            return []
        
        # appel de la fonction générer des recommandations pour un apprenant
        recommended_course_ids = self.recommender.recommend(enrolled_courses, top_n=top_n)
        recommendations = []
        
        # parcours des cours recommandés
        for course_id in recommended_course_ids:
            course = self.get_course_details(course_id)
            if course:
                recommendations.append({
                    'course_id': course['course_id'],
                    'nom': course['nom'],
                    'description': course['description'],
                    'level': course['level'],
                    'categories': course['category'],
                    'languages': course.get('languages', 'N/A'),
                    'image': course.get('image')
                })
        
        return recommendations

    # appel de la fonction trouver des cours similaires à un cours donné
    def get_similar_courses(self, course_id, top_n=5):
        """Trouve des cours similaires à un cours donné"""
        if not any(self.courses_df['course_id'] == course_id):
            return []
        
        similar_course_ids = self.recommender.get_similar_courses(course_id, top_n=top_n)
        similar_courses = []
        
        for similar_id in similar_course_ids:
            course = self.get_course_details(similar_id)
            if course:
                similar_courses.append({
                    'course_id': course['course_id'],
                    'nom': course['nom'],
                    'description': course['description'],
                    'level': course['level'],
                    'categories': course['category'],
                    'languages': course.get('languages', 'N/A'),
                    'image': course.get('image')
                })
        
        return similar_courses

    # appel de la fonction sauvegarder le modèle
    def save_model(self, path):
        """Sauvegarde le modèle"""
        self.recommender.save_model(path)

    # appel de la fonction charger le modèle
    def load_model(self, path):
        """Charge le modèle"""
        self.recommender.load_model(path) 