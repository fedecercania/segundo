#!/usr/bin/env python3
"""
Script para crear iconos desde Gallina.png
Genera icon-192.png e icon-512.png desde la imagen de la gallina
"""

from PIL import Image
import os

def create_icons():
    source_image = 'Gallina.png'
    
    if not os.path.exists(source_image):
        print(f"Error: No se encontró {source_image}")
        return
    
    try:
        # Cargar la imagen original
        img = Image.open(source_image)
        
        # Convertir a RGBA si es necesario (para mantener transparencia)
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Crear icono 192x192
        icon_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        icon_192.save('icon-192.png', 'PNG')
        print("✓ Creado icon-192.png")
        
        # Crear icono 512x512
        icon_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        icon_512.save('icon-512.png', 'PNG')
        print("✓ Creado icon-512.png")
        
        print("\n¡Iconos creados exitosamente!")
        
    except Exception as e:
        print(f"Error al crear iconos: {e}")

if __name__ == '__main__':
    create_icons()

