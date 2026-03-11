import os
from splink import splink_datasets

def main():
    print("Downloading datasets...")
    df_a = splink_datasets.febrl4a
    df_b = splink_datasets.febrl4b

    os.makedirs("data", exist_ok=True)
    df_a.to_csv("data/febrl4a.csv", index=False)
    df_b.to_csv("data/febrl4b.csv", index=False)
    print("Datasets saved successfully.")

if __name__ == "__main__":
    main()
