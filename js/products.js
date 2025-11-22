let products = [];
let categories = {};

async function loadProductData() {
    try {
        // Determine correct path based on current page location
        const isInSubfolder = window.location.pathname.includes('/pages/');
        const dataPath = isInSubfolder ? '../data/products.json' : './data/products.json';

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

// Note: addToCart() function is now in cart.js

