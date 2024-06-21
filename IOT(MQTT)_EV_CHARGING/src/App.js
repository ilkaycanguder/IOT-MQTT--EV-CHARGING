import React, { useEffect, useState } from "react";
import mqtt from "mqtt";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import "./App.css";
import BatteryLevelChart from "./BatteryLevelChart"; // BatteryLevelChart bileşenini içe aktar
import { FaChargingStation, FaRoute } from "react-icons/fa"; // FaChargingStation ve FaRoute ikonlarını içe aktar
import { TiBatteryCharge } from "react-icons/ti";
import CarDetailModal from "./CarDetailModal"; // Modal bileşenini içe aktar

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(2),
  },
  card: {
    position: "relative",
    transition: "transform 0.3s ease-in-out",
    "&:hover": {
      transform: "scale(1.05)",
    },
  },
  media: {
    height: 140,
  },
  dialog: {
    minWidth: 400,
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  lowBattery: {
    backgroundColor: "#ffdddd",
  },
  charging: {
    backgroundColor: "#ffffcc",
  },
  normal: {
    backgroundColor: "#ddffdd",
  },
}));

const App = () => {
  const classes = useStyles();
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
    {
      car_id: "v_4",
      battery: 100,
      charge_level: 100,
      route: "r_2",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_4.png",
    },
    {
      car_id: "v_5",
      battery: 100,
      charge_level: 100,
      route: "r_2",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_5.png",
    },
    {
      car_id: "v_6",
      battery: 100,
      charge_level: 100,
      route: "r_3",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_6.png",
    },
    {
      car_id: "v_7",
      battery: 100,
      charge_level: 100,
      route: "r_4",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_7.png",
    },
    {
      car_id: "v_8",
      battery: 100,
      charge_level: 100,
      route: "r_4",
      charge_station: "NULL",
      status: "Full Battery",
      charging: false,
      image: "/images/car_v_8.png",
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
                  image: car.image || data.image, // Eğer image yoksa eski image'ı kullan
                }
              : car
          )
        );
      }
    });

    client.on("error", (error) => {
      console.error("MQTT Client Error:", error);
    });

    return () => {
      client.end();
    };
  }, []);

  const getColorClass = (car) => {
    if (car.battery < 250) {
      return classes.lowBattery;
    } else if (car.charging) {
      return classes.charging;
    } else {
      return classes.normal;
    }
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
    <div className={classes.root}>
      <Typography variant="h4" gutterBottom>
        MQTT Message From Car
      </Typography>
      <Grid container spacing={3} className="car-dashboard">
        {carData.map((car) => (
          <Grid item xs={12} sm={6} md={4} key={car.car_id}>
            <Card
              className={`${classes.card} ${getColorClass(car)}`}
              onClick={() => openModal(car)}
            >
              <CardMedia
                className={classes.media}
                image={car.image}
                title={car.car_id}
              />
              <CardContent>
                <Typography variant="h6" component="h2">
                  {car.car_id}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                  <TiBatteryCharge className={classes.icon} />
                  Charge Level: {car.charge_level.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                  <FaRoute className={classes.icon} />
                  Route: {car.route}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                  <FaChargingStation className={classes.icon} />
                  Charge Station: {car.charge_station}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                  Speed: {car.speed} km/h
                </Typography>
                <div style={{ flexGrow: 1 }}>
                  <BatteryLevelChart
                    batteryLevel={car.battery}
                    carId={car.car_id}
                  />
                </div>
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
    </div>
  );
};

export default App;
