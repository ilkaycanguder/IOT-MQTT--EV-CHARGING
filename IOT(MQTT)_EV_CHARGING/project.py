import os
import sys
import optparse
from sumolib import checkBinary  # Çevresel değişkenlerdeki ikili dosyaları kontrol eder
import random
import traci
import time
import xml.etree.ElementTree as ET
import paho.mqtt.client as mqtt
import json

# MQTT ayarları
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sumo/vehicles"

# MQTT istemcisini başlatma
client = mqtt.Client()

# MQTT bağlantı kurulduğunda çağrılan fonksiyon
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))

client.on_connect = on_connect
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()

# Araç sınıfı tanımı
class Car:
    def __init__(self, _battery=0, _route="NULL", _station="NULL", _car_id="NULL"):
        self.battery = _battery
        self.route = _route
        self.station = _station
        self.car_id = _car_id

    # Batarya durumu döndüren fonksiyon
    def get_battery(self):
        return self.battery

    # Mevcut rota bilgisini döndüren fonksiyon
    def get_route(self):
        return self.route

    # Mevcut şarj istasyonunu döndüren fonksiyon
    def get_station(self):
        return self.station

    # Araç kimliğini döndüren fonksiyon
    def get_car_id(self):
        return self.car_id

    # Batarya durumunu ayarlayan fonksiyon
    def set_battery(self, x):
        self.battery = x

    # Rota bilgisini ayarlayan fonksiyon
    def set_route(self, x):
        self.route = x

    # Şarj istasyonunu ayarlayan fonksiyon
    def set_station(self, x):
        self.station = x

    # Araç kimliğini ayarlayan fonksiyon
    def set_car_id(self, x):
        self.car_id = x

# 9 araçtan oluşan bir liste oluşturma
vehicles = [Car() for _ in range(9)]
for i, vehicle in enumerate(vehicles):
    vehicle.car_id = f"v_{i}"

# Araç verilerini MQTT üzerinden yayınlayan fonksiyon
def publish_vehicle_data(car):
    charge_level = (car.get_battery() / 1000) * 100  # Batarya seviyesi % olarak hesaplanıyor
    data = {
        "car_id": car.get_car_id(),
        "battery": car.get_battery(),
        "charge_level": charge_level,  # % olarak hesaplanan batarya seviyesi
        "route": car.get_route(),
        "station": car.get_station(),
        "charging": car.get_battery() < 1000  # Şarj olma durumu
    }
    client.publish(MQTT_TOPIC, json.dumps(data))

# Araç ID'sine göre şarj istasyonunu bulan fonksiyon
def find_cs(car_id, cs0, cs1, cs2, cs3, cs4, cs5):
    charging_stations = [cs0, cs1, cs2, cs3, cs4, cs5]
    
    for i, station in enumerate(charging_stations):
        if car_id in station:
            return f"cs_{i}"
    
    return "NULL"

# DFA (Deterministic Finite Automaton) yükleyen fonksiyon
def load_dfa(dfa_file):
    tree = ET.parse(dfa_file)
    root = tree.getroot()

    states = {}
    transitions = []

    for state in root.find('states'):
        states[state.get('name')] = {'initial': state.get('initial') == 'true'}

    for transition in root.find('transitions'):
        transitions.append({
            'from': transition.get('from'),
            'to': transition.get('to'),
            'symbol': transition.get('symbol')
        })

    initial_state = next(state for state, properties in states.items() if properties['initial'])
    return DFA(initial_state, transitions)

# DFA sınıfı tanımı
class DFA:
    def __init__(self, initial_state, transitions):
        self.current_state = initial_state
        self.transitions = transitions

    # Geçiş işlemini gerçekleştiren fonksiyon
    def transition(self, symbol):
        for transition in self.transitions:
            if transition['from'] == self.current_state and transition['symbol'] == symbol:
                self.current_state = transition['to']
                print(f"Transition: {self.current_state}")
                break

# SUMO simülasyonunu çalıştıran ana fonksiyon
def run():
    dfa = load_dfa('vehicle_dfa.xml')
    battery_capacity = "1000"
    vehicle_ids = [f"v_{i}" for i in range(9)]
    for vehicle_id in vehicle_ids:
        traci.vehicle.setParameter(vehicle_id, "device.battery.maximumBatteryCapacity", battery_capacity)
        traci.vehicle.setParameter(vehicle_id, "device.battery.actualBatteryCapacity", battery_capacity)

    cs_edges = ["E4", "E7", "E10", "E13", "E16", "E19"]

    will_stop = {vehicle_id: 0 for vehicle_id in vehicle_ids}

    available_routes = [route for route in traci.route.getIDList() if "basa_don" not in route and route not in ["r_10", "r_11", "r_12", "r_13", "r_14", "r_15"]]
    while traci.simulation.getMinExpectedNumber() > 0:
        traci.simulationStep()

        for car_id in traci.vehicle.getIDList():
            current_lane = traci.vehicle.getRoadID(car_id)

            # Araç E1 yolundaysa 'basa_don' rotasına yönlendir
            if current_lane == "E1":
                try:
                    traci.vehicle.setRouteID(car_id, "basa_don")
                except traci.exceptions.TraCIException as e:
                    print(f"Route 'basa_don' is not known for vehicle '{car_id}': {str(e)}")

            # Araç 697983203 yolundaysa rastgele bir rotaya yönlendir
            if traci.vehicle.getRoadID(car_id) == "697983203":
                route_id = random.choice(available_routes)
                try:
                    traci.vehicle.setRouteID(car_id, route_id)
                except traci.exceptions.TraCIException as e:
                    print(f"Route replacement failed for vehicle '{car_id}': {str(e)}")

            current_charge = float(traci.vehicle.getParameter(car_id, "device.battery.actualBatteryCapacity"))
            current_route = traci.vehicle.getRouteID(car_id)
            cs0 = traci.chargingstation.getVehicleIDs("cs_0")
            cs1 = traci.chargingstation.getVehicleIDs("cs_1")
            cs2 = traci.chargingstation.getVehicleIDs("cs_2")
            cs3 = traci.chargingstation.getVehicleIDs("cs_3")
            cs4 = traci.chargingstation.getVehicleIDs("cs_4")
            cs5 = traci.chargingstation.getVehicleIDs("cs_5")
            charging_station = find_cs(car_id, cs0, cs1, cs2, cs3, cs4, cs5)

            vehicle = next(v for v in vehicles if v.car_id == car_id)
            vehicle.battery = current_charge
            vehicle.route = current_route
            vehicle.station = charging_station
            
            publish_vehicle_data(vehicle)  # Verileri MQTT üzerinden yayınla

            # Batarya seviyesi düşükse DFA durumunu değiştir
            if current_charge < 250:
                dfa.transition('BatteryLevelLow')
            else:
                dfa.transition('BatteryLevelHigh')

            # Mevcut duruma göre araçların hareketini kontrol et
            if dfa.current_state == 'Searching':
                # Şarj istasyonunu arama kodları
                print("Searching for a charging station")
                # Eğer şarj istasyonu bulunursa
                dfa.transition('StationDetected')
            elif dfa.current_state == 'OnTheWay':
                # Şarj istasyonuna gitme kodları
                print("On the way to charging station")
                # İstasyona varıldıysa
                dfa.transition('ReachedStation')
            elif dfa.current_state == 'Charging':
                # Şarj etme kodları
                print("Charging")
                if current_charge >= 1000:  # Tam dolu pil seviyesi
                    dfa.transition('BatteryFull')
            elif dfa.current_state == 'ChargingComplete':
                # Şarj işlemi tamamlandı
                print("Charging complete")
                dfa.transition('DisconnectConfirmed')
            elif dfa.current_state == 'Leaving':
                # Şarj istasyonundan ayrılma kodları
                print("Leaving charging station")
                dfa.transition('DriveCommand')

            # Batarya seviyesi 250'den düşükse şarj istasyonuna git
            if current_charge < 250 and will_stop[car_id] == 0:
                cs_routes = [traci.simulation.findRoute(current_lane, cs_edge) for cs_edge in cs_edges]

                index, result = min(enumerate(cs_routes), key=lambda x: x[1].travelTime)
                route_time = int(cs_routes[index].travelTime)
                traci.vehicle.setRoute(car_id, cs_routes[index].edges)
                traci.vehicle.setChargingStationStop(car_id, f"cs_{index}", 1000 - current_charge - 4 * route_time)
                will_stop[car_id] = 1

                print(f"{car_id} şarj olacak!! cs_{index}'e gidecek!!")

            if current_charge == 1000.00:
                will_stop[car_id] = 0

            # Şarj istasyonlarına varıldığında rotaları değiştir
            route_changes = {
                "E4": ("r_10", "-212712097#3", "r_10", "r_1"),
                "E7": ("r_11", "212712097#5", "r_11", "r_4"),
                "E10": ("r_12", "669466787#3", "r_12", "r_6"),
                "E13": ("r_13", "-669466787#1", "r_13", "r_0"),
                "E16": ("r_14", "212712115#9", "r_14", "r_2"),
                "E19": ("r_15", "-212712115#7", "r_15", "r_3"),
            }

            for lane, routes in route_changes.items():
                if current_lane == lane:
                    traci.vehicle.setRouteID(car_id, routes[0])
                if current_lane == routes[1] and current_route == routes[2]:
                    traci.vehicle.setRouteID(car_id, routes[3])

            # Batarya tamamen biterse aracı durdur ve kaldır
            if current_charge == 0.00:
                traci.vehicle.setSpeed(car_id, 0.00)
                traci.vehicle.remove(car_id)
                print(f"{car_id} yoldan kaldırıldı çünkü bataryası bitti.")

            print(f"{car_id}'s battery: {current_charge}")

    traci.close()

# Ana fonksiyon
if __name__ == "__main__":
    sumoBinary = checkBinary('sumo-gui')

    traci.start([sumoBinary, "-c", "esogu.sumocfg", "--time-to-teleport", "-1"])
    run()
