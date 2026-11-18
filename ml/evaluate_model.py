"""
Evaluate saved Scikit-learn Random Forest model on held-out test split.
"""

import json
from pathlib import Path
import joblib
from sklearn.metrics import classification_report
from preprocessing import load_and_split_dataset


def main():
    root = Path(__file__).resolve().parent.parent
    csv_path = root / "data" / "processed" / "crop_training_dataset.csv"
    model_path = Path(__file__).resolve().parent / "models" / "random_forest_pipeline.joblib"

    if not model_path.exists():
        raise FileNotFoundError("Model not found. Run ml/train_model.py first.")

    _, X_test, _, y_test = load_and_split_dataset(str(csv_path))
    pipeline = joblib.load(model_path)
    y_pred = pipeline.predict(X_test)
    print(classification_report(y_test, y_pred, digits=4))


if __name__ == "__main__":
    main()
