from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import products, formats, inventory, sales, shifts, kpis

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Heladería SG — API v2 (Doble Velocidad)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(formats.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(shifts.router)
app.include_router(kpis.router)
