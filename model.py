from sqlalchemy.orm import declarative_base, Mapped, mapped_column
from sqlalchemy import Integer, String, Float, TIMESTAMP, Boolean

Base = declarative_base()


class GasPrice(Base):
    __tablename__ = "clean.gasbuddy_metro_van"  # match your existing table
    __table_args__ = {"schema": "clean"}  # <-- IMPORTANT
    scraped_at: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), primary_key=True)
    address: Mapped[str] = mapped_column(String, primary_key=True)
    city: Mapped[str] = mapped_column(String)
    rank: Mapped[int] = mapped_column(Integer)
    station: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String)
    price_per_litre: Mapped[float] = mapped_column(Float)
    price_cents: Mapped[float] = mapped_column(Float)
    verified: Mapped[bool] = mapped_column(Boolean)
    address_key: Mapped[str] = mapped_column(String, unique=True, index=True)
    
    