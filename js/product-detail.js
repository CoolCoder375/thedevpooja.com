// Product Detail Page Logic

let currentProduct = null;
let mainSwiper = null;
let thumbsSwiper = null;

// Get product ID from URL
function getProductIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const productId = getProductIdFromURL();

    if (!productId) {
        showError();
        return;
    }

    // Wait for products to load
    document.addEventListener('productsLoaded', () => {
        loadProductDetail(productId);
    });

    // If products already loaded
    if (typeof products !== 'undefined' && products.length > 0) {
        loadProductDetail(productId);
    }
});

// Load product details
function loadProductDetail(productId) {
    const product = products.find(p => p.id.toString() === productId.toString());

    if (!product) {
        showError();
        return;
    }

    currentProduct = product;

    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('productContent').style.display = 'grid';

    // Populate product details
    populateProductDetails(product);

    // Initialize image gallery
    initializeImageGallery(product);

    // Initialize quantity controls
    initializeQuantityControls(product);

    // Show related products
    loadRelatedProducts(product);

    // Track page view
    if (typeof Analytics !== 'undefined') {
        Analytics.trackEvent('view_item', {
            currency: 'INR',
            value: product.price,
            items: [{
                item_id: product.id.toString(),
                item_name: product.name,
                item_category: product.category,
                price: product.price
            }]
        });
    }
}

// Populate product details
function populateProductDetails(product) {
    const quantity = parseInt(product.quantity) || 0;
    const isOutOfStock = quantity === 0;
    const isLowStock = quantity > 0 && quantity <= 5;

    // Breadcrumb
    document.getElementById('breadcrumbProduct').textContent = product.name;

    // Stock badge
    let stockBadgeHTML = '';
    if (isOutOfStock) {
        stockBadgeHTML = '<div class="stock-badge-detail out-of-stock">Out of Stock</div>';
    } else if (isLowStock) {
        stockBadgeHTML = `<div class="stock-badge-detail low-stock">Only ${quantity} left!</div>`;
    }
    document.getElementById('stockBadge').innerHTML = stockBadgeHTML;

    // Title & Category
    document.getElementById('productTitle').textContent = product.name;
    const categoryName = categories[product.category] || product.category;
    document.getElementById('productCategory').innerHTML = `<span class="category-badge">${categoryName}</span>`;

    // Price
    document.getElementById('productPrice').textContent = `₹${product.price}`;

    // Description
    document.getElementById('productDescription').textContent = product.description || 'No description available.';

    // Features
    if (product.features && product.features.length > 0) {
        const featuresContainer = document.getElementById('productFeaturesContainer');
        const featuresList = document.getElementById('productFeaturesList');

        featuresContainer.style.display = 'block';
        featuresList.innerHTML = product.features.map(feature =>
            `<li>${feature}</li>`
        ).join('');
    }

    // Meta info
    document.getElementById('productId').textContent = product.id;
    document.getElementById('productAvailability').textContent = isOutOfStock
        ? 'Out of Stock'
        : isLowStock
            ? `${quantity} in stock`
            : 'In Stock';
    document.getElementById('productAvailability').style.color = isOutOfStock ? '#c62828' : isLowStock ? '#e65100' : '#2e7d32';

    // Add to cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (isOutOfStock) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = 'Out of Stock';
        addToCartBtn.style.background = '#ccc';
        addToCartBtn.style.cursor = 'not-allowed';
    }

    // Set page title
    document.title = `${product.name} - DevPooja`;
}

// Initialize image gallery
function initializeImageGallery(product) {
    // Collect all available images
    const images = [product.image];
    if (product.image2) images.push(product.image2);
    if (product.image3) images.push(product.image3);
    if (product.image4) images.push(product.image4);
    if (product.image5) images.push(product.image5);

    // Populate main images
    const mainWrapper = document.getElementById('mainImagesWrapper');
    mainWrapper.innerHTML = images.map(img => `
        <div class="swiper-slide">
            <img src="${img}" alt="${product.name}" loading="lazy">
        </div>
    `).join('');

    // Populate thumbnails (only if more than 1 image)
    const thumbWrapper = document.getElementById('thumbImagesWrapper');
    if (images.length > 1) {
        thumbWrapper.innerHTML = images.map(img => `
            <div class="swiper-slide">
                <img src="${img}" alt="${product.name}">
            </div>
        `).join('');

        // Initialize thumbnails swiper
        thumbsSwiper = new Swiper('#productImagesThumbs', {
            spaceBetween: 10,
            slidesPerView: 4,
            freeMode: true,
            watchSlidesProgress: true,
        });
    } else {
        // Hide thumbnails if only 1 image
        document.getElementById('productImagesThumbs').style.display = 'none';
    }

    // Initialize main swiper
    mainSwiper = new Swiper('#productImagesMain', {
        spaceBetween: 10,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        thumbs: {
            swiper: thumbsSwiper,
        },
    });
}

// Initialize quantity controls
function initializeQuantityControls(product) {
    const quantity = parseInt(product.quantity) || 0;
    const qtyInput = document.getElementById('productQty');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const addToCartBtn = document.getElementById('addToCartBtn');

    // Set max quantity
    qtyInput.max = quantity;

    // Disable controls if out of stock
    if (quantity === 0) {
        qtyInput.disabled = true;
        qtyMinus.disabled = true;
        qtyPlus.disabled = true;
        return;
    }

    // Quantity decrease
    qtyMinus.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value) || 1;
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
        }
    });

    // Quantity increase
    qtyPlus.addEventListener('click', () => {
        const currentValue = parseInt(qtyInput.value) || 1;
        const maxValue = parseInt(qtyInput.max) || 999;
        if (currentValue < maxValue) {
            qtyInput.value = currentValue + 1;
        }
    });

    // Add to cart
    addToCartBtn.addEventListener('click', () => {
        const qty = parseInt(qtyInput.value) || 1;
        addToCart(product.id, qty);

        // Reset quantity to 1 after adding
        qtyInput.value = 1;
    });
}

// Load related products
function loadRelatedProducts(product) {
    // Get products from same category (excluding current product)
    const relatedProducts = products
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 6); // Max 6 related products

    if (relatedProducts.length === 0) {
        return; // Don't show section if no related products
    }

    // Show section
    document.getElementById('relatedProductsSection').style.display = 'block';

    // Populate related products
    const wrapper = document.getElementById('relatedProductsWrapper');
    wrapper.innerHTML = relatedProducts.map(p => renderRelatedProductCard(p)).join('');

    // Initialize swiper
    new Swiper('#relatedProductsSwiper', {
        slidesPerView: 1,
        spaceBetween: 20,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            640: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 3,
            },
            1024: {
                slidesPerView: 4,
            },
        },
    });
}

// Render related product card
function renderRelatedProductCard(product) {
    const quantity = parseInt(product.quantity) || 0;
    const isOutOfStock = quantity === 0;
    const isLowStock = quantity > 0 && quantity <= 5;

    let stockBadge = '';
    if (isOutOfStock) {
        stockBadge = '<div class="stock-badge out-of-stock">Out of Stock</div>';
    } else if (isLowStock) {
        stockBadge = `<div class="stock-badge low-stock">Only ${quantity} left!</div>`;
    }

    return `
        <div class="swiper-slide">
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" onclick="navigateToProduct(${product.id})">
                ${stockBadge}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="product-price">₹${product.price}</div>
                    <button class="btn btn-small btn-view-details">View Details</button>
                </div>
            </div>
        </div>
    `;
}

// Navigate to product detail page
function navigateToProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Show error state
function showError() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
});
