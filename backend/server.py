from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
import string
import random
from datetime import datetime
import qrcode
import io
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class ShortenRequest(BaseModel):
    original_url: str
    custom_code: Optional[str] = None

class URLResponse(BaseModel):
    original_url: str
    short_code: str
    clicks: int
    created_at: datetime
    qr_code: str
    custom: bool

class StatsResponse(BaseModel):
    short_code: str
    clicks: int
    original_url: str


# Helper function to generate random short code
def generate_short_code(length=6):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


# Helper function to generate QR code as base64
def generate_qr_code(url: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"


@api_router.post("/shorten", response_model=URLResponse)
async def shorten_url(request: ShortenRequest):
    """Create a shortened URL"""
    
    # If custom code provided, check if it's available
    if request.custom_code:
        existing = await db.urls.find_one({"short_code": request.custom_code})
        if existing:
            raise HTTPException(status_code=400, detail="Custom code already taken")
        short_code = request.custom_code
        custom = True
    else:
        # Generate random code and ensure it's unique
        while True:
            short_code = generate_short_code()
            existing = await db.urls.find_one({"short_code": short_code})
            if not existing:
                break
        custom = False
    
    # Generate QR code
    full_url = f"{request.original_url}"
    qr_code_base64 = generate_qr_code(full_url)
    
    # Create URL document
    url_doc = {
        "original_url": request.original_url,
        "short_code": short_code,
        "clicks": 0,
        "created_at": datetime.utcnow(),
        "qr_code": qr_code_base64,
        "custom": custom
    }
    
    await db.urls.insert_one(url_doc)
    
    return URLResponse(**url_doc)


@api_router.get("/urls", response_model=List[URLResponse])
async def get_all_urls():
    """Get all shortened URLs"""
    urls = await db.urls.find().sort("created_at", -1).to_list(1000)
    return [URLResponse(**url) for url in urls]


@api_router.delete("/urls/{short_code}")
async def delete_url(short_code: str):
    """Delete a shortened URL"""
    result = await db.urls.delete_one({"short_code": short_code})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="URL not found")
    return {"message": "URL deleted successfully"}


@api_router.get("/stats/{short_code}", response_model=StatsResponse)
async def get_stats(short_code: str):
    """Get statistics for a shortened URL"""
    url = await db.urls.find_one({"short_code": short_code})
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    return StatsResponse(
        short_code=url["short_code"],
        clicks=url["clicks"],
        original_url=url["original_url"]
    )


@api_router.get("/{short_code}")
async def redirect_url(short_code: str):
    """Redirect to original URL and increment click count"""
    url = await db.urls.find_one({"short_code": short_code})
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    # Increment click count
    await db.urls.update_one(
        {"short_code": short_code},
        {"$inc": {"clicks": 1}}
    )
    
    return RedirectResponse(url=url["original_url"])


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
