from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# --- DATABASE SETUP ---
# DATABASE_URL = "postgresql://user:password@localhost/heladeria" # Producción
DATABASE_URL = "sqlite:///./heladeria_v2.db" # Nueva BD para el sistema refactorizado
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============================================================================
# SQLALCHEMY MODELS — Sistema de Doble Velocidad
# ============================================================================

# --- Catálogo de Productos (Sabores de Helado, Envases, Insumos) ---
class Product(Base):
    """Representa un sabor de helado, un tipo de envase, o cualquier insumo."""
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)  # 'HELADO', 'ENVASE', 'BEBIDA', 'EXTRA'
    is_active = Column(Boolean, default=True)

    inventory = relationship("Inventory", back_populates="product", uselist=False)


# --- Inventario Físico (Solo para ENVASES e INSUMOS, NO helado) ---
class Inventory(Base):
    """Stock de ítems físicos que SÍ se descuentan en tiempo real (cucuruchos, vasitos, etc)."""
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True)
    current_stock = Column(Float, default=0)
    min_stock = Column(Float, default=50)

    product = relationship("Product", back_populates="inventory")


# --- Formatos de Venta (El "menú" del POS) ---
class SaleFormat(Base):
    """
    Define los formatos de venta que aparecerán en el POS.
    Ejemplo: '1 Kilo' -> precio $8500, 1000g de helado, max 4 sabores.
    Ejemplo: 'Cucurucho Simple' -> precio $3000, 150g, max 2 sabores.
    """
    __tablename__ = "sale_formats"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)           # '1 Kilo', 'Cucurucho Simple', '1/2 Kilo'
    price = Column(Float)                        # Precio en $
    total_grams = Column(Integer)                # Gramos totales de helado (1000, 500, 150...)
    max_flavors = Column(Integer)                # Máximo de sabores permitidos
    linked_product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    # Si tiene un envase asociado (cucurucho, vasito), se descuenta al vender.
    is_active = Column(Boolean, default=True)

    linked_product = relationship("Product")


# --- Ventas (Velocidad Comercial) ---
class Sale(Base):
    """Cabecera de una transacción de venta."""
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
    payment_method = Column(String)              # 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA'
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=True)

    items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    """
    Cada línea de una venta.
    Ejemplo: 1 venta de '1 Kilo' con sabores [DDL, Chocolate, Frutilla, Tramontana].
    """
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"))
    format_id = Column(Integer, ForeignKey("sale_formats.id"))
    quantity = Column(Integer, default=1)        # Cuántos de este formato (ej. 2 kilos)
    subtotal = Column(Float)

    sale = relationship("Sale", back_populates="items")
    format = relationship("SaleFormat")
    flavors = relationship("SaleItemFlavor", back_populates="sale_item")


class SaleItemFlavor(Base):
    """
    Registra qué sabores se eligieron en cada ítem vendido.
    Esto es PURAMENTE INFORMATIVO y se usa para calcular el 'Consumo Teórico'.
    NO modifica el stock de helado.
    """
    __tablename__ = "sale_item_flavors"
    id = Column(Integer, primary_key=True, index=True)
    sale_item_id = Column(Integer, ForeignKey("sale_items.id"))
    product_id = Column(Integer, ForeignKey("products.id"))     # El sabor elegido
    grams_assigned = Column(Float)               # Porción teórica en gramos

    sale_item = relationship("SaleItem", back_populates="flavors")
    product = relationship("Product")


# --- Turnos y Pesaje (Velocidad Operativa) ---
class Shift(Base):
    """Representa un turno de trabajo."""
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, index=True)
    shift_type = Column(String, default="MANANA")  # MANANA, TARDE, NOCHE
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    is_open = Column(Boolean, default=True)

    weighings = relationship("ShiftWeighing", back_populates="shift")
    sales = relationship("Sale")


class ShiftWeighing(Base):
    """
    Pesaje de un balde de helado al inicio y al final del turno.
    El 'consumo_real' es la diferencia que se calcula al cerrar.
    """
    __tablename__ = "shift_weighings"
    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"))
    product_id = Column(Integer, ForeignKey("products.id"))   # Sabor de helado
    initial_weight_grams = Column(Float)
    final_weight_grams = Column(Float, nullable=True)
    real_consumption = Column(Float, nullable=True)            # Se calcula al cerrar turno

    shift = relationship("Shift", back_populates="weighings")
    product = relationship("Product")


# --- Log de Auditoría (Se mantiene para envases e insumos) ---
class InventoryLog(Base):
    __tablename__ = "inventory_logs"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    movement_type = Column(String)  # 'SALE_ENVASE', 'MANUAL_ADD', 'ADJUSTMENT'
    quantity_changed = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")


# Crear todas las tablas
Base.metadata.create_all(bind=engine)


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

# --- Productos ---
class ProductCreate(BaseModel):
    name: str
    category: str  # 'HELADO', 'ENVASE', 'BEBIDA', 'EXTRA'

class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    is_active: bool

# --- Formatos de Venta ---
class SaleFormatCreate(BaseModel):
    name: str
    price: float
    total_grams: int
    max_flavors: int
    linked_product_id: Optional[int] = None

class SaleFormatResponse(BaseModel):
    id: int
    name: str
    price: float
    total_grams: int
    max_flavors: int
    linked_product_id: Optional[int] = None
    is_active: bool

# --- Ventas (POS) ---
class SaleItemFlavorInput(BaseModel):
    product_id: int  # ID del sabor de helado

class SaleItemInput(BaseModel):
    format_id: int
    quantity: int = 1
    flavors: List[SaleItemFlavorInput]

class SaleCreateInput(BaseModel):
    """
    JSON que el frontend envía al backend al confirmar una venta en el POS.
    Ejemplo:
    {
      "payment_method": "EFECTIVO",
      "shift_id": 1,
      "items": [
        {
          "format_id": 1,          // '1 Kilo'
          "quantity": 1,
          "flavors": [
            {"product_id": 1},     // Dulce de Leche
            {"product_id": 3},     // Chocolate
            {"product_id": 5},     // Frutilla
            {"product_id": 7}      // Tramontana
          ]
        }
      ]
    }
    """
    payment_method: str
    shift_id: Optional[int] = None
    items: List[SaleItemInput]

# --- Inventario (Envases) ---
class InventoryAdd(BaseModel):
    amount_to_add: float

class InventoryResponse(BaseModel):
    id: int
    name: str
    category: str
    current_stock: float
    min_stock: float

# --- Turnos ---
class ShiftWeighingInput(BaseModel):
    product_id: int
    weight_grams: float

class OpenShiftInput(BaseModel):
    shift_type: str = "MANANA"  # MANANA, TARDE, NOCHE
    weighings: List[ShiftWeighingInput]

class CloseShiftInput(BaseModel):
    weighings: List[ShiftWeighingInput]

# --- KPIs ---
class KPIData(BaseModel):
    ventas_del_dia: float
    efectivo_en_caja: float
    turno_activo: bool

# --- Auditoría de Merma ---
class FlavorConsumptionReport(BaseModel):
    product_id: int
    product_name: str
    initial_grams: float
    final_grams: float
    real_consumption_grams: float
    theoretical_grams: float
    difference_grams: float   # Positivo = merma (se gastó más), Negativo = sobró
    difference_percent: float

class ShiftAuditReport(BaseModel):
    shift_id: int
    shift_type: str
    opened_at: datetime
    closed_at: Optional[datetime]
    total_sales_count: int
    total_sales_amount: float
    total_efectivo: float
    total_transfer: float
    flavors: List[FlavorConsumptionReport]

class ShiftListItem(BaseModel):
    id: int
    shift_type: str
    opened_at: datetime
    closed_at: Optional[datetime]
    is_open: bool
    total_sales: float

# --- Logs ---
class InventoryLogResponse(BaseModel):
    id: int
    product_name: str
    movement_type: str
    quantity_changed: float
    created_at: datetime


# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(title="Heladería SG — API v2 (Doble Velocidad)")

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


# ============================================================================
# ENDPOINTS — Productos
# ============================================================================

@app.post("/products/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Si es ENVASE, crear inventario en 0
    if product.category == "ENVASE":
        db_inv = Inventory(product_id=db_product.id, current_stock=0, min_stock=50)
        db.add(db_inv)
        db.commit()

    return db_product

@app.get("/products/", response_model=List[ProductResponse])
def read_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.is_active == True)
    if category:
        query = query.filter(func.upper(Product.category) == category.upper())
    return query.all()


# ============================================================================
# ENDPOINTS — Formatos de Venta
# ============================================================================

@app.post("/sale-formats/", response_model=SaleFormatResponse)
def create_sale_format(fmt: SaleFormatCreate, db: Session = Depends(get_db)):
    db_format = SaleFormat(**fmt.dict())
    db.add(db_format)
    db.commit()
    db.refresh(db_format)
    return db_format

@app.get("/sale-formats/", response_model=List[SaleFormatResponse])
def read_sale_formats(db: Session = Depends(get_db)):
    return db.query(SaleFormat).filter(SaleFormat.is_active == True).all()


# ============================================================================
# ENDPOINTS — Inventario (Solo Envases e Insumos)
# ============================================================================

@app.get("/inventory/", response_model=List[InventoryResponse])
def read_inventory(db: Session = Depends(get_db)):
    items = db.query(Inventory).all()
    return [
        InventoryResponse(
            id=inv.product.id,
            name=inv.product.name,
            category=inv.product.category,
            current_stock=inv.current_stock,
            min_stock=inv.min_stock
        ) for inv in items
    ]

@app.post("/inventory/{product_id}/add")
def add_inventory(product_id: int, payload: InventoryAdd, db: Session = Depends(get_db)):
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found for this product")

    inventory.current_stock += payload.amount_to_add

    log = InventoryLog(
        product_id=product_id,
        movement_type="MANUAL_ADD",
        quantity_changed=payload.amount_to_add
    )
    db.add(log)
    db.commit()
    return {"message": "Stock added successfully", "new_stock": inventory.current_stock}

@app.get("/inventory/logs/", response_model=List[InventoryLogResponse])
def get_inventory_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(InventoryLog).order_by(InventoryLog.created_at.desc()).limit(limit).all()
    return [
        InventoryLogResponse(
            id=log.id,
            product_name=log.product.name,
            movement_type=log.movement_type,
            quantity_changed=log.quantity_changed,
            created_at=log.created_at
        ) for log in logs
    ]


# ============================================================================
# ENDPOINTS — Ventas / POS (Velocidad Comercial)
# ============================================================================

@app.post("/sales/")
def create_sale(sale: SaleCreateInput, db: Session = Depends(get_db)):
    """
    Endpoint transaccional del POS.
    1. Registra el ingreso financiero (Sale + SaleItems).
    2. Guarda los sabores elegidos en SaleItemFlavors (consumo teórico).
    3. Descuenta envases físicos del inventario (si el formato tiene uno vinculado).
    4. NO toca el stock de helado.
    """
    total = 0.0

    # Validar formatos y calcular total
    for item in sale.items:
        fmt = db.query(SaleFormat).filter(SaleFormat.id == item.format_id).first()
        if not fmt:
            raise HTTPException(status_code=404, detail=f"Format {item.format_id} not found")
        if len(item.flavors) > fmt.max_flavors:
            raise HTTPException(
                status_code=400,
                detail=f"Format '{fmt.name}' allows max {fmt.max_flavors} flavors, got {len(item.flavors)}"
            )
        total += fmt.price * item.quantity

    # Crear la venta
    db_sale = Sale(total=total, payment_method=sale.payment_method, shift_id=sale.shift_id)
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    # Crear items y sabores
    for item in sale.items:
        fmt = db.query(SaleFormat).filter(SaleFormat.id == item.format_id).first()
        subtotal = fmt.price * item.quantity

        db_item = SaleItem(
            sale_id=db_sale.id,
            format_id=item.format_id,
            quantity=item.quantity,
            subtotal=subtotal
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        # Guardar sabores (consumo teórico proporcional)
        grams_per_flavor = fmt.total_grams / len(item.flavors) if item.flavors else 0
        for flavor in item.flavors:
            product = db.query(Product).filter(Product.id == flavor.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Flavor {flavor.product_id} not found")

            db_flavor = SaleItemFlavor(
                sale_item_id=db_item.id,
                product_id=flavor.product_id,
                grams_assigned=grams_per_flavor * item.quantity
            )
            db.add(db_flavor)

        # Descontar envase físico (si el formato tiene uno vinculado)
        if fmt.linked_product_id:
            inv = db.query(Inventory).filter(Inventory.product_id == fmt.linked_product_id).first()
            if inv:
                inv.current_stock -= item.quantity
                log = InventoryLog(
                    product_id=fmt.linked_product_id,
                    movement_type="SALE_ENVASE",
                    quantity_changed=-item.quantity
                )
                db.add(log)

    db.commit()
    return {"message": "Sale registered successfully", "sale_id": db_sale.id, "total": total}


@app.get("/sales/recent")
def get_recent_sales(limit: int = 20, db: Session = Depends(get_db)):
    """Últimas ventas del día para el dashboard."""
    today = datetime.utcnow().date()
    sales = db.query(Sale).order_by(Sale.id.desc()).limit(limit).all()
    result = []
    for s in sales:
        items_desc = []
        for item in s.items:
            fmt = db.query(SaleFormat).filter(SaleFormat.id == item.format_id).first()
            flavor_names = [f.product.name for f in item.flavors]
            items_desc.append({
                "format_name": fmt.name if fmt else "?",
                "quantity": item.quantity,
                "flavors": flavor_names,
            })
        result.append({
            "id": s.id,
            "total": s.total,
            "payment_method": s.payment_method,
            "date": s.date.isoformat(),
            "items": items_desc,
        })
    return result


# ============================================================================
# ENDPOINTS — Turnos y Pesaje (Velocidad Operativa)
# ============================================================================

@app.post("/shifts/open")
def open_shift(payload: OpenShiftInput, db: Session = Depends(get_db)):
    """Abrir un turno registrando el peso inicial de cada balde."""
    existing = db.query(Shift).filter(Shift.is_open == True).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya hay un turno abierto. Cierre el turno actual primero.")

    shift = Shift(shift_type=payload.shift_type.upper())
    db.add(shift)
    db.commit()
    db.refresh(shift)

    for w in payload.weighings:
        weighing = ShiftWeighing(
            shift_id=shift.id,
            product_id=w.product_id,
            initial_weight_grams=w.weight_grams
        )
        db.add(weighing)

    db.commit()
    return {"message": "Turno abierto", "shift_id": shift.id, "shift_type": shift.shift_type}


@app.post("/shifts/{shift_id}/close", response_model=ShiftAuditReport)
def close_shift(shift_id: int, payload: CloseShiftInput, db: Session = Depends(get_db)):
    """Cerrar turno, calcular consumo real y devolver reporte completo."""
    shift = db.query(Shift).filter(Shift.id == shift_id, Shift.is_open == True).first()
    if not shift:
        raise HTTPException(status_code=404, detail="No se encontro un turno abierto con ese ID.")

    for w in payload.weighings:
        weighing = db.query(ShiftWeighing).filter(
            ShiftWeighing.shift_id == shift_id,
            ShiftWeighing.product_id == w.product_id
        ).first()
        if weighing:
            weighing.final_weight_grams = w.weight_grams
            weighing.real_consumption = weighing.initial_weight_grams - w.weight_grams

    shift.is_open = False
    shift.closed_at = datetime.utcnow()
    db.commit()

    # Generar reporte directamente al cerrar
    return _build_audit_report(shift_id, db)


@app.get("/shifts/active")
def get_active_shift(db: Session = Depends(get_db)):
    """Obtener el turno activo."""
    shift = db.query(Shift).filter(Shift.is_open == True).first()
    if not shift:
        return {"shift": None}
    return {
        "shift": {
            "id": shift.id,
            "shift_type": shift.shift_type,
            "opened_at": shift.opened_at,
            "weighings": [
                {
                    "product_id": w.product_id,
                    "product_name": w.product.name,
                    "initial_weight_grams": w.initial_weight_grams
                } for w in shift.weighings
            ]
        }
    }


@app.get("/shifts/history", response_model=List[ShiftListItem])
def get_shifts_history(limit: int = 20, db: Session = Depends(get_db)):
    """Historial de turnos cerrados."""
    shifts = db.query(Shift).filter(Shift.is_open == False).order_by(Shift.id.desc()).limit(limit).all()
    result = []
    for s in shifts:
        total = sum(sale.total for sale in s.sales)
        result.append(ShiftListItem(
            id=s.id, shift_type=s.shift_type or "MANANA", opened_at=s.opened_at,
            closed_at=s.closed_at, is_open=s.is_open, total_sales=total
        ))
    return result


# ============================================================================
# ENDPOINTS — Auditoría: Consumo Teórico vs Real (Merma)
# ============================================================================

def _build_audit_report(shift_id: int, db: Session) -> ShiftAuditReport:
    """Construye el reporte de auditoría de un turno."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    # 1. Calcular Consumo Teórico por sabor
    theoretical = {}
    sales = db.query(Sale).filter(Sale.shift_id == shift_id).all()
    total_amount = sum(s.total for s in sales)
    total_efectivo = sum(s.total for s in sales if s.payment_method.upper() == "EFECTIVO")
    total_transfer = sum(s.total for s in sales if s.payment_method.upper() != "EFECTIVO")

    for sale in sales:
        for item in sale.items:
            for flavor in item.flavors:
                pid = flavor.product_id
                if pid not in theoretical:
                    theoretical[pid] = {"name": flavor.product.name, "grams": 0.0}
                theoretical[pid]["grams"] += flavor.grams_assigned

    # 2. Obtener datos del pesaje
    weighing_data = {}
    for w in shift.weighings:
        weighing_data[w.product_id] = {
            "name": w.product.name,
            "initial": w.initial_weight_grams or 0.0,
            "final": w.final_weight_grams or 0.0,
            "real": w.real_consumption if w.real_consumption is not None else 0.0
        }

    # 3. Cruzar datos
    all_pids = set(list(theoretical.keys()) + list(weighing_data.keys()))
    flavors_report = []

    for pid in all_pids:
        theo = theoretical.get(pid, {"grams": 0.0})["grams"]
        wd = weighing_data.get(pid, {"initial": 0.0, "final": 0.0, "real": 0.0})
        real = wd["real"]
        diff = real - theo
        pct = (diff / theo * 100) if theo > 0 else 0.0
        name = weighing_data.get(pid, theoretical.get(pid, {})).get("name", "Desconocido")

        flavors_report.append(FlavorConsumptionReport(
            product_id=pid,
            product_name=name,
            initial_grams=round(wd["initial"], 2),
            final_grams=round(wd["final"], 2),
            real_consumption_grams=round(real, 2),
            theoretical_grams=round(theo, 2),
            difference_grams=round(diff, 2),
            difference_percent=round(pct, 2)
        ))

    return ShiftAuditReport(
        shift_id=shift.id,
        shift_type=shift.shift_type,
        opened_at=shift.opened_at,
        closed_at=shift.closed_at,
        total_sales_count=len(sales),
        total_sales_amount=round(total_amount, 2),
        total_efectivo=round(total_efectivo, 2),
        total_transfer=round(total_transfer, 2),
        flavors=flavors_report
    )


@app.get("/shifts/{shift_id}/audit", response_model=ShiftAuditReport)
def get_shift_audit(shift_id: int, db: Session = Depends(get_db)):
    return _build_audit_report(shift_id, db)


# ============================================================================
# ENDPOINTS — KPIs
# ============================================================================

@app.get("/kpis/", response_model=KPIData)
def get_kpis(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    sales = db.query(Sale).all()
    ventas_hoy = 0.0
    efectivo_hoy = 0.0

    for sale in sales:
        if sale.date.date() == today:
            ventas_hoy += sale.total
            if sale.payment_method.upper() == "EFECTIVO":
                efectivo_hoy += sale.total

    turno_activo = db.query(Shift).filter(Shift.is_open == True).first() is not None

    return KPIData(
        ventas_del_dia=ventas_hoy,
        efectivo_en_caja=efectivo_hoy,
        turno_activo=turno_activo
    )
