from flask import Flask, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app) 

# Aracın durumu - Vehicle status
vehicle_state = {
    "battery": 100.0,
    "temperature": 22.0,
    "velocity": 0.0,        
    "target_velocity": 0.0, 
    "lat": 40.1828,  
    "lon": 29.0665,
    "is_moving": False
}
# Pil verisi - Battery data
@app.route('/data/pil')
def get_pil():
    drain_rate = 0.08 if vehicle_state["velocity"] > 0 else 0.02
    vehicle_state["battery"] -= drain_rate
    if vehicle_state["battery"] < 0:
        vehicle_state["battery"] = 0
    voltage = (vehicle_state["battery"] / 100) * 12.0  
    return jsonify({"batteryPercentage": vehicle_state["battery"], "voltage": voltage})

@app.route('/data/temp')
def get_temp():
    if vehicle_state["velocity"] > 0:
        vehicle_state["temperature"] += random.uniform(0.1, 0.4)
        if vehicle_state["temperature"] > 45:
            vehicle_state["temperature"] = 45
    else:
        vehicle_state["temperature"] -= random.uniform(0.1, 0.3)
        if vehicle_state["temperature"] < 22:
            vehicle_state["temperature"] = 22
            
    return jsonify({"temperature": round(vehicle_state["temperature"], 1)})

@app.route('/data/velo')
def get_velo():
    accel_step = random.uniform(0.01, 0.08)  
    brake_step = random.uniform(0.05, 0.15) 

    current = vehicle_state["velocity"]
    target = vehicle_state["target_velocity"]

    if current < target:
        # Hızlanma - Speed up
        current += accel_step
        if current > target:
            current = target
    elif current > target:
        # Yavaşlama - Slowdown
        current -= brake_step
        if current < target:
            current = target
    else:
        # Hedef hızda gerçekçi bir hız dalgalanma simülasyonu - Realistic speed simulation on target speed
        if target > 0:
            current = target - random.uniform(0.00, 0.015)

    # Hız sınırlandırması - Speed limitation
    if current < 0.0:
        current = 0.0
    elif current > 0.4:
        current = 0.4

    vehicle_state["velocity"] = current
    vehicle_state["is_moving"] = current > 0

    return jsonify({"hiz": current, "error": False})

@app.route('/data/durum')
def get_durum():
    if vehicle_state["is_moving"]:
        speed_factor = vehicle_state["velocity"] * 0.0002
        vehicle_state["lat"] += random.uniform(-speed_factor, speed_factor)
        vehicle_state["lon"] += random.uniform(-speed_factor, speed_factor)
        
    return jsonify({
        "gps": {
            "latitude": round(vehicle_state["lat"], 6), 
            "longitude": round(vehicle_state["lon"], 6)
        },
        "error": False
    })

@app.route('/command/<cmd>')
def send_cmd(cmd):
    if cmd in ["forward", "backward", "left", "right"]:
        vehicle_state["target_velocity"] = 0.4  
    elif cmd == "stop":
        vehicle_state["target_velocity"] = 0.0  
        
    return jsonify({"status": f"{cmd} komutu alindi"})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)