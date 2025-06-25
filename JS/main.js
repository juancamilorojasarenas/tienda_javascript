let productos = [];
let productosFiltrados = [];
let carrito = [];
let categorias = new Set();

const productosContainer = document.getElementById('productos');
const panelCarro = document.getElementById('panelCarro');
const objetosCarrito = document.getElementById('objetos');
const cantidadCarroSpan = document.getElementById('cantidadcarro');
const cartCountSpan = document.getElementById('cartCount');

const busquedaInput = document.getElementById('busqueda');
const searchBtn = document.getElementById('searchBtn');
const filtrarSelect = document.getElementById('Filtrar');
const sortSelect = document.getElementById('sortSelect');
const carroBtn = document.getElementById('carro');
const comprarBtn = document.getElementById('Comprar');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        loadCartFromStorage();
        await fetchProducts();
        initEventListeners();
        renderProducts(productos);
        updateCartDisplay();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showErrorMessage('Error al cargar la tienda. Por favor, recarga la página.');
    }
});

async function fetchProducts() {
    try {
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div class="loading" style="font-size: 1.5rem; color: var(--color-primary);">
                    Cargando productos...
                </div>
            </div>
        `;

        const response = await fetch('https://fakestoreapi.com/products');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
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

        productos.forEach(producto => categorias.add(producto.category));
        
        updateCategorySelect();
        
        productosFiltrados = [...productos];
    } catch (error) {
        console.error('Error al obtener productos:', error);
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div style="color: var(--color-danger); font-size: 1.2rem;">
                    Error al cargar productos. Verifica tu conexión a internet.
                </div>
                <button onclick="fetchProducts()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
        throw error;
    }
}

function updateCategorySelect() {
    filtrarSelect.innerHTML = '<option value="all">Todas las categorías</option>';
    
    [...categorias].sort().forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        filtrarSelect.appendChild(option);
    });
}

function renderProducts(productosParaRenderizar) {
    if (!productosParaRenderizar || productosParaRenderizar.length === 0) {
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div style="color: var(--color-gray); font-size: 1.2rem;">
                    No se encontraron productos
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
                ${producto.category}
            </p>
            <button onclick="addToCart(${producto.id})" 
                    data-product-id="${producto.id}">
                Agregar al Carrito
            </button>
        </article>
    `).join('');
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

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
    
    console.log('Producto agregado al carrito:', producto.title);
}

function removeFromCart(productId) {
    const index = carrito.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        const producto = carrito[index];
        carrito.splice(index, 1);
        
        updateCartDisplay();
        saveCartToStorage();
        
        showNotification(`${producto.title} eliminado del carrito`);
        console.log('Producto eliminado del carrito:', producto.title);
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

function updateCartDisplay() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCountSpan.textContent = totalItems;

    if (carrito.length === 0) {
        objetosCarrito.innerHTML = `
            <li style="text-align: center; color: var(--color-gray); padding: 2rem;">
                Tu carrito está vacío
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
                    </button>
                </div>
            </li>
        `).join('');
    }

    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    cantidadCarroSpan.textContent = total.toFixed(2);

    comprarBtn.disabled = carrito.length === 0;
    comprarBtn.style.opacity = carrito.length === 0 ? '0.5' : '1';
}

function saveCartToStorage() {
    try {
        localStorage.setItem('tienda3x1_carrito', JSON.stringify(carrito));
    } catch (error) {
        console.error('Error al guardar carrito en localStorage:', error);
    }
}

function loadCartFromStorage() {
    try {
        const carritoGuardado = localStorage.getItem('tienda3x1_carrito');
        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
        }
    } catch (error) {
        console.error('Error al cargar carrito desde localStorage:', error);
        carrito = [];
    }
}

function clearCart() {
    carrito = [];
    updateCartDisplay();
    saveCartToStorage();
}

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
}

function filterByCategory(categoria) {
    if (categoria === 'all') {
        productosFiltrados = [...productos];
    } else {
        productosFiltrados = productos.filter(producto => 
            producto.category === categoria
        );
    }
    
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
}

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
            productosFiltrados.sort((a, b) => a.id - b.id);
    }
}

function sortProducts(sortType) {
    applySorting();
    renderProducts(productosFiltrados);
}

function initEventListeners() {
    carroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        panelCarro.classList.toggle('oculto');
    });

    busquedaInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });

    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchProducts(busquedaInput.value);
    });

    filtrarSelect.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });

    sortSelect.addEventListener('change', (e) => {
        sortProducts(e.target.value);
    });

    comprarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        processPurchase();
    });

    document.addEventListener('click', (e) => {
        if (!panelCarro.contains(e.target) && !carroBtn.contains(e.target)) {
            panelCarro.classList.add('oculto');
        }
    });

    busquedaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchProducts(busquedaInput.value);
        }
    });
}

function processPurchase() {
    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }

    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    const itemCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    comprarBtn.textContent = 'Procesando...';
    comprarBtn.disabled = true;

    setTimeout(() => {
        showNotification(`¡Compra realizada con éxito! Total: $${total.toFixed(2)} (${itemCount} productos)`, 'success');
        clearCart();
        panelCarro.classList.add('oculto');
        comprarBtn.textContent = 'Realizar Compra';
        comprarBtn.disabled = false;
    }, 2000);
}

function showNotification(message, type = 'info') {
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
    productosContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
            <div style="color: var(--color-danger); font-size: 1.2rem; margin-bottom: 1rem;">
                ${message}
            </div>
            <button onclick="location.reload()" 
                    style="padding: 0.75rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">
                Recargar Página
            </button>
        </div>
    `;
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

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function isValidProduct(producto) {
    return producto && 
           typeof producto.id === 'number' && 
           typeof producto.title === 'string' && 
           typeof producto.price === 'number' && 
           typeof producto.category === 'string';
}

window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    showNotification('Ha ocurrido un error inesperado', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
    showNotification('Error de conexión', 'error');
    event.preventDefault();
});

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