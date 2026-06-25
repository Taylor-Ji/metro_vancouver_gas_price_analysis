# 🛢️ Metro Vancouver Gas Price Dashboard  
# https://gas-mate.taylorji.com/
### *A Data-Driven Web Application for Fuel Insights*

![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?logo=render&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-F5788D?logo=chartdotjs&logoColor=white)

---

## 🌐 Overview

**Metro Vancouver Gas Price Dashboard** is a Flask-based web application that visualizes the historical **gas prices** across Metro Vancouver.  
It integrates with a hosted PostgreSQL database through Neon updated through an external ELT pipeline (Airflow), enabling users to view trends such as daily medians, lowest stations, and city-by-city comparisons.

This project demonstrates full-stack data engineering and web deployment — from **data scraping → database → analytics → visualization**.
All gas price data are from GasBuddy.

---

## 🚀 Key Features

✅ **Interactive Dashboard**
- Displays up-to-date and historical gas price data  
- Highlights cheapest cities and weekdays  
- Auto-updates with database refreshes

✅ **RESTful Flask API**
- JSON endpoints for downstream dashboards or external apps  
- Search and filter gas data by city or station  

✅ **Data Pipeline Integration**
- Connected to PostgreSQL database managed via Airflow DAGs  
- Supports ETL/ELT pipelines for clean, structured datasets  

✅ **Visualization Layer**
- Built with **Chart.js** for dynamic bar and line charts  
- Interactive tables and price ranking views  

✅ **Cloud-Deployed**
- **Backend:** Flask + Gunicorn hosted on Render  
- **Frontend:** static deployment via or Render  

---
