// Ağ yapılandırması - Network configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// Saat ve tarih - Date and clock
function tarihSaat() {
    const date = new Date().toLocaleString('tr-TR');
    document.getElementById("saat").innerHTML = date;
}
setInterval(tarihSaat, 1000);

// Batarya yüzdesi - Battery percentage
async function fetchBatteryData() {
    try {
        const response = await fetch(`${API_BASE_URL}/data/pil`);
        const data = await response.json();
        updateBatteryDisplay(data);
    } catch (error) {
        console.error('Pil verisi alınamadı:', error);
    }
}

function updateBatteryDisplay(data) {
    const batteryLevelDiv = document.getElementById('battery-level');
    const batteryPercentageDiv = document.getElementById('battery-percentage');
    
    if (!data || data.batteryPercentage === null) return;

    batteryPercentageDiv.textContent = `%${data.batteryPercentage.toFixed(1)}`;
    batteryLevelDiv.style.width = `${data.batteryPercentage}%`;

    if (data.batteryPercentage > 50) {
        batteryLevelDiv.style.backgroundColor = 'green';
    } else if (data.batteryPercentage > 30) {
        batteryLevelDiv.style.backgroundColor = 'orange';
    } else {
        batteryLevelDiv.style.backgroundColor = 'red';
    }
}

// Sıcaklık - Temperature
async function fetchTemperatureData() {
    try {
        const response = await fetch(`${API_BASE_URL}/data/temp`);
        const data = await response.json();
        updateThermometerDisplay(data.temperature);
    } catch (error) {
        console.error('Sıcaklık verisi alınamadı:', error);
    }
}

function updateThermometerDisplay(temperature) {
    const mercuryDiv = document.getElementById('mercury');
    const tempTextDiv = document.getElementById('temperature-text');

    if (temperature === null) return;

    tempTextDiv.textContent = `${temperature}°C`;
    
    let heightPercentage = (temperature / 50) * 100;
    if (heightPercentage > 100) heightPercentage = 100;
    mercuryDiv.style.height = `${heightPercentage}%`;

    if (temperature >= 30) mercuryDiv.style.backgroundColor = 'red';
    else if (temperature >= 15) mercuryDiv.style.backgroundColor = 'orange';
    else mercuryDiv.style.backgroundColor = 'green';
}

// Hız ve araç çalışma durumu - Speed and vehicle status
let sa = 0, dk = 0, sn = 0;
let timeIntervalId = null;

async function fetchVehicleData() {
    try {
        const response = await fetch(`${API_BASE_URL}/data/velo`);
        const data = await response.json();
        const velocityDiv = document.getElementById('velocity');
        const runningStatusDiv = document.getElementById('runningStatus');
        const velocity = data.hiz;
// Olası sensör gürültüsünün ekarte edilmesi için eşik 0.10'dur - The threshold is 0.10 in order to eliminate potential sensor noise
        if (velocity <= 0.10) {
            velocityDiv.textContent = `Hız: 0.00 cm/s`;
            runningStatusDiv.textContent = `Araç Durumu: Çalışmıyor`;
            if (timeIntervalId !== null) {
                clearInterval(timeIntervalId);
                timeIntervalId = null;
            }
        } else {
            velocityDiv.textContent = `Hız: ${(velocity * 10).toFixed(2)} cm/s`;
            runningStatusDiv.textContent = `Araç Durumu: Çalışıyor`;
            if (timeIntervalId === null) {
                timeIntervalId = setInterval(incrementTime, 1000);
            }
        }
    } catch (error) {
        console.error('Araç verileri alınırken hata oluştu:', error);
    }
}

//Aracın hareket halinde olduğu sürenin ölçülmesi için fonksiyon - Function to measure the duration while the vehicle is moving
function incrementTime() {
    sn++;
    if (sn >= 60) { sn = 0; dk++; }
    if (dk >= 60) { dk = 0; sa++; }
    document.getElementById('time').innerText = 
        `Çalışma Süresi: ${String(sa).padStart(2, '0')}:${String(dk).padStart(2, '0')}:${String(sn).padStart(2, '0')}`;
}

// GPS ve harita verilerinin çekilmesi (Leaflet) - Fetching the GPS data and map (Leaflet)
const map = L.map('map').setView([40.1828, 29.0665], 13); // Default: Bursa
L.tileLayer('https://{s}[.basemaps.cartocdn.com/rastertiles/voyager/](https://.basemaps.cartocdn.com/rastertiles/voyager/){z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
let marker = L.marker([40.1828, 29.0665]).addTo(map);

async function fetchGpsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/data/durum`);
        const data = await response.json();
        
        if (data.gps && data.gps.latitude && data.gps.longitude) {
            const lat = data.gps.latitude;
            const lon = data.gps.longitude;
            
            document.getElementById('gps-data').innerText = `Enlem: ${lat}, Boylam: ${lon}`;
            document.getElementById('mapLink').innerHTML = 
                `<a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank">Google Maps'te Gör</a>`;
            
            map.setView([lat, lon], 15);
            marker.setLatLng([lat, lon]);
        }
    } catch (error) {
        console.error('GPS verisi alınamadı:', error);
    }
}

// Komut gönderme fonksiyonu - Command sender function
function sendCommand(command) {
    fetch(`${API_BASE_URL}/command/${command}`)
        .then(response => response.text())
        .then(data => showNotification(`Komut Gönderildi: ${command}`))
        .catch(error => showNotification('Hata: Komut gönderilemedi.'));
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.innerText = message;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

// Arayüzü çalıştıran blok - The block that operates interface
window.onload = () => {
    fetchBatteryData();
    fetchTemperatureData();
    fetchVehicleData();
    fetchGpsData();
    
    // Döngüler
    setInterval(fetchBatteryData, 5000);
    setInterval(fetchTemperatureData, 5000);
    setInterval(fetchVehicleData, 500);
    setInterval(fetchGpsData, 5000);
};