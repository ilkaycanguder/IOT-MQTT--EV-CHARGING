import React, { useEffect, useState } from "react";
import mqtt from "mqtt";
import Modal from "react-modal";
import BatteryLevelChart from "./BatteryLevelChart"; // BatteryLevelChart bileşenini içe aktar
import "./App.css"; // Stil dosyasını ekleyin
import { Typography, Button } from "@material-ui/core"; // Material-UI bileşenlerini ekleyin

const CarDetailModal = ({ isOpen, onRequestClose, car }) => {
  const [currentCar, setCurrentCar] = useState(car);

  useEffect(() => {
    setCurrentCar(car);
  }, [car]);

  useEffect(() => {
    if (isOpen && currentCar) {
      const client = mqtt.connect("ws://localhost:9001");

      client.on("connect", () => {
        console.log("Connected to MQTT broker from Modal");
        client.subscribe("sumo/vehicles");
      });

      client.on("message", (topic, message) => {
        if (topic === "sumo/vehicles") {
          const data = JSON.parse(message.toString());
          if (data.car_id === currentCar.car_id) {
            setCurrentCar((prevCar) => ({
              ...prevCar,
              battery: data.battery,
              charge_level: data.charge_level,
              charge_station: data.station,
              status: data.status,
              speed: data.speed,
              charging: data.charging,
            }));
          }
        }
      });

      client.on("error", (error) => {
        console.error("MQTT Client Error from Modal:", error);
      });

      return () => {
        client.end();
      };
    }
  }, [isOpen, currentCar]);

  if (!currentCar) return null;

  const getColorClass = (car) => {
    if (car.battery < 250) {
      return "low-battery";
    } else if (car.charging) {
      return "charging";
    } else {
      return "normal";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Car Details"
      className="modal"
      overlayClassName="overlay"
    >
      <Typography variant="h5" gutterBottom>
        Details for {currentCar.car_id}
      </Typography>
      <div className={`car-details ${getColorClass(currentCar)}`}>
        <Typography variant="body1">
          <strong>Status:</strong> {currentCar.status}
        </Typography>
        <Typography variant="body1">
          <strong>Battery:</strong> {currentCar.battery} kW
        </Typography>
        <Typography variant="body1">
          <strong>Charge Level:</strong> {currentCar.charge_level.toFixed(2)}%
        </Typography>
        <Typography variant="body1">
          <strong>Speed:</strong> {currentCar.speed} km/h
        </Typography>
        <Typography variant="body1">
          <strong>Route:</strong> {currentCar.route}
        </Typography>
        <Typography variant="body1">
          <strong>Charge Station:</strong> {currentCar.charge_station}
        </Typography>
        <div style={{ flexGrow: 1 }}>
          <BatteryLevelChart
            batteryLevel={currentCar.battery}
            carId={currentCar.car_id}
          />
        </div>
        <img
          src={currentCar.image}
          alt={currentCar.car_id}
          style={{
            width: "100%",
            height: "auto",
            maxWidth: "200px",
            margin: "20px 0",
          }}
        />
      </div>
      <Button onClick={onRequestClose} variant="contained" color="primary">
        Close
      </Button>
    </Modal>
  );
};

export default CarDetailModal;
