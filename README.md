# MQTT SUMO Project

This project involves a SUMO simulation integrated with MQTT for vehicle and charging station management.

## Summary (Required)

This project integrates Eclipse SUMO and MQTT to manage electric vehicle (EV) charging stations. Vehicles in the simulation head to the nearest charging station when their battery falls below 25%, wait if another vehicle is charging, and communicate using MQTT. The project also includes a React interface to display real-time data from the simulation.

## Prerequisites

1. **Mosquitto MQTT Broker:**
   - Ensure Mosquitto is installed on your system. You can download it from [Mosquitto's official website](https://mosquitto.org/download/).

2. **Mosquitto Configuration:**
   - Open the existing `mosquitto.conf` file and add the following configuration:

     ```plaintext
     # General configuration
     persistence true
     persistence_location C:\Program Files\mosquitto\data
     log_dest file C:\Program Files\mosquitto\log\mosquitto.log

     # Default listener (MQTT protocol on port 1883)
     listener 1883
     protocol mqtt

     # WebSocket listener (MQTT over WebSockets on port 9001)
     listener 9001
     protocol websockets

     # Allow anonymous access (set to true if you want to allow clients to connect without authentication)
     allow_anonymous true

     # Optional: Define the path for the PID file
     pid_file C:\Program Files\mosquitto\mosquitto.pid

     # Optional: Maximum number of client connections (default is -1, which means unlimited)
     #max_connections -1

     # Logging settings
     log_type error
     log_type warning
     log_type notice
     log_type information
     connection_messages true
     log_timestamp true
     ```

3. **Starting Mosquitto:**
   - Open a command prompt as Administrator and start Mosquitto with the following command:
     ```sh
     net start mosquitto
     ```

## Running the Project

1. Install Node.js dependencies:
   npm install --force

2. Start the MQTT script:
   python mqtt.py
3. Start the main project script:
   python project.py
4. Start the React interface:
   npm start
