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
            lines = f.readlines()
            
        new_lines = []
        for line in lines:
            if line.startswith('import { API_URL } from "@/config";'):
                continue
            new_lines.append(line)
            
        content = "".join(new_lines)
        
        # Add the import correctly
        if 'API_URL' in content:
            if content.startswith('"use client";'):
                content = '"use client";\nimport { API_URL } from "@/config";\n' + content[13:]
            elif content.startswith("'use client';"):
                content = "'use client';\nimport { API_URL } from \"@/config\";\n" + content[13:]
            else:
                content = 'import { API_URL } from "@/config";\n' + content
                
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports for {file}")
