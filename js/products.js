// Product data - Replace image URLs with your Cloudinary URLs
const products = [
    {
        id: 1,
        name: "Sandalwood Incense Sticks",
        category: "incense",
        price: 199,
        image: "https://via.placeholder.com/400x400/00bcd4/ffffff?text=Sandalwood+Incense",
        description: "Premium sandalwood incense sticks - Pack of 100. Made from pure sandalwood for authentic fragrance.",
        features: ["100% Natural", "Long burning", "Authentic fragrance", "Export quality"]
    },
    {
        id: 2,
        name: "Fresh Marigold Garlands",
        category: "garlands",
        price: 150,
        image: "https://via.placeholder.com/400x400/4caf50/ffffff?text=Marigold+Garland",
        description: "Fresh marigold flower garland - 2 meters. Perfect for temple decoration and festivals.",
        features: ["Fresh flowers", "2 meter length", "Traditional design", "Daily fresh supply"]
    },
    {
        id: 3,
        name: "Brass Ganesha Idol",
        category: "idols",
        price: 899,
        image: "https://via.placeholder.com/400x400/00bcd4/ffffff?text=Ganesha+Idol",
        description: "Handcrafted brass Ganesha statue - 6 inches. Perfect for home temple and worship.",
        features: ["Handcrafted brass", "6 inch height", "Traditional design", "Export finish"]
    },
    {
        id: 4,
        name: "Traditional Brass Diyas",
        category: "diyas",
        price: 299,
        image: "https://via.placeholder.com/400x400/4caf50/ffffff?text=Brass+Diyas",
        description: "Traditional brass oil lamps - Set of 5. Perfect for festivals and daily worship.",
        features: ["Set of 5 diyas", "Pure brass", "Traditional design", "Festival ready"]
    },
    {
        id: 5,
        name: "Complete Pooja Thali Set",
        category: "pooja-items",
        price: 599,
        image: "https://via.placeholder.com/400x400/00bcd4/ffffff?text=Pooja+Thali",
        description: "Complete brass pooja thali with all accessories included for worship rituals.",
        features: ["Complete set", "Brass material", "All accessories", "Ready to use"]
    },
    {
        id: 6,
        name: "Premium Coconuts",
        category: "coconuts",
        price: 120,
        image: "https://via.placeholder.com/400x400/4caf50/ffffff?text=Premium+Coconuts",
        description: "Premium quality coconuts for religious ceremonies - Set of 3 pieces.",
        features: ["Premium quality", "Set of 3", "Fresh supply", "Ceremony ready"]
    }
];

// Categories for navigation
const categories = {
    "incense": "Incense & Dhoop",
    "garlands": "Garlands & Flowers", 
    "idols": "Idols & Statues",
    "diyas": "Diyas & Lamps",
    "pooja-items": "Pooja Items",
    "coconuts": "Coconuts & Fruits"
};

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