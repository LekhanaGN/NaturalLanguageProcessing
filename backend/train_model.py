from pathlib import Path
import json
import string
import joblib
import nltk
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "train.txt"
ARTIFACT_DIR = BASE_DIR / "artifacts"

def ensure_nltk():
    # The notebook uses NLTK's English stopwords. Download only if absent.
    try:
        from nltk.corpus import stopwords
        stopwords.words("english")
    except LookupError:
        nltk.download("stopwords", quiet=False)

def preprocess_text(text, stop_words):
    text = str(text).lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = "".join(ch for ch in text if not ch.isdigit())
    text = "".join(ch for ch in text if ch.isascii())
    return " ".join(word for word in text.split() if word not in stop_words)

def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}\n"
            "Place the same semicolon-separated train.txt used by the notebook at backend/data/train.txt."
        )

    ensure_nltk()
    from nltk.corpus import stopwords
    stop_words = set(stopwords.words("english"))

    # Same column names and delimiter as the notebook.
    df = pd.read_csv(DATA_PATH, sep=";", header=None, names=["text", "emotion"])
    df = df.dropna(subset=["text", "emotion"]).copy()
    if df.empty:
        raise ValueError("Dataset has no usable rows. Expected rows in the format: text;emotion")

    # Preserve the notebook's first-seen emotion order before encoding.
    labels = df["emotion"].astype(str).unique().tolist()
    label_to_id = {label: idx for idx, label in enumerate(labels)}
    df["emotion"] = df["emotion"].astype(str).map(label_to_id)
    df["text"] = df["text"].apply(lambda text: preprocess_text(text, stop_words))

    X_train, X_test, y_train, y_test = train_test_split(
        df["text"], df["emotion"], test_size=0.20, random_state=42
    )

    vectorizer = TfidfVectorizer()
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train_tfidf, y_train)
    predictions = model.predict(X_test_tfidf)
    accuracy = float(accuracy_score(y_test, predictions))

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACT_DIR / "emotion_model.joblib")
    joblib.dump(vectorizer, ARTIFACT_DIR / "tfidf_vectorizer.joblib")
    joblib.dump(labels, ARTIFACT_DIR / "labels.joblib")
    metadata = {
        "dataset_rows": int(len(df)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "test_accuracy": accuracy,
        "labels_in_notebook_order": labels,
        "model": "LogisticRegression(max_iter=1000)",
        "features": "TfidfVectorizer()",
        "split": {"test_size": 0.2, "random_state": 42},
    }
    (ARTIFACT_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Rows: {len(df)} | train: {len(X_train)} | test: {len(X_test)}")
    print(f"Emotion labels (same first-seen order as notebook): {labels}")
    print(f"Test accuracy on supplied dataset: {accuracy:.4%}")
    print("\nClassification report:")
    print(classification_report(y_test, predictions, target_names=labels, zero_division=0))
    print(f"\nSaved model artifacts to: {ARTIFACT_DIR}")

if __name__ == "__main__":
    main()
