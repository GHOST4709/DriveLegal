"""
seed.py
-------
One-shot script that:
  1. Creates all tables in bimstec_traffic.db (safe to run multiple times
     because it uses CREATE IF NOT EXISTS semantics via SQLAlchemy).
  2. Inserts exactly 20 realistic TrafficLaw records:
       • 10 for Dhaka, Bangladesh  (currency: BDT)
       • 10 for Bangkok, Thailand  (currency: THB)
  3. Guards against duplicate seeding — if any rows already exist the
     script prints a notice and exits without inserting again.

Usage:
    python seed.py
"""

import sys
from database import engine, SessionLocal, Base

# Import models so Base.metadata knows about the table before create_all()
from models import TrafficLaw  # noqa: F401 — needed for side-effect registration


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

DHAKA_RECORDS = [
    # ── Two-Wheeler violations ────────────────────────────────────────────
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Speeding",
        vehicle_type="Two-Wheeler",
        fine_amount=1000,
        currency="BDT",
        legal_consequence="Warning issued; repeat offence results in licence suspension for 15 days.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Red Light",
        vehicle_type="Two-Wheeler",
        fine_amount=500,
        currency="BDT",
        legal_consequence="Fine payable within 30 days; vehicle impounded if unpaid.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="No Helmet",
        vehicle_type="Two-Wheeler",
        fine_amount=300,
        currency="BDT",
        legal_consequence="Immediate fine on the spot; vehicle held until fine is paid.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Wrong Way",
        vehicle_type="Two-Wheeler",
        fine_amount=800,
        currency="BDT",
        legal_consequence="Fine plus 7-day licence suspension for first offence.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Using Mobile While Driving",
        vehicle_type="Two-Wheeler",
        fine_amount=600,
        currency="BDT",
        legal_consequence="Fine and mandatory road-safety awareness class.",
    ),
    # ── Four-Wheeler violations ───────────────────────────────────────────
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Speeding",
        vehicle_type="Four-Wheeler",
        fine_amount=2000,
        currency="BDT",
        legal_consequence="Fine; repeat offence leads to 30-day licence suspension.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Red Light",
        vehicle_type="Four-Wheeler",
        fine_amount=1500,
        currency="BDT",
        legal_consequence="Fine payable within 30 days; vehicle impounded if unpaid.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="No Seatbelt",
        vehicle_type="Four-Wheeler",
        fine_amount=500,
        currency="BDT",
        legal_consequence="On-the-spot fine; educational leaflet issued.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Wrong Way",
        vehicle_type="Four-Wheeler",
        fine_amount=2500,
        currency="BDT",
        legal_consequence="Fine plus mandatory court appearance for repeat offenders.",
    ),
    TrafficLaw(
        country="Bangladesh",
        city="Dhaka",
        violation_name="Drunk Driving",
        vehicle_type="Four-Wheeler",
        fine_amount=5000,
        currency="BDT",
        legal_consequence="Immediate arrest; licence cancelled; criminal charges under MV Act.",
    ),
]

BANGKOK_RECORDS = [
    # ── Two-Wheeler violations ────────────────────────────────────────────
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Speeding",
        vehicle_type="Two-Wheeler",
        fine_amount=1000,
        currency="THB",
        legal_consequence="Fine; points deducted from driving record; repeat offence leads to licence suspension.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Red Light",
        vehicle_type="Two-Wheeler",
        fine_amount=500,
        currency="THB",
        legal_consequence="On-the-spot fine; photo evidence retained for record.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="No Helmet",
        vehicle_type="Two-Wheeler",
        fine_amount=500,
        currency="THB",
        legal_consequence="Immediate fine; vehicle may not proceed until compliant equipment is worn.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Wrong Way",
        vehicle_type="Two-Wheeler",
        fine_amount=1000,
        currency="THB",
        legal_consequence="Fine and 5-day licence suspension for first offence.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Using Mobile While Driving",
        vehicle_type="Two-Wheeler",
        fine_amount=500,
        currency="THB",
        legal_consequence="Fine and mandatory safe-driving seminar.",
    ),
    # ── Four-Wheeler violations ───────────────────────────────────────────
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Speeding",
        vehicle_type="Four-Wheeler",
        fine_amount=2000,
        currency="THB",
        legal_consequence="Fine; 3 demerit points; licence suspended after 12 accumulated points.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Red Light",
        vehicle_type="Four-Wheeler",
        fine_amount=1000,
        currency="THB",
        legal_consequence="Fine and demerit points; camera-based enforcement active citywide.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="No Seatbelt",
        vehicle_type="Four-Wheeler",
        fine_amount=500,
        currency="THB",
        legal_consequence="On-the-spot fine for driver and each unbelted passenger.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Wrong Way",
        vehicle_type="Four-Wheeler",
        fine_amount=2000,
        currency="THB",
        legal_consequence="Fine, demerit points, and mandatory defensive-driving course.",
    ),
    TrafficLaw(
        country="Thailand",
        city="Bangkok",
        violation_name="Drunk Driving",
        vehicle_type="Four-Wheeler",
        fine_amount=20000,
        currency="THB",
        legal_consequence=(
            "Immediate arrest; licence revoked; imprisonment up to 1 year "
            "under Thailand Land Traffic Act B.E. 2522."
        ),
    ),
]


# ---------------------------------------------------------------------------
# Main seeding logic
# ---------------------------------------------------------------------------

def seed_database() -> None:
    """Create tables and populate them with seed data."""

    print("=== Road Safety AI — Database Seeder ===\n")

    # Step 1: create all tables (no-op if they already exist)
    print("[1/3] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("      Tables created (or already present).\n")

    db = SessionLocal()
    try:
        # Step 2: guard against duplicate seeding
        existing_count = db.query(TrafficLaw).count()
        if existing_count > 0:
            print(
                f"[!]  Database already contains {existing_count} record(s). "
                "Skipping seed to avoid duplicates.\n"
                "     Drop the 'traffic_laws' table and re-run if you need a fresh seed."
            )
            return

        # Step 3: insert all records in a single transaction
        print("[2/3] Inserting seed records...")
        all_records = DHAKA_RECORDS + BANGKOK_RECORDS
        db.add_all(all_records)
        db.commit()

        # Step 4: confirm
        final_count = db.query(TrafficLaw).count()
        print(f"      Inserted {final_count} records successfully.\n")

        print("[3/3] Seed summary:")
        dhaka_count = (
            db.query(TrafficLaw)
            .filter(TrafficLaw.city == "Dhaka")
            .count()
        )
        bangkok_count = (
            db.query(TrafficLaw)
            .filter(TrafficLaw.city == "Bangkok")
            .count()
        )
        print(f"      • Dhaka, Bangladesh  : {dhaka_count} records (BDT)")
        print(f"      • Bangkok, Thailand  : {bangkok_count} records (THB)")
        print("\n=== Seeding complete! ===")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERROR] Seeding failed — transaction rolled back.\nDetails: {exc}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
