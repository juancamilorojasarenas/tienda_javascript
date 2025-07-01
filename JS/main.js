// ===== VARIABLES GLOBALES =====
const API_BASE_URL = 'https://fakestoreapi.com';
const API_ENDPOINTS = {
    products: `${API_BASE_URL}/products`,
    categories: `${API_BASE_URL}/products/categories`
};

const STORAGE_KEYS = {
    cart: 'tienda3x1_carrito',
    preferences: 'tienda3x1_preferences'
};

const PLACEHOLDER_IMAGE = './css/media/placeholder.png';
const DEBOUNCE_DELAY = 300;

// Variables de estado
let productos = [];
let productosFiltrados = [];
let carrito = [];
let categorias = new Set();
let isLoading = false;

// Referencias del DOM - se inicializan una sola vez
let DOM = {};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        initDOMReferences();
        loadCartFromStorage();
        await fetchProducts();
        initEventListeners();
        renderProducts();
        updateCartDisplay();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showErrorMessage('Error al cargar la tienda. Por favor, recarga la página.');
    }
});

// Inicializar referencias del DOM
function initDOMReferences() {
    DOM = {
        productosContainer: document.getElementById('productos'),
        panelCarro: document.getElementById('panelCarro'),
        objetosCarrito: document.getElementById('objetos'),
        cantidadCarroSpan: document.getElementById('cantidadcarro'),
        cartCountSpan: document.getElementById('cartCount'),
        busquedaInput: document.getElementById('busqueda'),
        searchBtn: document.getElementById('searchBtn'),
        filtrarSelect: document.getElementById('Filtrar'),
        sortSelect: document.getElementById('sortSelect'),
        carroBtn: document.getElementById('carro'),
        comprarBtn: document.getElementById('Comprar')
    };
}

// ===== GESTIÓN DE PRODUCTOS =====
async function fetchProducts() {
    if (isLoading) return;
    isLoading = true;

    try {
        showLoadingState();
        
        const response = await fetch(API_ENDPOINTS.products);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        productos = data
            .filter(isValidProduct)
            .map(normalizeProduct);

        extractCategories();
        updateCategorySelect();
        productosFiltrados = [...productos];
        
    } catch (error) {
        console.error('Error al obtener productos:', error);
        showRetryButton();
        throw error;
    } finally {
        isLoading = false;
    }
}

// Mostrar estado de carga
function showLoadingState() {
    clearContainer(DOM.productosContainer);
    
    const loadingDiv = createElement('div', {
        style: 'grid-column: 1/-1; text-align: center; padding: 2rem;'
    });
    
    const loadingText = createElement('div', {
        className: 'loading',
        style: 'font-size: 1.5rem; color: var(--color-primary);',
        textContent: 'Cargando productos...'
    });
    
    loadingDiv.appendChild(loadingText);
    DOM.productosContainer.appendChild(loadingDiv);
}

// Mostrar botón de reintento
function showRetryButton() {
    clearContainer(DOM.productosContainer);
    
    const errorDiv = createElement('div', {
        style: 'grid-column: 1/-1; text-align: center; padding: 2rem;'
    });
    
    const errorText = createElement('div', {
        style: 'color: var(--color-danger); font-size: 1.2rem; margin-bottom: 1rem;',
        textContent: 'Error al cargar productos. Verifica tu conexión a internet.'
    });
    
    const retryBtn = createElement('button', {
        style: 'margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer;',
        textContent: 'Reintentar'
    });
    
    retryBtn.addEventListener('click', fetchProducts);
    
    errorDiv.appendChild(errorText);
    errorDiv.appendChild(retryBtn);
    DOM.productosContainer.appendChild(errorDiv);
}

// Normalizar datos del producto
function normalizeProduct(producto) {
    return {
        id: producto.id,
        title: producto.title,
        price: parseFloat(producto.price),
        category: producto.category,
        description: producto.description || '',
        image: producto.image || PLACEHOLDER_IMAGE
    };
}

// Validar producto
function isValidProduct(producto) {
    return producto && 
           typeof producto.id === 'number' && 
           typeof producto.title === 'string' && 
           typeof producto.price === 'number' && 
           typeof producto.category === 'string';
}

// Extraer categorías únicas
function extractCategories() {
    categorias.clear();
    productos.forEach(producto => categorias.add(producto.category));
}

// ===== RENDERIZADO =====
function renderProducts() {
    clearContainer(DOM.productosContainer);
    
    if (!productosFiltrados || productosFiltrados.length === 0) {
        showNoProductsMessage();
        return;
    }
    
    productosFiltrados.forEach(producto => {
        const article = createProductCard(producto);
        DOM.productosContainer.appendChild(article);
    });
}

// Crear tarjeta de producto
function createProductCard(producto) {
    const article = createElement('article');
    
    // Imagen
    const img = createElement('img', {
        src: producto.image,
        alt: producto.title,
        loading: 'lazy'
    });
    img.addEventListener('error', () => {
        img.src = PLACEHOLDER_IMAGE;
    });
    
    // Título
    const title = createElement('h3', {
        textContent: truncateText(producto.title, 50)
    });
    
    // Descripción
    const description = createElement('p', {
        textContent: truncateText(producto.description, 80) || 'Sin descripción disponible'
    });
    
    // Precio
    const price = createElement('p', {
        style: 'font-weight: 600; color: var(--color-primary); font-size: 1.1rem; margin: 0.5rem 0;',
        textContent: `$${producto.price.toFixed(2)}`
    });
    
    // Categoría
    const category = createElement('p', {
        style: 'font-size: 0.8rem; color: var(--color-gray); text-transform: capitalize; margin-bottom: 1rem;',
        textContent: producto.category
    });
    
    // Botón agregar al carrito
    const button = createElement('button', {
        textContent: 'Agregar al Carrito',
        'data-product-id': producto.id.toString()
    });
    button.addEventListener('click', () => addToCart(producto.id));
    
    // Ensamblar artículo
    [img, title, description, price, category, button].forEach(element => {
        article.appendChild(element);
    });
    
    return article;
}

// Mostrar mensaje de no productos
function showNoProductsMessage() {
    const messageDiv = createElement('div', {
        style: 'grid-column: 1/-1; text-align: center; padding: 2rem;'
    });
    
    const messageText = createElement('div', {
        style: 'color: var(--color-gray); font-size: 1.2rem;',
        textContent: 'No se encontraron productos'
    });
    
    messageDiv.appendChild(messageText);
    DOM.productosContainer.appendChild(messageDiv);
}

// ===== GESTIÓN DEL CARRITO =====
function addToCart(productId) {
    const producto = productos.find(p => p.id === productId);
    
    if (!producto) {
        console.error('Producto no encontrado:', productId);
        return;
    }

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

    updateCartDisplay();
    saveCartToStorage();
    showNotification(`${producto.title} agregado al carrito`);
}

function removeFromCart(productId) {
    const index = carrito.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        const producto = carrito[index];
        carrito.splice(index, 1);
        
        updateCartDisplay();
        saveCartToStorage();
        showNotification(`${producto.title} eliminado del carrito`);
    }
}

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

// Actualizar visualización del carrito
function updateCartDisplay() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    DOM.cartCountSpan.textContent = totalItems;

    clearContainer(DOM.objetosCarrito);

    if (carrito.length === 0) {
        showEmptyCartMessage();
    } else {
        carrito.forEach(item => {
            const li = createCartItem(item);
            DOM.objetosCarrito.appendChild(li);
        });
    }

    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    DOM.cantidadCarroSpan.textContent = total.toFixed(2);

    DOM.comprarBtn.disabled = carrito.length === 0;
    DOM.comprarBtn.style.opacity = carrito.length === 0 ? '0.5' : '1';
}

// Crear elemento del carrito
function createCartItem(item) {
    const li = createElement('li', {
        style: 'display: flex; flex-direction: column; gap: 0.5rem; border-bottom: 1px solid var(--color-gray-light); padding-bottom: 0.5rem;'
    });

    // Contenedor principal
    const mainDiv = createElement('div', {
        style: 'display: flex; align-items: center; gap: 0.5rem;'
    });

    // Imagen
    const img = createElement('img', {
        src: item.image,
        alt: item.title,
        style: 'width: 40px; height: 40px; object-fit: contain; border-radius: 4px;'
    });
    img.addEventListener('error', () => {
        img.src = PLACEHOLDER_IMAGE;
    });

    // Información del producto
    const infoDiv = createElement('div', {
        style: 'flex: 1; min-width: 0;'
    });

    const titleDiv = createElement('div', {
        style: 'font-weight: 600; font-size: 0.9rem; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
        textContent: truncateText(item.title, 30)
    });

    const priceDiv = createElement('div', {
        style: 'color: var(--color-primary); font-weight: 600;',
        textContent: `$${item.price.toFixed(2)}`
    });

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(priceDiv);

    mainDiv.appendChild(img);
    mainDiv.appendChild(infoDiv);

    // Controles de cantidad
    const controlsDiv = createElement('div', {
        style: 'display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;'
    });

    // Controles de cantidad
    const quantityDiv = createElement('div', {
        style: 'display: flex; align-items: center; gap: 0.25rem;'
    });

    const decreaseBtn = createElement('button', {
        style: 'width: 24px; height: 24px; border: none; background: var(--color-gray-light); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;',
        textContent: '-'
    });
    decreaseBtn.addEventListener('click', () => updateCartQuantity(item.id, item.cantidad - 1));

    const quantitySpan = createElement('span', {
        style: 'min-width: 30px; text-align: center; font-weight: 600;',
        textContent: item.cantidad.toString()
    });

    const increaseBtn = createElement('button', {
        style: 'width: 24px; height: 24px; border: none; background: var(--color-gray-light); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;',
        textContent: '+'
    });
    increaseBtn.addEventListener('click', () => updateCartQuantity(item.id, item.cantidad + 1));

    quantityDiv.appendChild(decreaseBtn);
    quantityDiv.appendChild(quantitySpan);
    quantityDiv.appendChild(increaseBtn);

    // Botón eliminar
    const removeBtn = createElement('button', {
        style: 'padding: 0.25rem 0.5rem; border: none; background: var(--color-danger); color: white; border-radius: 4px; cursor: pointer; font-size: 0.8rem;',
        textContent: '🗑️'
    });
    removeBtn.addEventListener('click', () => removeFromCart(item.id));

    controlsDiv.appendChild(quantityDiv);
    controlsDiv.appendChild(removeBtn);

    li.appendChild(mainDiv);
    li.appendChild(controlsDiv);

    return li;
}

// Mostrar mensaje de carrito vacío
function showEmptyCartMessage() {
    const li = createElement('li', {
        style: 'text-align: center; color: var(--color-gray); padding: 2rem;',
        textContent: 'Tu carrito está vacío'
    });
    DOM.objetosCarrito.appendChild(li);
}

// ===== FILTROS Y BÚSQUEDA =====
function searchProducts(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) {
        productosFiltrados = [...productos];
    } else {
        productosFiltrados = productos.filter(producto => 
            producto.title.toLowerCase().includes(searchTerm) ||
            producto.description.toLowerCase().includes(searchTerm) ||
            producto.category.toLowerCase().includes(searchTerm)
        );
    }
    
    applyCategoryFilter();
    applySorting();
    renderProducts();
}

function filterByCategory(categoria) {
    const searchQuery = DOM.busquedaInput.value.trim();
    
    // Primero aplicar filtro de categoría
    if (categoria === 'all') {
        productosFiltrados = [...productos];
    } else {
        productosFiltrados = productos.filter(producto => 
            producto.category === categoria
        );
    }
    
    // Luego aplicar búsqueda si existe
    if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.title.toLowerCase().includes(searchTerm) ||
            producto.description.toLowerCase().includes(searchTerm)
        );
    }
    
    applySorting();
    renderProducts();
}

function applyCategoryFilter() {
    const selectedCategory = DOM.filtrarSelect.value;
    
    if (selectedCategory !== 'all') {
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.category === selectedCategory
        );
    }
}

function applySorting() {
    const sortValue = DOM.sortSelect.value;
    
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
            productosFiltrados.sort((a, b) => a.id - b.id);
    }
}

function sortProducts() {
    applySorting();
    renderProducts();
}

// ===== GESTIÓN DE CATEGORÍAS =====
function updateCategorySelect() {
    clearContainer(DOM.filtrarSelect);
    
    const defaultOption = createElement('option', {
        value: 'all',
        textContent: 'Todas las categorías'
    });
    DOM.filtrarSelect.appendChild(defaultOption);
    
    [...categorias].sort().forEach(categoria => {
        const option = createElement('option', {
            value: categoria,
            textContent: categoria.charAt(0).toUpperCase() + categoria.slice(1)
        });
        DOM.filtrarSelect.appendChild(option);
    });
}

// ===== EVENTOS =====
function initEventListeners() {
    // Botón de carrito
    DOM.carroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.panelCarro.classList.toggle('oculto');
    });

    // Búsqueda con debounce
    const debouncedSearch = debounce((value) => {
        searchProducts(value);
    }, DEBOUNCE_DELAY);

    DOM.busquedaInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });

    // Botón de búsqueda
    DOM.searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchProducts(DOM.busquedaInput.value);
    });

    // Filtro de categorías
    DOM.filtrarSelect.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });

    // Ordenamiento
    DOM.sortSelect.addEventListener('change', () => {
        sortProducts();
    });

    // Botón de compra
    DOM.comprarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        processPurchase();
    });

    // Cerrar carrito al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!DOM.panelCarro.contains(e.target) && !DOM.carroBtn.contains(e.target)) {
            DOM.panelCarro.classList.add('oculto');
        }
    });

    // Búsqueda con Enter
    DOM.busquedaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchProducts(DOM.busquedaInput.value);
        }
    });
}

// ===== COMPRA =====
function processPurchase() {
    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }

    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    const itemCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    DOM.comprarBtn.textContent = 'Procesando...';
    DOM.comprarBtn.disabled = true;

    setTimeout(() => {
        showNotification(`¡Compra realizada con éxito! Total: $${total.toFixed(2)} (${itemCount} productos)`, 'success');
        clearCart();
        DOM.panelCarro.classList.add('oculto');
        DOM.comprarBtn.textContent = 'Realizar Compra';
        DOM.comprarBtn.disabled = false;
    }, 2000);
}

// ===== ALMACENAMIENTO LOCAL =====
function saveCartToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(carrito));
    } catch (error) {
        console.error('Error al guardar carrito:', error);
    }
}

function loadCartFromStorage() {
    try {
        const carritoGuardado = localStorage.getItem(STORAGE_KEYS.cart);
        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
        }
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        carrito = [];
    }
}

function clearCart() {
    carrito = [];
    updateCartDisplay();
    saveCartToStorage();
}

// ===== UTILIDADES =====
function createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    return element;
}

function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

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

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'info') {
    const notification = createElement('div', {
        style: `
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
        `,
        textContent: message
    });
    
    document.body.appendChild(notification);

    if (!document.querySelector('#notification-styles')) {
        const style = createElement('style', {
            id: 'notification-styles',
            textContent: `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `
        });
        document.head.appendChild(style);
    }

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showErrorMessage(message) {
    clearContainer(DOM.productosContainer);
    
    const errorDiv = createElement('div', {
        style: 'grid-column: 1/-1; text-align: center; padding: 2rem;'
    });
    
    const errorText = createElement('div', {
        style: 'color: var(--color-danger); font-size: 1.2rem; margin-bottom: 1rem;',
        textContent: message
    });
    
    const reloadBtn = createElement('button', {
        style: 'padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;',
        textContent: 'Recargar Página'
    });
    reloadBtn.addEventListener('click', () => location.reload());
    
    errorDiv.appendChild(errorText);
    errorDiv.appendChild(reloadBtn);
    DOM.productosContainer.appendChild(errorDiv);
}

// ===== MANEJO DE ERRORES GLOBALES =====
window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    showNotification('Ha ocurrido un error inesperado', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
    showNotification('Error de conexión', 'error');
    event.preventDefault();
});