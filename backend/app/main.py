from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from .database import Base, get_session, init_db

app = FastAPI(on_startup=[init_db])

# Import and include routers
from .api import products, rag
app.include_router(products.router)
app.include_router(rag.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check(session: AsyncSession = Depends(get_session)):
    return {"status": "ok", "message": "Service is healthy"}
