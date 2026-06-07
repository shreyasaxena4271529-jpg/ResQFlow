# ResQFlow - Multi-API Integration Guide

## Overview

ResQFlow now integrates **three powerful APIs** for comprehensive disaster response and emergency management:

1. **Weather Data API**
2. **Real-time Disasters API**
3. **Air Quality API**

---

## 🌤️ Weather Data API

### What It Does
Fetches real-time weather information across multiple Indian cities including:
- **Current Temperature & Wind Speed**
- **Humidity Levels**
- **Precipitation (Current & Hourly Forecast)**
- **Daily Weather Forecast**

### Data Source
- **Provider**: Open-Meteo (Free API, No Key Required)
- **Locations Monitored**: 
  - Delhi (28.6139°N, 77.2090°E)
  - Mumbai (19.0760°N, 72.8777°E)
  - Chennai (13.0827°N, 80.2707°E)
  - Bangalore (12.9716°N, 77.5946°E)
  - Kolkata (22.5726°N, 88.3639°E)

### API Endpoint
```
https://api.open-meteo.com/v1/forecast
?latitude={lat}&longitude={lon}
&current_weather=true
&hourly=precipitation,temperature_2m,relativehumidity_2m,windspeed_10m,weathercode
&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum
&timezone=Asia/Kolkata
```

### Function
```javascript
fetchWeatherData(lat, lon, location)  // Fetch single location
fetchMultipleWeatherData()             // Fetch all 5 locations
```

### Usage Example
```javascript
const weather = await fetchWeatherData(28.6139, 77.2090, "Delhi");
console.log(weather.temperature);     // 32.5°C
console.log(weather.humidity);        // 65%
console.log(weather.windspeed);       // 12 km/h
```

---

## 🌍 Real-time Disasters API

### What It Does
Monitors and aggregates real-time disaster data:
- **Earthquake Detection** (Magnitude, Location, Depth, Time)
- **Weather Alerts** (Heavy Rain, Storms, Cyclones)
- **Indian Meteorological Alerts** (via CAP Feed)

### Data Sources
| Disaster Type | Provider | Endpoint |
|--------------|----------|----------|
| Earthquakes | USGS | `earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson` |
| Weather Alerts | IMD CAP | `cap-sources.s3.amazonaws.com/in-imd-en/rss.xml` |
| Multi-Hazards | GDACS | `gdacs.org/AppData/alerts/rss.xml` |

### Geographic Coverage
- **Latitude**: 6°N to 38°N
- **Longitude**: 68°E to 97°E
- **Region**: Entire Indian Subcontinent

### Functions
```javascript
fetchEarthquakeData()      // Get earthquake events
fetchDisasterAlerts()      // Get combined earthquake + weather alerts
fetchImdCapAlerts()        // Get IMD meteorological alerts
```

### Usage Example
```javascript
const disasters = await fetchDisasterAlerts();
console.log(disasters.earthquakes);  // Array of recent quakes
console.log(disasters.imdAlerts);    // Array of IMD weather alerts
```

### Response Structure
```javascript
{
  earthquakes: [
    {
      magnitude: 4.5,
      place: "Uttarakhand Region",
      depth: 15.2,
      coords: [32.15, 79.45],
      time: "2026-06-05T10:30:00Z",
      significance: 125
    }
  ],
  imdAlerts: [
    {
      type: "warning",
      title: "Heavy Rain Alert",
      desc: "Northeast Monsoon warning...",
      source: "IMD"
    }
  ]
}
```

---

## 💨 Air Quality API

### What It Does
Monitors air quality across India:
- **AQI Index** (0-500 scale)
- **Particulate Matter** (PM2.5, PM10)
- **Pollutants** (NO2, O3, SO2)
- **AQI Categories** (Good → Hazardous)

### Data Source
- **Provider**: Open-Meteo (Free API, No Key Required)
- **Categories**:
  - **Good**: AQI 0-50
  - **Moderate**: AQI 51-100
  - **Unhealthy for Sensitive Groups**: AQI 101-150
  - **Unhealthy**: AQI 151-200
  - **Very Unhealthy**: AQI 201-300
  - **Hazardous**: AQI 301+

### API Endpoint
```
https://api.open-meteo.com/v1/air-quality
?latitude={lat}&longitude={lon}
&current=pm10,pm2_5,no2,o3,so2
&timezone=Asia/Kolkata
```

### Functions
```javascript
fetchAirQualityData(lat, lon, location)  // Fetch single location
fetchMultipleAirQualityData()             // Fetch all 5 locations
```

### Usage Example
```javascript
const aqi = await fetchAirQualityData(28.6139, 77.2090, "Delhi");
console.log(aqi.aqi);        // 156 (Unhealthy)
console.log(aqi.category);   // "Unhealthy"
console.log(aqi.pm2_5);      // 78.5 µg/m³
console.log(aqi.pm10);       // 125.3 µg/m³
```

---

## 📊 Integration in ResQFlow

### Component State Variables
```javascript
const [weatherData, setWeatherData] = useState([]);           // Multi-location weather
const [airQualityData, setAirQualityData] = useState([]);     // Multi-location AQI
const [disasterAlerts, setDisasterAlerts] = useState({        // Real-time disasters
  earthquakes: [],
  imdAlerts: [],
  lastUpdate: null
});
```

### Data Loading (useEffect)
```javascript
// Called every 5 minutes (300000ms)
const loadLiveData = async () => {
  // Parallel fetch from all 3 API groups
  const [weatherList, aqiList, disasterData] = await Promise.all([
    fetchMultipleWeatherData(),
    fetchMultipleAirQualityData(),
    fetchDisasterAlerts()
  ]);
};
```

### Risk Calculations
The app automatically calculates risk metrics:
```javascript
Flood Risk = (Next Hour Precipitation × 3) + (Humidity × 0.2)
Earthquake Risk = (Magnitude × 15) + (Event Count × 4)
Air Quality Risk = (AQI / 500) × 100
Cyclone Risk = Next Hour Precipitation × 1.8
```

---

## 🚀 How to Use in Your Chatbot

When the user asks questions, the chatbot now has access to:

### Weather Questions
- "What's the weather in Delhi?"
- "Will there be rain today?"
- "Current temperature and humidity?"
- "Wind speed in Mumbai?"

### Disaster Questions
- "Any earthquakes detected?"
- "What are today's weather alerts?"
- "Is there a cyclone warning?"
- "Recent seismic activity?"

### Air Quality Questions
- "What's the air quality today?"
- "Is it safe to go outside?"
- "Air pollution levels in my city?"
- "Which city has best air quality?"

### The chatbot will respond with:
✅ Real-time data from APIs
✅ Risk assessments
✅ Health recommendations
✅ Emergency guidance

---

## 📡 Update Frequency

| API | Interval | Notes |
|-----|----------|-------|
| Weather | 5 minutes | Real-time updates |
| Earthquakes | 5 minutes | Live USGS feed |
| Air Quality | 5 minutes | Hourly forecasts |
| IMD Alerts | 5 minutes | Weather warnings |

---

## 🔧 Customization

### Add More Cities
Edit `WEATHER_LOCATIONS` in line ~15:
```javascript
const WEATHER_LOCATIONS = {
  "Delhi": { lat: 28.6139, lon: 77.2090 },
  "Hyderabad": { lat: 17.3850, lon: 78.4867 },  // Add new city
};
```

### Change Update Frequency
In the `useEffect`, modify the interval:
```javascript
const intervalId = setInterval(loadLiveData, 60000); // Update every 60 seconds
```

### Modify Risk Thresholds
Adjust the risk calculations in the `loadLiveData` function to customize sensitivity.

---

## 📝 API Keys Required

| API | Key Required? | Get Key |
|-----|---------------|---------|
| Weather (Open-Meteo) | ❌ No | Free tier included |
| Earthquakes (USGS) | ❌ No | Public feed |
| Air Quality (Open-Meteo) | ❌ No | Free tier included |
| IMD CAP Alerts | ❌ No | Public feed |
| Gemini (Chatbot) | ✅ Yes | https://aistudio.google.com/app/apikey |
| WAQI (Alternative AQI) | ✅ Yes (optional) | https://waqi.info/api |

---

## 🐛 Troubleshooting

### Weather Data Not Loading
- Check internet connection
- Verify coordinates are valid
- Check browser console (F12) for errors

### Earthquakes Not Showing
- USGS feed may have regional delays
- Check geographic filter (6°N-38°N, 68°E-97°E)
- Minimum magnitude threshold: varies

### Air Quality Missing
- Some locations may not have data
- Fallback to national average if unavailable
- Check AQI value range (0-500)

### Alerts Not Updating
- IMD feed may be delayed during extreme weather
- GDACS updates may take 10-15 minutes
- Check API endpoint status

---

## 📚 References

- **Open-Meteo Weather**: https://open-meteo.com/
- **USGS Earthquake Feed**: https://earthquake.usgs.gov/earthquakes/feed/
- **IMD CAP Alerts**: https://www.imd.gov.in/
- **GDACS Multi-Hazard**: https://www.gdacs.org/
- **AQI Standards**: https://www.epa.gov/air-quality/air-quality-index-aqi-basics

---

## 💡 Tips

✅ Use mobile-friendly queries for better AI responses
✅ Cite source data when providing recommendations
✅ Update risk assessments with fresh data every 5 minutes
✅ Test APIs individually before relying on combined data
✅ Monitor API response times in console

