import pandas as pd
from splink.datasets import splink_datasets
from splink import SettingsCreator, block_on, Linker, DuckDBAPI
import splink.comparison_library as cl
import splink.comparison_template_library as ctl

df_a = splink_datasets.febrl4a
df_b = splink_datasets.febrl4b

settings = SettingsCreator(
    link_type="link_only",
    blocking_rules_to_generate_predictions=[
        block_on("given_name", "surname"),
    ],
    comparisons=[
        ctl.ForenameSurnameComparison("given_name", "surname"),
        ctl.DateOfBirthComparison("date_of_birth", input_is_string=True),
        cl.ExactMatch("postcode").configure(term_frequency_adjustments=True),
    ]
)

db = DuckDBAPI()
linker = Linker([df_a, df_b], settings, db)

linker.training.estimate_u_using_random_sampling(max_pairs=1000)
linker.training.estimate_parameters_using_expectation_maximisation(block_on("given_name", "surname"))

predictions = linker.inference.predict(threshold_match_probability=0.5)
print("Splink 4 works! Found", len(predictions.as_pandas_dataframe()))
