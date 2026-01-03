// Checkout Page Logic
class Checkout {
    constructor() {
        this.cartItems = this.loadCart();
        this.customerDetails = {};
        this.selectedPaymentMethod = 'cod';
        this.init();
    }

    // Load cart from localStorage
    loadCart() {
        const saved = localStorage.getItem('devpooja_cart');
        return saved ? JSON.parse(saved) : [];
    }

    // Initialize checkout page
    init() {
        // Check if cart is empty
        if (this.cartItems.length === 0) {
            alert('Your cart is empty!');
            window.location.href = '../index.html';
            return;
        }

        // Display order summary
        this.displayOrderSummary();

        // Check Razorpay availability
        this.checkRazorpayAvailability();

        // Attach event listeners
        this.attachEventListeners();

        // Mobile menu
        this.initMobileMenu();
    }

    // Display order summary
    displayOrderSummary() {
        const container = document.getElementById('orderItems');
        const subtotal = this.getCartTotal();

        container.innerHTML = this.cartItems.map(item => `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="order-item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${item.quantity}</p>
                </div>
                <div class="order-item-total">₹${item.price * item.quantity}</div>
            </div>
        `).join('');

        document.getElementById('subtotalAmount').textContent = `₹${subtotal}`;
        document.getElementById('totalAmount').textContent = `₹${subtotal}`;
    }

    // Get cart total
    getCartTotal() {
        return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Check if Razorpay is available
    checkRazorpayAvailability() {
        const razorpayEnabled = typeof RAZORPAY_CONFIG !== 'undefined' &&
                                RAZORPAY_CONFIG.features.enableRazorpay &&
                                RAZORPAY_CONFIG.keyId &&
                                RAZORPAY_CONFIG.keyId !== '';

        if (razorpayEnabled) {
            const razorpayCard = document.querySelector('.payment-method-card[data-method="razorpay"]');
            if (razorpayCard) {
                razorpayCard.style.display = 'block';
            }
        }
    }

    // Attach event listeners
    attachEventListeners() {
        // Place order button
        const placeOrderBtn = document.getElementById('placeOrderBtn');
        placeOrderBtn.addEventListener('click', () => this.handlePlaceOrder());

        // Payment method selection
        const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethodInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.selectedPaymentMethod = e.target.value;
                this.updatePlaceOrderButton();
            });
        });
    }

    // Update place order button text
    updatePlaceOrderButton() {
        const btn = document.getElementById('placeOrderBtn');
        if (this.selectedPaymentMethod === 'razorpay') {
            btn.textContent = 'Proceed to Payment';
        } else {
            btn.textContent = 'Place Order';
        }
    }

    // Handle place order
    async handlePlaceOrder() {
        // Validate customer details
        const form = document.getElementById('customerDetailsForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Collect customer details
        this.customerDetails = {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            email: document.getElementById('customerEmail').value.trim(),
            address: document.getElementById('customerAddress').value.trim(),
            city: document.getElementById('customerCity').value.trim(),
            state: document.getElementById('customerState').value.trim(),
            pincode: document.getElementById('customerPincode').value.trim(),
            notes: document.getElementById('orderNotes').value.trim()
        };

        // Validate phone number
        if (!/^[0-9]{10}$/.test(this.customerDetails.phone)) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }

        // Validate pincode
        if (!/^[0-9]{6}$/.test(this.customerDetails.pincode)) {
            alert('Please enter a valid 6-digit pincode');
            return;
        }

        // Process based on payment method
        if (this.selectedPaymentMethod === 'razorpay') {
            this.processRazorpayPayment();
        } else {
            await this.processCODOrder();
        }
    }

    // Show button loading state
    showButtonLoading(text = 'Processing...') {
        const btn = document.getElementById('placeOrderBtn');
        const btnText = btn.querySelector('.btn-text');
        btn.classList.add('loading');
        btn.disabled = true;
        btnText.textContent = text;
    }

    // Hide button loading state
    hideButtonLoading(text = 'Place Order') {
        const btn = document.getElementById('placeOrderBtn');
        const btnText = btn.querySelector('.btn-text');
        btn.classList.remove('loading');
        btn.disabled = false;
        btnText.textContent = text;
    }

    // Process Razorpay payment
    processRazorpayPayment() {
        if (typeof Razorpay === 'undefined') {
            alert('Payment gateway is not loaded. Please refresh and try again.');
            return;
        }

        // Show loading while opening payment modal
        this.showButtonLoading('Opening payment gateway...');

        const total = this.getCartTotal();
        const config = RAZORPAY_CONFIG;

        const options = {
            key: config.keyId,
            amount: total * 100, // Amount in paise
            currency: config.currency,
            name: config.businessName,
            description: config.businessDescription,
            image: config.businessLogo,

            // Prefill customer details
            prefill: {
                name: this.customerDetails.name,
                email: this.customerDetails.email,
                contact: this.customerDetails.phone
            },

            notes: {
                customer_name: this.customerDetails.name,
                customer_phone: this.customerDetails.phone,
                delivery_address: this.getFullAddress(),
                order_items: JSON.stringify(this.cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })))
            },

            theme: {
                color: config.themeColor
            },

            handler: (response) => {
                // Payment successful - keep loading while processing
                this.showButtonLoading('Processing payment...');
                this.handlePaymentSuccess(response.razorpay_payment_id);
            },

            modal: {
                ondismiss: () => {
                    // Hide loading when modal is dismissed
                    this.hideButtonLoading();
                    console.log('Payment cancelled by user');
                }
            }
        };

        const rzp = new Razorpay(options);

        rzp.on('payment.failed', (response) => {
            // Hide loading on payment failure
            this.hideButtonLoading();
            alert('Payment failed: ' + response.error.description + '\nPlease try again or choose Cash on Delivery.');
        });

        rzp.open();
    }

    // Process COD order
    async processCODOrder() {
        try {
            // Show loading
            this.showButtonLoading('Placing order...');

            // Create order object
            const order = this.createOrderObject(null);

            // Save order to Google Sheets (if Apps Script is configured)
            this.showButtonLoading('Saving order...');
            await this.saveOrderToSheets(order);

            // Send WhatsApp message
            this.showButtonLoading('Opening WhatsApp...');
            this.sendWhatsAppNotification(order);

            // Show success message
            this.showOrderSuccess(order);

            // Clear cart
            localStorage.removeItem('devpooja_cart');

            // Hide loading (success modal will handle navigation)
            this.hideButtonLoading('Order Placed!');

        } catch (error) {
            console.error('Error placing order:', error);
            this.hideButtonLoading();
            alert('Failed to place order. Please try again.');
        }
    }

    // Handle payment success
    async handlePaymentSuccess(paymentId) {
        // Create order object with payment ID
        const order = this.createOrderObject(paymentId);

        // Save order to Google Sheets
        await this.saveOrderToSheets(order);

        // Send WhatsApp notification
        this.sendWhatsAppNotification(order);

        // Show success message
        this.showOrderSuccess(order);

        // Clear cart
        localStorage.removeItem('devpooja_cart');
    }

    // Create order object
    createOrderObject(paymentId) {
        return {
            orderId: 'ORD-' + Date.now(),
            timestamp: new Date().toISOString(),
            customer: this.customerDetails,
            items: this.cartItems,
            total: this.getCartTotal(),
            paymentMethod: this.selectedPaymentMethod === 'razorpay' ? 'Online' : 'COD',
            paymentId: paymentId,
            status: paymentId ? 'Paid' : 'Pending',
            deliveryAddress: this.getFullAddress()
        };
    }

    // Get full address string
    getFullAddress() {
        return `${this.customerDetails.address}, ${this.customerDetails.city}, ${this.customerDetails.state} - ${this.customerDetails.pincode}`;
    }

    // Save order to Google Sheets
    async saveOrderToSheets(order) {
        if (typeof SHEETS_CONFIG === 'undefined' || !SHEETS_CONFIG.appsScriptUrl) {
            console.log('Apps Script not configured, skipping order save');
            return;
        }

        try {
            const response = await fetch(SHEETS_CONFIG.appsScriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addOrder',
                    data: order
                })
            });

            console.log('Order saved to Google Sheets');
        } catch (error) {
            console.error('Failed to save order:', error);
        }
    }

    // Send WhatsApp notification
    sendWhatsAppNotification(order) {
        let message = '*🛍️ New Order from DevPooja Website*\n\n';

        // Order ID
        message += `*Order ID:* ${order.orderId}\n`;
        message += `*Date:* ${new Date(order.timestamp).toLocaleString()}\n\n`;

        // Payment status
        if (order.paymentId) {
            message += '*✅ PAYMENT RECEIVED (ONLINE)*\n';
            message += `*Payment ID:* ${order.paymentId}\n\n`;
        } else {
            message += '*💰 CASH ON DELIVERY*\n\n';
        }

        // Customer details
        message += '*📋 Customer Details:*\n';
        message += `Name: ${order.customer.name}\n`;
        message += `Phone: ${order.customer.phone}\n`;
        if (order.customer.email) {
            message += `Email: ${order.customer.email}\n`;
        }
        message += `\n*📍 Delivery Address:*\n${order.deliveryAddress}\n\n`;

        // Order items
        message += '*🛒 Order Items:*\n';
        order.items.forEach((item, index) => {
            message += `${index + 1}. ${item.name}\n`;
            message += `   Qty: ${item.quantity} × ₹${item.price} = ₹${item.price * item.quantity}\n`;
        });

        message += `\n*💵 Total Amount: ₹${order.total}*\n\n`;

        // Special notes
        if (order.customer.notes) {
            message += `*📝 Special Instructions:*\n${order.customer.notes}\n\n`;
        }

        // Action required
        if (order.paymentId) {
            message += '✅ Payment already received. Please prepare for shipping.\n';
        } else {
            message += '⚠️ Cash on Delivery - Please confirm before shipping.';
        }

        // WhatsApp URL
        const phoneNumber = RAZORPAY_CONFIG ? RAZORPAY_CONFIG.whatsappNumber : '919067615208';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
    }

    // Show order success message
    showOrderSuccess(order) {
        const successHTML = `
            <div class="order-success-overlay">
                <div class="order-success-modal">
                    <div class="success-icon">✅</div>
                    <h2>Order Placed Successfully!</h2>
                    <div class="success-details">
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        ${order.paymentId ? `<p><strong>Payment ID:</strong> ${order.paymentId}</p>` : ''}
                        <p><strong>Total Amount:</strong> ₹${order.total}</p>
                        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    </div>
                    <p class="success-message">
                        ${order.paymentId
                            ? 'Your payment has been received. We will ship your order soon!'
                            : 'We have received your order. Please confirm via WhatsApp to proceed.'}
                    </p>
                    <div class="success-actions">
                        <a href="../index.html" class="btn btn-primary">Continue Shopping</a>
                        <a href="products.html" class="btn btn-secondary">View Products</a>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', successHTML);
    }

    // Mobile menu
    initMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    }
}

// Initialize checkout when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Checkout();
});
