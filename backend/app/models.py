from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta, timezone
from .database import Base

def get_local_time():
    return datetime.now(timezone(timedelta(hours=-3))).replace(tzinfo=None)


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
    date = Column(DateTime, default=get_local_time)
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
    opened_at = Column(DateTime, default=get_local_time)
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
    created_at = Column(DateTime, default=get_local_time)

    product = relationship("Product")
