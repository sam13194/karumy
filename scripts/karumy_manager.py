import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import sqlite3
import json
import os
import shutil
from PIL import Image, ImageTk
from datetime import datetime

class KarumyProductManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Karumy Productos - Gestor de Catalogo")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 700)
        
        # Definir variables
        self.db_path = "karumy_productos.db"
        self.json_path = "productos.json"
        self.img_path = "assets/img/productos/"
        
        # Crear conexión a la base de datos
        self.crear_base_datos()
        
        # Crear interfaz
        self.crear_interfaz()
        
        # Cargar datos iniciales
        self.cargar_datos()
    
    def crear_base_datos(self):
        """Crea la base de datos SQLite si no existe"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Crear tabla de categorías
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS categorias (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            imagen TEXT,
            icono TEXT
        )
        ''')
        
        # Crear tabla de productos
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS productos (
            id TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            categoria TEXT NOT NULL,
            categoria_nombre TEXT NOT NULL,
            descripcion_corta TEXT,
            precio REAL NOT NULL,
            precio_oferta REAL,
            imagen_principal TEXT,
            es_nuevo INTEGER DEFAULT 0,
            es_oferta INTEGER DEFAULT 0,
            etiquetas TEXT,
            sku TEXT,
            FOREIGN KEY (categoria) REFERENCES categorias(id)
        )
        ''')
        
        # Crear tabla para descripciones detalladas
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS descripciones (
            producto_id TEXT,
            descripcion TEXT,
            orden INTEGER,
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
        ''')
        
        # Crear tabla para beneficios
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS beneficios (
            producto_id TEXT,
            beneficio TEXT,
            orden INTEGER,
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
        ''')
        
        # Crear tabla para ingredientes
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ingredientes (
            producto_id TEXT,
            ingrediente TEXT,
            orden INTEGER,
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
        ''')
        
        # Crear tabla para modo de uso
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS modo_uso (
            producto_id TEXT,
            instruccion TEXT,
            orden INTEGER,
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
        ''')
        
        # Crear tabla para imágenes adicionales
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS imagenes_adicionales (
            producto_id TEXT,
            ruta_imagen TEXT,
            orden INTEGER,
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
        ''')
        
        # Crear tabla para opciones de producto (tamaños, colores, etc.)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS opciones (
            producto_id TEXT,
            tipo TEXT,
            valor TEXT,
            precio_adicional REAL DEFAULT 0,
            orden INTEGER,
            FOREIGN KEY (producto_id) REFERENCES productos(id)
        )
        ''')
        
        # Crear tabla para productos relacionados
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS productos_relacionados (
            producto_id TEXT,
            producto_relacionado_id TEXT,
            FOREIGN KEY (producto_id) REFERENCES productos(id),
            FOREIGN KEY (producto_relacionado_id) REFERENCES productos(id)
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def crear_interfaz(self):
        """Crea la interfaz gráfica principal"""
        # Frame principal
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Estilo
        self.style = ttk.Style()
        self.style.configure("TButton", padding=6, relief="flat", background="#ccc")
        self.style.configure("Accent.TButton", foreground="white", background="#ff4081")
        
        # Crear secciones
        self.crear_toolbar()
        self.crear_seccion_categorias()
        self.crear_seccion_productos()
        self.crear_detalles_producto()
    
    def crear_toolbar(self):
        """Crea la barra de herramientas superior"""
        toolbar = ttk.Frame(self.main_frame)
        toolbar.pack(fill=tk.X, padx=5, pady=5)
        
        # Botones para categorías
        ttk.Button(toolbar, text="Nueva Categoría", command=self.nueva_categoria).pack(side=tk.LEFT, padx=5)
        ttk.Button(toolbar, text="Editar Categoría", command=self.editar_categoria).pack(side=tk.LEFT, padx=5)
        ttk.Button(toolbar, text="Eliminar Categoría", command=self.eliminar_categoria).pack(side=tk.LEFT, padx=5)
        
        ttk.Separator(toolbar, orient='vertical').pack(side=tk.LEFT, fill=tk.Y, padx=10, pady=5)
        
        # Botones para productos
        ttk.Button(toolbar, text="Nuevo Producto", command=self.nuevo_producto).pack(side=tk.LEFT, padx=5)
        ttk.Button(toolbar, text="Eliminar Producto", command=self.eliminar_producto).pack(side=tk.LEFT, padx=5)
        
        ttk.Separator(toolbar, orient='vertical').pack(side=tk.LEFT, fill=tk.Y, padx=10, pady=5)
        
        # Botones para exportar/importar
        ttk.Button(toolbar, text="Exportar a JSON", style="Accent.TButton", command=self.exportar_json).pack(side=tk.RIGHT, padx=5)
        ttk.Button(toolbar, text="Importar desde JSON", command=self.importar_json).pack(side=tk.RIGHT, padx=5)
    
    def crear_seccion_categorias(self):
        """Crea la sección para mostrar las categorías"""
        categorias_frame = ttk.LabelFrame(self.main_frame, text="Categorías")
        categorias_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Crear Treeview para categorías
        self.categorias_tree = ttk.Treeview(categorias_frame, columns=("nombre", "productos"), height=6)
        self.categorias_tree.heading("#0", text="ID")
        self.categorias_tree.heading("nombre", text="Nombre")
        self.categorias_tree.heading("productos", text="Productos")
        self.categorias_tree.column("#0", width=150)
        self.categorias_tree.column("nombre", width=200)
        self.categorias_tree.column("productos", width=100, anchor=tk.CENTER)
        
        # Scrollbar para el Treeview
        scroll_y = ttk.Scrollbar(categorias_frame, orient=tk.VERTICAL, command=self.categorias_tree.yview)
        self.categorias_tree.configure(yscrollcommand=scroll_y.set)
        
        # Empaquetar Treeview y Scrollbar
        self.categorias_tree.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5, pady=5)
        scroll_y.pack(side=tk.RIGHT, fill=tk.Y, pady=5)
        
        # Evento de selección
        self.categorias_tree.bind("<<TreeviewSelect>>", self.seleccionar_categoria)
    
    def crear_seccion_productos(self):
        """Crea la sección para mostrar los productos"""
        # Frame para encabezado y selección
        productos_header = ttk.Frame(self.main_frame)
        productos_header.pack(fill=tk.X, padx=5, pady=5)
        
        self.productos_label = ttk.Label(productos_header, text="Productos", font=("Arial", 12, "bold"))
        self.productos_label.pack(side=tk.LEFT, padx=5)
        
        # Frame principal de productos
        productos_frame = ttk.Frame(self.main_frame)
        productos_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Crear Treeview para productos
        self.productos_tree = ttk.Treeview(productos_frame, 
                                     columns=("nombre", "precio", "oferta", "nuevo"), 
                                     height=10)
        self.productos_tree.heading("#0", text="ID")
        self.productos_tree.heading("nombre", text="Nombre")
        self.productos_tree.heading("precio", text="Precio")
        self.productos_tree.heading("oferta", text="Oferta")
        self.productos_tree.heading("nuevo", text="Nuevo")
        
        self.productos_tree.column("#0", width=150)
        self.productos_tree.column("nombre", width=250)
        self.productos_tree.column("precio", width=100, anchor=tk.CENTER)
        self.productos_tree.column("oferta", width=100, anchor=tk.CENTER)
        self.productos_tree.column("nuevo", width=80, anchor=tk.CENTER)
        
        # Scrollbar para el Treeview
        scroll_y = ttk.Scrollbar(productos_frame, orient=tk.VERTICAL, command=self.productos_tree.yview)
        self.productos_tree.configure(yscrollcommand=scroll_y.set)
        
        # Empaquetar Treeview y Scrollbar
        self.productos_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        scroll_y.pack(side=tk.RIGHT, fill=tk.Y, pady=5)
        
        # Evento de selección
        self.productos_tree.bind("<<TreeviewSelect>>", self.seleccionar_producto)
    
    def crear_detalles_producto(self):
        """Crea la sección para editar los detalles del producto"""
        # Frame principal para detalles
        self.detalles_frame = ttk.LabelFrame(self.main_frame, text="Detalles del Producto")
        self.detalles_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Notebook para pestañas
        self.notebook = ttk.Notebook(self.detalles_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Pestaña de información básica
        self.tab_basico = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_basico, text="Información Básica")
        
        # Pestaña de descripciones
        self.tab_descripciones = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_descripciones, text="Descripciones")
        
        # Pestaña de imágenes
        self.tab_imagenes = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_imagenes, text="Imágenes")
        
        # Pestaña de características
        self.tab_caracteristicas = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_caracteristicas, text="Características")
        
        # Pestaña de opciones
        self.tab_opciones = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_opciones, text="Opciones")
        
        # Pestaña de relacionados
        self.tab_relacionados = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_relacionados, text="Relacionados")
        
        # Crear contenido de las pestañas
        self.crear_tab_basico()
        self.crear_tab_descripciones()
        self.crear_tab_imagenes()
        self.crear_tab_caracteristicas()
        self.crear_tab_opciones()
        self.crear_tab_relacionados()
        
        # Botón de guardar
        btn_frame = ttk.Frame(self.detalles_frame)
        btn_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.btn_guardar = ttk.Button(btn_frame, text="Guardar Cambios", 
                                 command=self.guardar_producto, style="Accent.TButton")
        self.btn_guardar.pack(side=tk.RIGHT, padx=5, pady=5)
        
        # Deshabilitar todo hasta que se seleccione un producto
        self.notebook.state(['disabled'])
        self.btn_guardar.state(['disabled'])
    
    def crear_tab_basico(self):
        """Crea el contenido de la pestaña de información básica"""
        frame = ttk.Frame(self.tab_basico, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Variables para almacenar los valores
        self.var_id = tk.StringVar()
        self.var_nombre = tk.StringVar()
        self.var_categoria = tk.StringVar()
        self.var_sku = tk.StringVar()
        self.var_precio = tk.DoubleVar()
        self.var_precio_oferta = tk.DoubleVar()
        self.var_es_nuevo = tk.BooleanVar()
        self.var_es_oferta = tk.BooleanVar()
        
        # Crear formulario
        # Primera columna
        col1 = ttk.Frame(frame)
        col1.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)
        
        ttk.Label(col1, text="ID:").grid(row=0, column=0, sticky=tk.W, pady=5)
        ttk.Entry(col1, textvariable=self.var_id, width=30).grid(row=0, column=1, pady=5, padx=5, sticky=tk.W)
        
        ttk.Label(col1, text="Nombre:").grid(row=1, column=0, sticky=tk.W, pady=5)
        ttk.Entry(col1, textvariable=self.var_nombre, width=30).grid(row=1, column=1, pady=5, padx=5, sticky=tk.W+tk.E)
        
        ttk.Label(col1, text="Categoría:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.combo_categoria = ttk.Combobox(col1, textvariable=self.var_categoria, width=28)
        self.combo_categoria.grid(row=2, column=1, pady=5, padx=5, sticky=tk.W+tk.E)
        
        ttk.Label(col1, text="SKU:").grid(row=3, column=0, sticky=tk.W, pady=5)
        ttk.Entry(col1, textvariable=self.var_sku, width=30).grid(row=3, column=1, pady=5, padx=5, sticky=tk.W)
        
        # Segunda columna
        col2 = ttk.Frame(frame)
        col2.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)
        
        ttk.Label(col2, text="Precio:").grid(row=0, column=0, sticky=tk.W, pady=5)
        ttk.Entry(col2, textvariable=self.var_precio, width=15).grid(row=0, column=1, pady=5, padx=5, sticky=tk.W)
        
        ttk.Label(col2, text="Precio Oferta:").grid(row=1, column=0, sticky=tk.W, pady=5)
        ttk.Entry(col2, textvariable=self.var_precio_oferta, width=15).grid(row=1, column=1, pady=5, padx=5, sticky=tk.W)
        
        ttk.Checkbutton(col2, text="Es Nuevo", variable=self.var_es_nuevo).grid(row=2, column=0, columnspan=2, sticky=tk.W, pady=5)
        ttk.Checkbutton(col2, text="Es Oferta", variable=self.var_es_oferta).grid(row=3, column=0, columnspan=2, sticky=tk.W, pady=5)
        
        # Descripción corta
        ttk.Label(frame, text="Descripción Corta:").pack(anchor=tk.W, pady=(15,5))
        self.txt_desc_corta = tk.Text(frame, height=4, width=60)
        self.txt_desc_corta.pack(fill=tk.X, pady=5)
        
        # Etiquetas
        ttk.Label(frame, text="Etiquetas (separadas por comas):").pack(anchor=tk.W, pady=(15,5))
        self.txt_etiquetas = ttk.Entry(frame, width=60)
        self.txt_etiquetas.pack(fill=tk.X, pady=5)
    
    def crear_tab_descripciones(self):
        """Crea el contenido de la pestaña de descripciones"""
        frame = ttk.Frame(self.tab_descripciones, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Descripción completa
        ttk.Label(frame, text="Descripción Completa (cada párrafo en una línea):").pack(anchor=tk.W, pady=(5,5))
        
        # Frame para el texto y botones
        desc_frame = ttk.Frame(frame)
        desc_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.txt_desc_completa = tk.Text(desc_frame, height=10, width=60)
        self.txt_desc_completa.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scroll_desc = ttk.Scrollbar(desc_frame, orient=tk.VERTICAL, command=self.txt_desc_completa.yview)
        self.txt_desc_completa.configure(yscrollcommand=scroll_desc.set)
        scroll_desc.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Beneficios
        ttk.Label(frame, text="Beneficios (uno por línea):").pack(anchor=tk.W, pady=(15,5))
        
        ben_frame = ttk.Frame(frame)
        ben_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.txt_beneficios = tk.Text(ben_frame, height=6, width=60)
        self.txt_beneficios.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scroll_ben = ttk.Scrollbar(ben_frame, orient=tk.VERTICAL, command=self.txt_beneficios.yview)
        self.txt_beneficios.configure(yscrollcommand=scroll_ben.set)
        scroll_ben.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Ingredientes
        ttk.Label(frame, text="Ingredientes (uno por línea):").pack(anchor=tk.W, pady=(15,5))
        
        ing_frame = ttk.Frame(frame)
        ing_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.txt_ingredientes = tk.Text(ing_frame, height=6, width=60)
        self.txt_ingredientes.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scroll_ing = ttk.Scrollbar(ing_frame, orient=tk.VERTICAL, command=self.txt_ingredientes.yview)
        self.txt_ingredientes.configure(yscrollcommand=scroll_ing.set)
        scroll_ing.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Modo de uso
        ttk.Label(frame, text="Modo de Uso (uno por línea):").pack(anchor=tk.W, pady=(15,5))
        
        uso_frame = ttk.Frame(frame)
        uso_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.txt_modo_uso = tk.Text(uso_frame, height=6, width=60)
        self.txt_modo_uso.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scroll_uso = ttk.Scrollbar(uso_frame, orient=tk.VERTICAL, command=self.txt_modo_uso.yview)
        self.txt_modo_uso.configure(yscrollcommand=scroll_uso.set)
        scroll_uso.pack(side=tk.RIGHT, fill=tk.Y)
    
    def crear_tab_imagenes(self):
        """Crea el contenido de la pestaña de imágenes"""
        frame = ttk.Frame(self.tab_imagenes, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Imagen principal
        ttk.Label(frame, text="Imagen Principal:").grid(row=0, column=0, sticky=tk.W, pady=5)
        
        img_frame = ttk.Frame(frame)
        img_frame.grid(row=1, column=0, columnspan=2, sticky=tk.W, pady=5)
        
        # Use tk.Label instead of ttk.Label for the image label
        self.lbl_img_principal = tk.Label(img_frame, text="Sin imagen", border=1, relief="solid", width=30, height=10)
        self.lbl_img_principal.pack(side=tk.LEFT, padx=5)
        
        img_buttons = ttk.Frame(img_frame)
        img_buttons.pack(side=tk.LEFT, padx=5, fill=tk.Y, expand=True)
        
        self.var_ruta_img_principal = tk.StringVar()
        ttk.Label(img_buttons, textvariable=self.var_ruta_img_principal, wraplength=200).pack(pady=5)
        
        ttk.Button(img_buttons, text="Seleccionar Imagen", command=lambda: self.seleccionar_imagen("principal")).pack(pady=5)
        ttk.Button(img_buttons, text="Eliminar Imagen", command=lambda: self.eliminar_imagen("principal")).pack(pady=5)
        
        # Imágenes adicionales
        ttk.Label(frame, text="Imágenes Adicionales:").grid(row=2, column=0, sticky=tk.W, pady=(20,5))
        
        self.img_adicionales_frame = ttk.Frame(frame)
        self.img_adicionales_frame.grid(row=3, column=0, columnspan=2, sticky=tk.W+tk.E+tk.N+tk.S, pady=5)
        
        # Lista para almacenar referencias a imágenes adicionales
        self.imagenes_adicionales = []
        
        # Botón para añadir imagen adicional
        ttk.Button(frame, text="Añadir Imagen Adicional", command=self.añadir_imagen_adicional).grid(row=4, column=0, sticky=tk.W, pady=10)
    
    def crear_tab_caracteristicas(self):
        """Crea el contenido de la pestaña de características"""
        frame = ttk.Frame(self.tab_caracteristicas, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Este tab es informativo, muestra los datos agregados en otras pestañas
        ttk.Label(frame, text="Resumen de Características", font=("Arial", 12, "bold")).pack(anchor=tk.W, pady=10)
        
        # Crear un Text widget para mostrar el resumen
        self.txt_resumen = tk.Text(frame, height=25, width=70, wrap=tk.WORD)
        self.txt_resumen.pack(fill=tk.BOTH, expand=True, pady=5)
        self.txt_resumen.config(state=tk.DISABLED)  # Solo lectura
    
    def crear_tab_opciones(self):
        """Crea el contenido de la pestaña de opciones"""
        frame = ttk.Frame(self.tab_opciones, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Frame superior para añadir tipos de opciones
        top_frame = ttk.Frame(frame)
        top_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(top_frame, text="Tipo de Opción:").pack(side=tk.LEFT, padx=5)
        self.var_tipo_opcion = tk.StringVar()
        self.combo_tipo_opcion = ttk.Combobox(top_frame, textvariable=self.var_tipo_opcion, values=["tamaño", "color", "aroma", "presentación"])
        self.combo_tipo_opcion.pack(side=tk.LEFT, padx=5)
        self.combo_tipo_opcion.bind("<Return>", self.añadir_tipo_opcion)
        
        ttk.Button(top_frame, text="Añadir Tipo", command=self.añadir_tipo_opcion).pack(side=tk.LEFT, padx=5)
        
        # Frame para el notebook de opciones
        self.opciones_frame = ttk.Frame(frame)
        self.opciones_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Notebook para los tipos de opciones
        self.opciones_notebook = ttk.Notebook(self.opciones_frame)
        self.opciones_notebook.pack(fill=tk.BOTH, expand=True)
        
        # Diccionario para almacenar los widgets de opciones
        self.opciones_widgets = {}
    
    def crear_tab_relacionados(self):
        """Crea el contenido de la pestaña de productos relacionados"""
        frame = ttk.Frame(self.tab_relacionados, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Lista de productos disponibles
        ttk.Label(frame, text="Productos Disponibles:").pack(anchor=tk.W, pady=5)
        
        disponibles_frame = ttk.Frame(frame)
        disponibles_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.lista_disponibles = tk.Listbox(disponibles_frame, selectmode=tk.MULTIPLE, width=50, height=10)
        self.lista_disponibles.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scroll_disp = ttk.Scrollbar(disponibles_frame, orient=tk.VERTICAL, command=self.lista_disponibles.yview)
        self.lista_disponibles.configure(yscrollcommand=scroll_disp.set)
        scroll_disp.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Botones de acción
        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(btn_frame, text="Añadir Seleccionados →", command=self.añadir_relacionados).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="← Quitar Seleccionados", command=self.quitar_relacionados).pack(side=tk.RIGHT, padx=5)
        
        # Lista de productos relacionados
        ttk.Label(frame, text="Productos Relacionados:").pack(anchor=tk.W, pady=5)
        
        relacionados_frame = ttk.Frame(frame)
        relacionados_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.lista_relacionados = tk.Listbox(relacionados_frame, selectmode=tk.MULTIPLE, width=50, height=10)
        self.lista_relacionados.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scroll_rel = ttk.Scrollbar(relacionados_frame, orient=tk.VERTICAL, command=self.lista_relacionados.yview)
        self.lista_relacionados.configure(yscrollcommand=scroll_rel.set)
        scroll_rel.pack(side=tk.RIGHT, fill=tk.Y)
    
    def añadir_imagen_adicional(self, ruta_imagen=None):
        """Añade un nuevo slot para imagen adicional"""
        # Crear frame para la imagen
        frame = ttk.Frame(self.img_adicionales_frame, padding=5)
        frame.pack(side=tk.LEFT, padx=5, pady=5)
        
        # Índice de la nueva imagen
        indice = len(self.imagenes_adicionales)
        
        # Crear label para mostrar la imagen - use tk.Label instead of ttk.Label
        lbl_img = tk.Label(frame, text="Sin imagen", border=1, relief="solid", width=15, height=8)
        lbl_img.pack(pady=5)
        
        # Variable para almacenar la ruta
        var_ruta = tk.StringVar(value=ruta_imagen or "")
        
        # Botones para manejar la imagen
        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(btn_frame, text="Seleccionar", 
                  command=lambda i=indice: self.seleccionar_imagen("adicional", i)).pack(side=tk.LEFT, padx=2)
                  
        ttk.Button(btn_frame, text="Eliminar", 
                  command=lambda i=indice: self.eliminar_imagen("adicional", i)).pack(side=tk.RIGHT, padx=2)
        
        # Almacenar datos de la imagen
        img_data = {
            'indice': indice,
            'frame': frame,
            'label': lbl_img,
            'ruta': ruta_imagen,
            'var_ruta': var_ruta
        }
        
        self.imagenes_adicionales.append(img_data)
        
        # Mostrar imagen si existe
        if ruta_imagen:
            self.actualizar_vista_imagen_adicional(indice)

    def cargar_datos(self):
        """Carga los datos iniciales de la base de datos"""
        self.cargar_categorias()
        self.cargar_combo_categorias()
    
    def cargar_categorias(self):
        """Carga las categorías en el Treeview"""
        # Limpiar Treeview
        for item in self.categorias_tree.get_children():
            self.categorias_tree.delete(item)
        
        # Consultar categorías
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT c.id, c.nombre, COUNT(p.id) as productos
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria
        GROUP BY c.id
        ORDER BY c.nombre
        ''')
        
        categorias = cursor.fetchall()
        conn.close()
        
        # Insertar categorías en Treeview
        for categoria in categorias:
            self.categorias_tree.insert("", tk.END, text=categoria[0], values=(categoria[1], categoria[2]))
    
    def cargar_combo_categorias(self):
        """Carga las categorías en el combobox"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, nombre FROM categorias ORDER BY nombre')
        categorias = cursor.fetchall()
        
        conn.close()
        
        # Crear lista de valores para el combobox en formato "id - nombre"
        valores = [f"{cat[0]} - {cat[1]}" for cat in categorias]
        self.combo_categoria['values'] = valores
    
    def seleccionar_categoria(self, event):
        """Maneja el evento de selección de categoría"""
        # Obtener el ID de la categoría seleccionada
        seleccion = self.categorias_tree.selection()
        if not seleccion:
            return
        
        categoria_id = self.categorias_tree.item(seleccion[0], "text")
        
        # Actualizar etiqueta de productos
        categoria_nombre = self.categorias_tree.item(seleccion[0], "values")[0]
        self.productos_label.config(text=f"Productos en {categoria_nombre}")
        
        # Cargar productos de esta categoría
        self.cargar_productos(categoria_id)
    
    def cargar_productos(self, categoria_id=None):
        """Carga los productos en el Treeview"""
        # Limpiar Treeview
        for item in self.productos_tree.get_children():
            self.productos_tree.delete(item)
        
        # Consultar productos
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if categoria_id:
            cursor.execute('''
            SELECT id, nombre, precio, precio_oferta, es_nuevo, es_oferta
            FROM productos
            WHERE categoria = ?
            ORDER BY nombre
            ''', (categoria_id,))
        else:
            cursor.execute('''
            SELECT id, nombre, precio, precio_oferta, es_nuevo, es_oferta
            FROM productos
            ORDER BY nombre
            ''')
        
        productos = cursor.fetchall()
        conn.close()
        
        # Insertar productos en Treeview
        for producto in productos:
            # Formatear precio
            precio = f"${producto[2]:,.0f}"
            
            # Formatear precio de oferta
            precio_oferta = f"${producto[3]:,.0f}" if producto[3] else "-"
            
            # Formato para es_nuevo y es_oferta
            es_nuevo = "✓" if producto[4] else ""
            es_oferta = "✓" if producto[5] else ""
            
            self.productos_tree.insert("", tk.END, text=producto[0], 
                                  values=(producto[1], precio, precio_oferta, es_nuevo))
    
    def seleccionar_producto(self, event):
        """Maneja el evento de selección de producto"""
        # Obtener el ID del producto seleccionado
        seleccion = self.productos_tree.selection()
        if not seleccion:
            return
        
        producto_id = self.productos_tree.item(seleccion[0], "text")
        
        # Cargar datos del producto
        self.cargar_datos_producto(producto_id)
        
        # Habilitar notebook y botón de guardar
        self.notebook.state(['!disabled'])
        self.btn_guardar.state(['!disabled'])
    
    def cargar_datos_producto(self, producto_id):
        """Carga los datos del producto seleccionado en los campos"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Para acceder a las columnas por nombre
        cursor = conn.cursor()
        
        # Consultar datos básicos del producto
        cursor.execute('''
        SELECT * FROM productos WHERE id = ?
        ''', (producto_id,))
        
        producto = cursor.fetchone()
        
        if not producto:
            conn.close()
            return
        
        # Cargar datos básicos
        self.var_id.set(producto['id'])
        self.var_nombre.set(producto['nombre'])
        
        # Formatear categoría como "id - nombre" para el combobox
        categoria_completa = f"{producto['categoria']} - {producto['categoria_nombre']}"
        self.var_categoria.set(categoria_completa)
        
        self.var_sku.set(producto['sku'] or "")
        self.var_precio.set(producto['precio'])
        self.var_precio_oferta.set(producto['precio_oferta'] or 0)
        self.var_es_nuevo.set(bool(producto['es_nuevo']))
        self.var_es_oferta.set(bool(producto['es_oferta']))
        
        # Cargar descripción corta
        self.txt_desc_corta.delete("1.0", tk.END)
        self.txt_desc_corta.insert("1.0", producto['descripcion_corta'] or "")
        
        # Cargar etiquetas
        self.txt_etiquetas.delete(0, tk.END)
        
        # Consultar etiquetas en formato JSON
        etiquetas_json = producto['etiquetas']
        if etiquetas_json:
            try:
                etiquetas = json.loads(etiquetas_json)
                self.txt_etiquetas.insert(0, ", ".join(etiquetas))
            except:
                pass
        
        # Cargar descripciones
        cursor.execute('SELECT descripcion FROM descripciones WHERE producto_id = ? ORDER BY orden', (producto_id,))
        descripciones = cursor.fetchall()
        
        self.txt_desc_completa.delete("1.0", tk.END)
        for desc in descripciones:
            self.txt_desc_completa.insert(tk.END, desc['descripcion'] + "\n")
        
        # Cargar beneficios
        cursor.execute('SELECT beneficio FROM beneficios WHERE producto_id = ? ORDER BY orden', (producto_id,))
        beneficios = cursor.fetchall()
        
        self.txt_beneficios.delete("1.0", tk.END)
        for ben in beneficios:
            self.txt_beneficios.insert(tk.END, ben['beneficio'] + "\n")
        
        # Cargar ingredientes
        cursor.execute('SELECT ingrediente FROM ingredientes WHERE producto_id = ? ORDER BY orden', (producto_id,))
        ingredientes = cursor.fetchall()
        
        self.txt_ingredientes.delete("1.0", tk.END)
        for ing in ingredientes:
            self.txt_ingredientes.insert(tk.END, ing['ingrediente'] + "\n")
        
        # Cargar modo de uso
        cursor.execute('SELECT instruccion FROM modo_uso WHERE producto_id = ? ORDER BY orden', (producto_id,))
        instrucciones = cursor.fetchall()
        
        self.txt_modo_uso.delete("1.0", tk.END)
        for inst in instrucciones:
            self.txt_modo_uso.insert(tk.END, inst['instruccion'] + "\n")
        
        # Cargar imagen principal
        self.var_ruta_img_principal.set(producto['imagen_principal'] or "")
        self.mostrar_imagen_principal(producto['imagen_principal'])
        
        # Cargar imágenes adicionales
        self.cargar_imagenes_adicionales(producto_id)
        
        # Cargar opciones
        self.cargar_opciones(producto_id)
        
        # Cargar productos relacionados
        self.cargar_productos_relacionados(producto_id)
        
        # Actualizar resumen
        self.actualizar_resumen()
        
        conn.close()
    
    def mostrar_imagen_principal(self, ruta_imagen):
        """Muestra la imagen principal en el label"""
        if not ruta_imagen:
            self.lbl_img_principal.config(text="Sin imagen", image="")
            return
        
        try:
            # Verificar si la imagen existe
            if not os.path.exists(ruta_imagen) and ruta_imagen.startswith("assets/"):
                # Intentar con rutas relativas al directorio de trabajo
                ruta_relativa = ruta_imagen.replace("assets/", "./assets/")
                if os.path.exists(ruta_relativa):
                    ruta_imagen = ruta_relativa
                else:
                    self.lbl_img_principal.config(text=f"Imagen no encontrada:\n{ruta_imagen}", image="")
                    return
            
            # Cargar y redimensionar imagen
            img = Image.open(ruta_imagen)
            img = img.resize((150, 150), Image.LANCZOS)
            photo = ImageTk.PhotoImage(img)
            
            # Guardar referencia para evitar garbage collection
            self.foto_principal = photo
            
            # Mostrar imagen
            self.lbl_img_principal.config(text="", image=photo)
        except Exception as e:
            self.lbl_img_principal.config(text=f"Error al cargar imagen:\n{str(e)}", image="")
    
    def cargar_imagenes_adicionales(self, producto_id):
        """Carga las imágenes adicionales del producto"""
        # Limpiar frame de imágenes adicionales
        for widget in self.img_adicionales_frame.winfo_children():
            widget.destroy()
        
        # Limpiar lista de imágenes adicionales
        self.imagenes_adicionales = []
        
        # Consultar imágenes adicionales
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT ruta_imagen FROM imagenes_adicionales 
        WHERE producto_id = ? 
        ORDER BY orden
        ''', (producto_id,))
        
        imagenes = cursor.fetchall()
        conn.close()
        
        # Crear widgets para cada imagen
        for i, img_data in enumerate(imagenes):
            ruta_imagen = img_data[0]
            self.añadir_imagen_adicional(ruta_imagen)
    
    def cargar_opciones(self, producto_id):
        """Carga las opciones del producto"""
        # Limpiar notebook de opciones
        for tab in self.opciones_notebook.tabs():
            self.opciones_notebook.forget(tab)
        
        # Limpiar diccionario de widgets
        self.opciones_widgets = {}
        
        # Consultar tipos de opciones
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT DISTINCT tipo FROM opciones 
        WHERE producto_id = ? 
        ORDER BY tipo
        ''', (producto_id,))
        
        tipos = cursor.fetchall()
        
        # Crear tabs para cada tipo de opción
        for tipo_data in tipos:
            tipo = tipo_data[0]
            self.crear_tab_opcion(tipo)
            
            # Consultar opciones para este tipo
            cursor.execute('''
            SELECT valor, precio_adicional FROM opciones 
            WHERE producto_id = ? AND tipo = ? 
            ORDER BY orden
            ''', (producto_id, tipo))
            
            opciones = cursor.fetchall()
            
            # Añadir opciones al listbox
            listbox = self.opciones_widgets[tipo]['listbox']
            for opcion in opciones:
                valor = opcion[0]
                precio = opcion[1]
                listbox.insert(tk.END, f"{valor} | ${precio:,.0f}")
        
        conn.close()
    
    def crear_tab_opcion(self, tipo):
        """Crea un tab para un tipo de opción"""
        # Crear frame para el tab
        tab = ttk.Frame(self.opciones_notebook)
        self.opciones_notebook.add(tab, text=tipo.capitalize())
        
        # Frame superior para añadir valores
        top_frame = ttk.Frame(tab, padding=5)
        top_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(top_frame, text="Valor:").pack(side=tk.LEFT, padx=5)
        valor_entry = ttk.Entry(top_frame, width=20)
        valor_entry.pack(side=tk.LEFT, padx=5)
        
        ttk.Label(top_frame, text="Precio Adicional:").pack(side=tk.LEFT, padx=5)
        precio_entry = ttk.Entry(top_frame, width=10)
        precio_entry.pack(side=tk.LEFT, padx=5)
        
        # Botón para añadir opción
        ttk.Button(top_frame, text="Añadir", 
                  command=lambda t=tipo, v=valor_entry, p=precio_entry: self.añadir_valor_opcion(t, v, p)).pack(side=tk.LEFT, padx=5)
        
        # Listbox para valores
        list_frame = ttk.Frame(tab, padding=5)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        listbox = tk.Listbox(list_frame, width=50, height=10)
        listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scroll = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=listbox.yview)
        listbox.configure(yscrollcommand=scroll.set)
        scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Botones para manejar valores
        btn_frame = ttk.Frame(tab, padding=5)
        btn_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(btn_frame, text="Eliminar Seleccionado", 
                  command=lambda t=tipo, l=listbox: self.eliminar_valor_opcion(t, l)).pack(side=tk.LEFT, padx=5)
        
        # Guardar referencias a los widgets
        self.opciones_widgets[tipo] = {
            'valor_entry': valor_entry,
            'precio_entry': precio_entry,
            'listbox': listbox
        }
    
    def añadir_valor_opcion(self, tipo, valor_entry, precio_entry):
        """Añade un valor a un tipo de opción"""
        valor = valor_entry.get().strip()
        if not valor:
            messagebox.showwarning("Valor Requerido", "Por favor, ingresa un valor para la opción.")
            return
        
        try:
            precio = float(precio_entry.get().replace(',', '') or 0)
        except ValueError:
            messagebox.showwarning("Precio Inválido", "Por favor, ingresa un número válido para el precio adicional.")
            return
        
        # Añadir a listbox
        listbox = self.opciones_widgets[tipo]['listbox']
        listbox.insert(tk.END, f"{valor} | ${precio:,.0f}")
        
        # Limpiar campos
        valor_entry.delete(0, tk.END)
        precio_entry.delete(0, tk.END)
    
    def eliminar_valor_opcion(self, tipo, listbox):
        """Elimina el valor seleccionado de un tipo de opción"""
        seleccion = listbox.curselection()
        if not seleccion:
            return
        
        listbox.delete(seleccion[0])
    
    def cargar_productos_relacionados(self, producto_id):
        """Carga los productos relacionados"""
        # Limpiar listboxes
        self.lista_disponibles.delete(0, tk.END)
        self.lista_relacionados.delete(0, tk.END)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Obtener todos los productos excepto el actual
        cursor.execute('''
        SELECT id, nombre FROM productos 
        WHERE id != ? 
        ORDER BY nombre
        ''', (producto_id,))
        
        todos_productos = cursor.fetchall()
        
        # Obtener productos relacionados
        cursor.execute('''
        SELECT pr.producto_relacionado_id, p.nombre 
        FROM productos_relacionados pr
        JOIN productos p ON pr.producto_relacionado_id = p.id
        WHERE pr.producto_id = ?
        ORDER BY p.nombre
        ''', (producto_id,))
        
        relacionados = cursor.fetchall()
        
        conn.close()
        
        # IDs de productos relacionados
        relacionados_ids = [r[0] for r in relacionados]
        
        # Llenar lista de relacionados
        for rel in relacionados:
            self.lista_relacionados.insert(tk.END, f"{rel[0]} - {rel[1]}")
        
        # Llenar lista de disponibles (los que no están en relacionados)
        for prod in todos_productos:
            if prod[0] not in relacionados_ids:
                self.lista_disponibles.insert(tk.END, f"{prod[0]} - {prod[1]}")
    
    def actualizar_resumen(self):
        """Actualiza el texto de resumen en la pestaña de características"""
        # Habilitar escritura
        self.txt_resumen.config(state=tk.NORMAL)
        
        # Limpiar texto
        self.txt_resumen.delete("1.0", tk.END)
        
        # Información básica
        self.txt_resumen.insert(tk.END, "INFORMACIÓN BÁSICA\n", "titulo")
        self.txt_resumen.insert(tk.END, f"ID: {self.var_id.get()}\n")
        self.txt_resumen.insert(tk.END, f"Nombre: {self.var_nombre.get()}\n")
        self.txt_resumen.insert(tk.END, f"Categoría: {self.var_categoria.get()}\n")
        self.txt_resumen.insert(tk.END, f"SKU: {self.var_sku.get()}\n")
        self.txt_resumen.insert(tk.END, f"Precio: ${self.var_precio.get():,.0f}\n")
        
        if self.var_precio_oferta.get() > 0:
            self.txt_resumen.insert(tk.END, f"Precio de Oferta: ${self.var_precio_oferta.get():,.0f}\n")
        
        self.txt_resumen.insert(tk.END, f"Es Nuevo: {'Sí' if self.var_es_nuevo.get() else 'No'}\n")
        self.txt_resumen.insert(tk.END, f"Es Oferta: {'Sí' if self.var_es_oferta.get() else 'No'}\n")
        
        # Etiquetas
        etiquetas = self.txt_etiquetas.get().strip()
        if etiquetas:
            self.txt_resumen.insert(tk.END, f"Etiquetas: {etiquetas}\n")
        
        # Descripción corta
        desc_corta = self.txt_desc_corta.get("1.0", tk.END).strip()
        if desc_corta:
            self.txt_resumen.insert(tk.END, "\nDESCRIPCIÓN CORTA\n", "titulo")
            self.txt_resumen.insert(tk.END, f"{desc_corta}\n")
        
        # Descripción completa
        desc_completa = self.txt_desc_completa.get("1.0", tk.END).strip()
        if desc_completa:
            self.txt_resumen.insert(tk.END, "\nDESCRIPCIÓN COMPLETA\n", "titulo")
            self.txt_resumen.insert(tk.END, f"{desc_completa}\n")
        
        # Beneficios
        beneficios = self.txt_beneficios.get("1.0", tk.END).strip()
        if beneficios:
            self.txt_resumen.insert(tk.END, "\nBENEFICIOS\n", "titulo")
            for linea in beneficios.split('\n'):
                if linea.strip():
                    self.txt_resumen.insert(tk.END, f"• {linea}\n")
        
        # Ingredientes
        ingredientes = self.txt_ingredientes.get("1.0", tk.END).strip()
        if ingredientes:
            self.txt_resumen.insert(tk.END, "\nINGREDIENTES\n", "titulo")
            for linea in ingredientes.split('\n'):
                if linea.strip():
                    self.txt_resumen.insert(tk.END, f"• {linea}\n")
        
        # Modo de uso
        modo_uso = self.txt_modo_uso.get("1.0", tk.END).strip()
        if modo_uso:
            self.txt_resumen.insert(tk.END, "\nMODO DE USO\n", "titulo")
            for i, linea in enumerate(modo_uso.split('\n')):
                if linea.strip():
                    self.txt_resumen.insert(tk.END, f"{i+1}. {linea}\n")
        
        # Imágenes
        self.txt_resumen.insert(tk.END, "\nIMAGENES\n", "titulo")
        if self.var_ruta_img_principal.get():
            self.txt_resumen.insert(tk.END, f"Principal: {self.var_ruta_img_principal.get()}\n")
        else:
            self.txt_resumen.insert(tk.END, "Principal: No definida\n")
        
        if self.imagenes_adicionales:
            self.txt_resumen.insert(tk.END, "Adicionales:\n")
            for img_data in self.imagenes_adicionales:
                ruta = img_data.get('ruta', 'No definida')
                self.txt_resumen.insert(tk.END, f"  - {ruta}\n")
        else:
            self.txt_resumen.insert(tk.END, "Adicionales: Ninguna\n")
        
        # Opciones
        if self.opciones_widgets:
            self.txt_resumen.insert(tk.END, "\nOPCIONES\n", "titulo")
            for tipo, widgets in self.opciones_widgets.items():
                self.txt_resumen.insert(tk.END, f"{tipo.capitalize()}:\n")
                listbox = widgets['listbox']
                for i in range(listbox.size()):
                    self.txt_resumen.insert(tk.END, f"  - {listbox.get(i)}\n")
        
        # Productos relacionados
        if self.lista_relacionados.size() > 0:
            self.txt_resumen.insert(tk.END, "\nPRODUCTOS RELACIONADOS\n", "titulo")
            for i in range(self.lista_relacionados.size()):
                self.txt_resumen.insert(tk.END, f"• {self.lista_relacionados.get(i)}\n")
        
        # Deshabilitar escritura
        self.txt_resumen.config(state=tk.DISABLED)
        
        # Configurar estilos de texto
        self.txt_resumen.tag_configure("titulo", font=("Arial", 10, "bold"))
    
    def seleccionar_imagen(self, tipo, indice=None):
        """Abre un diálogo para seleccionar una imagen"""
        # Obtener la carpeta inicial
        carpeta_inicial = os.path.abspath(self.img_path) if os.path.exists(self.img_path) else "/"
        
        # Abrir diálogo
        ruta_imagen = filedialog.askopenfilename(
            title="Seleccionar Imagen",
            initialdir=carpeta_inicial,
            filetypes=[("Imágenes", "*.jpg *.jpeg *.png *.gif")]
        )
        
        if not ruta_imagen:
            return
        
        # Copiar imagen a la carpeta del proyecto si es necesario
        if not ruta_imagen.startswith(self.img_path):
            # Crear carpeta si no existe
            if not os.path.exists(self.img_path):
                os.makedirs(self.img_path, exist_ok=True)
            
            # Generar nombre para la nueva imagen
            producto_id = self.var_id.get()
            extension = os.path.splitext(ruta_imagen)[1]
            nuevo_nombre = f"{producto_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}{extension}"
            nueva_ruta = os.path.join(self.img_path, nuevo_nombre)
            
            # Copiar archivo
            try:
                shutil.copy2(ruta_imagen, nueva_ruta)
                ruta_imagen = nueva_ruta
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo copiar la imagen: {str(e)}")
                return
        
        # Actualizar según el tipo de imagen
        if tipo == "principal":
            self.var_ruta_img_principal.set(ruta_imagen)
            self.mostrar_imagen_principal(ruta_imagen)
        elif tipo == "adicional" and indice is not None:
            # Actualizar imagen adicional existente
            self.imagenes_adicionales[indice]['ruta'] = ruta_imagen
            self.actualizar_vista_imagen_adicional(indice)
        
        # Actualizar resumen
        self.actualizar_resumen()
    
    def eliminar_imagen(self, tipo, indice=None):
        """Elimina una imagen seleccionada"""
        if tipo == "principal":
            self.var_ruta_img_principal.set("")
            self.lbl_img_principal.config(text="Sin imagen", image="")
            self.foto_principal = None
        elif tipo == "adicional" and indice is not None:
            # Eliminar frame de la imagen
            frame = self.imagenes_adicionales[indice]['frame']
            frame.destroy()
            
            # Eliminar de la lista
            self.imagenes_adicionales.pop(indice)
            
            # Actualizar índices
            for i, img_data in enumerate(self.imagenes_adicionales):
                img_data['indice'] = i
        
        # Actualizar resumen
        self.actualizar_resumen()
    
    def actualizar_vista_imagen_adicional(self, indice):
        """Actualiza la vista de una imagen adicional"""
        if indice >= len(self.imagenes_adicionales):
            return
        
        img_data = self.imagenes_adicionales[indice]
        ruta_imagen = img_data['ruta']
        
        if not ruta_imagen:
            img_data['label'].config(text="Sin imagen", image="")
            return
        
        try:
            # Verificar si la imagen existe
            if not os.path.exists(ruta_imagen) and ruta_imagen.startswith("assets/"):
                # Intentar con rutas relativas
                ruta_relativa = ruta_imagen.replace("assets/", "./assets/")
                if os.path.exists(ruta_relativa):
                    ruta_imagen = ruta_relativa
                else:
                    img_data['label'].config(text=f"Imagen no encontrada:\n{ruta_imagen}", image="")
                    return
            
            # Cargar y redimensionar imagen
            img = Image.open(ruta_imagen)
            img = img.resize((100, 100), Image.LANCZOS)
            photo = ImageTk.PhotoImage(img)
            
            # Guardar referencia para evitar garbage collection
            img_data['photo'] = photo
            
            # Mostrar imagen
            img_data['label'].config(text="", image=photo)
        except Exception as e:
            img_data['label'].config(text=f"Error:\n{str(e)}", image="")
    
    def añadir_tipo_opcion(self, event=None):
        """Añade un nuevo tipo de opción"""
        tipo = self.var_tipo_opcion.get().strip().lower()
        
        if not tipo:
            messagebox.showwarning("Tipo Requerido", "Por favor, ingresa un tipo de opción.")
            return
        
        # Verificar si ya existe
        if tipo in self.opciones_widgets:
            self.opciones_notebook.select(list(self.opciones_widgets.keys()).index(tipo))
            return
        
        # Crear tab para este tipo
        self.crear_tab_opcion(tipo)
        
        # Limpiar combobox
        self.combo_tipo_opcion.delete(0, tk.END)
    
    def añadir_relacionados(self):
        """Añade productos seleccionados a la lista de relacionados"""
        seleccion = self.lista_disponibles.curselection()
        if not seleccion:
            return
        
        # Obtener productos seleccionados
        productos = [self.lista_disponibles.get(i) for i in seleccion]
        
        # Añadir a relacionados y eliminar de disponibles
        for producto in productos:
            self.lista_relacionados.insert(tk.END, producto)
            
        # Eliminar de disponibles (comenzando por el último para no afectar índices)
        for i in sorted(seleccion, reverse=True):
            self.lista_disponibles.delete(i)
        
        # Actualizar resumen
        self.actualizar_resumen()
    
    def quitar_relacionados(self):
        """Quita productos seleccionados de la lista de relacionados"""
        seleccion = self.lista_relacionados.curselection()
        if not seleccion:
            return
        
        # Obtener productos seleccionados
        productos = [self.lista_relacionados.get(i) for i in seleccion]
        
        # Añadir a disponibles y eliminar de relacionados
        for producto in productos:
            self.lista_disponibles.insert(tk.END, producto)
            
        # Eliminar de relacionados (comenzando por el último para no afectar índices)
        for i in sorted(seleccion, reverse=True):
            self.lista_relacionados.delete(i)
        
        # Actualizar resumen
        self.actualizar_resumen()
    
    def nueva_categoria(self):
        """Crea una nueva categoría"""
        # Pedir ID de categoría
        categoria_id = simpledialog.askstring("Nueva Categoría", "ID de la categoría (sin espacios):")
        if not categoria_id:
            return
        
        # Validar formato de ID
        categoria_id = categoria_id.strip().lower().replace(' ', '-')
        
        # Pedir nombre de categoría
        categoria_nombre = simpledialog.askstring("Nueva Categoría", "Nombre de la categoría:")
        if not categoria_nombre:
            return
        
        # Pedir descripción
        categoria_desc = simpledialog.askstring("Nueva Categoría", "Descripción (opcional):")
        
        # Pedir icono
        categoria_icono = simpledialog.askstring("Nueva Categoría", "Icono (clase FontAwesome, ej: fas fa-spa):")
        if not categoria_icono:
            categoria_icono = "fas fa-spa"  # Valor por defecto
        
        # Guardar en la base de datos
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
            INSERT INTO categorias (id, nombre, descripcion, icono)
            VALUES (?, ?, ?, ?)
            ''', (categoria_id, categoria_nombre, categoria_desc, categoria_icono))
            
            conn.commit()
            messagebox.showinfo("Éxito", f"Categoría '{categoria_nombre}' creada correctamente.")
            
            # Actualizar interfaz
            self.cargar_categorias()
            self.cargar_combo_categorias()
        except sqlite3.IntegrityError:
            messagebox.showerror("Error", f"Ya existe una categoría con el ID '{categoria_id}'.")
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo crear la categoría: {str(e)}")
        finally:
            conn.close()
    
    def editar_categoria(self):
        """Edita la categoría seleccionada"""
        # Verificar si hay categoría seleccionada
        seleccion = self.categorias_tree.selection()
        if not seleccion:
            messagebox.showwarning("Selección Requerida", "Por favor, selecciona una categoría para editar.")
            return
        
        # Obtener datos de la categoría
        categoria_id = self.categorias_tree.item(seleccion[0], "text")
        categoria_nombre = self.categorias_tree.item(seleccion[0], "values")[0]
        
        # Consultar datos completos
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT descripcion, imagen, icono FROM categorias WHERE id = ?', (categoria_id,))
        datos = cursor.fetchone()
        
        if not datos:
            conn.close()
            return
        
        categoria_desc = datos[0] or ""
        categoria_imagen = datos[1] or ""
        categoria_icono = datos[2] or ""
        
        conn.close()
        
        # Pedir nuevos datos
        nuevo_nombre = simpledialog.askstring("Editar Categoría", "Nombre:", initialvalue=categoria_nombre)
        if nuevo_nombre is None:  # Cancelado
            return
        
        nueva_desc = simpledialog.askstring("Editar Categoría", "Descripción:", initialvalue=categoria_desc)
        if nueva_desc is None:  # Cancelado
            return
        
        nuevo_icono = simpledialog.askstring("Editar Categoría", "Icono (FontAwesome):", initialvalue=categoria_icono)
        if nuevo_icono is None:  # Cancelado
            return
        
        # Actualizar en la base de datos
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
            UPDATE categorias 
            SET nombre = ?, descripcion = ?, icono = ?
            WHERE id = ?
            ''', (nuevo_nombre, nueva_desc, nuevo_icono, categoria_id))
            
            # También actualizar nombre en productos
            cursor.execute('''
            UPDATE productos 
            SET categoria_nombre = ?
            WHERE categoria = ?
            ''', (nuevo_nombre, categoria_id))
            
            conn.commit()
            messagebox.showinfo("Éxito", f"Categoría '{nuevo_nombre}' actualizada correctamente.")
            
            # Actualizar interfaz
            self.cargar_categorias()
            self.cargar_combo_categorias()
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo actualizar la categoría: {str(e)}")
        finally:
            conn.close()
    
    def eliminar_categoria(self):
        """Elimina la categoría seleccionada"""
        # Verificar si hay categoría seleccionada
        seleccion = self.categorias_tree.selection()
        if not seleccion:
            messagebox.showwarning("Selección Requerida", "Por favor, selecciona una categoría para eliminar.")
            return
        
        # Obtener datos de la categoría
        categoria_id = self.categorias_tree.item(seleccion[0], "text")
        categoria_nombre = self.categorias_tree.item(seleccion[0], "values")[0]
        productos_count = int(self.categorias_tree.item(seleccion[0], "values")[1])
        
        # Confirmar eliminación
        if productos_count > 0:
            respuesta = messagebox.askyesno("Confirmar Eliminación", 
                                           f"La categoría '{categoria_nombre}' tiene {productos_count} productos asociados. "+
                                           "Si la eliminas, estos productos quedarán sin categoría.\n\n"+
                                           "¿Estás seguro de que deseas eliminarla?")
        else:
            respuesta = messagebox.askyesno("Confirmar Eliminación", 
                                           f"¿Estás seguro de que deseas eliminar la categoría '{categoria_nombre}'?")
        
        if not respuesta:
            return
        
        # Eliminar de la base de datos
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Establecer productos a una categoría genérica
            if productos_count > 0:
                cursor.execute('''
                UPDATE productos 
                SET categoria = 'sin-categoria', categoria_nombre = 'Sin Categoría'
                WHERE categoria = ?
                ''', (categoria_id,))
                
                # Verificar si existe la categoría genérica, crearla si no
                cursor.execute('SELECT id FROM categorias WHERE id = "sin-categoria"')
                if not cursor.fetchone():
                    cursor.execute('''
                    INSERT INTO categorias (id, nombre, descripcion, icono)
                    VALUES ('sin-categoria', 'Sin Categoría', 'Productos sin categoría asignada', 'fas fa-question')
                    ''')
            
            # Eliminar la categoría
            cursor.execute('DELETE FROM categorias WHERE id = ?', (categoria_id,))
            
            conn.commit()
            messagebox.showinfo("Éxito", f"Categoría '{categoria_nombre}' eliminada correctamente.")
            
            # Actualizar interfaz
            self.cargar_categorias()
            self.cargar_combo_categorias()
            self.cargar_productos()  # Actualizar lista de productos
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo eliminar la categoría: {str(e)}")
        finally:
            conn.close()

















































    def nuevo_producto(self):
            """Crea un nuevo producto"""
            # Pedir ID de producto
            producto_id = simpledialog.askstring("Nuevo Producto", "ID del producto (sin espacios):")
            if not producto_id:
                return
            
            # Validar formato de ID
            producto_id = producto_id.strip().lower().replace(' ', '-')
            
            # Pedir nombre del producto
            producto_nombre = simpledialog.askstring("Nuevo Producto", "Nombre del producto:")
            if not producto_nombre:
                return
            
            # Verificar si hay categorías
            if not self.combo_categoria['values']:
                messagebox.showwarning("Sin Categorías", "Debes crear al menos una categoría antes de añadir productos.")
                return
            
            # Pedir categoría
            categoria_completa = simpledialog.askstring("Nuevo Producto", "Categoría:", 
                                                    initialvalue=self.combo_categoria['values'][0])
            if not categoria_completa:
                return
            
            # Extraer ID de categoría
            categoria_id = categoria_completa.split(' - ')[0]
            
            # Consultar nombre de categoría
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT nombre FROM categorias WHERE id = ?', (categoria_id,))
            resultado = cursor.fetchone()
            
            if not resultado:
                conn.close()
                messagebox.showerror("Error", f"La categoría con ID '{categoria_id}' no existe.")
                return
            
            categoria_nombre = resultado[0]
            
            # Crear producto básico
            try:
                cursor.execute('''
                INSERT INTO productos (id, nombre, categoria, categoria_nombre, precio, es_nuevo)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (producto_id, producto_nombre, categoria_id, categoria_nombre, 0, 1))
                
                conn.commit()
                messagebox.showinfo("Éxito", f"Producto '{producto_nombre}' creado correctamente.")
                
                # Actualizar interfaz
                self.cargar_productos(categoria_id)
                
                # Seleccionar el nuevo producto
                for item in self.productos_tree.get_children():
                    if self.productos_tree.item(item, "text") == producto_id:
                        self.productos_tree.selection_set(item)
                        self.productos_tree.focus(item)
                        self.seleccionar_producto(None)
                        break
            except sqlite3.IntegrityError:
                messagebox.showerror("Error", f"Ya existe un producto con el ID '{producto_id}'.")
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo crear el producto: {str(e)}")
            finally:
                conn.close()
    
    def eliminar_producto(self):
        """Elimina el producto seleccionado"""
        # Verificar si hay producto seleccionado
        seleccion = self.productos_tree.selection()
        if not seleccion:
            messagebox.showwarning("Selección Requerida", "Por favor, selecciona un producto para eliminar.")
            return
        
        # Obtener datos del producto
        producto_id = self.productos_tree.item(seleccion[0], "text")
        producto_nombre = self.productos_tree.item(seleccion[0], "values")[0]
        
        # Confirmar eliminación
        respuesta = messagebox.askyesno("Confirmar Eliminación", 
                                       f"¿Estás seguro de que deseas eliminar el producto '{producto_nombre}'?")
        if not respuesta:
            return
        
        # Eliminar de la base de datos
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Eliminar registros relacionados primero
            cursor.execute('DELETE FROM descripciones WHERE producto_id = ?', (producto_id,))
            cursor.execute('DELETE FROM beneficios WHERE producto_id = ?', (producto_id,))
            cursor.execute('DELETE FROM ingredientes WHERE producto_id = ?', (producto_id,))
            cursor.execute('DELETE FROM modo_uso WHERE producto_id = ?', (producto_id,))
            cursor.execute('DELETE FROM imagenes_adicionales WHERE producto_id = ?', (producto_id,))
            cursor.execute('DELETE FROM opciones WHERE producto_id = ?', (producto_id,))
            cursor.execute('DELETE FROM productos_relacionados WHERE producto_id = ? OR producto_relacionado_id = ?', 
                          (producto_id, producto_id))
            
            # Finalmente eliminar el producto
            cursor.execute('DELETE FROM productos WHERE id = ?', (producto_id,))
            
            conn.commit()
            messagebox.showinfo("Éxito", f"Producto '{producto_nombre}' eliminado correctamente.")
            
            # Actualizar interfaz
            # Obtener la categoría actualmente seleccionada
            categoria_seleccionada = None
            seleccion_cat = self.categorias_tree.selection()
            if seleccion_cat:
                categoria_seleccionada = self.categorias_tree.item(seleccion_cat[0], "text")
            
            self.cargar_productos(categoria_seleccionada)
            self.cargar_categorias()  # Actualizar contadores
            
            # Deshabilitar detalles
            self.notebook.state(['disabled'])
            self.btn_guardar.state(['disabled'])
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo eliminar el producto: {str(e)}")
        finally:
            conn.close()
    
    def guardar_producto(self):
        """Guarda los cambios del producto actual"""
        # Verificar ID
        producto_id = self.var_id.get().strip()
        if not producto_id:
            messagebox.showwarning("ID Requerido", "El ID del producto es obligatorio.")
            return
        
        # Verificar nombre
        producto_nombre = self.var_nombre.get().strip()
        if not producto_nombre:
            messagebox.showwarning("Nombre Requerido", "El nombre del producto es obligatorio.")
            return
        
        # Verificar categoría
        categoria_completa = self.var_categoria.get().strip()
        if not categoria_completa:
            messagebox.showwarning("Categoría Requerida", "La categoría del producto es obligatoria.")
            return
        
        # Extraer ID y nombre de categoría
        try:
            categoria_id, categoria_nombre = categoria_completa.split(' - ', 1)
        except ValueError:
            messagebox.showwarning("Formato Incorrecto", "La categoría debe tener el formato 'id - nombre'.")
            return
        
        # Verificar precio
        try:
            precio = float(self.var_precio.get())
            if precio < 0:
                raise ValueError("El precio no puede ser negativo.")
        except ValueError as e:
            messagebox.showwarning("Precio Inválido", str(e))
            return
        
        # Verificar precio de oferta
        try:
            precio_oferta = float(self.var_precio_oferta.get() or 0)
            if precio_oferta < 0:
                raise ValueError("El precio de oferta no puede ser negativo.")
        except ValueError as e:
            messagebox.showwarning("Precio de Oferta Inválido", str(e))
            return
        
        # Si es oferta pero no hay precio de oferta
        es_oferta = self.var_es_oferta.get()
        if es_oferta and precio_oferta <= 0:
            messagebox.showwarning("Precio de Oferta Requerido", 
                                 "Si marcas el producto como oferta, debes indicar un precio de oferta.")
            return
        
        # Si hay precio de oferta pero no está marcado como oferta
        if precio_oferta > 0 and not es_oferta:
            # Preguntar si marcar automáticamente
            respuesta = messagebox.askyesno("Oferta", 
                                           "Has indicado un precio de oferta, ¿deseas marcar el producto como oferta?")
            if respuesta:
                es_oferta = True
                self.var_es_oferta.set(True)
        
        # Obtener descripción corta
        descripcion_corta = self.txt_desc_corta.get("1.0", tk.END).strip()
        
        # Obtener etiquetas
        etiquetas_texto = self.txt_etiquetas.get().strip()
        etiquetas = [tag.strip() for tag in etiquetas_texto.split(',') if tag.strip()]
        etiquetas_json = json.dumps(etiquetas) if etiquetas else None
        
        # Guardar datos básicos del producto
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
            UPDATE productos SET
            nombre = ?,
            categoria = ?,
            categoria_nombre = ?,
            descripcion_corta = ?,
            precio = ?,
            precio_oferta = ?,
            es_nuevo = ?,
            es_oferta = ?,
            etiquetas = ?,
            sku = ?,
            imagen_principal = ?
            WHERE id = ?
            ''', (
                producto_nombre,
                categoria_id,
                categoria_nombre,
                descripcion_corta,
                precio,
                precio_oferta if precio_oferta > 0 else None,
                1 if self.var_es_nuevo.get() else 0,
                1 if es_oferta else 0,
                etiquetas_json,
                self.var_sku.get().strip(),
                self.var_ruta_img_principal.get().strip(),
                producto_id
            ))
            
            # Guardar descripciones
            cursor.execute('DELETE FROM descripciones WHERE producto_id = ?', (producto_id,))
            descripciones = self.txt_desc_completa.get("1.0", tk.END).strip().split('\n')
            for i, desc in enumerate(descripciones):
                if desc.strip():
                    cursor.execute('''
                    INSERT INTO descripciones (producto_id, descripcion, orden)
                    VALUES (?, ?, ?)
                    ''', (producto_id, desc.strip(), i))
            
            # Guardar beneficios
            cursor.execute('DELETE FROM beneficios WHERE producto_id = ?', (producto_id,))
            beneficios = self.txt_beneficios.get("1.0", tk.END).strip().split('\n')
            for i, ben in enumerate(beneficios):
                if ben.strip():
                    cursor.execute('''
                    INSERT INTO beneficios (producto_id, beneficio, orden)
                    VALUES (?, ?, ?)
                    ''', (producto_id, ben.strip(), i))
            
            # Guardar ingredientes
            cursor.execute('DELETE FROM ingredientes WHERE producto_id = ?', (producto_id,))
            ingredientes = self.txt_ingredientes.get("1.0", tk.END).strip().split('\n')
            for i, ing in enumerate(ingredientes):
                if ing.strip():
                    cursor.execute('''
                    INSERT INTO ingredientes (producto_id, ingrediente, orden)
                    VALUES (?, ?, ?)
                    ''', (producto_id, ing.strip(), i))
            
            # Guardar modo de uso
            cursor.execute('DELETE FROM modo_uso WHERE producto_id = ?', (producto_id,))
            instrucciones = self.txt_modo_uso.get("1.0", tk.END).strip().split('\n')
            for i, inst in enumerate(instrucciones):
                if inst.strip():
                    cursor.execute('''
                    INSERT INTO modo_uso (producto_id, instruccion, orden)
                    VALUES (?, ?, ?)
                    ''', (producto_id, inst.strip(), i))
            
            # Guardar imágenes adicionales
            cursor.execute('DELETE FROM imagenes_adicionales WHERE producto_id = ?', (producto_id,))
            for i, img_data in enumerate(self.imagenes_adicionales):
                ruta = img_data.get('ruta')
                if ruta:
                    cursor.execute('''
                    INSERT INTO imagenes_adicionales (producto_id, ruta_imagen, orden)
                    VALUES (?, ?, ?)
                    ''', (producto_id, ruta, i))
            
            # Guardar opciones
            cursor.execute('DELETE FROM opciones WHERE producto_id = ?', (producto_id,))
            for tipo, widgets in self.opciones_widgets.items():
                listbox = widgets['listbox']
                for i in range(listbox.size()):
                    # Formato: "valor | $precio"
                    texto = listbox.get(i)
                    partes = texto.split('|')
                    valor = partes[0].strip()
                    precio_adicional = 0
                    
                    if len(partes) > 1:
                        # Extraer valor numérico del precio (quitar "$" y ",")
                        try:
                            precio_adicional = float(partes[1].strip().replace('$', '').replace(',', ''))
                        except ValueError:
                            precio_adicional = 0
                    
                    cursor.execute('''
                    INSERT INTO opciones (producto_id, tipo, valor, precio_adicional, orden)
                    VALUES (?, ?, ?, ?, ?)
                    ''', (producto_id, tipo, valor, precio_adicional, i))
            
            # Guardar productos relacionados
            cursor.execute('DELETE FROM productos_relacionados WHERE producto_id = ?', (producto_id,))
            for i in range(self.lista_relacionados.size()):
                # Formato: "id - nombre"
                texto = self.lista_relacionados.get(i)
                relacionado_id = texto.split(' - ')[0]
                
                cursor.execute('''
                INSERT INTO productos_relacionados (producto_id, producto_relacionado_id)
                VALUES (?, ?)
                ''', (producto_id, relacionado_id))
            
            conn.commit()
            messagebox.showinfo("Éxito", f"Producto '{producto_nombre}' guardado correctamente.")
            
            # Actualizar interfaz
            self.cargar_productos_relacionados(producto_id)  # Actualizar relacionados
            self.cargar_categorias()  # Actualizar contadores
            
            # Actualizar el producto en el Treeview
            for item in self.productos_tree.get_children():
                if self.productos_tree.item(item, "text") == producto_id:
                    # Formatear precio
                    precio_fmt = f"${precio:,.0f}"
                    
                    # Formatear precio de oferta
                    precio_oferta_fmt = f"${precio_oferta:,.0f}" if precio_oferta > 0 else "-"
                    
                    # Formato para es_nuevo
                    es_nuevo_fmt = "✓" if self.var_es_nuevo.get() else ""
                    
                    self.productos_tree.item(item, values=(producto_nombre, precio_fmt, precio_oferta_fmt, es_nuevo_fmt))
                    break
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo guardar el producto: {str(e)}")
            raise e
        finally:
            conn.close()
    
    def exportar_json(self):
        """Exporta la base de datos a un archivo JSON"""
        # Pedir ubicación para guardar
        ruta_json = filedialog.asksaveasfilename(
            title="Guardar JSON",
            initialdir="./",
            initialfile="productos.json",
            defaultextension=".json",
            filetypes=[("Archivos JSON", "*.json"), ("Todos los archivos", "*.*")]
        )
        
        if not ruta_json:
            return
        
        # Conectar a la base de datos
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            # Obtener categorías
            cursor.execute('''
            SELECT id, nombre, descripcion, imagen, icono
            FROM categorias
            ORDER BY nombre
            ''')
            
            categorias_raw = cursor.fetchall()
            
            # Convertir a diccionarios
            categorias = []
            for cat in categorias_raw:
                categorias.append({
                    "id": cat['id'],
                    "nombre": cat['nombre'],
                    "descripcion": cat['descripcion'],
                    "imagen": cat['imagen'],
                    "icono": cat['icono']
                })
            
            # Obtener productos
            cursor.execute('''
            SELECT id, nombre, categoria, categoria_nombre, descripcion_corta,
                   precio, precio_oferta, imagen_principal, es_nuevo, es_oferta,
                   etiquetas, sku
            FROM productos
            ORDER BY nombre
            ''')
            
            productos_raw = cursor.fetchall()
            
            # Convertir a diccionarios
            productos = []
            for prod in productos_raw:
                # Construir producto básico
                producto = {
                    "id": prod['id'],
                    "nombre": prod['nombre'],
                    "categoria": prod['categoria'],
                    "categoria_nombre": prod['categoria_nombre'],
                    "descripcion_corta": prod['descripcion_corta'],
                    "precio": prod['precio'],
                    "precio_oferta": prod['precio_oferta'],
                    "imagen_principal": prod['imagen_principal'],
                    "es_nuevo": bool(prod['es_nuevo']),
                    "es_oferta": bool(prod['es_oferta']),
                    "sku": prod['sku']
                }
                
                # Añadir etiquetas
                if prod['etiquetas']:
                    try:
                        producto["etiquetas"] = json.loads(prod['etiquetas'])
                    except:
                        producto["etiquetas"] = []
                else:
                    producto["etiquetas"] = []
                
                # Obtener descripciones
                cursor.execute('''
                SELECT descripcion FROM descripciones 
                WHERE producto_id = ? 
                ORDER BY orden
                ''', (prod['id'],))
                
                descripciones = [row['descripcion'] for row in cursor.fetchall()]
                producto["descripcion_completa"] = descripciones
                
                # Obtener beneficios
                cursor.execute('''
                SELECT beneficio FROM beneficios 
                WHERE producto_id = ? 
                ORDER BY orden
                ''', (prod['id'],))
                
                beneficios = [row['beneficio'] for row in cursor.fetchall()]
                producto["beneficios"] = beneficios
                
                # Obtener ingredientes
                cursor.execute('''
                SELECT ingrediente FROM ingredientes 
                WHERE producto_id = ? 
                ORDER BY orden
                ''', (prod['id'],))
                
                ingredientes = [row['ingrediente'] for row in cursor.fetchall()]
                producto["ingredientes"] = ingredientes
                
                
                # Obtener modo de uso
                cursor.execute('''
                SELECT instruccion FROM modo_uso 
                WHERE producto_id = ? 
                ORDER BY orden
                ''', (prod['id'],))
                
                modo_uso = [row['instruccion'] for row in cursor.fetchall()]
                producto["modo_uso"] = modo_uso
                
                # Obtener imágenes adicionales
                cursor.execute('''
                SELECT ruta_imagen FROM imagenes_adicionales 
                WHERE producto_id = ? 
                ORDER BY orden
                ''', (prod['id'],))
                
                imagenes = [row['ruta_imagen'] for row in cursor.fetchall()]
                producto["imagenes_adicionales"] = imagenes
                
                # Obtener opciones
                cursor.execute('''
                SELECT DISTINCT tipo FROM opciones 
                WHERE producto_id = ? 
                ORDER BY tipo
                ''', (prod['id'],))
                
                tipos_opciones = [row['tipo'] for row in cursor.fetchall()]
                
                opciones = {}
                for tipo in tipos_opciones:
                    cursor.execute('''
                    SELECT valor, precio_adicional FROM opciones 
                    WHERE producto_id = ? AND tipo = ? 
                    ORDER BY orden
                    ''', (prod['id'], tipo))
                    
                    valores_opciones = []
                    for opcion in cursor.fetchall():
                        valores_opciones.append({
                            "valor": opcion['valor'],
                            "precio_adicional": opcion['precio_adicional']
                        })
                    
                    opciones[tipo] = valores_opciones
                
                producto["opciones"] = opciones
                
                # Obtener productos relacionados
                cursor.execute('''
                SELECT producto_relacionado_id FROM productos_relacionados 
                WHERE producto_id = ?
                ''', (prod['id'],))
                
                relacionados = [row['producto_relacionado_id'] for row in cursor.fetchall()]
                producto["productos_relacionados"] = relacionados
                
                # Añadir producto a la lista
                productos.append(producto)
            
            # Crear objeto JSON final
            json_data = {
                "productos": productos,
                "categorias": categorias
            }
            
            # Guardar a archivo
            with open(ruta_json, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, ensure_ascii=False, indent=2)
            
            messagebox.showinfo("Éxito", f"Datos exportados correctamente a:\n{ruta_json}")
        except Exception as e:
            messagebox.showerror("Error", f"Error al exportar datos: {str(e)}")
        finally:
            conn.close()
    
    def importar_json(self):
        """Importa datos desde un archivo JSON"""
        # Pedir archivo para importar
        ruta_json = filedialog.askopenfilename(
            title="Abrir JSON",
            initialdir="./",
            filetypes=[("Archivos JSON", "*.json"), ("Todos los archivos", "*.*")]
        )
        
        if not ruta_json:
            return
        
        # Confirmar importación
        respuesta = messagebox.askyesno("Confirmar Importación", 
                                       "La importación reemplazará todos los datos existentes.\n\n"+
                                       "¿Estás seguro de que deseas continuar?")
        if not respuesta:
            return
        
        try:
            # Cargar datos del JSON
            with open(ruta_json, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            # Verificar estructura
            if 'productos' not in json_data or 'categorias' not in json_data:
                messagebox.showerror("Formato Incorrecto", 
                                    "El archivo JSON no tiene el formato correcto para Karumy Cosméticos.")
                return
            
            # Conectar a la base de datos
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Comenzar transacción
            cursor.execute("BEGIN TRANSACTION")
            
            try:
                # Limpiar tablas existentes
                cursor.execute("DELETE FROM productos_relacionados")
                cursor.execute("DELETE FROM opciones")
                cursor.execute("DELETE FROM imagenes_adicionales")
                cursor.execute("DELETE FROM modo_uso")
                cursor.execute("DELETE FROM ingredientes")
                cursor.execute("DELETE FROM beneficios")
                cursor.execute("DELETE FROM descripciones")
                cursor.execute("DELETE FROM productos")
                cursor.execute("DELETE FROM categorias")
                
                # Importar categorías
                for cat in json_data['categorias']:
                    cursor.execute('''
                    INSERT INTO categorias (id, nombre, descripcion, imagen, icono)
                    VALUES (?, ?, ?, ?, ?)
                    ''', (
                        cat.get('id', ''),
                        cat.get('nombre', ''),
                        cat.get('descripcion', ''),
                        cat.get('imagen', ''),
                        cat.get('icono', '')
                    ))
                
                # Importar productos
                for prod in json_data['productos']:
                    # Datos básicos
                    cursor.execute('''
                    INSERT INTO productos (
                        id, nombre, categoria, categoria_nombre, descripcion_corta,
                        precio, precio_oferta, imagen_principal, es_nuevo, es_oferta,
                        etiquetas, sku
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        prod.get('id', ''),
                        prod.get('nombre', ''),
                        prod.get('categoria', ''),
                        prod.get('categoria_nombre', ''),
                        prod.get('descripcion_corta', ''),
                        prod.get('precio', 0),
                        prod.get('precio_oferta'),
                        prod.get('imagen_principal', ''),
                        1 if prod.get('es_nuevo', False) else 0,
                        1 if prod.get('es_oferta', False) else 0,
                        json.dumps(prod.get('etiquetas', [])) if 'etiquetas' in prod else None,
                        prod.get('sku', '')
                    ))
                    
                    # Descripciones
                    for i, desc in enumerate(prod.get('descripcion_completa', [])):
                        cursor.execute('''
                        INSERT INTO descripciones (producto_id, descripcion, orden)
                        VALUES (?, ?, ?)
                        ''', (prod['id'], desc, i))
                    
                    # Beneficios
                    for i, ben in enumerate(prod.get('beneficios', [])):
                        cursor.execute('''
                        INSERT INTO beneficios (producto_id, beneficio, orden)
                        VALUES (?, ?, ?)
                        ''', (prod['id'], ben, i))
                    
                    # Ingredientes
                    for i, ing in enumerate(prod.get('ingredientes', [])):
                        cursor.execute('''
                        INSERT INTO ingredientes (producto_id, ingrediente, orden)
                        VALUES (?, ?, ?)
                        ''', (prod['id'], ing, i))
                    
                    # Modo de uso
                    for i, uso in enumerate(prod.get('modo_uso', [])):
                        cursor.execute('''
                        INSERT INTO modo_uso (producto_id, instruccion, orden)
                        VALUES (?, ?, ?)
                        ''', (prod['id'], uso, i))
                    
                    # Imágenes adicionales
                    for i, img in enumerate(prod.get('imagenes_adicionales', [])):
                        cursor.execute('''
                        INSERT INTO imagenes_adicionales (producto_id, ruta_imagen, orden)
                        VALUES (?, ?, ?)
                        ''', (prod['id'], img, i))
                    
                    # Opciones
                    for tipo, opciones in prod.get('opciones', {}).items():
                        for i, opcion in enumerate(opciones):
                            cursor.execute('''
                            INSERT INTO opciones (producto_id, tipo, valor, precio_adicional, orden)
                            VALUES (?, ?, ?, ?, ?)
                            ''', (
                                prod['id'],
                                tipo,
                                opcion.get('valor', ''),
                                opcion.get('precio_adicional', 0),
                                i
                            ))
                    
                    # Productos relacionados
                    for rel_id in prod.get('productos_relacionados', []):
                        cursor.execute('''
                        INSERT INTO productos_relacionados (producto_id, producto_relacionado_id)
                        VALUES (?, ?)
                        ''', (prod['id'], rel_id))
                
                # Confirmar transacción
                cursor.execute("COMMIT")
                
                messagebox.showinfo("Éxito", "Datos importados correctamente.")
                
                # Actualizar interfaz
                self.cargar_categorias()
                self.cargar_combo_categorias()
                self.cargar_productos()
            except Exception as e:
                # Revertir cambios en caso de error
                cursor.execute("ROLLBACK")
                raise e
            finally:
                conn.close()
        except Exception as e:
            messagebox.showerror("Error", f"Error al importar datos: {str(e)}")
