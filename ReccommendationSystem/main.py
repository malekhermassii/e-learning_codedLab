from flask import Flask, jsonify, request
from flask_cors import CORS
from data_service import DataService
import os

app = Flask(__name__)
CORS(app)

# Initialisation du service de données
data_service = DataService()

# route pour vérifier l'état du service
@app.route('/')
def health_check():
    """Vérifie l'état du service"""
    return jsonify({
        "status": "active",
        "message": "Service de recommandation opérationnel",
        "version": "1.0.0"
    })

# route pour obtenir les recommandations pour un apprenant
@app.route('/recommend/<apprenant_id>', methods=['GET'])
def get_recommendations(apprenant_id):
    """Obtient les recommandations pour un apprenant"""
    try:
        print(f"Reçu demande de recommandation pour apprenant_id: {apprenant_id}")
        
        # Obtenir les recommandations
        recommendations = data_service.get_recommendations(apprenant_id)
        
        response_data = {
            "apprenant_id": apprenant_id,
            "recommendations": recommendations,
            "is_default": len(recommendations) == 0
        }
        
        print(f"Envoi de {len(recommendations)} recommandations")
        return jsonify(response_data)

    except Exception as e:
        print(f"Erreur dans get_recommendations: {str(e)}")
        return jsonify({"error": str(e)}), 500

# route pour obtenir les cours similaires à un cours donné
@app.route('/similar/<course_id>', methods=['GET'])
def get_similar_courses(course_id):
    """Obtient les cours similaires à un cours donné"""
    try:
        top_n = request.args.get('top_n', default=5, type=int)
        similar_courses = data_service.get_similar_courses(course_id, top_n=top_n)
        
        if not similar_courses:
            return jsonify({"error": "Cours non trouvé"}), 404
            
        return jsonify(similar_courses)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# route pour rafraîchir le modèle   
@app.route('/refresh', methods=['POST'])
def refresh_model():
    """Force le rafraîchissement du modèle"""
    try:
        data_service = DataService()  # Réinitialise le service
        return jsonify({"status": "success", "message": "Modèle rafraîchi avec succès"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# route pour exécuter l'application
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)