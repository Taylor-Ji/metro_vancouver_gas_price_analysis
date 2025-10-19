from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from sqlalchemy import text
import numpy as np
import pandas as pd
import os

from db import SessionLocal
from model import GasPrice
from helpers import get_daily_meian_gas_price, convert_scraped_at_to_datetime


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [os.getenv("FRONTEND_ORIGIN", "*")]}})


@app.get("/healthz")
def healthz():
    return {"ok": True}, 200

@app.get("/api/hello")
def hello():
    return jsonify(message="Hello from Flask!")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_all_data_sql')
def get_all_data_sql():
    session = SessionLocal()
    try:
        q = text("""
            SELECT * 
FROM clean.gasbuddy_metro_van
ORDER BY scraped_at DESC
LIMIT 100
        """)
        rows = session.execute(q).mappings().all()
        copy_df = pd.DataFrame(rows)
        copy_df = convert_scraped_at_to_datetime(copy_df)
        # rows is a list of dict-like RowMappings already
        out = []
        
        for r in copy_df.itertuples(index=False):
            out.append({
                "scraped_at": r.scraped_at.isoformat() if r.scraped_at else None,
                "city": r.city,
                "weekday": r.scraped_at.day_name() if r.scraped_at else None,
                # "rank": r.rank,
                "station": r.station,
                "address": r.address,
                # "price_per_litre": float(r.price_per_litre) if r.price_per_litre is not None else None,
                "price_cents": float(r.price_cents) if r.price_cents is not None else None,
                # "verified": bool(r.verified),
            })

        return jsonify(out)
    finally:
        session.close()
        

@app.route('/get_daily_median_gas_price')
def get_daily_median_gas_price():
    session = SessionLocal()
    try:
        q = text("""
            SELECT * 
            FROM clean.gasbuddy_metro_van
        """)
        rows = session.execute(q).mappings().all()
        # rows is a list of dict-like RowMappings already
        data = []
        for r in rows:
            data.append({
                "scraped_at": r["scraped_at"].isoformat() if r["scraped_at"] else None,
                "city": r["city"],
                "rank": r["rank"],
                "station": r["station"],
                "address": r["address"],
                "price_per_litre": float(r["price_per_litre"]) if r["price_per_litre"] is not None else None,
                "price_cents": float(r["price_cents"]) if r["price_cents"] is not None else None,
                "verified": bool(r["verified"]),
            })
        df = pd.DataFrame(data)
        df = convert_scraped_at_to_datetime(df)
        median_prices = get_daily_meian_gas_price(df)
        # median_prices is a Series indexed by weekday; convert to list of objects
        out = []
        for weekday, med in median_prices.items():
            out.append({"weekday": weekday, "median_price": float(med)})
        return jsonify(out)
    finally:
        session.close()


@app.route('/get_median_by_city')
def get_median_by_city():
    session = SessionLocal()
    try:
        q = text("""
            SELECT * 
            FROM clean.gasbuddy_metro_van
        """)
        rows = session.execute(q).mappings().all()
        # rows is a list of dict-like RowMappings already
        data = []
        for r in rows:
            data.append({
                "scraped_at": r["scraped_at"].isoformat() if r["scraped_at"] else None,
                "city": r["city"],
                "rank": r["rank"],
                "station": r["station"],
                "address": r["address"],
                "price_per_litre": float(r["price_per_litre"]) if r["price_per_litre"] is not None else None,
                "price_cents": float(r["price_cents"]) if r["price_cents"] is not None else None,
                "verified": bool(r["verified"]),
            })
        df = pd.DataFrame(data)
        df = convert_scraped_at_to_datetime(df)
        median_prices = df.groupby('city')['price_cents'].median().sort_values()
        out = []
        for city, med in median_prices.items():
            out.append({"city": city, "median_price_cents": float(med)})
        return jsonify(out)
    finally:
        session.close()

@app.route('/get_daily_lowest_price')
def get_daily_lowest_price():
    session = SessionLocal()
    try:
        q = text("""
           WITH priced AS (
  SELECT
      (scraped_at AT TIME ZONE 'America/Vancouver')::date AS local_date,
      scraped_at,
      city,
      station,
      address,
      price_cents,
      verified,
      rank,
      ROW_NUMBER() OVER (
        PARTITION BY (scraped_at AT TIME ZONE 'America/Vancouver')::date
        ORDER BY
          price_cents ASC,                 -- lowest price first
          CASE WHEN verified THEN 0 ELSE 1 END, -- prefer verified
          rank ASC,                        -- prefer better rank if tied
          scraped_at ASC                   -- stable tie-break
      ) AS rn
  FROM clean.gasbuddy_metro_van
  WHERE price_cents BETWEEN 100 AND 250      -- guard against bad data
)
SELECT
    local_date,
    price_cents,
    station,
    city,
    address,
    verified,
    scraped_at
FROM priced
WHERE rn = 1
ORDER BY local_date;
        """)
        rows = session.execute(q).mappings().all()
        # rows is a list of dict-like RowMappings with keys: date, lowest_price, station, address, city
        out = []
        for r in rows:
            # r['date'] will typically be a date object (or string); stringify safely
            # date_val = r.get('date')
            # if hasattr(date_val, 'isoformat'):
            #     date_str = date_val.isoformat()
            # else:
            #     date_str = str(date_val) if date_val is not None else None

            out.append({
                "date": r.get('local_date').isoformat() if r.get('local_date') else None,
                "city": r.get('city'),
                "station": r.get('station'),
                "address": r.get('address'),
                "price_cents": float(r['price_cents']) if r.get('price_cents') is not None else None,
            })
        return jsonify(out)
    finally:
        session.close()
        

@app.route('/get_median_station_rank')
def get_median_station_rank():
    session = SessionLocal()
    try:
        q = text("""
            SELECT station, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_cents) as price_cents
            FROM clean.gasbuddy_metro_van
            GROUP BY station
            ORDER BY price_cents ASC
        """)
        rows = session.execute(q).mappings().all()
        print(rows)
        # rows is a list of dict-like RowMappings already
        data = []
        for r in rows:
            data.append({
                "station": r["station"],
                "price_cents": float(r["price_cents"]) if r["price_cents"] is not None else None,
            })
        df = pd.DataFrame(data)
        # Sort by price_cents ascending (lowest first)
        df = df.sort_values(by='price_cents', ascending=True).reset_index(drop=True)
        # Assign rank starting from 1
        df['rank'] = df.index + 1
        out = []
        for r in df.itertuples(index=False):
            out.append({
                "station": r.station,
                "price_cents": float(r.price_cents) if r.price_cents is not None else None,
                "rank": int(r.rank),
            })
        return jsonify(out)

        # df = convert_scraped_at_to_datetime(df)
    finally:
        session.close()



if __name__ == '__main__':
    app.run(port=8000, debug=True)
