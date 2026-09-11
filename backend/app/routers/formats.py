from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import SaleFormat
from ..schemas import SaleFormatCreate, SaleFormatResponse

router = APIRouter(prefix="/sale-formats", tags=["formats"])

@router.post("/", response_model=SaleFormatResponse)
def create_sale_format(fmt: SaleFormatCreate, db: Session = Depends(get_db)):
    db_format = SaleFormat(**fmt.dict())
    db.add(db_format)
    db.commit()
    db.refresh(db_format)
    return db_format

@router.get("/", response_model=List[SaleFormatResponse])
def read_sale_formats(db: Session = Depends(get_db)):
    return db.query(SaleFormat).filter(SaleFormat.is_active == True).all()
