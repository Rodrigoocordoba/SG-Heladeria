"""
Script para cargar datos de prueba en la heladeria.
Ejecutar con: python seed_data.py
"""
import requests

BASE_URL = "http://127.0.0.1:8000"

# --- 1. Crear Sabores de Helado ---
sabores = [
    "Dulce de Leche Granizado",
    "Chocolate Suizo",
    "Frutilla a la Crema",
    "Tramontana",
    "Crema Americana",
    "Menta Granizada",
    "Limon",
    "Sambayon",
]

print("=== Creando Sabores de Helado ===")
for sabor in sabores:
    r = requests.post(f"{BASE_URL}/products/", json={
        "name": sabor,
        "category": "HELADO"
    })
    if r.status_code == 200:
        print(f"  [OK] {sabor} (ID: {r.json()['id']})")
    else:
        print(f"  [ERROR] creando {sabor}: {r.text}")

# --- 2. Crear Envases ---
envases = [
    {"name": "Cucurucho Grande", "category": "ENVASE"},
    {"name": "Cucurucho Chico", "category": "ENVASE"},
    {"name": "Vasito 1/4 Kg", "category": "ENVASE"},
    {"name": "Pote 1 Kg", "category": "ENVASE"},
    {"name": "Pote 1/2 Kg", "category": "ENVASE"},
]

print("")
print("=== Creando Envases ===")
envase_ids = {}
for envase in envases:
    r = requests.post(f"{BASE_URL}/products/", json=envase)
    if r.status_code == 200:
        data = r.json()
        envase_ids[envase["name"]] = data["id"]
        print(f"  [OK] {envase['name']} (ID: {data['id']})")
    else:
        print(f"  [ERROR] creando {envase['name']}: {r.text}")

# --- 3. Cargar Stock Inicial de Envases ---
print("")
print("=== Cargando Stock de Envases ===")
stock_inicial = {
    "Cucurucho Grande": 200,
    "Cucurucho Chico": 300,
    "Vasito 1/4 Kg": 150,
    "Pote 1 Kg": 100,
    "Pote 1/2 Kg": 120,
}

for nombre, cantidad in stock_inicial.items():
    pid = envase_ids.get(nombre)
    if pid:
        r = requests.post(f"{BASE_URL}/inventory/{pid}/add", json={
            "amount_to_add": cantidad
        })
        if r.status_code == 200:
            print(f"  [OK] {nombre}: +{cantidad} unidades")
        else:
            print(f"  [ERROR] en {nombre}: {r.text}")

# --- 4. Crear Formatos de Venta ---
print("")
print("=== Creando Formatos de Venta ===")
formatos = [
    {"name": "1 Kilo", "price": 8500.0, "total_grams": 1000, "max_flavors": 4, "linked_product_id": envase_ids.get("Pote 1 Kg")},
    {"name": "1/2 Kilo", "price": 5000.0, "total_grams": 500, "max_flavors": 3, "linked_product_id": envase_ids.get("Pote 1/2 Kg")},
    {"name": "1/4 Kilo", "price": 3000.0, "total_grams": 250, "max_flavors": 2, "linked_product_id": envase_ids.get("Vasito 1/4 Kg")},
    {"name": "Cucurucho Simple", "price": 3500.0, "total_grams": 150, "max_flavors": 2, "linked_product_id": envase_ids.get("Cucurucho Chico")},
    {"name": "Cucurucho Doble", "price": 5000.0, "total_grams": 250, "max_flavors": 3, "linked_product_id": envase_ids.get("Cucurucho Grande")},
]

for fmt in formatos:
    r = requests.post(f"{BASE_URL}/sale-formats/", json=fmt)
    if r.status_code == 200:
        data = r.json()
        print(f"  [OK] {fmt['name']} -- ${fmt['price']} ({fmt['total_grams']}g, max {fmt['max_flavors']} sabores)")
    else:
        print(f"  [ERROR] en {fmt['name']}: {r.text}")

print("")
print("Datos de prueba cargados exitosamente! Recarga el frontend.")
