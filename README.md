# 🚨 ResQFlow

**An AI-Powered Disaster Response & Emergency Management Assistant**

ResQFlow is an intelligent, multilingual disaster response dashboard built specifically for emergency management in India. Powered by Google's **Gemini AI**, it provides real-time emergency guidance, evacuation routes, and situational awareness for natural disasters like floods, earthquakes, wildfires, and cyclones.

---

## 🌟 Key Features

- 🤖 **Gemini-Powered Emergency Chatbot**: Instant, life-saving advice for floods, fires, and earthquakes.
- 🌍 **Real-Time Disaster Tracking**: Integrates with live data feeds (USGS Earthquakes, IMD CAP Alerts).
- 🌤️ **Live Environmental Data**: Monitors Air Quality Index (AQI) and extreme weather conditions.
- 🗣️ **Multilingual Support**: Supports English, Hindi, Tamil, Telugu, and Bengali.
- 📍 **Interactive Dashboard**: Visualizes resource allocation, risk predictions, and active alerts.
- ⚡ **Frontend-Only Architecture**: Built entirely with React (CDN), requiring no backend server.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (via CDN), Babel Standalone, HTML5, CSS3
- **AI Model**: Google Gemini 2.5 Flash API
- **Data Integrations**: 
  - [USGS Earthquake API](https://earthquake.usgs.gov/)
  - [Open-Meteo](https://open-meteo.com/) (Weather & AQI)
  - IMD CAP Feeds (Disaster Alerts)

---

## 🚀 How to Run Locally

Because this project is built entirely on the frontend, running it locally is incredibly easy.

1. Clone or download this repository.
2. Create a file named `config.local.js` in the root directory.
3. Add your Gemini API key to the file like this:
   ```javascript
   window.RESQFLOW_CONFIG = {
     GEMINI_API_KEY: "your_api_key_here"
   };
   ```
4. Open `index.html` in your web browser. That's it!

*(Note: `config.local.js` is included in `.gitignore` to prevent accidental exposure of your API key).*

---

## 🔒 Deployment & Security

This project is configured to be deployed via **GitHub Pages**. 

To protect the Gemini API key, the repository uses a custom **GitHub Action** (`deploy.yml`) that dynamically injects the API key during the build process using **GitHub Secrets**. 

**Deployment Steps:**
1. Go to your repository **Settings > Secrets and variables > Actions**.
2. Add a new repository secret named `GEMINI_API_KEY` with your actual key.
3. Go to **Settings > Pages** and set the Source to **GitHub Actions**.
4. The workflow will automatically build and deploy your secure site!

---

## ⚠️ Disclaimer

ResQFlow is a prototype application. While it uses real-time APIs, AI-generated advice should never completely replace official government guidance during a severe emergency. Always listen to local authorities and emergency broadcasts (e.g., NDRF, IMD).
