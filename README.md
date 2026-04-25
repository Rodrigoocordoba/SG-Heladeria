# SG-Heladería 🍦 - Versión 2.0 (Arquitectura Doble Velocidad)

Sistema Integral de Gestión (ERP/POS) para una heladería. Esta versión introduce un rediseño completo de la interfaz ("Tablet-First" con Dark Mode y Glassmorphism) y un cambio estructural profundo en la lógica de negocio usando el modelo de **"Doble Velocidad"**:
1. **Velocidad Comercial**: El Punto de Venta (POS) es extremadamente rápido. Se registra el "Consumo Teórico" basado en formatos vendidos (ej: 1 Kilo) y los sabores elegidos, descontando únicamente el envase físico en tiempo real.
2. **Velocidad Operativa**: Mediante un sistema de control de Turnos, se registra el peso real de los baldes al abrir y cerrar la caja. Esto permite calcular el "Consumo Real" y auditar con precisión milimétrica las mermas o diferencias contra las ventas facturadas.

## 🚀 Tecnologías Utilizadas

### Backend
* **Python / FastAPI**: Framework web asíncrono y de alto rendimiento.
* **SQLAlchemy**: ORM para la interacción con la base de datos relacional.
* **SQLite**: Base de datos utilizada para desarrollo local (`heladeria_v2.db`).

### Frontend
* **Next.js 14 (App Router)**: Framework de React.
* **Zustand**: Manejo de estado global ultrarrápido y simplificado para todos los módulos.
* **Tailwind CSS**: Framework utilitario para un diseño moderno, responsivo y táctil.
* **Shadcn/UI & Sonner**: Componentes accesibles y sistema de notificaciones en tiempo real (Toasts).

---

## 📦 Módulos del Sistema

* 🛒 **Punto de Venta (POS)**: Interfaz de venta rápida dividida en Panel de Catálogo (máquina de estados Formatos -> Sabores) y Carrito. Bloqueado por seguridad si no hay un turno abierto.
* 📊 **Dashboard**: Panel principal con métricas financieras (Ventas del día, Efectivo, Transferencias), alertas tempranas de bajo stock, y log histórico de transacciones recientes.
* 📦 **Inventario**: Control estricto del stock físico (envases, cucuruchos, insumos). Muestra barras de progreso de consumo y registra un log de auditoría inmutable por cada movimiento (`SALE_ENVASE`, `MANUAL_ADD`).
* 🕐 **Turnos & Auditoría**: Flujo de caja que obliga a registrar el pesaje inicial y final de cada sabor de helado. Genera reportes automáticos detallando diferencias en gramos entre el stock real y el teórico.

---

## 📂 Estructura del Proyecto (Monorepo)

```text
SG-Heladeria/
│
├── backend/                  # API FastAPI (Puerto 8000)
│   ├── app/
│   │   ├── main.py           # Modelos de SQLAlchemy, Pydantic Schemas y Endpoints
│   ├── requirements.txt      # Dependencias de Python
│   ├── seed_data.py          # Script de poblado inicial de datos de prueba
│   └── heladeria_v2.db       # Base de datos local (SQLite)
│
└── frontend/                 # Aplicación Next.js (Puerto 3000)
    ├── src/
    │   ├── app/(app)/        # Layout App Router
    │   │   ├── pos/          # Pantalla de Ventas
    │   │   ├── dashboard/    # Panel de KPI
    │   │   ├── inventario/   # Gestión de Insumos
    │   │   └── turnos/       # Apertura, Cierre y Pesajes
    │   ├── store/            # Stores de Zustand (pos-store, shifts-store, etc)
    │   └── components/       # Componentes reutilizables UI
    └── package.json
```

---

## 🛠️ Cómo ejecutar el proyecto localmente

### 1. Levantar el Backend (API)

Abre una terminal en la raíz del proyecto y ejecuta:

```bash
cd backend
python -m venv venv
# Activar entorno virtual (Windows)
.\venv\Scripts\activate
# Instalar dependencias
pip install -r requirements.txt

# (Opcional) Cargar datos de prueba (Formatos y Sabores)
python seed_data.py

# Iniciar servidor
uvicorn app.main:app --reload
```
La API estará corriendo en `http://127.0.0.1:8000`.

### 2. Levantar el Frontend (Web)

Abre otra terminal en la raíz del proyecto y ejecuta:

```bash
cd frontend
npm install
npm run dev
```
La interfaz de usuario estará corriendo en `http://localhost:3000`.

---

## 📝 Roadmap (Próximos pasos)
* [ ] Exportación a PDF de la Auditoría Financiera de Cierre de Turnos.
* [ ] Gestión visual del ABM (Alta, Baja y Modificación) de Sabores y Formatos desde la UI.
* [ ] Persistencia de estados locales (Zustand `persist`) en caso de refrescos accidentales de pestaña.
* [ ] Autenticación de usuarios (Cajeros vs Administradores).
