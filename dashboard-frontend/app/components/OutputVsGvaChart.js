"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

export default function OutputVsGvaChart({ selectedYears }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!selectedYears || selectedYears.length === 0) {
      setChartData(null);
      return;
    }

    
    const query = selectedYears.map((y) => `year=${y}`).join("&");
    const url = `http://localhost:8000/api/output-vs-gva?${query}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setChartData({
          labels: data.periods,
          datasets: [
            {
              label: "Revenue",
              data: data.revenue,
              borderColor: "#1E3A8A", 
              backgroundColor: "#1E3A8A",
              fill: false,
              tension: 0.3,
              pointRadius: 5,
            },
            {
              label: "Gross Value Added (GVA)",
              data: data.gva,
              borderColor: "#10B981", 
              backgroundColor: "#10B981",
              fill: false,
              tension: 0.3,
              pointRadius: 5,
            },
          ],
        });
      })
      .catch((err) => console.error(err));
  }, [selectedYears]); 

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: { labels: { color: "#fff" } },
      title: {
        display: true,
        text: "Company Output vs. GVA Over Time",
        color: "#fff",
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
        ticks: { color: "#fff",callback: (value) => `$${value}M` },
        grid: { color: "#444" },
      },
    },
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full md:w-[400px] h-[300px]">
      {chartData ? (
        <div className="relative w-full h-full">
          <Line data={chartData} options={options} />
        </div>
      ) : (
        <p className="text-gray-400">Loading Output vs. GVA chart...</p>
      )}
    </div>
  );
}
