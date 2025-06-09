import torch
from transformers import AutoTokenizer, AutoModel
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import joblib
from tqdm import tqdm

class HuggingFaceRecommender:
    # initialisation du recommandateur avec un modèle de Hugging Face
    def __init__(self, model_name="sentence-transformers/all-MiniLM-L6-v2"):
        """
        Initialise le recommandateur avec un modèle de Hugging Face
        
        Args:
            model_name: Nom du modèle à utiliser (par défaut: all-MiniLM-L6-v2)
        """
        #initialisation du device   (cpu ou gpu)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        #initialisation du tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        #initialisation du modèle
        self.model = AutoModel.from_pretrained(model_name).to(self.device)
        #initialisation des embeddings des cours
        self.course_embeddings = None
        #initialisation des données des cours
        self.course_df = None
        #initialisation de l'entraînement du modèle
        self.is_trained = False
        
    # appel de la fonction générer les embeddings pour une liste de textes
    def _get_embeddings(self, texts):
        """
        Génère les embeddings pour une liste de textes
        
        Args:
            texts: Liste de textes à encoder
            
        Returns:
            numpy array des embeddings
        """
        # Tokenization
        encoded_input = self.tokenizer(
            texts,
            padding=True, #ajouter des zéros pour que les textes soient de la même longueur     
            truncation=True, #couper les textes si elles sont trop longues
            max_length=128, #limiter la longueur des textes à 128 tokens
            return_tensors='pt' #retourner les embeddings sous forme de tenseurs
        ).to(self.device)
        
        # Génération des embeddings
        with torch.no_grad():
            model_output = self.model(**encoded_input)
            # Utiliser la moyenne des embeddings de la dernière couche
            embeddings = model_output.last_hidden_state.mean(dim=1)
            
        return embeddings.cpu().numpy()
    
    # appel de la fonction entraîner le modèle sur les données des cours
    def fit(self, course_data):
        """
        Entraîne le modèle sur les données des cours
        
        Args:
            course_data: DataFrame contenant les informations des cours
        """
        self.course_df = course_data.copy()#copie des données des cours
        
        # Préparation des textes pour l'embedding
        print("Préparation des textes...")
        combined_texts = self.course_df.apply(
            lambda row: f"{row['description']} {row['nom']} {row['level']} {' '.join(row['category'])}",
            axis=1
        ).tolist()
        
        # Génération des embeddings
        print("Génération des embeddings...")
        self.course_embeddings = self._get_embeddings(combined_texts)
        self.is_trained = True
        print("Modèle entraîné avec succès!")
        
    # appel de la fonction générer des recommandations pour un utilisateur
    def recommend(self, user_enrolled_ids, top_n=5):
        """
        Génère des recommandations pour un utilisateur
        
        Args:
            user_enrolled_ids: Liste des IDs des cours suivis par l'utilisateur
            top_n: Nombre de recommandations à générer
            
        Returns:
            Liste des IDs des cours recommandés
        """
        # vérifier si le modèle est entraîné et si l'utilisateur a suivi des cours
        if not self.is_trained or not user_enrolled_ids:
            return []
            
        # Trouver les indices des cours suivis
        mask = self.course_df['course_id'].isin([str(cid) for cid in user_enrolled_ids])
        if not mask.any():
            return []
            
        # Calculer le vecteur utilisateur (moyenne des embeddings des cours suivis)
        user_embedding = np.mean(self.course_embeddings[mask], axis=0)
        
        # Calculer les similarités avec tous les cours
        similarities = cosine_similarity(
            user_embedding.reshape(1, -1),
            self.course_embeddings
        )[0]
        
        # Exclure les cours déjà suivis
        similarities[mask] = -1
        
        # Obtenir les indices des top_n cours les plus similaires
        top_indices = np.argsort(-similarities)[:top_n]
        
        # Retourner les IDs des cours recommandés
        return self.course_df.iloc[top_indices]['course_id'].tolist()
        
    # appel de la fonction trouver des cours similaires à un cours donné
    def get_similar_courses(self, course_id, top_n=5):
        """
        Trouve les cours similaires à un cours donné
        
        Args:
            course_id: ID du cours de référence
            top_n: Nombre de cours similaires à trouver
            
        Returns:
            Liste des IDs des cours similaires
        """
        if not self.is_trained:
            return []
            
        # Trouver l'index du cours
        course_idx = self.course_df[self.course_df['course_id'] == str(course_id)].index
        if len(course_idx) == 0:
            return []
            
        course_idx = course_idx[0]
        
        # Calculer les similarités
        similarities = cosine_similarity(
            self.course_embeddings[course_idx].reshape(1, -1),
            self.course_embeddings
        )[0]
        
        # Exclure le cours de référence
        similarities[course_idx] = -1
        
        # Obtenir les indices des top_n cours les plus similaires
        top_indices = np.argsort(-similarities)[:top_n]
        
        return self.course_df.iloc[top_indices]['course_id'].tolist()
        
    # appel de la fonction sauvegarder le modèle
    def save_model(self, path):
        """Sauvegarde le modèle et les embeddings"""
        model_data = {
            'course_embeddings': self.course_embeddings,
            'course_df': self.course_df
        }
        joblib.dump(model_data, path)
        
    # appel de la fonction charger le modèle
    def load_model(self, path):
        """Charge le modèle et les embeddings"""
        model_data = joblib.load(path)
        self.course_embeddings = model_data['course_embeddings']
        self.course_df = model_data['course_df']
        self.is_trained = True 