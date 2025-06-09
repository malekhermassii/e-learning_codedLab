from bson import ObjectId
from pymongo import MongoClient
import pandas as pd

class MongoDBService:
    def __init__(self):
        #connexion à la base de données
        self.client = MongoClient("mongodb+srv://maleekhermassii:mcsxTp9Svo5zrtUU@cluster0.ie2ke8k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
        self.db = self.client["lms"]
    def fetch_courses(self):
        #récupérer les cours depuis la base de données
        """Récupère les cours depuis MongoDB"""
        courses = list(self.db.courses.find(
            {},
            {
                "_id": 1,
                "nom": 1,
                "description": 1,
                "level": 1,
                "Language": 1,
                "categorical": 1,
                "image": 1,
            }
        ))
        
        for course in courses:
            course["course_id"] = str(course.pop("_id"))
            course["languages"] = course.pop("Language", "english")
            course["category"] = course.get("categorical", [])
            course["nom"] = course.get("nom", "username")
            course["description"] = course.get("description", "desccourse")
            course["level"] = course.get("level", "beginner")
            course["image"] = course.get("image")

        return pd.DataFrame(courses)

    def fetch_enrollments(self):
        #récupérer les inscriptions depuis la base de données
        """Récupère les inscriptions depuis MongoDB"""
        enrollments = list(self.db.enrollments.find({}))
        processed = []
        for en in enrollments:
            if 'apprenantId' not in en or 'courseId' not in en:
                continue
            processed.append({
                "apprenant_id": str(en['apprenantId']),
                "course_id": str(en['courseId'])
            })
        return pd.DataFrame(processed)

    def get_apprenant_courses(self, apprenant_id):
        #récupérer les cours suivis par un apprenant
        """Récupère les cours suivis par un apprenant"""
        enrollments_df = self.fetch_enrollments()
        return enrollments_df[enrollments_df['apprenant_id'] == apprenant_id]['course_id'].tolist()

    def get_course_details(self, course_id, courses_df):
        #récupérer les détails d'un cours
        """Récupère les détails d'un cours"""
        course = courses_df[courses_df['course_id'] == course_id]
        if len(course) == 0:
            return None
        return course.iloc[0].to_dict()


