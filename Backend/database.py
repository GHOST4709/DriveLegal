"""
database.py
-----------
SQLAlchemy engine, session factory, and declarative Base for the
Road Safety AI backend. Uses a local SQLite file: bimstec_traffic.db
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ---------------------------------------------------------------------------
# Database URL — SQLite file stored next to the running process
# ---------------------------------------------------------------------------
DATABASE_URL = "sqlite:///./bimstec_traffic.db"

# ---------------------------------------------------------------------------
# Engine
# check_same_thread=False is required for SQLite when used with FastAPI
# (multiple threads may call the same connection during the request lifecycle)
# ---------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,          # Set True during development for SQL query logging
)

# ---------------------------------------------------------------------------
# Session factory
# autocommit=False  → explicit commits are required (safe default)
# autoflush=False   → prevents premature flushes before we're ready
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ---------------------------------------------------------------------------
# Declarative Base — all ORM models inherit from this
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Dependency helper — used by FastAPI route functions via Depends()
# Yields a DB session and guarantees it is closed after the request ends.
# ---------------------------------------------------------------------------
def get_db():
    """
    FastAPI dependency that provides a SQLAlchemy Session.

    Usage in a route:
        @app.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
