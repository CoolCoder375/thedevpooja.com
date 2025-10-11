let products = [];
let categories = {};

async function loadProductData() {
    try {
        // Determine correct path based on current page location
        const isInSubfolder = window.location.pathname.includes('/pages/');
        const dataPath = isInSubfolder ? '../data/products.json' : './data/products.json';

        console.log('Loading from path:', dataPath);
        const response = await fetch(dataPath);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        products = data.products;
        categories = data.categories;

        // Notify that products are ready
        document.dispatchEvent(new CustomEvent('productsLoaded'));
        return data;
    } catch (error) {
        console.error('Error loading product data:', error);
        return null;
    }
}

// Load products when page starts
loadProductData();

// Function to get products by category
function getProductsByCategory(category) {
    return products.filter(product => product.category === category);
}

// Function to get product by ID
function getProductById(id) {
    return products.find(product => product.id === parseInt(id));
}

// Function to render product cards
function renderProductCard(product) {
    return `
        <div class="swiper-slide">
            <div class="product-card" data-category="${product.category}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="product-price">₹${product.price}</div>
                    <button class="btn btn-small" onclick="addToCart(${product.id})">Add to Cart</button>
                </div>
            </div>
        </div>
    `;
}

// Simple cart functionality
let cart = [];

function addToCart(productId) {
    const product = getProductById(productId);
    if (product) {
        cart.push(product);
        // Update button temporarily
        const button = event.target;
        button.textContent = 'Added ✓';
        button.style.backgroundColor = '#4caf50';
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.style.backgroundColor = '';
        }, 2000);

        console.log('Cart:', cart);
    }
}

