from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
from typing import List

# --- DATABASE SETUP ---
# DATABASE_URL = "postgresql://user:password@localhost/heladeria" # Comentado para usar en producción
DATABASE_URL = "sqlite:///./heladeria.db" # Usando SQLite temporalmente para facilitar pruebas
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLALCHEMY MODELS ---
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String) # ej. 'Helado', 'Cucurucho', 'Bebida'
    unit_price = Column(Float)
    is_by_weight = Column(Boolean, default=True) # True = gramos, False = unidad
    
    inventory = relationship("Inventory", back_populates="product", uselist=False)

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    current_amount_grams = Column(Float) # Si es por unidad, se guarda como float pero representa unidades
    min_stock = Column(Float)
    
    product = relationship("Product", back_populates="inventory")

class InventoryLog(Base):
    __tablename__ = "inventory_logs"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    movement_type = Column(String) # 'SALE', 'MANUAL_ADD', 'ADJUSTMENT'
    quantity_changed = Column(Float) # Positivo si entra, negativo si sale
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product")

class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
    payment_method = Column(String)
    
    items = relationship("SaleItem", back_populates="sale")

class SaleItem(Base):
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity_sold = Column(Float) # Gramos o Unidades
    subtotal = Column(Float)
    
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")

# Crear tablas (en producción usar Alembic)
Base.metadata.create_all(bind=engine)

# --- PYDANTIC SCHEMAS ---
class ProductCreate(BaseModel):
    name: str
    category: str
    unit_price: float
    is_by_weight: bool

class SaleItemCreate(BaseModel):
    product_id: int
    quantity_sold: float

class SaleCreate(BaseModel):
    payment_method: str
    items: List[SaleItemCreate]

class InventoryAdd(BaseModel):
    amount_to_add: float

class InventoryResponse(BaseModel):
    id: int
    name: str
    category: str
    unit_price: float
    is_by_weight: bool
    current_amount_grams: float
    min_stock: float
    max_capacity: float = 10000.0 # Valor por defecto para % de la barra en UI

class KPIData(BaseModel):
    ventas_del_dia: float
    efectivo_en_caja: float

class InventoryLogResponse(BaseModel):
    id: int
    product_name: str
    movement_type: str
    quantity_changed: float
    is_by_weight: bool
    created_at: datetime

from fastapi.middleware.cors import CORSMiddleware

# --- FASTAPI APP ---
app = FastAPI(title="Heladería MVP API")

# Configuración CORS para permitir peticiones desde el frontend (localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoints Productos
@app.post("/products/")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    # Crear inventario en 0 por defecto
    db_inv = Inventory(product_id=db_product.id, current_amount_grams=0, min_stock=1000)
    db.add(db_inv)
    db.commit()
    return db_product

@app.get("/products/")
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Product).offset(skip).limit(limit).all()

# Endpoints Inventario
@app.get("/inventory/", response_model=List[InventoryResponse])
def read_inventory(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    inventory_items = db.query(Inventory).offset(skip).limit(limit).all()
    response = []
    for inv in inventory_items:
        prod = inv.product
        response.append(InventoryResponse(
            id=prod.id,
            name=prod.name,
            category=prod.category,
            unit_price=prod.unit_price,
            is_by_weight=prod.is_by_weight,
            current_amount_grams=inv.current_amount_grams,
            min_stock=inv.min_stock
        ))
    return response

@app.post("/inventory/{product_id}/add")
def add_inventory(product_id: int, payload: InventoryAdd, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found for this product")
    
    inventory.current_amount_grams += payload.amount_to_add
    
    # Registrar Movimiento
    log = InventoryLog(
        product_id=product_id,
        movement_type="MANUAL_ADD",
        quantity_changed=payload.amount_to_add
    )
    db.add(log)
    
    db.commit()
    return {"message": "Stock added successfully", "new_amount": inventory.current_amount_grams}

@app.get("/inventory/logs/", response_model=List[InventoryLogResponse])
def get_inventory_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(InventoryLog).order_by(InventoryLog.created_at.desc()).limit(limit).all()
    response = []
    for log in logs:
        prod = log.product
        response.append(InventoryLogResponse(
            id=log.id,
            product_name=prod.name,
            movement_type=log.movement_type,
            quantity_changed=log.quantity_changed,
            is_by_weight=prod.is_by_weight,
            created_at=log.created_at
        ))
    return response

# Endpoints Ventas y Lógica de Stock
@app.post("/sales/")
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    # 1. Calcular total y verificar stock
    total = 0.0
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        if inventory.current_amount_grams < item.quantity_sold:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
        
        # Calcular subtotal
        subtotal = product.unit_price * item.quantity_sold
        total += subtotal

    # 2. Registrar Venta
    db_sale = Sale(total=total, payment_method=sale.payment_method)
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    # 3. Registrar Items y Descontar Stock
    for item in sale.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        subtotal = product.unit_price * item.quantity_sold
        
        db_sale_item = SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            quantity_sold=item.quantity_sold,
            subtotal=subtotal
        )
        db.add(db_sale_item)
        
        # Descontar del inventario
        inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
        inventory.current_amount_grams -= item.quantity_sold
        
        # Registrar Movimiento (Venta)
        log = InventoryLog(
            product_id=product.id,
            movement_type="SALE",
            quantity_changed=-item.quantity_sold
        )
        db.add(log)
    
    db.commit()
    return {"message": "Sale registered successfully", "sale_id": db_sale.id, "total": total}

# Endpoints KPIs
@app.get("/kpis/", response_model=KPIData)
def get_kpis(db: Session = Depends(get_db)):
    sales = db.query(Sale).all()
    today = datetime.utcnow().date()
    ventas_hoy = 0.0
    efectivo_hoy = 0.0
    
    for sale in sales:
        if sale.date.date() == today:
            ventas_hoy += sale.total
            if sale.payment_method.lower() == "efectivo":
                efectivo_hoy += sale.total
                
    return {"ventas_del_dia": ventas_hoy, "efectivo_en_caja": efectivo_hoy}
