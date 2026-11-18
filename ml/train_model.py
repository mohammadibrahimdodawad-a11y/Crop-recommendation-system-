"""
Train a Random Forest Classifier for crop recommendation using Scikit-learn.
Saves both the trained pipeline and reproducible evaluation report.
"""

import json
from pathlib import Path
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from preprocessing import load_and_split_dataset, build_numeric_preprocessor

MODEL_VERSION = "RF-Agronomy-Hybrid-v1.0.0"
DATASET_VERSION = "FAO-ICAR-Benchmark-2026.1"


def main():
    root = Path(__file__).resolve().parent.parent
    csv_path = root / "data" / "processed" / "crop_training_dataset.csv"
    models_dir = Path(__file__).resolve().parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    X_train, X_test, y_train, y_test = load_and_split_dataset(str(csv_path))

    pipeline = Pipeline(
        steps=[
            ("preprocessor", build_numeric_preprocessor()),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=100,
                    max_depth=12,
                    random_state=42,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
    labels = sorted(y_test.unique().tolist())
    cm = confusion_matrix(y_test, y_pred, labels=labels).tolist()

    joblib.dump(pipeline, models_dir / "random_forest_pipeline.joblib")

    report = {
        "model_version": MODEL_VERSION,
        "dataset_version": DATASET_VERSION,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "accuracy": round(acc, 4),
        "macro_precision": round(float(prec), 4),
        "macro_recall": round(float(rec), 4),
        "macro_f1": round(float(f1), 4),
        "labels": labels,
        "confusion_matrix": cm,
    }
    (models_dir / "sklearn_evaluation_report.json").write_text(json.dumps(report, indent=2))
    print(f"Trained {MODEL_VERSION} | Test Accuracy: {acc:.4f} | Macro F1: {f1:.4f}")


if __name__ == "__main__":
    main()
