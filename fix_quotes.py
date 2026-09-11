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
            
        # Fix "); -> `);
        content = content.replace('");', '`);')
        
        # Fix ", { -> `, {
        content = content.replace('", {', '`, {')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
