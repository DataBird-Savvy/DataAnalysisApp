"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";


ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function SecurityForecastChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/security-forecasts")
      .then((res) => res.json())
      .then((result) => {
        if (!result.results) return;

        // Create unique sorted date timeline
        const allDatesSet = new Set();
        result.results.forEach((district) => {
          district.actual.forEach((item) => allDatesSet.add(item.date));
          district.forecast.forEach((item) => allDatesSet.add(item.date));
        });
        const allDates = Array.from(allDatesSet).sort();

        // Define color palette for better contrast
        const colorPalette = [
          "#e6194b", // red
          "#3cb44b", // green
          "#ffe119", // yellow
          "#4363d8", // blue
          "#f58231", // orange
          "#911eb4", // purple
          "#46f0f0", // cyan
          "#f032e6", // magenta
          "#bcf60c", // lime
          "#fabebe"  // pink
        ];

        // Create datasets
        const datasets = [];
        result.results.forEach((district, idx) => {
          const color = colorPalette[idx % colorPalette.length];

          // Actual data
          const actualData = allDates.map((date) => {
            const point = district.actual.find((d) => d.date === date);
            return point ? point.value : null;
          });

          datasets.push({
            label: `${district.district} Actual`,
            data: actualData,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          });

          // Forecast data (dashed line)
          const forecastData = allDates.map((date) => {
            const point = district.forecast.find((d) => d.date === date);
            return point ? point.value : null;
          });

          datasets.push({
            label: `${district.district} Forecast`,
            data: forecastData,
            borderColor: color,
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          });
        });

        setChartData({
          labels: allDates,
          datasets: datasets,
        });
      })
      .catch((err) => console.error("Error loading forecast data:", err));
  }, []);

  if (!chartData) {
    return <p className="text-gray-300">Loading security forecast chart...</p>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#fff",
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
      datalabels: {
        display: false  
      }
    },
    scales: {
      x: {
        ticks: { color: "#fff", autoSkip: true, maxTicksLimit: 20 },
        grid: { color: "#444" },
      },
      y: {
        ticks: { color: "#fff" },
        grid: { color: "#444" },
      },
    },
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg overflow-x-auto">
      <h2 className="text-xl font-bold mb-4 text-white">
        Security Incidents: Actual vs Forecast 
      </h2>
      <div className="min-w-[800px] h-[500px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
