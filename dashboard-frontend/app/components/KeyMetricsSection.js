"use client";

import { useEffect, useState } from "react";

export default function KeyMetricsSection({ selectedYears }) {
  const [summary, setSummary] = useState({
    total_revenue: null,
    total_profit: null,
  });

  useEffect(() => {
    if (!selectedYears || selectedYears.length === 0) {
      setSummary({
        total_revenue: null,
        total_profit: null,
      });
      return;
    }

    const query = selectedYears.map((y) => `year=${y}`).join("&");
    fetch(`http://localhost:8000/api/summary?${query}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Summary API:", data);
        setSummary(data);
      })
      .catch((err) => {
        console.error("Error fetching summary:", err);
      });
  }, [selectedYears]);

  return (
    <section className="w-full">
      <h2 className="text-2xl font-bold mb-4 text-white"></h2>
      
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
        <MetricCard
          title="Total Revenue"
          value={
            summary.total_revenue !== null
              ? `$${summary.total_revenue.toLocaleString()}M`
              : "Loading..."
          }
        />
        <MetricCard
          title="Total Profit"
          value={
            summary.total_profit !== null
              ? `$${summary.total_profit.toLocaleString()}M`
              : "Loading..."
          }
        />
      </div>
    </section>
  );
}


function MetricCard({ title, value }) {
  return (
    <div className="rounded-lg shadow-md border border-gray-700 p-6 bg-gray-800 flex flex-col items-center justify-center text-center">
      <h3 className="text-md font-medium text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-blue-400">{value}</p>
      
    </div>
  );
}

