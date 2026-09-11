import os

files = [
    'frontend/src/app/(app)/admin/page.tsx',
    'frontend/src/app/(app)/pedido/page.tsx',
    'frontend/src/app/(app)/turnos/page.tsx',
    'frontend/src/components/dashboard/AddStockModal.tsx',
    'frontend/src/components/dashboard/NewSaleModal.tsx',
    'frontend/src/components/dashboard/POSSaleModal.tsx'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        
        # We only want to replace double quotes that come right after an API_URL string
        content = content.replace('`${API_URL}/products/", {', '`${API_URL}/products/`, {')
        content = content.replace('`${API_URL}/sale-formats/", {', '`${API_URL}/sale-formats/`, {')
        content = content.replace('`${API_URL}/products/");', '`${API_URL}/products/`);')
        content = content.replace('`${API_URL}/products/?category=HELADO");', '`${API_URL}/products/?category=HELADO`);')
        content = content.replace('`${API_URL}/products/?category=ENVASE");', '`${API_URL}/products/?category=ENVASE`);')
        content = content.replace('`${API_URL}/shifts/active");', '`${API_URL}/shifts/active`);')
        content = content.replace('`${API_URL}/shifts/history");', '`${API_URL}/shifts/history`);')
        content = content.replace('`${API_URL}/shifts/open", {', '`${API_URL}/shifts/open`, {')
        content = content.replace('`${API_URL}/sales/", {', '`${API_URL}/sales/`, {')

        if content != original:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {file}')
