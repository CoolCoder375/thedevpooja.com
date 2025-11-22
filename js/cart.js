// Cart Management System
class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.initializeCart();
    }

    // Load cart from localStorage
    loadCart() {
        const saved = localStorage.getItem('devpooja_cart');
        return saved ? JSON.parse(saved) : [];
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('devpooja_cart', JSON.stringify(this.items));
        this.updateCartUI();
    }

    // Add item to cart
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.showNotification(`${product.name} added to cart!`);
    }

    // Remove item from cart
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
    }

    // Update item quantity
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get total items count
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Clear cart
    clearCart() {
        this.items = [];
        this.saveCart();
    }

    // Initialize cart UI
    initializeCart() {
        this.createCartHTML();
        this.attachEventListeners();
        this.updateCartUI();
    }

    // Create cart HTML structure
    createCartHTML() {
        // Determine correct path based on current page location
        const isInSubfolder = window.location.pathname.includes('/pages/');
        const svgPath = isInSubfolder ? '../svg/cart.svg' : 'svg/cart.svg';

        const cartHTML = `
            <!-- Floating Cart Button -->
            <button class="cart-float-btn" id="cartFloatBtn">
                <img src="${svgPath}" alt="Cart" class="cart-icon">
                <span class="cart-badge" id="cartBadge">0</span>
            </button>

            <!-- Cart Sidebar -->
            <div class="cart-sidebar" id="cartSidebar">
                <div class="cart-header">
                    <h3>Shopping Cart</h3>
                    <button class="cart-close-btn" id="cartCloseBtn">&times;</button>
                </div>

                <div class="cart-items" id="cartItems">
                    <!-- Cart items will be inserted here -->
                </div>

                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span class="cart-total-amount" id="cartTotalAmount">₹0</span>
                    </div>
                    <button class="btn btn-primary cart-checkout-btn" id="cartCheckoutBtn">
                        Proceed to Checkout
                    </button>
                    <button class="btn btn-secondary cart-clear-btn" id="cartClearBtn">
                        Clear Cart
                    </button>
                </div>
            </div>

            <!-- Cart Overlay -->
            <div class="cart-overlay" id="cartOverlay"></div>

            <!-- Notification Toast -->
            <div class="cart-notification" id="cartNotification"></div>
        `;

        // Insert cart HTML into body
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    }

    // Attach event listeners
    attachEventListeners() {
        const floatBtn = document.getElementById('cartFloatBtn');
        const closeBtn = document.getElementById('cartCloseBtn');
        const overlay = document.getElementById('cartOverlay');
        const checkoutBtn = document.getElementById('cartCheckoutBtn');
        const clearBtn = document.getElementById('cartClearBtn');

        floatBtn.addEventListener('click', () => this.openCart());
        closeBtn.addEventListener('click', () => this.closeCart());
        overlay.addEventListener('click', () => this.closeCart());
        checkoutBtn.addEventListener('click', () => this.checkout());
        clearBtn.addEventListener('click', () => this.confirmClearCart());
    }

    // Open cart sidebar
    openCart() {
        document.getElementById('cartSidebar').classList.add('active');
        document.getElementById('cartOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close cart sidebar
    closeCart() {
        document.getElementById('cartSidebar').classList.remove('active');
        document.getElementById('cartOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    // Update cart UI
    updateCartUI() {
        this.updateCartBadge();
        this.renderCartItems();
        this.updateCartTotal();
    }

    // Update cart badge
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const count = this.getItemCount();
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Render cart items
    renderCartItems() {
        const container = document.getElementById('cartItems');
        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="cart-empty">
                    <div class="cart-empty-icon">🛒</div>
                    <p>Your cart is empty</p>
                    <small>Add some products to get started!</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">₹${item.price}</div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn qty-decrease" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn qty-increase" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <div class="cart-item-subtotal">₹${item.price * item.quantity}</div>
                    <button class="cart-item-remove" onclick="cart.removeItem(${item.id})">
                        <span>Remove</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update cart total
    updateCartTotal() {
        const totalElement = document.getElementById('cartTotalAmount');
        if (totalElement) {
            totalElement.textContent = `₹${this.getTotal()}`;
        }
    }

    // Show notification
    showNotification(message) {
        const notification = document.getElementById('cartNotification');
        if (notification) {
            notification.textContent = message;
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    // Confirm clear cart
    confirmClearCart() {
        if (this.items.length === 0) return;

        if (confirm('Are you sure you want to clear your cart?')) {
            this.clearCart();
            this.showNotification('Cart cleared!');
        }
    }

    // Checkout via WhatsApp
    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Create order message for WhatsApp
        let message = '*New Order from DevPooja Website*\n\n';
        message += '*Order Details:*\n';

        this.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Quantity: ${item.quantity}\n`;
            message += `   Price: ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}\n\n`;
        });

        message += `*Total Amount: ₹${this.getTotal()}*\n\n`;
        message += 'Please confirm this order and provide delivery details.';

        // WhatsApp business number (replace with actual number)
        const phoneNumber = '919067615208'; // Replace with your WhatsApp business number
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');

        // Optionally clear cart after checkout
        setTimeout(() => {
            if (confirm('Order sent via WhatsApp! Would you like to clear your cart?')) {
                this.clearCart();
                this.closeCart();
            }
        }, 1000);
    }
}

// Initialize cart when DOM is ready
let cart;

// Use both DOMContentLoaded and window.onload to ensure cart initializes
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    // DOM already loaded
    initCart();
}

function initCart() {
    cart = new ShoppingCart();
}

// Global function to add to cart (called from product pages)
function addToCart(productId) {
    if (!cart) {
        console.error('Cart not initialized yet');
        return;
    }

    // Get product from products array
    const product = typeof getProductById === 'function' ? getProductById(productId) : null;

    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    cart.addItem(product);
}
