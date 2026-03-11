import pandas as pd
import numpy as np
import splink.comparison_library as cl
from splink import DuckDBAPI, Linker, SettingsCreator, block_on
import logging

logging.getLogger("splink").setLevel(logging.ERROR)

def preprocess_framework(df: pd.DataFrame) -> pd.DataFrame:
    """Preprocess the dataset similar to Section 3 of the notebook."""
    df = df.copy()
    # Normalize string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].astype(str).str.lower().str.strip()
        df[col] = df[col].replace({'nan': None, '': None, 'none': None})
    
    # Basic date formatting (if available)
    if 'date_of_birth' in df.columns:
        # Padded to 8 characters to standardise yyyymmdd
        df['date_of_birth'] = df['date_of_birth'].astype(str).str.replace(r'\.0$', '', regex=True)
        df['date_of_birth'] = df['date_of_birth'].apply(lambda x: x.zfill(8) if x and x != 'None' else None)
    
    # Remove whitespace artifacts from soc_sec_id
    if 'soc_sec_id' in df.columns:
        df['soc_sec_id'] = df['soc_sec_id'].astype(str).str.replace(r'\.0$', '', regex=True)

    return df

def validate_columns(df_a: pd.DataFrame, df_b: pd.DataFrame) -> bool:
    """Assert minimum overlap of required columns."""
    needed = {'rec_id', 'given_name', 'surname'}
    return needed.issubset(df_a.columns) and needed.issubset(df_b.columns)

def compute_blocking_stats(df_a: pd.DataFrame, df_b: pd.DataFrame, blocking_rules: list) -> dict:
    """Calculates pairwise comparison volume for the provided blocking rules."""
    df_a = preprocess_framework(df_a)
    df_b = preprocess_framework(df_b)
    
    settings = SettingsCreator(
        link_type="link_only",
        unique_id_column_name="rec_id",
        comparisons=[cl.ExactMatch("given_name")] # Dummy comparison to initialize linker
    )
    
    db_api = DuckDBAPI()
    linker = Linker([df_a, df_b], settings, db_api)
    
    results = []
    total_comparisons = 0
    
    for rule in blocking_rules:
        # Convert simple strings like 'postcode' to 'l.postcode = r.postcode' if necessary
        rule_sql = rule if "=" in rule else f"l.{rule} = r.{rule}"
        try:
            count = linker.count_num_comparisons_from_blocking_rule(rule_sql)
            results.append({"rule": rule_sql, "comparisons": count})
        except Exception as e:
            results.append({"rule": rule_sql, "comparisons": 0, "error": str(e)})
            
    # Also evaluate total unique pairs generated assuming these rules are OR'd
    try:
        settings = SettingsCreator(
            link_type="link_only",
            unique_id_column_name="rec_id",
            blocking_rules_to_generate_predictions=[
                rule if "=" in rule else f"l.{rule} = r.{rule}" for rule in blocking_rules
            ],
            comparisons=[cl.ExactMatch("given_name")]
        )
        temp_linker = Linker([df_a, df_b], settings, DuckDBAPI())
        total_comparisons = temp_linker.count_num_comparisons_from_blocking_rule(" OR ".join([rule if "=" in rule else f"l.{rule} = r.{rule}" for rule in blocking_rules]))
    except Exception as e:
        print(f"Failed to calculate union comparison count: {e}")
            
    return {"rules": results, "estimated_total": total_comparisons}

def run_splink_pipeline(df_a: pd.DataFrame, df_b: pd.DataFrame, blocking_rules: list):
    """Executes the Splink EM Model Linkage and returns the candidate pairs dataframe."""
    df_a = preprocess_framework(df_a)
    df_b = preprocess_framework(df_b)
    
    # Standardise rule syntax
    brs = [rule if "=" in rule else f"l.{rule} = r.{rule}" for rule in blocking_rules]
    
    settings = SettingsCreator(
        link_type="link_only",
        unique_id_column_name="rec_id",
        blocking_rules_to_generate_predictions=brs,
        comparisons=[
            cl.ExactMatch("given_name").configure(term_frequency_adjustments=True),
            cl.ExactMatch("surname").configure(term_frequency_adjustments=True),
            cl.ExactMatch("date_of_birth"),
            cl.ExactMatch("postcode"),
            cl.ExactMatch("suburb"),
            cl.ExactMatch("state"),
        ],
        retain_matching_columns=True,
        retain_intermediate_calculation_columns=True
    )
    
    db_api = DuckDBAPI()
    linker = Linker([df_a, df_b], settings, db_api)
    
    # Train EM model on the data natively
    for rule in brs:
        try:
            linker.training.estimate_parameters_using_expectation_maximisation(rule)
        except Exception as e:
            print(f"Skipping EM training on rule {rule}: {e}")
            
    # Predict
    df_predict = linker.inference.predict(threshold_match_probability=0.01)
    
    # Calculate Waterfall chart data internally before dropping columns
    # We will just export the core matches and rely on frontend calculations or full pandas extract
    predictions_pd = df_predict.as_pandas_dataframe()
    
    return predictions_pd
