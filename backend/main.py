from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from typing import List, Optional
import pickle
import os

from logger import logging
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS: allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data
logger.info("📦 Loading datasets...")

try:
    financial_df = pd.read_csv("data/wayne_financial_data.csv")
    hr_df = pd.read_csv("data/wayne_hr_analytics.csv")
    supply_chain_df = pd.read_csv("data/wayne_supply_chain.csv")
    rd_portfolio_df = pd.read_csv("data/wayne_rd_portfolio.csv")
    security_df = pd.read_csv("data/wayne_security_data.csv")
    financial_df["GVA"] = financial_df["Revenue_M"] - financial_df["Operating_Costs_M"]
    security_df['Date'] = pd.to_datetime(security_df['Date'])
    logger.info("✅ Data loaded successfully.")
except Exception as e:
    logger.error(f"❌ Error loading data: {e}")
    raise

@app.get("/api/summary")
def get_summary(year: Optional[List[int]] = Query(None)):
    logger.info(f"🔍 Summary requested for year(s): {year}")
    df = financial_df.copy()
    if year:
        df = df[df["Year"].isin(year)]
    total_revenue = float(df["Revenue_M"].sum())
    total_profit = float(df["Net_Profit_M"].sum())
    logger.info(f"📊 Summary: revenue={total_revenue}, profit={total_profit}")
    return {
        "total_revenue": total_revenue,
        "total_profit": total_profit,
    }

@app.get("/api/gdp-gva-yoy")
def get_gdp_gva_yoy():
    logger.info("📈 Calculating GDP and GVA YoY changes...")
    quarterly = (
        financial_df.groupby(["Year", "Quarter"])[["Revenue_M", "GVA"]]
        .sum()
        .reset_index()
        .sort_values(["Year", "Quarter"])
    )
    quarterly["GDP_YoY_%"] = quarterly.groupby("Quarter")["Revenue_M"].pct_change() * 100
    quarterly["GVA_YoY_%"] = quarterly.groupby("Quarter")["GVA"].pct_change() * 100
    quarterly = quarterly.dropna(subset=["GDP_YoY_%", "GVA_YoY_%"])
    quarterly["Period"] = quarterly["Quarter"] + " FY" + quarterly["Year"].astype(str)
    logger.info("✅ GDP-GVA YoY calculation completed.")
    return quarterly[["Period", "GDP_YoY_%", "GVA_YoY_%"]].to_dict(orient="records")

@app.get("/api/available-years")
def get_available_years():
    years = financial_df["Year"].dropna().unique().tolist()
    logger.info(f"📅 Available years returned: {years}")
    return sorted(int(y) for y in years)

@app.get("/api/revenue-by-division-quarter")
def revenue_by_division_quarter(year: Optional[List[int]] = Query(None)):
    logger.info(f"📂 Revenue by division and quarter requested for year(s): {year}")
    required_cols = {"Year", "Quarter", "Division", "Revenue_M"}
    if not required_cols.issubset(financial_df.columns):
        logger.error("❌ Missing required columns in financial_df.")
        return {"error": f"Missing columns: {required_cols - set(financial_df.columns)}"}

    df = financial_df.copy()
    if year:
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

    logger.info("✅ Revenue-by-division data structured and returned.")
    return result

@app.get("/api/security-forecasts")
async def security_forecasts(forecast_days: int = Query(7, description="Number of days to forecast")):
    logger.info(f"🔮 Forecasting next {forecast_days} days for all districts...")
    results = []

    districts = security_df['District'].unique()

    for district in districts:
        logger.info(f"📍 Forecasting for district: {district}")
        district_df = security_df[security_df['District'] == district]
        daily_incidents = (
            district_df.groupby('Date')['Security_Incidents']
            .sum()
            .reset_index()
            .sort_values('Date')
        )

        actual_data = [
            {"date": date.strftime("%Y-%m-%d"), "value": value}
            for date, value in zip(daily_incidents['Date'], daily_incidents['Security_Incidents'])
        ]

        model_path = f"notebook/models/{district}_holtwinters.pkl"
        
        if not os.path.exists(model_path):
            logger.warning(f"⚠️ Model not found for {district}. Skipping.")
            continue

        try:
            with open(model_path, 'rb') as f:
                model = pickle.load(f)

            last_date = pd.to_datetime(daily_incidents['Date']).max()
            forecast_values = model.forecast(forecast_days)
            forecast_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=forecast_days)

            forecast_data = [
                {"date": date.strftime("%Y-%m-%d"), "value": round(value, 2)}
                for date, value in zip(forecast_dates, forecast_values)
            ]

            results.append({
                "district": district,
                "actual": actual_data,
                "forecast": forecast_data
            })
            logger.info(f"✅ Forecast completed for {district}")

        except Exception as e:
            logger.error(f"❌ Error forecasting for {district}: {e}")

    logger.info("🏁 Forecasting completed for all districts.")
    return JSONResponse(content={"results": results})


@app.get("/api/community-engagement-vs-effectiveness")
async def community_engagement_vs_effectiveness(year: Optional[int] = Query(None)):
    logger.info(f"🔍 Community Engagement vs Effectiveness requested for year: {year}")

    df = security_df.copy()

    if year:
        if 'Year' not in df.columns:
            df['Year'] = df['Date'].dt.year  # Create Year column if not exists
        df = df[df['Year'] == year]

    districts = df['District'].unique()
    results = []

    for district in districts:
        district_df = df[df['District'] == district]

        points = []
        for _, row in district_df.iterrows():
            points.append({
                "x": row['Community_Engagement_Events'],
                "y": row['Crime_Prevention_Effectiveness_Pct']
            })

        results.append({
            "district": district,
            "points": points
        })

    logger.info(f"✅ Data prepared for {len(districts)} districts")
    return JSONResponse(content=results)
