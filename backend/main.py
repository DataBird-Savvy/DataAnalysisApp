from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from typing import List,Optional
from fastapi import Query

app = FastAPI()

# CORS: allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can tighten this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load CSVs once
financial_df = pd.read_csv("data/wayne_financial_data.csv")
hr_df = pd.read_csv("data/wayne_hr_analytics.csv")
supply_chain_df = pd.read_csv("data/wayne_supply_chain.csv")
rd_portfolio_df = pd.read_csv("data/wayne_rd_portfolio.csv")
financial_df["GVA"] = financial_df["Revenue_M"] - financial_df["Operating_Costs_M"]


# --- 1) Summary Stats ---
@app.get("/api/summary")
def get_summary(year: Optional[List[int]] = Query(None)):
    df = financial_df.copy()
    if year:
        df = df[df["Year"].isin(year)]
    return {
        "total_revenue": float(df["Revenue_M"].sum()),
        "total_profit": float(df["Net_Profit_M"].sum()),
    }

# --- 2) gdp-gva-yoy (Line Chart) ---
@app.get("/api/gdp-gva-yoy")
def get_gdp_gva_yoy():
    # Group by Year + Quarter
    quarterly = (
        financial_df.groupby(["Year", "Quarter"])[["Revenue_M", "GVA"]]
        .sum()
        .reset_index()
        .sort_values(["Year", "Quarter"])
    )
    
    # Calculate YoY %
    quarterly["GDP_YoY_%"] = (
        quarterly.groupby("Quarter")["Revenue_M"].pct_change() * 100
    )
    quarterly["GVA_YoY_%"] = (
        quarterly.groupby("Quarter")["GVA"].pct_change() * 100
    )
    
    quarterly = quarterly.dropna(subset=["GDP_YoY_%", "GVA_YoY_%"])


    # Period column for X-axis
    quarterly["Period"] = quarterly["Quarter"] + " FY" + quarterly["Year"].astype(str)
    
    # Only send relevant columns
    output = quarterly[["Period", "GDP_YoY_%", "GVA_YoY_%"]]

    return output.to_dict(orient="records")

@app.get("/api/available-years")
def get_available_years():
    years = financial_df["Year"].dropna().unique().tolist()
    return sorted(int(y) for y in years)


@app.get("/api/revenue-by-division-quarter")
def revenue_by_division_quarter(year: Optional[List[int]] = Query(None)):
    required_cols = {"Year", "Quarter", "Division", "Revenue_M"}
    if not required_cols.issubset(financial_df.columns):
        return {"error": f"Missing columns: {required_cols - set(financial_df.columns)}"}

    df = financial_df.copy()

    if year is not None:
        df = df[df["Year"].isin(year)]

    grouped = (
        df.groupby(["Year", "Division", "Quarter"])["Revenue_M"]
        .sum()
        .reset_index()
    )

    result = {}
    for y in grouped["Year"].unique():
        year_df = grouped[grouped["Year"] == y]
        divisions = year_df["Division"].unique().tolist()
        quarters = sorted(year_df["Quarter"].unique().tolist())
        values = []

        for division in divisions:
            subset = year_df[year_df["Division"] == division]
            quarter_values = []
            for q in quarters:
                match = subset[subset["Quarter"] == q]
                val = float(match["Revenue_M"].values[0]) if not match.empty else 0.0
                quarter_values.append(val)
            values.append(quarter_values)

        result[int(y)] = {
            "year": int(y),
            "divisions": divisions,
            "quarters": quarters,
            "values": values
        }

    return result