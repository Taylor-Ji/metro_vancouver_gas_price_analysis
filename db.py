import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

PG_HOST = os.getenv("PG_HOST")
PG_USER = os.getenv("PG_USER")
PG_PASS = os.getenv("PG_PASS")
PG_PORT = os.getenv("PG_PORT")
PG_DB = os.getenv("PG_DB")


DATABASE_URL = (
    f"postgresql+psycopg2://{PG_USER}:{PG_PASS}@{PG_HOST}:{PG_PORT}/{PG_DB}"
    f"?sslmode={os.getenv('PG_SSLMODE','require')}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
