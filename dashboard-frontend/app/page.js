"use client";

import { useState, useEffect } from "react";
import RevenueGvaYoYChart from "./components/RevenueGvaYoYChart";
import OutputVsGvaChart from "./components/OutputVsGvaChart";
import RevenueDivisionQuarter from "./components/RevenueDivisionQuarter";
import KeyMetricsSection from "./components/KeyMetricsSection";
import ForcastSecurityIncident from "./components/ForcastSecurityIncident";
import CommEngageCrime from "./components/CommEngageCrime";

export default function DashboardPage() {
  const [yearOptions, setYearOptions] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  const handleYearChange = (e) => {
    const options = Array.from(e.target.selectedOptions).map((opt) =>
      parseInt(opt.value)
    );
    setSelectedYears(options);
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/available-years")
      .then((res) => res.json())
      .then((years) => {
        setYearOptions(years);
        setSelectedYears(years);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-3xl font-bold">Wayne Enterprises Dashboard</h1>
        <div className="mt-4 md:mt-0">
          <label className="block mb-1 text-sm font-medium">Select Years:</label>
          <select
            multiple
            value={selectedYears.map(String)}
            onChange={handleYearChange}
            className="bg-gray-800 border border-gray-600 rounded p-2 w-full md:w-48 h-14"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

     {/* Row: Metrics + GVA Charts */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md md:col-span-1">
            <KeyMetricsSection selectedYears={selectedYears} />
          </div>

          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md md:col-span-2">
            <div className="flex flex-col md:flex-row gap-4 h-full">
              
              <div className="w-full md:w-1/2">
                <RevenueGvaYoYChart selectedYears={selectedYears} />
              </div>
              <div className="w-full md:w-1/2">
                <OutputVsGvaChart selectedYears={selectedYears} />
              </div>
            </div>
          </div>
        </section>

      


      {/* Row: Revenue by Division + Scatter Plot */}
      <section className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-md h-[500px] overflow-auto">
          <RevenueDivisionQuarter selectedYears={selectedYears} />
        </div>
        <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-md h-[500px] overflow-auto">
          <CommEngageCrime selectedYears={selectedYears} />
        </div>
      </section>

      {/* Row: Security Forecast */}
      <section>
     
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <ForcastSecurityIncident />
        </div>
      </section>
    </main>
  );
}
