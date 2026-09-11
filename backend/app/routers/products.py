from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from ..database import get_db
from ..models import Product, Inventory
from ..schemas import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=ProductResponse)
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

@router.get("/", response_model=List[ProductResponse])
def read_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Product).filter(Product.is_active == True)
    if category:
        query = query.filter(func.upper(Product.category) == category.upper())
    return query.all()
