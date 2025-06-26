// esto sirve para definir los contenedores
let productos = []; // lista donde se guardan los productos de la api
let productosFiltrados = []; // una copia segun la busqueda realizada
let carrito = []; // aca se guardan los productos en el carrito
let categorias = new Set(); // ayuda a guardar categorias sin repeticion

// Estas constantes traen elementos para ser usados en el dom desde el html
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

// Esta función se ejecuta cuando la página termina de cargar completamente
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // ejecutar funciones en orden logico
        loadCartFromStorage(); // Recuperamos el carrito cuando se racarga la pagina
        await fetchProducts(); // Traer productos desde la api con await
        initEventListeners(); // Configurar eventos
        renderProducts(productos); // Mostrar los productos en la pantalla
        updateCartDisplay(); // Actualizar el contador del carrito
    } catch (error) {
        // Si ocurre un error lo muestra en consola
        console.error('Error al inicializar la aplicación:', error);
        showErrorMessage('Error al cargar la tienda. Por favor, recarga la página.');
    }
});

// funcion para traer los productos desde la api
async function fetchProducts() {
    try {
        // mientras se trae el contenido se muestra un mensaje de cargando
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <div class="loading" style="font-size: 1.5rem; color: var(--color-primary);">
                    Cargando productos...
                </div>
            </div>
        `;

        // hacer peticion a la api
        const response = await fetch('https://fakestoreapi.com/products');
        
        // Verificar respuesta exitosa
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // convertir respuesta en json
        const data = await response.json();

        // filtrar productos para traer la imformacion nesesaria
        productos = data.filter(producto => 
            producto && 
            producto.id && 
            producto.title && 
            producto.price && 
            producto.category
        ).map(producto => ({
            // Restructuramos cada producto para que muestre toda la informacion nesesaria
            id: producto.id,
            title: producto.title,
            price: parseFloat(producto.price), // asegurar que el precio sea de tipo numerico
            category: producto.category,
            description: producto.description || '', // Si no hay descripción se pone una cadena vacia
            image: producto.image || './css/media/placeholder.png' // Si no hay imagen se muestra un placeholder
        }));

        // Extraer categorias de los productos
        productos.forEach(producto => categorias.add(producto.category));
        
        // Actualizar el selec con las categorias encontradas
        updateCategorySelect();
        
        // trae todos los productos inicialmente sin filtrar
        productosFiltrados = [...productos];
    } catch (error) {
        //si ocurre un erro lo muestra en consola y en la pagina y da la opcion para reintentar
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
        throw error; // vuelve a enviar el error para manejarlo
    }
}

// Esta función actualiza el menu desplegable de categorias
function updateCategorySelect() {
    // pone una opcion por defecto
    filtrarSelect.innerHTML = '<option value="all">Todas las categorías</option>';
    
    // Ordena las categorias alfabeticamente y las pone como opciones
    [...categorias].sort().forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        // Capitaliza las opciones
        option.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
        filtrarSelect.appendChild(option);
    });
}

// funcion para renderizar productos en pantalla
function renderProducts(productosParaRenderizar) {
    // si el producto no existe muestra un mensaje de que no existe tal producto
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

    // crea un html para cada producto
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
    `).join(''); // une todos los productos en uno solo
}

// Funcion para mantener la extetica de los titulos para no salirse del contenedor
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// cuando espichas o presionas agrgar al carro se incia esta funcion
function addToCart(productId) {
    // busca el producto por id
    const producto = productos.find(p => p.id === productId);
    
    // si no lo encuentra muestra un error
    if (!producto) {
        console.error('Producto no encontrado:', productId);
        return;
    }

    // Verifica si el producto esta en el carro
    const existingItem = carrito.find(item => item.id === productId);
    
    if (existingItem) {
        // Si ya esta en el carro añade uno mas 
        existingItem.cantidad += 1;
    } else {
        // Si no esta en el carro lo añade al carrito
        carrito.push({
            id: producto.id,
            title: producto.title,
            price: producto.price,
            image: producto.image,
            cantidad: 1
        });
    }

    // Actualiza la pantalla y guarda de forma local
    updateCartDisplay();
    saveCartToStorage();
    
    // Muestra una notificacion de que se agrego al carrito
    showNotification(`${producto.title} agregado al carrito`);
    
    console.log('Producto agregado al carrito:', producto.title);
}

// Función para eliminar productos del carro
function removeFromCart(productId) {
    // Busca la posision del producto en el carro
    const index = carrito.findIndex(item => item.id === productId);
    
    if (index !== -1) {
        // Guarda el producto y lo elimina para mostrar unmensaje
        const producto = carrito[index];
        carrito.splice(index, 1); // Lo elimina del carro
        
        // Actualiza y guarda
        updateCartDisplay();
        saveCartToStorage();
        
        showNotification(`${producto.title} eliminado del carrito`);
        console.log('Producto eliminado del carrito:', producto.title);
    }
}

// actualiza la cantidad del producto en el carro
function updateCartQuantity(productId, nuevaCantidad) {
    const item = carrito.find(item => item.id === productId);
    
    if (item) {
        if (nuevaCantidad <= 0) {
            // Si la nueva cantidad es 0 o menos, elimina el producto
            removeFromCart(productId);
        } else {
            // Si no lo actializa
            item.cantidad = parseInt(nuevaCantidad);
            updateCartDisplay();
            saveCartToStorage();
        }
    }
}

// actualiza la interfaz del carro
function updateCartDisplay() {
    // Calcula el total sumando todas las cantidades de los productos
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCountSpan.textContent = totalItems;

    // Si el carrito esta vacio muestra un mensaje
    if (carrito.length === 0) {
        objetosCarrito.innerHTML = `
            <li style="text-align: center; color: var(--color-gray); padding: 2rem;">
                Tu carrito está vacío
            </li>
        `;
    } else {
        // Si hay productos, genera un HTML para cada uno y le añade css
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

    // Calcula el total del carrito multiplicando precio por cantidad
    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    cantidadCarroSpan.textContent = total.toFixed(2);

// habilita o desavilita el boton dependiendo si el carro esta vacio o no
    comprarBtn.disabled = carrito.length === 0;
    comprarBtn.style.opacity = carrito.length === 0 ? '0.5' : '1';
}

// Guarda el carrito de manera local
function saveCartToStorage() {
    try {
        localStorage.setItem('tienda3x1_carrito', JSON.stringify(carrito));
    } catch (error) {
        // Si hay error lo muetra en consola
        console.error('Error al guardar carrito en localStorage:', error);
    }
}

// Cargamos el carrito guardado localmente
function loadCartFromStorage() {
    try {
        const carritoGuardado = localStorage.getItem('tienda3x1_carrito');
        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
        }
    } catch (error) {
        // Si hay error con el json, inicia un uevo carro vacio
        console.error('Error al cargar carrito desde localStorage:', error);
        carrito = [];
    }
}

// Función simple para vaciar completamente el carrito
function clearCart() {
    carrito = [];
    updateCartDisplay();
    saveCartToStorage();
}

// funcion para buscar productos
function searchProducts(query) {
    if (!query || query.trim() === '') {
        // Si no hay busquedas muestra todos los productos
        productosFiltrados = [...productos];
    } else {
        // Si hay búsqueda realiza filtros
        const searchTerm = query.toLowerCase().trim();
        productosFiltrados = productos.filter(producto => 
            producto.title.toLowerCase().includes(searchTerm) ||
            producto.description.toLowerCase().includes(searchTerm) ||
            producto.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Aplicamos el filtro actual y lo muestra
    applySorting();
    renderProducts(productosFiltrados);
}

// Funcion para filtrar por categoria
function filterByCategory(categoria) {
    if (categoria === 'all') {
        // Si selecciona todass muestra todos los productos
        productosFiltrados = [...productos];
    } else {
        // de lo contrario lo muestra segun categoria
        productosFiltrados = productos.filter(producto => 
            producto.category === categoria
        );
    }
    
    // Si hay una búsqueda activa tambien aplica el filtro
    const searchQuery = busquedaInput.value.trim();
    if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        productosFiltrados = productosFiltrados.filter(producto => 
            producto.title.toLowerCase().includes(searchTerm) ||
            producto.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Aplica filtors y lo muestra 
    applySorting();
    renderProducts(productosFiltrados);
}

// funcion para apicar filtros de ordenamiento
function applySorting() {
    const sortValue = sortSelect.value;
    
    // switch para manejar todos los ordenamientos
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
            // Por defecto ordena por ID 
            productosFiltrados.sort((a, b) => a.id - b.id);
    }
}

// Función para el ordenamiento
function sortProducts(sortType) {
    applySorting();
    renderProducts(productosFiltrados);
}

// funcion para configurar los eventos
function initEventListeners() {
    // El botón de carrito para abrirlo
    carroBtn.addEventListener('click', (e) => {
        e.preventDefault();
        panelCarro.classList.toggle('oculto');
    });

    // La búsqueda funciona mientras se escribe
    busquedaInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });

    // El botón de buscar asiendo click busca
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchProducts(busquedaInput.value);
    });

    // Cuando cambia la categoria, lo filtra
    filtrarSelect.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });

    // Cuando cambia el ordenamiento re ordena
    sortSelect.addEventListener('change', (e) => {
        sortProducts(e.target.value);
    });

    // El botón de comprar simula la compra
    comprarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        processPurchase();
    });

    // Si se hace click fuera del carro lo cierra
    document.addEventListener('click', (e) => {
        if (!panelCarro.contains(e.target) && !carroBtn.contains(e.target)) {
            panelCarro.classList.add('oculto');
        }
    });

    // Permite buscar sl presionar enter
    busquedaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchProducts(busquedaInput.value);
        }
    });
}

// funcion para simular compra
function processPurchase() {
    // Verifica que haya algo en el carrito
    if (carrito.length === 0) {
        showNotification('Tu carrito está vacío', 'error');
        return;
    }

    // Calcula el total y la cantidad de productos
    const total = carrito.reduce((sum, item) => sum + (item.price * item.cantidad), 0);
    const itemCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    // muestra que esta procesando la compra
    comprarBtn.textContent = 'Procesando...';
    comprarBtn.disabled = true;

    // Simula el prosesamiento
    setTimeout(() => {
        showNotification(`¡Compra realizada con éxito! Total: $${total.toFixed(2)} (${itemCount} productos)`, 'success');
        clearCart(); // Vacia el carro
        panelCarro.classList.add('oculto'); // Cierra el panel
        // Restauramos el botón
        comprarBtn.textContent = 'Realizar Compra';
        comprarBtn.disabled = false;
    }, 2000); // simula un prosesamiento de 2 segundos 
}

// funcion para mostrar las notificaciones
function showNotification(message, type = 'info') {
    // Crea el elemento de notificacion
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

    // Agregamos los estilos de animación
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

    // Después de 3 segundos anima la salida y elimina la notificacion
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Función para mostrasr mensajes de error
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

// evita la repeticion masiva de eventos no ejecutandolos tras llegar a sierto limite
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

// Función para cambiar monead segun la configuracion regional
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// funcion para validar la existencia de un producto
function isValidProduct(producto) {
    return producto && 
           typeof producto.id === 'number' && 
           typeof producto.title === 'string' && 
           typeof producto.price === 'number' && 
           typeof producto.category === 'string';
}

// captura eventos inesperados
window.addEventListener('error', (event) => {
    console.error('Error global capturado:', event.error);
    showNotification('Ha ocurrido un error inesperado', 'error');
});

// Captura promesas rechazadas que o fueron cumplidas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
    showNotification('Error de conexión', 'error');
    event.preventDefault(); // Evita que el error se muestre en consola
});