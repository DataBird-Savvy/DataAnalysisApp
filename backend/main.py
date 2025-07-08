from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd

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

# Utility: fill NA and round floats for clean API
def clean_df(df):
    return df.fillna(0).round(2)

# --- 1) Summary Stats ---
@app.get("/api/summary")
def get_summary():
    return {
        "total_revenue": float(financial_df["Revenue"].sum()),
        "total_profit": float(financial_df["Profit"].sum()),
        "unique_employees": int(hr_df["EmployeeID"].nunique()),
        "departments": int(hr_df["Department"].nunique()),
        "active_suppliers": int(supply_chain_df["Supplier"].nunique()),
        "total_rd_projects": int(rd_portfolio_df["Project_ID"].nunique())
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

# # --- 3) Revenue by Division (Horizontal Bar) ---
# @app.get("/api/revenue-by-division")
# def revenue_by_division():
#     if 'Division' not in financial_df.columns:
#         return JSONResponse(status_code=400, content={"error": "Division column missing in financial data"})
#     division = financial_df.groupby("Division")[["Revenue"]].sum().reset_index()
#     division = division.sort_values(by="Revenue", ascending=False)
#     return clean_df(division).to_dict(orient="records")

# # --- 4) Employee Distribution (Pie) ---
# @app.get("/api/employee-distribution")
# def employee_distribution():
#     dist = hr_df["Department"].value_counts().reset_index()
#     dist.columns = ["Department", "Count"]
#     return clean_df(dist).to_dict(orient="records")

# # --- 5) Supply Chain Performance (Region) ---
# @app.get("/api/supply-performance")
# def supply_performance():
#     if 'Region' not in supply_chain_df.columns:
#         return JSONResponse(status_code=400, content={"error": "Region column missing in supply chain data"})
#     perf = supply_chain_df.groupby("Region")["DeliveryTime"].mean().reset_index()
#     perf.columns = ["Region", "AvgDeliveryTime"]
#     return clean_df(perf).to_dict(orient="records")

# # --- 6) Active vs. Completed R&D Projects (Pie) ---
# @app.get("/api/rd-status")
# def rd_status():
#     if 'Status' not in rd_portfolio_df.columns:
#         return JSONResponse(status_code=400, content={"error": "Status column missing in R&D portfolio data"})
#     status_counts = rd_portfolio_df["Status"].value_counts().reset_index()
#     status_counts.columns = ["Status", "Count"]
#     return clean_df(status_counts).to_dict(orient="records")

# # --- 7) Patents Over Time (Bar) ---
# @app.get("/api/rd-patents-trend")
# def rd_patents_trend():
#     if 'Year' not in rd_portfolio_df.columns:
#         return JSONResponse(status_code=400, content={"error": "Year column missing in R&D portfolio data"})
#     patents = rd_portfolio_df.groupby("Year")["Patent_Applications"].sum().reset_index()
#     patents.columns = ["Year", "TotalPatents"]
#     return clean_df(patents).to_dict(orient="records")
