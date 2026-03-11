import pandas as pd
import numpy as np

def score_data_quality(df: pd.DataFrame) -> dict:
    """
    Computes data quality metrics for a single dataset.
    Returns:
      grade: A, B, C, or D string
      completeness: dict of column -> % completeness
      missing_summary: dict of column -> count missing
      preview: list of dict representing first 5 rows
      total_records: int
      columns: list of strings
    """
    total_records = len(df)
    columns = df.columns.tolist()
    
    if total_records == 0:
        return {
            "grade": "F", 
            "completeness": {}, 
            "missing_summary": {}, 
            "preview": [],
            "total_records": 0,
            "columns": columns
        }
    
    # Fill empty strings as NaN for accurate missing counts
    df_clean = df.replace(r'^\s*$', np.nan, regex=True)
    missing_counts = df_clean.isnull().sum()
    
    completeness = {}
    missing_summary = {}
    
    total_missing = 0
    total_expected = total_records * len(columns)
    
    for col in columns:
        m_count = int(missing_counts[col])
        missing_summary[col] = m_count
        comp_pct = 100 * (1 - m_count / total_records)
        completeness[col] = round(comp_pct, 2)
        total_missing += m_count
        
    overall_completeness = 100 * (1 - total_missing / total_expected)
    
    if overall_completeness > 95:
        grade = "A (Excellent)"
    elif overall_completeness > 85:
        grade = "B (Good)"
    elif overall_completeness > 70:
        grade = "C (Fair)"
    else:
        grade = "D (Poor)"
        
    preview = df.head(5).fillna("").to_dict(orient="records")
    
    return {
        "grade": grade,
        "completeness": completeness,
        "missing_summary": missing_summary,
        "preview": preview,
        "total_records": total_records,
        "columns": columns
    }
