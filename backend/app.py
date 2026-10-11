from pathlib import Path
import joblib
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "artifacts"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

def load_artifacts():
    model_path = ARTIFACT_DIR / "emotion_model.joblib"
    vectorizer_path = ARTIFACT_DIR / "tfidf_vectorizer.joblib"
    labels_path = ARTIFACT_DIR / "labels.joblib"
    if not (model_path.exists() and vectorizer_path.exists() and labels_path.exists()):
        return None
    return {
        "model": joblib.load(model_path),
        "vectorizer": joblib.load(vectorizer_path),
        "labels": joblib.load(labels_path),
    }

def preprocess(text):
    # Mirrors the notebook's text cleanup sequence.
    import string
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = "".join(ch for ch in text if not ch.isdigit())
    text = "".join(ch for ch in text if ch.isascii())
    # Use the same NLTK English stopword list as the notebook.
    from nltk.corpus import stopwords
    stop_words = set(stopwords.words("english"))
    return " ".join(word for word in text.split() if word not in stop_words)

@app.get("/api/health")
def health():
    artifacts = load_artifacts()
    return jsonify({
        "status": "ok",
        "model_ready": artifacts is not None,
        "message": "Model loaded" if artifacts else "Model not trained yet. Run python train_model.py in backend."
    })

@app.get("/api/emotions")
def emotions():
    artifacts = load_artifacts()
    if not artifacts:
        return jsonify({"error": "Model not trained yet. Run python train_model.py in backend."}), 503
    return jsonify({"emotions": artifacts["labels"]})

@app.post("/api/predict")
def predict():
    body = request.get_json(silent=True) or {}
    text = body.get("text", "")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "Please enter a sentence to analyze."}), 400
    if len(text) > 5000:
        return jsonify({"error": "Please keep the text under 5,000 characters."}), 400

    artifacts = load_artifacts()
    if not artifacts:
        return jsonify({"error": "Model not trained yet. Add backend/data/train.txt and run python train_model.py."}), 503

    cleaned = preprocess(text)
    features = artifacts["vectorizer"].transform([cleaned])
    model = artifacts["model"]
    pred_id = int(model.predict(features)[0])
    labels = artifacts["labels"]
    predicted_label = labels[pred_id] if pred_id < len(labels) else str(pred_id)

    scores = {}
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(features)[0]
        for class_id, probability in zip(model.classes_, probs):
            idx = int(class_id)
            label = labels[idx] if idx < len(labels) else str(idx)
            scores[label] = round(float(probability), 4)
    sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)

    return jsonify({
        "text": text,
        "cleaned_text": cleaned,
        "emotion": predicted_label,
        "score": scores.get(predicted_label),
        "scores": [{"emotion": name, "score": score} for name, score in sorted_scores],
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
