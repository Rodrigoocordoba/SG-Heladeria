from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

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
