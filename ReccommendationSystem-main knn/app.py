from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/recommend/<apprenant_id>', methods=['GET'])
def get_recommendations(apprenant_id):
    # TODO: Implémenter la logique de recommandation
    return jsonify({
        "recommendations": []
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 



    