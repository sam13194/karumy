import tkinter as tk
from tkinter import ttk
from karumy_manager import KarumyProductManager

def main():
    root = tk.Tk()
    root.title("Karumy Cosmeticos - Gestor de Productos")
    
    # Estilo para la aplicación
    style = ttk.Style()
    style.theme_use('clam')  # Usar tema 'clam' para mejor apariencia
    
    # Configurar colores
    style.configure('TFrame', background='#f5f5f5')
    style.configure('TLabel', background='#f5f5f5')
    style.configure('TLabelframe', background='#f5f5f5')
    style.configure('TLabelframe.Label', background='#f5f5f5')
    
    # Botones con estilo
    style.configure('TButton', padding=6, relief="flat", background="#ccc")
    style.configure('Accent.TButton', foreground="white", background="#ff4081")
    style.map('Accent.TButton',
             foreground=[('pressed', 'white'), ('active', 'white')],
             background=[('pressed', '#e93a76'), ('active', '#ff5a92')])
    
    app = KarumyProductManager(root)
    root.mainloop()


if __name__ == "__main__":
    main()
