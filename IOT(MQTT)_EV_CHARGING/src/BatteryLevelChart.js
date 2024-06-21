import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BatteryLevelChart = ({ batteryLevel, carId, color }) => {
  const backgroundColor =
    batteryLevel < 250 ? "rgba(255, 99, 132, 0.6)" : color;
  const borderColor = batteryLevel < 250 ? "rgba(255, 99, 132, 1)" : color;

  const data = {
    labels: [carId],
    datasets: [
      {
        label: "Battery Level (kW)",
        data: [batteryLevel],
        backgroundColor,
        borderColor,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Battery Level",
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 1000, // Batarya seviyesinin maksimum değeri
      },
    },
    maintainAspectRatio: false, // Boyutun ayarlanmasını sağlar
  };

  return (
    <div style={{ width: "100%", height: "150px" }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BatteryLevelChart;
