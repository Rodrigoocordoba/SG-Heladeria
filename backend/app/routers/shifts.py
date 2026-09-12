from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from ..database import get_db
from ..models import Shift, ShiftWeighing, Sale
from ..schemas import OpenShiftInput, CloseShiftInput, ShiftAuditReport, ShiftListItem, FlavorConsumptionReport

router = APIRouter(prefix="/shifts", tags=["shifts"])

@router.post("/open")
def open_shift(payload: OpenShiftInput, db: Session = Depends(get_db)):
    """Abrir un turno registrando el peso inicial de cada balde."""
    existing = db.query(Shift).filter(Shift.is_open == True).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya hay un turno abierto. Cierre el turno actual primero.")

    from app.models import get_local_time
    today_start = get_local_time().replace(hour=0, minute=0, second=0, microsecond=0)
    
    existing_type = db.query(Shift).filter(
        Shift.shift_type == payload.shift_type.upper(),
        Shift.opened_at >= today_start
    ).first()
    if existing_type:
        raise HTTPException(status_code=400, detail=f"El turno de {payload.shift_type.upper()} ya fue realizado hoy.")

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


@router.post("/{shift_id}/close", response_model=ShiftAuditReport)
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
    from app.models import get_local_time
    shift.closed_at = get_local_time()
    db.commit()

    # Generar reporte directamente al cerrar
    return _build_audit_report(shift_id, db)


@router.get("/active")
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


@router.get("/history", response_model=List[ShiftListItem])
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


@router.get("/{shift_id}/audit", response_model=ShiftAuditReport)
def get_shift_audit(shift_id: int, db: Session = Depends(get_db)):
    return _build_audit_report(shift_id, db)


def _build_audit_report(shift_id: int, db: Session) -> ShiftAuditReport:
    """Construye el reporte de auditoría de un turno."""
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    # 1. Ya no calculamos teórico, solo devolvemos el pesaje
    sales = db.query(Sale).filter(Sale.shift_id == shift_id).all()
    total_amount = sum(s.total for s in sales)
    total_efectivo = sum(s.total for s in sales if s.payment_method.upper() == "EFECTIVO")
    total_transfer = sum(s.total for s in sales if s.payment_method.upper() != "EFECTIVO")

    # 2. Obtener datos del pesaje
    weighing_data = {}
    for w in shift.weighings:
        weighing_data[w.product_id] = {
            "name": w.product.name,
            "initial": w.initial_weight_grams or 0.0,
            "final": w.final_weight_grams or 0.0,
            "real": w.real_consumption if w.real_consumption is not None else 0.0
        }

    flavors_report = []

    for pid, wd in weighing_data.items():
        real = wd["real"]
        name = wd.get("name", "Desconocido")

        flavors_report.append(FlavorConsumptionReport(
            product_id=pid,
            product_name=name,
            initial_grams=round(wd["initial"], 2),
            final_grams=round(wd["final"], 2),
            real_consumption_grams=round(real, 2),
            theoretical_grams=0.0,
            difference_grams=round(real, 2),
            difference_percent=0.0
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

@router.get("/daily", response_model=List[ShiftAuditReport])
def get_daily_audit(date: str = None, db: Session = Depends(get_db)):
    """Genera un reporte consolidado del día devolviendo los reportes de todos los turnos."""
    if not date:
        from app.models import get_local_time
        date = get_local_time().strftime("%Y-%m-%d")
    
    shifts = db.query(Shift).all()
    daily_shifts = [s for s in shifts if s.opened_at.strftime("%Y-%m-%d") == date]
    
    if not daily_shifts:
        raise HTTPException(status_code=404, detail=f"No hay turnos para la fecha {date}")
        
    daily_shifts.sort(key=lambda x: x.opened_at)
    
    reports = []
    for s in daily_shifts:
        reports.append(_build_audit_report(s.id, db))
        
    return reports
