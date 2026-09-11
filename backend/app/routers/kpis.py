from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import Sale, Shift
from ..schemas import KPIData

router = APIRouter(prefix="/kpis", tags=["kpis"])

@router.get("/", response_model=KPIData)
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
