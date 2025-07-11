"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function RevenueDivisionQuarter({ selectedYears }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!selectedYears || selectedYears.length === 0) {
      setChartData(null);
      return;
    }

    const query = selectedYears.map((y) => `year=${y}`).join("&");
    const url = `http://localhost:8000/api/revenue-by-division-quarter?${query}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const years = Object.keys(data);
        if (years.length === 0) {
          console.warn("No data for selected years");
          return;
        }

        const baseDivisions = data[years[0]]?.divisions || [];
        const datasets = [];

        years.forEach((year) => {
          const yearData = data[year];
          if (!yearData?.divisions || !yearData?.quarters || !yearData?.values) {
            console.warn(`Missing fields for ${year}:`, yearData);
            return;
          }

          yearData.quarters.forEach((quarter, qIdx) => {
            datasets.push({
              label: `${quarter} ${year}`,
              data: yearData.divisions.map((_, divIdx) => yearData.values[divIdx][qIdx]),
              backgroundColor: `hsl(${(qIdx * 60) + parseInt(year) * 5}, 70%, 50%)`,
            });
          });
        });

        setChartData({
          labels: baseDivisions,
          datasets: datasets,
        });
      })
      .catch((err) => {
        console.error("Fetch error:", err);
      });
  }, [selectedYears]);

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-white">
        Revenue by Division — Quarterly
      </h2>

      {chartData ? (
        <div className="w-full overflow-x-auto h-[600px]">
          <div className="w-full" style={{ height: `${chartData.labels.length * 120}px` }}>

            <Bar
              data={chartData}
              options={{
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false, 
                plugins: {
                  legend: { position: "top" },
                  datalabels: {
                    anchor: "end",
                    align: "end",
                    color: "#fff",
                    formatter: (value) => `$${value.toFixed(1)}M`,
                  },
                },
                scales: {
                  x: {
                    display: false, 
                    beginAtZero: true,
                    ticks: { color: "#fff", callback: (value) => `$${value}M` },
                    grid: { color: "#444" },
                  },
                  y: {
                    ticks: { color: "#fff" },
                    grid: { color: "#444" },
                  },
                },
                elements: {
                  bar: {
                    categoryPercentage: .9, 
                    barPercentage: .8, 
                  },
                },
              }}
            />
          </div>
        </div>
      ) : (
        <p className="text-gray-400">No data available for the selected years.</p>
      )}
    </div>
  );
}
