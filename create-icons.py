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
        
        def create_square_icon(size):
            # Crear un fondo transparente cuadrado
            icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            
            # Calcular el tamaño para mantener proporciones sin cortar
            img_width, img_height = img.size
            ratio = min(size / img_width, size / img_height)
            new_width = int(img_width * ratio * 0.9)  # 0.9 para dejar espacio alrededor
            new_height = int(img_height * ratio * 0.9)
            
            # Redimensionar manteniendo proporciones
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Calcular posición para centrar
            x = (size - new_width) // 2
            y = (size - new_height) // 2
            
            # Pegar la imagen centrada en el fondo
            icon.paste(resized_img, (x, y), resized_img)
            
            return icon
        
        # Crear icono 192x192
        icon_192 = create_square_icon(192)
        icon_192.save('icon-192.png', 'PNG')
        print("✓ Creado icon-192.png")
        
        # Crear icono 512x512
        icon_512 = create_square_icon(512)
        icon_512.save('icon-512.png', 'PNG')
        print("✓ Creado icon-512.png")
        
        print("\n¡Iconos creados exitosamente!")
        
    except Exception as e:
        print(f"Error al crear iconos: {e}")

if __name__ == '__main__':
    create_icons()

