# SG-Heladería 🍦

Sistema de Gestión (MVP) para una heladería, diseñado para manejar la complejidad del control de stock donde el producto se ingresa en volumen (Baldes/Kilos) pero se vende fraccionado (Gramos/Unidades).

## 🚀 Tecnologías Utilizadas

### Backend
* **Python / FastAPI**: Framework web de alto rendimiento.
* **SQLAlchemy**: ORM para la interacción con la base de datos.
* **SQLite**: Base de datos utilizada para el MVP local (Configurado para migrar a **PostgreSQL** en producción).

### Frontend
* **Next.js 15 (App Router)**: Framework de React.
* **Tailwind CSS**: Para el diseño y estilizado responsivo.
* **Shadcn/UI**: Componentes accesibles y personalizables (Dialogs, Selects, Toasts, Progress).

---

## 📦 Funcionalidades Implementadas (Fase 1 y 2)

* **Dashboard Principal**: Panel con KPIs dinámicos que muestran las *Ventas del Día*, *Efectivo en Caja* y *Alertas de Stock Bajo*.
* **Control de Inventario**: Tabla dinámica en tiempo real que lista los productos, su categoría y el stock restante con barras de progreso visuales (verde, amarillo, rojo según el nivel crítico).
* **Ingreso de Mercadería**: Sistema para inyectar nuevo stock a los productos existentes (ej. 10.000 gramos de un nuevo balde).
* **Punto de Venta (POS)**: Modal para registrar "Nuevas Ventas". Permite seleccionar el producto, ingresar los gramos o unidades vendidas, y automáticamente:
  * Suma el valor a la caja del día.
  * Descuenta el stock de la base de datos en tiempo real.
* **Notificaciones UX**: Integración de Toasts (Notificaciones push) para el feedback de éxito o error en las operaciones.

---

## 📂 Estructura del Proyecto (Monorepo)

```text
SG-Heladeria/
│
├── backend/                  # API FastAPI
│   ├── app/
│   │   ├── main.py           # Modelos de BD, Schemas y Endpoints
│   ├── requirements.txt      # Dependencias de Python
│   └── heladeria.db          # Base de datos local (SQLite)
│
└── frontend/                 # Aplicación Next.js
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Dashboard Principal
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── dashboard/    # Componentes de negocio (Tablas, Modales)
    │   │   └── ui/           # Componentes de Shadcn (Botones, Inputs, etc.)
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
# Iniciar servidor
uvicorn app.main:app --reload
```
La API estará corriendo en `http://127.0.0.1:8000`.
Puedes acceder a la documentación interactiva en `http://127.0.0.1:8000/docs`.

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
* [ ] **Fase 3**: Creación de tabla `InventoryLogs` para trazabilidad y auditoría de ingresos/egresos de stock.
* [ ] Sistema de Autenticación (Login) para separar vista de Cajeros y Administradores.
* [ ] Migración a PostgreSQL y Deploy a producción (Vercel/Render).
