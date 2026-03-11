from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import io
import os
import uvicorn
from typing import List

# Import modular pipeline steps
from data_quality import score_data_quality
from pipeline import validate_columns, compute_blocking_stats, run_splink_pipeline
from ml_pipeline import engineer_features, generate_ground_truth, train_and_evaluate_ml

app = FastAPI(title="DataLink Dynamic API", description="Entity Resolution & Data Quality Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for the active session (not production scalable, but fits portfolio architecture)
SESSION = {
    "df_a": None,
    "df_b": None,
    "splink_candidates": None,
    "ml_results": None,
    "features_df": None
}

@app.post("/api/upload")
async def upload_files(
    file_a: UploadFile = File(...), 
    file_b: UploadFile = File(...)
):
    """
    Accept two CSV files, load them into memory, validate columns, and return Data Quality scores.
    """
    try:
        contents_a = await file_a.read()
        contents_b = await file_b.read()
        
        # Read the file buffers correctly avoiding strict formatting drops
        df_a = pd.read_csv(io.BytesIO(contents_a))
        df_b = pd.read_csv(io.BytesIO(contents_b))
        
        # Standardize column names to lower case to match FEBRL strictly
        df_a.columns = df_a.columns.str.lower().str.strip()
        df_b.columns = df_b.columns.str.lower().str.strip()
        
        if not validate_columns(df_a, df_b):
            raise HTTPException(status_code=400, detail="Missing required columns: rec_id, given_name, surname")
            
        SESSION["df_a"] = df_a
        SESSION["df_b"] = df_b
        
        dq_a = score_data_quality(df_a)
        dq_b = score_data_quality(df_b)
        
        return {
            "status": "success",
            "dataset_a": dq_a,
            "dataset_b": dq_b
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BlockRequest(BaseModel):
    rules: List[str]

@app.post("/api/block")
def analyze_blocking(req: BlockRequest):
    """
    Accepts blocking fields/rules and returns comparison counts per rule alongside total estimations.
    """
    if SESSION["df_a"] is None or SESSION["df_b"] is None:
        raise HTTPException(status_code=400, detail="Datasets not loaded. Call /api/upload first.")
        
    stats = compute_blocking_stats(SESSION["df_a"], SESSION["df_b"], req.rules)
    return stats

class PipelineRequest(BaseModel):
    blocking_rules: List[str]
    models: List[str]
    threshold: float

@app.post("/api/run-matching")
def run_matching(req: PipelineRequest):
    """
    Executes the entire backend pipeline:
    Splink Generation -> Feature Engineering -> ML Training -> Quality Summary
    """
    try:
        df_a = SESSION["df_a"]
        df_b = SESSION["df_b"]
        
        if df_a is None or df_b is None:
             raise HTTPException(status_code=400, detail="Datasets not loaded.")
        
        # 1. Splink Linking
        candidates = run_splink_pipeline(df_a, df_b, req.blocking_rules)
        SESSION["splink_candidates"] = candidates
        
        # 2. ML Engine
        features_df = engineer_features(candidates)
        features_df = generate_ground_truth(features_df)
        SESSION["features_df"] = features_df
        
        ml_results = train_and_evaluate_ml(features_df, req.models)
        SESSION["ml_results"] = ml_results
        
        # Construct summary outputs
        prob_predictions = ml_results["predictions"]
        features_df['match_probability'] = prob_predictions
        
        matches = features_df[features_df['match_probability'] >= req.threshold].copy()
        review = features_df[(features_df['match_probability'] >= 0.5) & (features_df['match_probability'] < req.threshold)].copy()
        
        return {
             "matched_pairs_count": len(matches),
             "review_queue_count": len(review),
             "metrics": ml_results["metrics"],
             "best_model": ml_results["best_model_name"],
             "feature_importance": ml_results["feature_importances"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results/matches")
def get_matches(limit: int = 50, skip: int = 0):
    """Return top matched results from the in-memory dataframe."""
    df = SESSION.get("features_df")
    if df is None: return []
    # threshold applied frontend side or default >0.9
    matches = df[df['match_probability'] >= 0.9]
    return matches.sort_values(by="match_probability", ascending=False).iloc[skip:skip+limit].fillna("").to_dict(orient="records")

@app.get("/api/results/review")
def get_review_queue(limit: int = 50, skip: int = 0):
    df = SESSION.get("features_df")
    if df is None: return []
    review = df[(df['match_probability'] >= 0.5) & (df['match_probability'] < 0.9)]
    return review.sort_values(by="match_probability", ascending=False).iloc[skip:skip+limit].fillna("").to_dict(orient="records")

@app.get("/api/metrics")
def get_metrics():
    """Return stored model metrics and comparisons."""
    res = SESSION.get("ml_results")
    if res is None: return {}
    return {
        "metrics": res["metrics"],
        "best_model": res["best_model_name"]
    }

@app.get("/api/feature-importance")
def get_feature_importance():
    res = SESSION.get("ml_results")
    if res is None: return {}
    return res["feature_importances"]
    
@app.get("/api/waterfall/{base_id_l}")
def get_waterfall(base_id_l: str):
    """Simulates a waterfall comparison JSON payload."""
    df = SESSION.get("features_df")
    if df is None: return []
    pair = df[df['base_id_l'] == base_id_l].iloc[0]
    
    # Simple simulated waterfall extraction
    return [
       {"column": "Given Name", "weight": pair.get('jaro_winkler_given_name', 0) * 10},
       {"column": "Surname", "weight": pair.get('jaro_winkler_surname', 0) * 10},
       {"column": "Date of Birth", "weight": pair.get('dob_exact_match', 0) * 15},
       {"column": "Address", "weight": pair.get('address_score', 0) * 5}
    ]

@app.get("/api/quality-report")
def get_quality_report():
    df_a = SESSION.get("df_a")
    df_b = SESSION.get("df_b")
    if df_a is None: return {}
    return {"dataset_a": score_data_quality(df_a), "dataset_b": score_data_quality(df_b)}

from fastapi.responses import Response

@app.get("/api/download/{file_type}")
def download_file(file_type: str):
    df = SESSION.get("features_df")
    if df is None: return Response("No data", status_code=400)
    
    if file_type == "all_matches":
        csv_data = df.to_csv(index=False)
    elif file_type == "confirmed_matches":
        csv_data = df[df['match_probability'] >= 0.9].to_csv(index=False)
    elif file_type == "review_queue":
        csv_data = df[(df['match_probability'] >= 0.5) & (df['match_probability'] < 0.9)].to_csv(index=False)
    else:
        return Response("Invalid type", status_code=400)
        
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={file_type}.csv"}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
