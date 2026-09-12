from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import products, formats, inventory, sales, shifts, kpis

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Heladería SG — API v2 (Doble Velocidad)")

@app.delete("/api/v1/reset-shifts-danger")
def reset_shifts(db: Session = Depends(get_db)):
    from app.models import Shift, ShiftWeighing, Sale, SaleItem, SaleItemFlavor
    db.query(ShiftWeighing).delete()
    db.query(SaleItemFlavor).delete()
    db.query(SaleItem).delete()
    db.query(Sale).delete()
    db.query(Shift).delete()
    db.commit()
    return {"msg": "Shifts reset"}

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
