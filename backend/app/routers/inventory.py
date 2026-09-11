from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Inventory, InventoryLog
from ..schemas import InventoryResponse, InventoryAdd, InventoryLogResponse

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/", response_model=List[InventoryResponse])
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

@router.post("/{product_id}/add")
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

@router.get("/logs/", response_model=List[InventoryLogResponse])
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
