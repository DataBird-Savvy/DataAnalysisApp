"use client";

import { useEffect, useState } from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title);

export default function CommEngageCrime({ selectedYears }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!selectedYears || selectedYears.length === 0) return;

    const year = selectedYears[0]; 

    fetch(`http://localhost:8000/api/community-engagement-vs-effectiveness?year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        const colors = [
          "#FF6384", "#36A2EB", "#FFCE56",
          "#4BC0C0", "#9966FF", "#FF9F40"
        ];

        const datasets = data.map((districtData, idx) => ({
          label: districtData.district,
          data: districtData.points,
          backgroundColor: colors[idx % colors.length],
          pointRadius: 6,
        }));

        setChartData({
          datasets: datasets,
        });
      })
      .catch((err) => console.error(err));
  }, [selectedYears]); 

  if (!chartData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Loading scatter plot...</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#fff",
        },
      },
      tooltip: {
        callbacks: {
          label: function (ctx) {
            return `Events: ${ctx.parsed.x}, Effectiveness: ${ctx.parsed.y}%`;
          },
        },
      },
      datalabels: {
        display: false},
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Community Engagement Events",
          color: "#fff",
        },
        ticks: { color: "#fff" },
        grid: { color: "#444" },
      },
      y: {
        title: {
          display: true,
          text: "Crime Prevention Effectiveness (%)",
          color: "#fff",
        },
        ticks: { color: "#fff",stepSize: 5,callback: (value) => `${value}%` },
        grid: { color: "#444" },
        
      },
    },
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-full overflow-x-auto">
      <h2 className="text-xl font-bold mb-4 text-white">
        Community Engagement vs Crime Prevention Effectiveness
      </h2>
      <div className="w-full h-full">
        <Scatter data={chartData} options={options} />
      </div>
    </div>
  );
  
}
