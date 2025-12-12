import React, { useEffect, useState } from "react";
import mqtt from "mqtt";
import {
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Box,
} from "@mui/material";

import "./App.css";
import BatteryLevelChart from "./BatteryLevelChart";
import { FaChargingStation, FaRoute } from "react-icons/fa";
import { TiBatteryCharge } from "react-icons/ti";
import CarDetailModal from "./CarDetailModal";

const App = () => {
  const [carData, setCarData] = useState([
    {
      car_id: "v_0",
      battery: 100,
      charge_level: 100,
      route: "r_1",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_0.png",
    },
    {
      car_id: "v_1",
      battery: 100,
      charge_level: 100,
      route: "r_1",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_1.png",
    },
    {
      car_id: "v_2",
      battery: 100,
      charge_level: 100,
      route: "r_1",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_2.png",
    },
    {
      car_id: "v_3",
      battery: 100,
      charge_level: 100,
      route: "r_1",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_3.png",
    },
  ]);

  const [selectedCar, setSelectedCar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const client = mqtt.connect("ws://localhost:9001");

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.subscribe("sumo/vehicles");
    });

    client.on("message", (topic, message) => {
      if (topic === "sumo/vehicles") {
        const data = JSON.parse(message.toString());
        console.log("Received MQTT message:", data);
        setCarData((prevData) =>
          prevData.map((car) =>
            car.car_id === data.car_id
              ? {
                  ...car,
                  battery: data.battery,
                  charge_level: data.charge_level,
                  charge_station: data.station,
                  status: data.status,
                  charging: data.charging,
                  image: car.image || data.image,
                }
              : car
          )
        );
      }
    });

    client.on("error", (error) => console.error("MQTT Client Error:", error));

    return () => client.end();
  }, []);

  const getCardColor = (car) => {
    if (car.battery < 250) return "#ffdddd";
    if (car.charging) return "#ffffcc";
    return "#ddffdd";
  };

  const openModal = (car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCar(null);
    setIsModalOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Typography variant='h4' gutterBottom>
        MQTT Message From Car
      </Typography>

      <Grid container spacing={3}>
        {carData.map((car) => (
          <Grid item xs={12} sm={6} md={4} key={car.car_id}>
            <Card
              sx={{
                position: "relative",
                transition: "transform 0.3s ease-in-out",
                "&:hover": { transform: "scale(1.05)" },
                bgcolor: getCardColor(car),
                cursor: "pointer",
              }}
              onClick={() => openModal(car)}
            >
              <CardMedia sx={{ height: 140 }} image={car.image} />

              <CardContent>
                <Typography variant='h6'>{car.car_id}</Typography>

                <Typography variant='body2' color='text.secondary'>
                  <TiBatteryCharge style={{ marginRight: 6 }} />
                  Charge Level: {car.charge_level.toFixed(2)}%
                </Typography>

                <Typography variant='body2' color='text.secondary'>
                  <FaRoute style={{ marginRight: 6 }} />
                  Route: {car.route}
                </Typography>

                <Typography variant='body2' color='text.secondary'>
                  <FaChargingStation style={{ marginRight: 6 }} />
                  Charge Station: {car.charge_station}
                </Typography>

                <Typography variant='body2' color='text.secondary'>
                  Speed: {car.speed} km/h
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <BatteryLevelChart
                    batteryLevel={car.battery}
                    carId={car.car_id}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedCar && (
        <CarDetailModal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          car={selectedCar}
        />
      )}
    </Box>
  );
};

export default App;
