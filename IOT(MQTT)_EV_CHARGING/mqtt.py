import paho.mqtt.client as mqtt

# MQTT ayarları
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "sumo/vehicles"

# Bağlantı kurulduğunda çağrılan fonksiyon
def on_connect(client, userdata, flags, rc):
    print("Bağlantı sonucu kodu: " + str(rc))
    client.subscribe(MQTT_TOPIC)

# Mesaj alındığında çağrılan fonksiyon
def on_message(client, userdata, msg):
    print(f"Mesaj alındı: {msg.topic} {msg.payload.decode()}")

# MQTT istemcisi oluşturma
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(MQTT_BROKER, MQTT_PORT, 60)

# Sonsuz döngü
client.loop_forever()
