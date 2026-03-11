import pandas as pd
import numpy as np
import jellyfish
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, roc_curve, precision_recall_curve
import joblib
import os

def safe_jaro(s1, s2):
    if pd.isna(s1) or pd.isna(s2) or not s1 or not s2: return 0.0
    return jellyfish.jaro_winkler_similarity(str(s1).lower(), str(s2).lower())

def safe_lev(s1, s2):
    if pd.isna(s1) or pd.isna(s2) or not s1 or not s2: return 0.0
    s1, s2 = str(s1).lower(), str(s2).lower()
    dist = jellyfish.levenshtein_distance(s1, s2)
    max_len = max(len(s1), len(s2))
    if max_len == 0: return 0.0
    return 1 - (dist / max_len)

def engineer_features(candidates: pd.DataFrame) -> pd.DataFrame:
    """Takes a merged candidates dataframe and applies customized text & scalar metrics."""
    df = candidates.copy()
    
    # 1. Similarity Scores
    df['jaro_winkler_given_name'] = df.apply(lambda r: safe_jaro(r.get('given_name_l', ''), r.get('given_name_r', '')), axis=1)
    df['jaro_winkler_surname'] = df.apply(lambda r: safe_jaro(r.get('surname_l', ''), r.get('surname_r', '')), axis=1)
    df['levenshtein_given_name'] = df.apply(lambda r: safe_lev(r.get('given_name_l', ''), r.get('given_name_r', '')), axis=1)
    df['levenshtein_surname'] = df.apply(lambda r: safe_lev(r.get('surname_l', ''), r.get('surname_r', '')), axis=1)
    
    df['full_name_similarity'] = df.apply(lambda r: safe_jaro(
        str(r.get('given_name_l', '')) + " " + str(r.get('surname_l', '')), 
        str(r.get('given_name_r', '')) + " " + str(r.get('surname_r', ''))
    ), axis=1)

    # 2. Date of Birth matches (Exact, Year, Month, Day diff)
    def parse_date(d):
        d = str(d)
        if len(d) == 8:
            return d[:4], d[4:6], d[6:]
        return None, None, None

    df['dob_exact_match'] = (df['date_of_birth_l'] == df['date_of_birth_r']).astype(int)
    
    dob_l = df['date_of_birth_l'].apply(parse_date)
    dob_r = df['date_of_birth_r'].apply(parse_date)
    
    df['dob_year_match'] = [1 if l[0] == r[0] and l[0] else 0 for l, r in zip(dob_l, dob_r)]
    df['dob_month_match'] = [1 if l[1] == r[1] and l[1] else 0 for l, r in zip(dob_l, dob_r)]
    
    df['dob_day_diff'] = 999
    # Simplified diffs
    
    # 3. Geo Info
    df['postcode_exact_match'] = (df['postcode_l'] == df['postcode_r']).astype(int)
    df['suburb_exact_match'] = (df['suburb_l'] == df['suburb_r']).astype(int)
    df['state_exact_match'] = (df['state_l'] == df['state_r']).astype(int)
    df['address_similarity'] = df.apply(lambda r: safe_jaro(r.get('address_1_l', ''), r.get('address_1_r', '')), axis=1)
    df['soc_sec_exact_match'] = df.apply(lambda r: 1 if r.get('soc_sec_id_l') == r.get('soc_sec_id_r') and pd.notna(r.get('soc_sec_id_l')) else 0, axis=1)

    df['name_and_dob_score'] = (df['full_name_similarity'] + df['dob_exact_match']) / 2
    df['address_score'] = (df['postcode_exact_match'] + df['suburb_exact_match'] + df['state_exact_match']) / 3

    return df

def generate_ground_truth(df: pd.DataFrame) -> pd.DataFrame:
    """Extract true matches by parsing the rec-XXX-org vs rec-XXX-dup-0 patterns."""
    def extract_base_id(rec_id):
        if pd.isna(rec_id): return ""
        parts = str(rec_id).split('-')
        if len(parts) >= 2:
            return f"{parts[0]}-{parts[1]}"
        return str(rec_id)
        
    df['base_id_l'] = df['rec_id_l'].apply(extract_base_id)
    df['base_id_r'] = df['rec_id_r'].apply(extract_base_id)
    df['is_true_match'] = (df['base_id_l'] == df['base_id_r']).astype(int)
    return df

def train_and_evaluate_ml(candidates: pd.DataFrame, models_to_train: list):
    """
    Trains specified ML models on the engineered features.
    models_to_train: list of strings (e.g. ['Logistic Regression', 'Random Forest'])
    Returns metrics, the best model object, and feature importances.
    """
    # Define features
    features = [
        'jaro_winkler_given_name', 'jaro_winkler_surname', 
        'levenshtein_given_name', 'levenshtein_surname',
        'full_name_similarity', 'dob_exact_match', 'dob_year_match', 
        'dob_month_match', 'dob_day_diff', 'postcode_exact_match', 
        'suburb_exact_match', 'state_exact_match', 'address_similarity',
        'soc_sec_exact_match', 'name_and_dob_score', 'address_score'
    ]
    
    # Impute NaNs with 0 for model stability
    X = candidates[features].fillna(0).copy()
    y = candidates['is_true_match']
    
    # Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    
    model_map = {
        'Logistic Regression': LogisticRegression(max_iter=1000),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
    }
    
    metrics = []
    best_f1 = -1
    best_model_name = ""
    best_model = None
    best_probs = None
    
    for m_name in models_to_train:
        if m_name in model_map:
            clf = model_map[m_name]
            clf.fit(X_train, y_train)
            
            y_pred = clf.predict(X_test)
            y_prob = clf.predict_proba(X_test)[:, 1]
            
            f1 = f1_score(y_test, y_pred)
            fpr, tpr, _ = roc_curve(y_test, y_prob)
            prec, rec, _ = precision_recall_curve(y_test, y_prob)
            
            # Downsample points for frontend performance
            step = max(1, len(fpr) // 50)
            
            metrics.append({
                "Model": m_name,
                "Precision": precision_score(y_test, y_pred, zero_division=0),
                "Recall": recall_score(y_test, y_pred, zero_division=0),
                "F1": f1,
                "AUC": roc_auc_score(y_test, y_prob),
                "CM": confusion_matrix(y_test, y_pred).flatten().tolist(),
                "roc": {"fpr": fpr[::step].tolist(), "tpr": tpr[::step].tolist()},
                "pr": {"prec": prec[::step].tolist(), "rec": rec[::step].tolist()}
            })
            
            if f1 > best_f1:
                best_f1 = f1
                best_model = clf
                best_model_name = m_name
                best_probs = clf.predict_proba(X)[:, 1] # Full dataset scores
                
    # Extract feature importance from best model
    importances = {}
    if hasattr(best_model, 'feature_importances_'):
        importances = dict(zip(features, best_model.feature_importances_))
    elif hasattr(best_model, 'coef_'):
        importances = dict(zip(features, np.abs(best_model.coef_[0])))
        
    return {
        "metrics": metrics,
        "best_model_name": best_model_name,
        "best_model_obj": best_model,
        "feature_importances": importances,
        "predictions": best_probs.tolist() if best_probs is not None else []
    }
