import os

with open('frontend/src/config.ts', 'w') as f:
    f.write('export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";\n')

files = [
    'frontend/src/app/(app)/admin/page.tsx',
    'frontend/src/app/(app)/pedido/page.tsx',
    'frontend/src/app/(app)/turnos/page.tsx',
    'frontend/src/components/dashboard/AddStockModal.tsx',
    'frontend/src/components/dashboard/NewSaleModal.tsx',
    'frontend/src/components/dashboard/POSSaleModal.tsx',
    'frontend/src/store/dashboard-store.ts',
    'frontend/src/store/inventory-store.ts',
    'frontend/src/store/pos-store.ts',
    'frontend/src/store/shifts-store.ts'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original = content
        
        # We replace any occurrences of the hardcoded URLs
        # Add import if needed
        if 'http://127.0.0.1:8000' in content:
            if 'import { API_URL } from "@/config"' not in content:
                content = 'import { API_URL } from "@/config";\n' + content
                
            content = content.replace('"http://127.0.0.1:8000/', '`${API_URL}/')
            content = content.replace('`http://127.0.0.1:8000/', '`${API_URL}/')
            content = content.replace('"http://127.0.0.1:8000"', 'API_URL')
            
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Updated {file}')
