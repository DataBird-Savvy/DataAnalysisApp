"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip);

export default function RevenueGvaYoYChart({ selectedYears }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!selectedYears || selectedYears.length === 0) {
      setChartData(null);
      return;
    }

    
    let adjustedYears = [...selectedYears];
    const minYear = Math.min(...selectedYears);
    if (!selectedYears.includes(minYear - 1)) {
      adjustedYears.push(minYear - 1);
    }

    const query = adjustedYears.map(y => `year=${y}`).join("&");

    fetch(`http://127.0.0.1:8000/api/revenue-gva-yoy?${query}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Revenue-GVA YoY API data:", data);

        if (!data || data.length === 0) {
          console.warn("No YoY data available.");
          setChartData(null);
          return;
        }

        const labels = data.map(item => item.Period);
        const revenue = data.map(item => item["REVENUE_YoY_%"]);
        const gva = data.map(item => item["GVA_YoY_%"]);

        setChartData({
          labels: labels,
          datasets: [
            {
              label: "REVENUE YoY %",
              data: revenue,
              borderColor: "orange",
              backgroundColor: "orange",
              fill: false,
              tension: 0.3,
              pointRadius: 4,
            },
            {
              label: "GVA YoY %",
              data: gva,
              borderColor: "blue",
              backgroundColor: "blue",
              fill: false,
              tension: 0.3,
              pointRadius: 4,
            },
          ],
        });
      })
      .catch((err) => {
        console.error("Error fetching YoY chart data:", err);
        setChartData(null);
      });
  }, [selectedYears]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#fff" },
      },
      datalabels: {
        display: false  
      }
    },
    scales: {
      x: {
        ticks: { color: "#fff" },
        grid: { color: "#444" },
      },
      y: {
        ticks: { color: "#fff" },
        grid: { color: "#444" },
      },
    },
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full md:w-[400px] h-[300px]">
      <h2 className="text-white text-sm mb-2">Revenue vs GVA YoY Growth %</h2>
      {chartData && chartData.labels.length > 0 ? (
        <div className="relative h-full w-full">
          <Line data={chartData} options={options} />
        </div>
      ) : (
        <p className="text-gray-400 text-sm">
          No YoY data available for the selected years.
        </p>
      )}
    </div>
  );
}
