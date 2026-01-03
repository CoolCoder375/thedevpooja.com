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

    // Checkout - Redirect to checkout page
    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Determine correct path based on current page location
        const isInSubfolder = window.location.pathname.includes('/pages/');
        const checkoutPath = isInSubfolder ? 'checkout.html' : 'pages/checkout.html';

        // Redirect to checkout page
        window.location.href = checkoutPath;
    }

    // Show payment options modal
    showPaymentOptions() {
        const total = this.getTotal();
        const razorpayEnabled = typeof RAZORPAY_CONFIG !== 'undefined' &&
                                RAZORPAY_CONFIG.features.enableRazorpay &&
                                RAZORPAY_CONFIG.keyId &&
                                RAZORPAY_CONFIG.keyId !== '';

        let modalHTML = `
            <div class="payment-modal" id="paymentModal">
                <div class="payment-modal-content">
                    <button class="payment-modal-close" onclick="cart.closePaymentModal()">&times;</button>
                    <h2>Choose Payment Method</h2>
                    <div class="payment-total">
                        <span>Total Amount:</span>
                        <span class="payment-total-amount">₹${total}</span>
                    </div>
                    <div class="payment-options">
        `;

        if (razorpayEnabled) {
            modalHTML += `
                        <button class="payment-option-btn razorpay-btn" onclick="cart.payWithRazorpay()">
                            <div class="payment-option-icon">💳</div>
                            <div class="payment-option-details">
                                <h3>Pay Online</h3>
                                <p>Cards, UPI, NetBanking, Wallets</p>
                                <span class="payment-badge">Instant Confirmation</span>
                            </div>
                        </button>
            `;
        }

        if (!razorpayEnabled || RAZORPAY_CONFIG.features.enableWhatsAppCheckout) {
            modalHTML += `
                        <button class="payment-option-btn whatsapp-btn" onclick="cart.payWithWhatsApp()">
                            <div class="payment-option-icon">📱</div>
                            <div class="payment-option-details">
                                <h3>Cash on Delivery</h3>
                                <p>Order via WhatsApp</p>
                                <span class="payment-badge">Pay when delivered</span>
                            </div>
                        </button>
            `;
        }

        modalHTML += `
                    </div>
                </div>
            </div>
        `;

        // Insert modal into DOM
        const existingModal = document.getElementById('paymentModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Close payment modal
    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.remove();
        }
    }

    // Pay with Razorpay
    payWithRazorpay() {
        if (typeof Razorpay === 'undefined') {
            alert('Razorpay is not loaded. Please refresh the page and try again.');
            return;
        }

        const total = this.getTotal();
        const config = RAZORPAY_CONFIG;

        const options = {
            key: config.keyId,
            amount: total * 100, // Amount in paise (₹500 = 50000 paise)
            currency: config.currency,
            name: config.businessName,
            description: config.businessDescription,
            image: config.businessLogo,

            handler: (response) => {
                // Payment successful
                this.handlePaymentSuccess(response);
            },

            prefill: {
                name: '',
                email: '',
                contact: ''
            },

            notes: {
                order_items: JSON.stringify(this.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })))
            },

            theme: {
                color: config.themeColor
            },

            modal: {
                ondismiss: () => {
                    this.showNotification('Payment cancelled');
                }
            }
        };

        const rzp = new Razorpay(options);

        rzp.on('payment.failed', (response) => {
            this.handlePaymentFailure(response);
        });

        // Close payment options modal
        this.closePaymentModal();

        // Open Razorpay checkout
        rzp.open();
    }

    // Handle successful payment
    handlePaymentSuccess(response) {
        const paymentId = response.razorpay_payment_id;

        // Send WhatsApp notification to business
        this.sendWhatsAppOrderConfirmation(paymentId);

        // Show success message
        this.showPaymentSuccessModal(paymentId);

        // Clear cart
        this.clearCart();
        this.closeCart();
    }

    // Handle payment failure
    handlePaymentFailure(response) {
        alert('Payment failed: ' + response.error.description + '\nPlease try again or choose Cash on Delivery.');
    }

    // Show payment success modal
    showPaymentSuccessModal(paymentId) {
        const modalHTML = `
            <div class="payment-modal success-modal" id="successModal">
                <div class="payment-modal-content">
                    <div class="success-icon">✅</div>
                    <h2>Payment Successful!</h2>
                    <p>Your order has been placed successfully.</p>
                    <div class="success-details">
                        <p><strong>Payment ID:</strong> ${paymentId}</p>
                        <p><strong>Total Amount:</strong> ₹${this.getTotal()}</p>
                    </div>
                    <p class="success-message">
                        We'll send you a WhatsApp message shortly with order confirmation.
                    </p>
                    <button class="btn btn-primary" onclick="document.getElementById('successModal').remove()">
                        Continue Shopping
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Auto-close after 10 seconds
        setTimeout(() => {
            const modal = document.getElementById('successModal');
            if (modal) modal.remove();
        }, 10000);
    }

    // Send WhatsApp order confirmation
    sendWhatsAppOrderConfirmation(paymentId = null) {
        // Create order message for WhatsApp
        let message = '*✅ New Order from DevPooja Website*\n\n';

        if (paymentId) {
            message += '*💳 PAID ONLINE*\n';
            message += `*Payment ID:* ${paymentId}\n\n`;
        } else {
            message += '*💰 CASH ON DELIVERY*\n\n';
        }

        message += '*Order Details:*\n';

        this.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Quantity: ${item.quantity}\n`;
            message += `   Price: ₹${item.price} x ${item.quantity} = ₹${item.price * item.quantity}\n\n`;
        });

        message += `*Total Amount: ₹${this.getTotal()}*\n\n`;

        if (paymentId) {
            message += '✅ Payment already received via Razorpay.\n';
            message += 'Please prepare for shipping.';
        } else {
            message += 'Please confirm this order and provide delivery details.';
        }

        // WhatsApp business number
        const phoneNumber = RAZORPAY_CONFIG ? RAZORPAY_CONFIG.whatsappNumber : '919067615208';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
    }

    // Pay with WhatsApp (Cash on Delivery)
    payWithWhatsApp() {
        this.closePaymentModal();
        this.sendWhatsAppOrderConfirmation();

        // Show confirmation message
        setTimeout(() => {
            if (confirm('Order details opened in WhatsApp!\n\nPlease send the message to complete your order.\n\nWould you like to clear your cart?')) {
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
