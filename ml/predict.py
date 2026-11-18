"""
Inference helper for saved Scikit-learn Random Forest crop recommendation pipeline.
"""

from pathlib import Path
import joblib
import pandas as pd
from preprocessing import FEATURE_COLUMNS


def predict_top_crops(n: float, p: float, k: float, temperature: float, humidity: float, ph: float, rainfall: float, top_k: int = 3):
    model_path = Path(__file__).resolve().parent / "models" / "random_forest_pipeline.joblib"
    pipeline = joblib.load(model_path)
    row = pd.DataFrame([[n, p, k, temperature, humidity, ph, rainfall]], columns=FEATURE_COLUMNS)
    probs = pipeline.predict_proba(row)[0]
    classes = pipeline.classes_
    ranked = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
    return [{"crop_slug": c, "probability": round(float(prob), 4)} for c, prob in ranked[:top_k]]
