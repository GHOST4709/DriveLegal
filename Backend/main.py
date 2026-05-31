"""
main.py
-------
Road Safety AI — FastAPI backend for the BIMSTEC Hackathon.

Endpoints:
  GET  /api/laws/{country}/{city}   → List all traffic laws for a location
  GET  /api/calculate               → Look up a specific fine by query params
  POST /api/chat                    → LangChain-powered AI chatbot

Run:
    uvicorn main:app --reload --port 8000

Environment variable required for the chat endpoint:
    OPENAI_API_KEY=sk-...
"""

import os
from dotenv import load_dotenv
load_dotenv()
import logging
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

# LangChain imports
# from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
# from langchain_community.tools import DuckDuckGoSearchRun
from duckduckgo_search import DDGS

# Local modules
from database import engine, get_db, Base
from models import TrafficLaw, User
from schemas import (
    TrafficLawResponse,
    ChatbotExtraction,
    ChatRequest,
    ChatResponse,
)
from security import get_password_hash # <-- Added security import here
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("road_safety_ai")


# ---------------------------------------------------------------------------
# Lifespan: create DB tables on startup (idempotent)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure all SQLAlchemy-mapped tables exist before accepting requests."""
    logger.info("Startup: creating database tables if not present...")
    Base.metadata.create_all(bind=engine)
    logger.info("Startup complete.")
    yield
    logger.info("Shutdown: application stopped.")


# ---------------------------------------------------------------------------
# FastAPI app initialisation
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Road Safety AI — BIMSTEC Hackathon",
    description=(
        "Backend API for querying traffic laws and fines in Bangladesh (Dhaka) "
        "and Thailand (Bangkok), with an AI-powered natural-language chatbot."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow all origins for hackathon local development
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # open for all origins during hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================================================
# Endpoint A: GET /api/laws/{country}/{city}
# ===========================================================================

@app.get(
    "/api/laws/{country}/{city}",
    response_model=list[TrafficLawResponse],
    summary="List all traffic laws for a country/city",
    tags=["Traffic Laws"],
)
def get_laws_by_location(
    country: str,
    city: str,
    db: Session = Depends(get_db),
) -> list[TrafficLaw]:
    """
    Returns **all** traffic law records that match the given country and city.

    - Path parameter `country` and `city` are matched case-insensitively.
    - Returns an empty list (not 404) when no records match, so the frontend
      can display a friendly "no data found" message.

    **Example:** `GET /api/laws/Bangladesh/Dhaka`
    """
    logger.info("GET /api/laws/%s/%s", country, city)

    laws = (
        db.query(TrafficLaw)
        .filter(
            func.lower(TrafficLaw.country) == func.lower(country),
            func.lower(TrafficLaw.city) == func.lower(city),
        )
        .order_by(TrafficLaw.vehicle_type, TrafficLaw.violation_name)
        .all()
    )

    logger.info("Found %d record(s) for %s / %s", len(laws), country, city)
    return laws


# ===========================================================================
# Endpoint B: GET /api/calculate
# ===========================================================================

@app.get(
    "/api/calculate",
    response_model=TrafficLawResponse,
    summary="Calculate the fine for a specific violation",
    tags=["Traffic Laws"],
)
def calculate_fine(
    city: str = Query(..., description="City name (e.g., 'Dhaka', 'Bangkok')"),
    violation_name: str = Query(..., description="Violation name (e.g., 'Speeding')"),
    vehicle_type: str = Query(..., description="'Two-Wheeler' or 'Four-Wheeler'"),
    db: Session = Depends(get_db),
) -> TrafficLaw:
    """
    Looks up the **exact fine and legal consequence** for a specific
    city + violation + vehicle-type combination.

    All query parameters are matched case-insensitively (LOWER LIKE).

    **Example:**
    `GET /api/calculate?city=Dhaka&violation_name=Speeding&vehicle_type=Two-Wheeler`
    """
    logger.info(
        "GET /api/calculate  city=%s  violation=%s  vehicle=%s",
        city, violation_name, vehicle_type,
    )

    law = (
        db.query(TrafficLaw)
        .filter(
            func.lower(TrafficLaw.city) == func.lower(city),
            func.lower(TrafficLaw.violation_name) == func.lower(violation_name),
            func.lower(TrafficLaw.vehicle_type) == func.lower(vehicle_type),
        )
        .first()
    )

    if not law:
        logger.warning(
            "No record found for city=%s violation=%s vehicle=%s",
            city, violation_name, vehicle_type,
        )
        raise HTTPException(
            status_code=404,
            detail=(
                f"No traffic law found for city='{city}', "
                f"violation='{violation_name}', vehicle_type='{vehicle_type}'. "
                "Please verify the parameters and try again."
            ),
        )

    logger.info("Match found: id=%d  fine=%d %s", law.id, law.fine_amount, law.currency)
    return law


# ===========================================================================
# Endpoint C: POST /api/chat  (LangChain AI Chatbot)
# ===========================================================================

def _build_extraction_chain() -> Any:
    """
    Builds and returns a LangChain chain that:
      1. Accepts a raw user message.
      2. Instructs the LLM (gpt-4o-mini) to extract city, violation,
         and vehicle_type as a ChatbotExtraction structured output.

    The chain uses with_structured_output() which leverages OpenAI's
    function-calling API under the hood to guarantee a valid, typed object.
    """
    llm = ChatGroq(
    model="llama-3.1-8b-instant",     
    api_key=os.environ.get("GROQ_API_KEY")
)

    extraction_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are an expert entity extractor for a Road Safety AI system 
covering BIMSTEC countries, specifically Bangladesh (city: Dhaka) and 
Thailand (city: Bangkok).

Your ONLY job is to extract three pieces of information from the user's message:
1. city       — The city being asked about. Normalise to 'Dhaka' or 'Bangkok'.
2. violation  — The traffic violation. Map user language to canonical names:
                  Speeding | Red Light | No Helmet | Wrong Way |
                  No Seatbelt | Using Mobile While Driving | Drunk Driving
3. vehicle_type — Exactly 'Two-Wheeler' (bikes, motorcycles, scooters) 
                  or 'Four-Wheeler' (cars, vans, trucks, buses).

If the city is ambiguous, default to 'Dhaka'.
If the vehicle type is ambiguous, default to 'Four-Wheeler'.
Always return structured output matching the schema exactly.""",
            ),
            ("human", "{user_message}"),
        ]
    )

    # with_structured_output forces the LLM to return a validated ChatbotExtraction
    structured_llm = llm.with_structured_output(ChatbotExtraction)

    # LCEL chain: prompt → structured LLM
    return extraction_prompt | structured_llm


def _build_response_chain() -> Any:
    """
    Builds and returns a LangChain chain that:
      1. Receives the extracted entities + the matching DB record (or a
         'not found' message).
      2. Generates a warm, informative, conversational reply for the user.
    """
    llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.environ.get("GROQ_API_KEY")
)

    response_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """You are a friendly and knowledgeable Road Safety AI assistant 
for BIMSTEC countries, specialising in Bangladesh and Thailand traffic laws.

You will be given:
- The user's original question.
- Structured data extracted from the question (city, violation, vehicle type).
- The result from the official traffic law database (either a law record or a 
  'not found' notice).

Your task:
- If a law record is provided: explain the fine amount, currency, and legal 
  consequence clearly and conversationally. Add a brief road-safety tip.
- If no record was found: politely inform the user that you couldn't find that 
  specific law in the database, suggest they verify with local authorities, and 
  invite them to rephrase their query.
- Keep the tone helpful, concise, and encouraging of safe driving.
- Do NOT make up fine amounts or consequences not present in the provided data.""",
            ),
            (
                "human",
                """User question: {user_message}

Extracted entities:
  City         : {city}
  Violation    : {violation}
  Vehicle type : {vehicle_type}

Database result:
{db_result}

Please provide a natural, conversational response.""",
            ),
        ]
    )

    # Standard LLM output — we want plain text here
    return response_prompt | llm


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    summary="AI chatbot — ask about any traffic law in natural language",
    tags=["Chatbot"],
)
def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
) -> ChatResponse:
    """
    **Full LangChain AI chatbot flow:**

    1. **Extract entities** — `gpt-4o-mini` with `with_structured_output()` parses
       the user's message into `city`, `violation`, and `vehicle_type`.
    2. **Query DB** — The extracted entities are used in a case-insensitive
       SQLAlchemy query against the local SQLite database.
    3. **Generate reply** — A second LangChain chain formats the DB result
       (or a graceful "not found" message) into a conversational AI response.
    4. **Return** — `{"reply": "...", "extracted_data": {...}}` is returned.

    **Example request body:**
    ```json
    {"message": "What's the fine for running a red light on my motorcycle in Dhaka?"}
    ```
    """
    user_message = body.message.strip()
    logger.info("POST /api/chat  message='%s'", user_message)

    # ------------------------------------------------------------------
    # Step 1: Build chains
    # ------------------------------------------------------------------
    try:
        extraction_chain = _build_extraction_chain()
        response_chain = _build_response_chain()
    except Exception as exc:
        logger.error("Failed to build LangChain chains: %s", exc)
        raise HTTPException(
            status_code=500,
            detail="AI service initialisation failed. Ensure OPENAI_API_KEY is set.",
        ) from exc

    # ------------------------------------------------------------------
    # Step 2: Extract structured entities from the user's message
    # ------------------------------------------------------------------
    try:
        extraction: ChatbotExtraction = extraction_chain.invoke(
            {"user_message": user_message}
        )
    except Exception as exc:
        logger.error("LangChain extraction failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"AI entity extraction failed: {exc}",
        ) from exc

    logger.info(
        "Extracted → city='%s'  violation='%s'  vehicle_type='%s'",
        extraction.city,
        extraction.violation,
        extraction.vehicle_type,
    )

    # ------------------------------------------------------------------
    # Step 3: Query the SQLite database with the extracted parameters
    # ------------------------------------------------------------------
    law: TrafficLaw | None = (
        db.query(TrafficLaw)
        .filter(
            func.lower(TrafficLaw.city) == func.lower(extraction.city),
            func.lower(TrafficLaw.violation_name) == func.lower(extraction.violation),
            func.lower(TrafficLaw.vehicle_type) == func.lower(extraction.vehicle_type),
        )
        .first()
    )

    # ------------------------------------------------------------------
    # Step 4: Build the DB result string for the second LLM prompt
    # ------------------------------------------------------------------
    if law:
        db_result_text = (
            f"Record found:\n"
            f"  Country            : {law.country}\n"
            f"  City               : {law.city}\n"
            f"  Violation          : {law.violation_name}\n"
            f"  Vehicle type       : {law.vehicle_type}\n"
            f"  Fine amount        : {law.fine_amount} {law.currency}\n"
            f"  Legal consequence  : {law.legal_consequence}"
        )
        extracted_data: dict = {
            "city": extraction.city,
            "violation": extraction.violation,
            "vehicle_type": extraction.vehicle_type,
            "db_record_found": True,
            "id": law.id,
            "country": law.country,
            "violation_name": law.violation_name,
            "fine_amount": law.fine_amount,
            "currency": law.currency,
            "legal_consequence": law.legal_consequence,
        }
        logger.info(
            "DB match found: id=%d  fine=%d %s", law.id, law.fine_amount, law.currency
        )
    else:
        logger.warning("No DB match. Triggering fallback Web Search...")
        
        # --- THE LIGHTWEIGHT WEB SEARCH MAGIC ---
        try:
            # Hit DuckDuckGo and grab the top 2 results
            results = DDGS().text(user_message, max_results=2)
            
            # Stitch the text snippets together
            search_snippets = "\n".join([f"- {res['body']}" for res in results])
            
            db_result_text = (
                f"NO DATABASE RECORD FOUND.\n"
                f"WEB SEARCH RESULTS:\n{search_snippets}"
            )
            logger.info("Web search completed successfully.")
        except Exception as e:
            logger.error("Web search failed: %s", e)
            db_result_text = "NO DATABASE RECORD FOUND. WEB SEARCH FAILED."
        # ----------------------------
        
        extracted_data = {
            "city": extraction.city,
            "violation": extraction.violation,
            "vehicle_type": extraction.vehicle_type,
            "db_record_found": False,
            "web_search_used": True,
        }

    # ------------------------------------------------------------------
    # Step 5: Generate the conversational AI reply
    # ------------------------------------------------------------------
    try:
        ai_message = response_chain.invoke(
            {
                "user_message": user_message,
                "city": extraction.city,
                "violation": extraction.violation,
                "vehicle_type": extraction.vehicle_type,
                "db_result": db_result_text,
            }
        )
        reply_text: str = ai_message.content
    except Exception as exc:
        logger.error("LangChain response generation failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"AI response generation failed: {exc}",
        ) from exc

    logger.info("Chat response generated successfully.")

    # ------------------------------------------------------------------
    # Step 6: Return the final structured response
    # ------------------------------------------------------------------
    return ChatResponse(
        reply=reply_text,
        extracted_data=extracted_data,
    )

# ===========================================================================
# Endpoint D: User Authentication  (SignUp)
# ===========================================================================
# We define the expected JSON payload from the frontend
class UserCreate(BaseModel):
    username: str
    password: str

@app.post(
    "/api/signup",
    summary="Register a new user",
    tags=["Authentication"],
)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user by checking for duplicates, hashing their 
    plain-text password, and securely saving them to the SQLite database.
    """
    logger.info("POST /api/signup for username='%s'", user.username)

    # 1. Check if the username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        logger.warning("Signup failed: Username '%s' already exists.", user.username)
        raise HTTPException(status_code=400, detail="Username already registered")

    # 2. Hash the plain text password securely
    secure_password = get_password_hash(user.password)

    # 3. Create the database record
    new_user = User(username=user.username, hashed_password=secure_password)
    
    # 4. Save it to the SQLite database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info("User '%s' registered successfully.", user.username)
    return {"message": f"User {user.username} created successfully!"}

# ===========================================================================
# Health check
# ===========================================================================

@app.get(
    "/health",
    summary="Health check",
    tags=["Utility"],
    include_in_schema=True,
)
def health_check() -> dict:
    """Returns 200 OK with a simple status payload. Useful for monitoring."""
    return {"status": "ok", "service": "Road Safety AI", "version": "1.0.0"}
