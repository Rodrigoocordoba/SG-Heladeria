from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Sale, SaleItem, SaleItemFlavor, SaleFormat, Product, Inventory, InventoryLog
from ..schemas import SaleCreateInput

router = APIRouter(prefix="/sales", tags=["sales"])

@router.post("/")
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

@router.get("/recent")
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
