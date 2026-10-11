# NaturalLanguageProcessing
# Emotion Detection — React + Flask

A minimal white-and-lavender UI connected to a Flask API using the notebook's TF-IDF + Logistic Regression approach.

## Notebook facts
- Dataset columns: `text`, `emotion`
- Dataset size shown in notebook: 16,000 rows
- Train/test split: 80/20, `random_state=42`
- Best reported result: TF-IDF + Logistic Regression, accuracy `0.8628125` (86.28%)
- Other notebook results: CountVectorizer + MultinomialNB `0.768125`; TF-IDF + MultinomialNB `0.6609375`

## 1. Add the dataset
The notebook loads `/content/train.txt` as a semicolon-separated file with no header. Put the same `train.txt` file here:

`backend/data/train.txt`

Expected format (one row per line):
`text;emotion`

Do not create a replacement dataset if you want results consistent with the notebook.

## 2. Start the Flask API
Open a terminal in the project folder:

```bash
cd backend
python -m venv .venv
```

Activate it:
- Windows PowerShell: `.venv\\Scripts\\Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

Install dependencies and train/save the model:

```bash
pip install -r requirements.txt
python train_model.py
python app.py
```

The API runs at `http://127.0.0.1:5000`.

The training script follows the notebook's preprocessing steps (lowercase, remove punctuation, digits and non-ASCII characters, then remove English stopwords), uses the same 80/20 split and random seed, fits TF-IDF + Logistic Regression, and saves the fitted vectorizer, classifier and original label mapping to `backend/artifacts/`.

## 3. Start React
Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

## API
- `GET /api/health` — checks whether model artifacts are available
- `GET /api/emotions` — lists labels found in the supplied dataset
- `POST /api/predict` — JSON body: `{ "text": "I feel wonderful today" }`

The prediction endpoint returns the predicted emotion and model probability when available. Probability is a model score, not a calibrated measure of certainty.

## Notes
- The notebook does not print the full label list in its saved outputs. The training script obtains the labels directly from the supplied dataset in the same first-seen order as the notebook (`df['emotion'].unique()`).
- The training script writes the measured test accuracy into the saved metadata. It does not assume the reported accuracy will be identical if the dataset differs.
