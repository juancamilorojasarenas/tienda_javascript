// ====================================================================
// SISTEMA DE E-COMMERCE - TIENDA 3x1
// ====================================================================

// Estado global de la aplicación
let productos = [];
let productosFiltrados = [];
let carrito = [];
let categorias = new Set();

// ====================================================================
// CONFIGURACIÓN DE ELEMENTOS DOM
// ====================================================================

// Elementos principales
const productosContainer = document.getElementById('productos');
const panelCarro = document.getElementById('panelCarro');
const objetosCarrito = document.getElementById('objetos');
const cantidadCarroSpan = document.getElementById('cantidadcarro');
const cartCountSpan = document.getElementById('cartCount');

// Elementos de navegación
const busquedaInput = document.getElementById('busqueda');
const searchBtn = document.getElementById('searchBtn');
const filtrarSelect = document.getElementById('Filtrar');
const sortSelect = document.getElementById('sortSelect');
const carroBtn = document.getElementById('carro');
const comprarBtn = document.getElementById('Comprar');

// ====================================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ====================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Cargar carrito desde localStorage
        loadCartFromStorage();
        
        // Obtener productos de la API
        await fetchProducts();
        
        // Configurar event listeners
        initEventListeners();
        
        // Renderizar productos iniciales
        renderProducts(productos);
        
        // Actualizar display del carrito
        updateCartDisplay();
        
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        showErrorMessage('Error al cargar la tienda. Por favor, recarga la página.');
    }
});

// ====================================================================
// CONSUMO DE API
// ====================================================================

/**
 * Obtiene productos de la API FakeStore
 */
async function fetchProducts() {
    try {
        // Mostrar indicador de carga
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div class="loading" style="font-size: 1.5rem; color: var(--color-primary);">
                    🔄 Cargando productos...
                </div>
            </div>
        `;

        const response = await fetch('https://fakestoreapi.com/products');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validar y procesar datos
        productos = data.filter(producto => 
            producto && 
            producto.id && 
            producto.title && 
            producto.price && 
            producto.category
        ).map(producto => ({
            id: producto.id,
            title: producto.title,
            price: parseFloat(producto.price),
            category: producto.category,
            description: producto.description || '',
            image: producto.image || './css/media/placeholder.png'
        }));

        // Extraer categorías únicas
        productos.forEach(producto => categorias.add(producto.category));
        
        // Actualizar select de categorías
        updateCategorySelect();
        
        // Establecer productos filtrados
        productosFiltrados = [...productos];
        
        console.log(`✅ ${productos.length} productos cargados correctamente`);
        
    } catch (error) {
        console.error('❌ Error al obtener productos:', error);
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div style="color: var(--color-danger); font-size: 1.2rem;">
                    ⚠️ Error al cargar productos. Verifica tu conexión a internet.
                </div>
                <button onclick="fetchProducts()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    🔄 Reintentar
                </button>
            </div>
        `;
        throw error;
    }
}

/**
 * Actualiza el select de categorías
 */
function updateCategorySelect() {
    // Limpiar opciones existentes (excepto "Todas las categorías")
    filtrarSelect.innerHTML = '<option value="all">Todas las categorías</option>';
    
    // Agregar categorías ordenadas alfabéticamente
    [...categorias].sort().forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        filtrarSelect.appendChild(option);
    });
}

// ====================================================================
// RENDERIZADO DE PRODUCTOS
// ====================================================================

/**
 * Renderiza la lista de productos en el DOM
 * @param {Array} productosParaRenderizar - Array de productos a mostrar
 */
function renderProducts(productosParaRenderizar) {
    if (!productosParaRenderizar || productosParaRenderizar.length === 0) {
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div style="color: var(--color-gray); font-size: 1.2rem;">
                    🔍 No se encontraron productos
                </div>
            </div>
        `;
        return;
    }

    productosContainer.innerHTML = productosParaRenderizar.map(producto => `
        <article>
            <img src="${producto.image}" 
                 alt="${producto.title}" 
                 onerror="this.src='./css/media/placeholder.png'"
                 loading="lazy" />
            <h3>${truncateText(producto.title, 50)}</h3>
            <p>${truncateText(producto.description, 80) || 'Sin descripción disponible'}</p>
            <p style="font-weight: 600; color: var(--color-primary); font-size: 1.1rem; margin: 0.5rem 0;">
                $${producto.price.toFixed(2)}
            </p>
            <p style="font-size: 0.8rem; color: var(--color-gray); text-transform: capitalize; margin-bottom: 1rem;">
                📂 ${producto.category}
            </p>
            <button onclick="addToCart(${producto.id})" 
                    data-product-id="${producto.id}">
                🛒 Agregar al Carrito
            </button>
        </article>
    `).join('');
}

/**
 * Trunca texto a una longitud específica
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ====================================================================
// GESTIÓN DEL CARRITO
// ====================================================================

/**
 * Agrega un producto al carrito
 * @param {number} productId - ID del producto a agregar
 */
function addToCart(productId) {
    const producto = productos.find(p => p.id === productId);
    
    if (!producto) {
        console.error('Producto no encontrado:', productId);
        return;
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = carrito.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            title: producto.title,
            price: producto.price,
            image: producto.image,
            cantidad: 1
        });
    }

    // Actualizar UI y storage
    updateCartDisplay();
    saveCartToStorage();
    
    // Feedback visual
    showNotification(`✅ ${producto.title} agregado al carrito`);
    
    console.log('Producto agregado al carrito:', producto.title);
}

/**
 * Elimina un producto del carrito
 * @param {number} productId - ID del producto a eliminar
 */
function removeFromCart(productId) {
    const index = carrito.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        const producto = carrito[index];
        carrito.splice(index, 1);
        
        updateCartDisplay();
        saveCartToStorage();
        
        showNotification(`❌ ${producto.title} eliminado del carrito`);
        console.log('Producto eliminado del carrito:', producto.title);
    }
}

/**
 * Actualiza la cantidad de un producto en el carrito
 * @param {number} productId - ID del producto
 * @param {number} nuevaCantidad - Nueva cantidad
 */
function updateCartQuantity(productId, nuevaCantidad) {
    const item = carrito.find(item => item.id === productId);
    
    if (item) {
        if (nuevaCantidad <= 0) {
            removeFromCart(productId);
        } else {
            item.cantidad = parseInt(nuevaCantidad);
            updateCartDisplay();
            saveCartToStorage();
        }
    }
}

/**
 * Actualiza la visualización del carrito
 */
function updateCartDisplay() {
    // Actualizar contador en el botón del carrito
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCountSpan.textContent = totalItems;

    // Actualizar lista de productos en el panel
    if (carrito.length === 0) {
        objetosCarrito.innerHTML = `
            <li style="text-align: center; color: var(--color-gray); padding: 2rem;">
                🛒 Tu carrito está vacío
            </li>
        `;
    } else {
        objetosCarrito.innerHTML = carrito.map(item => `
            <li style="display: flex; flex-direction: column; gap: 0.5rem; border-bottom: 1px solid var(--color-gray-light); padding-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="${item.image}" alt="${item.title}" 
                         style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;" 
                         onerror="this.src='./css/media/placeholder.png'" />
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.9rem; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${truncateText(item.title, 30)}
                        </div>
                        <div style="color: var(--color-primary); font-weight: 600;">
                            $${item.price.toFixed(2)}
                        </div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <button onclick="updateCartQuantity(${item.id}, ${item.cantidad - 1})" 
                                style="width: 24px; height: 24px; border: none; background: var(--color-gray-light); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">-</button>
                        <span style="min-width: 30px; text-align: center; font-weight: 600;">${item.cantidad}</span>
                        <button onclick="updateCartQuantity(${item.id}, ${item.cantidad + 1})" 
                                style="width: 24px; height: 24px; border: none; background: var(--color-gray-light); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">+</button>
                    </div>
                    <button onclick="removeFromCart(${item.id})" 
                            style="padding: 0.25rem 0.5rem; border: none; background: var(--color-danger); color: white; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        🗑️
                    </button>
                </div>
            </li>
        `).join('');
    }

    // Actualizar total
    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    cantidadCarroSpan.textContent = total.toFixed(2);

    // Habilitar/deshabilitar botón de compra
    comprarBtn.disabled = carrito.length === 0;
    comprarBtn.style.opacity = carrito.length === 0 ? '0.5' : '1';
}

// ====================================================================
// PERSISTENCIA EN LOCALSTORAGE
// ====================================================================

/**
 * Guarda el carrito en localStorage
 */
function saveCartToStorage() {
    try {
        localStorage.setItem('tienda3x1_carrito', JSON.stringify(carrito));
    } catch (error) {
        console.error('Error al guardar carrito en localStorage:', error);
    }
}

/**
 * Carga el carrito desde localStorage
 */
function loadCartFromStorage() {
    try {
        const carritoGuardado = localStorage.getItem('tienda3x1_carrito');
        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
            console.log('✅ Carrito cargado desde localStorage');
        }
    } catch (error) {
        console.error('Error al cargar carrito desde localStorage:', error);
        carrito = [];
    }
}

/**
 * Limpia el carrito y localStorage
 */
function clearCart() {
    carrito = [];
    updateCartDisplay();
    saveCartToStorage();
    console.log('🧹 Carrito limpiado');
}

// ====================================================================
// FUNCIONALIDADES DE BÚSQUEDA Y FILTRADO
// ====================================================================

/**
 * Busca productos por título y descripción
 * @param {string} query - Término de búsqueda
 */
function searchProducts(query) {
    if (!query || query.trim() === '') {
        productosFiltrados = [...productos];
    } else {
        const searchTerm = query.toLowerCase().trim();
        productosFiltrados = productos.filter(producto => 
            producto.title.toLowerCase().includes(searchTerm) ||
            producto.description.toLowerCase().includes(searchTerm) ||
            producto.category.toLowerCase().includes(searchTerm)
        );
    }
    
    applySorting();
    renderProducts(productosFiltrados);
    
    console.log(`🔍 Búsqueda: "${query}" - ${productosFiltrados.length} resultados`);
}

/**
 * Filtra productos por categoría
 * @param {string} categoria - Categoría seleccionada
 */
function filterByCategory(categoria) {
    if (categoria === 'all') {
        productosFiltrados = [...productos];
    } else {
        productosFiltrados = productos.filter(producto => 
            producto.category === categoria
        );
    }
    
    // Aplicar búsqueda si hay texto en el input
    const searchQuery = busquedaInput.value.trim();
    if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.title.toLowerCase().includes(searchTerm) ||
            producto.description.toLowerCase().includes(searchTerm)
        );
    }
    
    applySorting();
    renderProducts(productosFiltrados);
    
    console.log(`📂 Filtro por categoría: "${categoria}" - ${productosFiltrados.length} resultados`);
}

/**
 * Aplica ordenamiento a los productos filtrados
 */
function applySorting() {
    const sortValue = sortSelect.value;
    
    switch (sortValue) {
        case 'precio-asc':
            productosFiltrados.sort((a, b) => a.price - b.price);
            break;
        case 'precio-desc':
            productosFiltrados.sort((a, b) => b.price - a.price);
            break;
        case 'nombre-asc':
            productosFiltrados.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'nombre-desc':
            productosFiltrados.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            // Orden por defecto (por ID)
            productosFiltrados.sort((a, b) => a.id - b.id);
    }
}

/**
 * Maneja el ordenamiento de productos
 * @param {string} sortType - Tipo de ordenamiento
 */
function sortProducts(sortType) {
    applySorting();
    renderProducts(productosFiltrados);
    
    console.log(`📊 Ordenamiento aplicado: ${sortType}`);
}

// ====================================================================
// EVENT LISTENERS
// ====================================================================

/**
 * Inicializa todos los event listeners
 */
function initEventListeners() {
    // Botón del carrito - toggle panel
    carroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        panelCarro.classList.toggle('oculto');
    });

    // Búsqueda en tiempo real
    busquedaInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });

    // Botón de búsqueda
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchProducts(busquedaInput.value);
    });

    // Filtro por categoría
    filtrarSelect.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });

    // Ordenamiento
    sortSelect.addEventListener('change', (e) => {
        sortProducts(e.target.value);
    });

    // Botón de compra
    comprarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        processPurchase();
    });

    // Cerrar carrito al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!panelCarro.contains(e.target) && !carroBtn.contains(e.target)) {
            panelCarro.classList.add('oculto');
        }
    });

    // Búsqueda con Enter
    busquedaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchProducts(busquedaInput.value);
        }
    });

    console.log('✅ Event listeners configurados');
}

// ====================================================================
// FUNCIONALIDADES ADICIONALES
// ====================================================================

/**
 * Procesa la compra (simulado)
 */
function processPurchase() {
    if (carrito.length === 0) {
        showNotification('❌ Tu carrito está vacío', 'error');
        return;
    }

    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    const itemCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    // Simulación de procesamiento
    comprarBtn.textContent = '⏳ Procesando...';
    comprarBtn.disabled = true;

    setTimeout(() => {
        // Simular compra exitosa
        showNotification(`🎉 ¡Compra realizada con éxito! Total: $${total.toFixed(2)} (${itemCount} productos)`, 'success');
        
        // Limpiar carrito
        clearCart();
        
        // Cerrar panel del carrito
        panelCarro.classList.add('oculto');
        
        // Restaurar botón
        comprarBtn.textContent = 'Realizar Compra';
        comprarBtn.disabled = false;
        
        console.log('🛒 Compra procesada exitosamente');
    }, 2000);
}

/**
 * Muestra notificaciones al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--color-secondary)' : 
                    type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 10000;
        max-width: 300px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        backdrop-filter: blur(12px);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Agregar animación CSS si no existe
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Eliminar notificación después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Muestra mensaje de error general
 * @param {string} message - Mensaje de error
 */
function showErrorMessage(message) {
    productosContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
            <div style="color: var(--color-danger); font-size: 1.2rem; margin-bottom: 1rem;">
                ⚠️ ${message}
            </div>
            <button onclick="location.reload()" 
                    style="padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">
                🔄 Recargar Página
            </button>
        </div>
    `;
}

// ====================================================================
// FUNCIONES DE UTILIDAD
// ====================================================================

/**
 * Debounce function para optimizar búsquedas
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce aplicado
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Formatea números como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada como moneda
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Valida si un objeto es un producto válido
 * @param {Object} producto - Objeto a validar
 * @returns {boolean} True si es válido
 */
function isValidProduct(producto) {
    return producto && 
           typeof producto.id === 'number' && 
           typeof producto.title === 'string' && 
           typeof producto.price === 'number' && 
           typeof producto.category === 'string';
}

// ====================================================================
// MANEJO DE ERRORES GLOBALES
// ====================================================================

// Capturar errores no manejados
window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    showNotification('❌ Ha ocurrido un error inesperado', 'error');
});

// Capturar promesas rechazadas no manejadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
    showNotification('❌ Error de conexión', 'error');
    event.preventDefault();
});

// ====================================================================
// EXPORTS (para testing si es necesario)
// ====================================================================

// Si estamos en un entorno de testing, exportar funciones principales
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchProducts,
        addToCart,
        removeFromCart,
        searchProducts,
        filterByCategory,
        sortProducts,
        updateCartDisplay,
        saveCartToStorage,
        loadCartFromStorage
    };
}

console.log('🚀 Sistema de E-commerce inicializado - Tienda 3x1');