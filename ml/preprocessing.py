"""
Data preprocessing pipeline for Global Smart Crop Recommendation System.
Loads verified crop-climate-soil training data, handles missing values,
and performs a leak-free stratified 80/20 train-test split.
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COLUMN = "crop_slug"


def load_and_split_dataset(csv_path: str, test_size: float = 0.2, random_state: int = 42):
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=[TARGET_COLUMN])
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    return X_train, X_test, y_train, y_test


def build_numeric_preprocessor() -> Pipeline:
    return Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
