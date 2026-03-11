import pandas as pd
from splink.datasets import splink_datasets
import splink.duckdb.comparison_library as cl
import splink.duckdb.comparison_template_library as ctl
from splink.duckdb.linker import DuckDBLinker
import re

print("Loading data", flush=True)
df_a = pd.read_csv("data/febrl4a.csv")
df_a['source_dataset'] = 'dataset_a'
df_b = pd.read_csv("data/febrl4b.csv")
df_b['source_dataset'] = 'dataset_b'
print("Data loaded", flush=True)

settings = {
    "link_type": "link_only",
    "unique_id_column_name": "rec_id",
    "blocking_rules_to_generate_predictions": [
        "l.given_name = r.given_name and l.surname = r.surname",
        "l.given_name = r.given_name and l.date_of_birth = r.date_of_birth",
        "l.surname = r.surname and l.postcode = r.postcode",
        "l.date_of_birth = r.date_of_birth and l.suburb = r.suburb",
        "l.soc_sec_id = r.soc_sec_id"
    ],
    "comparisons": [
        ctl.name_comparison("given_name"),
        ctl.name_comparison("surname"),
        ctl.date_comparison("date_of_birth"),
        cl.exact_match("postcode", term_frequency_adjustments=True),
        cl.exact_match("suburb", term_frequency_adjustments=True),
        cl.exact_match("state")
    ],
    "retain_intermediate_calculation_columns": True
}

try:
    print("Instantiating Linker", flush=True)
    linker = DuckDBLinker([df_a, df_b], settings)
    print("Success", flush=True)
except Exception as e:
    raw_error = str(e)
    # Extract just the text outside tags
    text = re.sub('<[^<]+?>', '', raw_error)
    with open("splink_error.txt", "w", encoding='utf-8') as f:
        f.write(text)
    print("Error text saved.")
