"""
models.py
---------
SQLAlchemy ORM model definitions for the Road Safety AI backend.

Table: traffic_laws
Stores traffic violation laws per country, city, and vehicle type,
including the fine amount, currency, and legal consequences.
"""

from sqlalchemy import Integer, String, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Column, Integer, String
from datetime import datetime
from sqlalchemy import Boolean, DateTime
from database import Base

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True, nullable=False)
#     # Notice we call it 'hashed_password', not 'password'
#     hashed_password = Column(String, nullable=False)


class TrafficLaw(Base):
    """
    Represents a single traffic law / violation record.

    Each row captures:
    - Where the law applies   (country, city)
    - What the violation is   (violation_name, vehicle_type)
    - The penalty             (fine_amount, currency, legal_consequence)
    """

    __tablename__ = "traffic_laws"

    # ------------------------------------------------------------------
    # Primary Key
    # ------------------------------------------------------------------
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
        doc="Auto-incrementing surrogate primary key.",
    )

    # ------------------------------------------------------------------
    # Location columns (both indexed for fast geo-based lookups)
    # ------------------------------------------------------------------
    country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="Country where the law is applicable (e.g., 'Bangladesh', 'Thailand').",
    )

    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        doc="City where the law is applicable (e.g., 'Dhaka', 'Bangkok').",
    )

    # ------------------------------------------------------------------
    # Violation columns
    # ------------------------------------------------------------------
    violation_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        doc="Human-readable name of the traffic violation (e.g., 'Speeding', 'Red Light').",
    )

    vehicle_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Category of vehicle this law applies to: 'Two-Wheeler' or 'Four-Wheeler'.",
    )

    # ------------------------------------------------------------------
    # Penalty columns
    # ------------------------------------------------------------------
    fine_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Monetary fine for this violation, expressed in the corresponding currency.",
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        doc="ISO currency code for the fine amount (e.g., 'BDT', 'THB').",
    )

    legal_consequence: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Additional legal consequences beyond the monetary fine (e.g., licence suspension).",
    )

    # ------------------------------------------------------------------
    # Composite index: common query pattern is country + city together
    # ------------------------------------------------------------------
    __table_args__ = (
        Index("ix_traffic_laws_country_city", "country", "city"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<TrafficLaw id={self.id} country='{self.country}' city='{self.city}' "
            f"violation='{self.violation_name}' vehicle='{self.vehicle_type}' "
            f"fine={self.fine_amount} {self.currency}>"
        )
# ── Paste this class into your models.py (after TrafficLaw) ──────
class User(Base):
    """
    Stores registered user accounts.
    Passwords are bcrypt-hashed — never stored in plain text.
    """
 
    __tablename__ = "users"
 
    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, index=True,
    )
    full_name: Mapped[str] = mapped_column(
        String(200), nullable=False,
        doc="User's display name.",
    )
    email: Mapped[str] = mapped_column(
        String(200), nullable=False, unique=True, index=True,
        doc="Unique login email address (stored lowercase).",
    )
    hashed_password: Mapped[str] = mapped_column(
        String(500), nullable=False,
        doc="bcrypt hash of the user's password.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False,
        doc="UTC timestamp of account creation.",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False,
        doc="False = soft-deleted / deactivated account.",
    )
 
    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}'>"
 