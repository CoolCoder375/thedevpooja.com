/**
 * Google Analytics 4 (GA4) Integration
 * Tracks user behavior, e-commerce events, and custom events
 */

// Initialize GA4 if enabled
if (typeof GA4_CONFIG !== 'undefined' && GA4_CONFIG.enabled && GA4_CONFIG.measurementId !== 'G-XXXXXXXXXX') {

    // Load GA4 script
    (function() {
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_CONFIG.measurementId}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.textContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_CONFIG.measurementId}', {
                'debug_mode': ${GA4_CONFIG.debug}
            });
        `;
        document.head.appendChild(script2);

        if (GA4_CONFIG.debug) {
            console.log('✅ GA4 Initialized:', GA4_CONFIG.measurementId);
        }
    })();
}

/**
 * Analytics Helper Functions
 */
const Analytics = {

    /**
     * Track custom event
     * @param {string} eventName - Name of the event
     * @param {object} params - Event parameters
     */
    trackEvent(eventName, params = {}) {
        if (!this.isEnabled()) return;

        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, params);

            if (GA4_CONFIG.debug) {
                console.log('📊 GA4 Event:', eventName, params);
            }
        }
    },

    /**
     * Check if analytics is enabled
     */
    isEnabled() {
        return typeof GA4_CONFIG !== 'undefined'
            && GA4_CONFIG.enabled
            && GA4_CONFIG.measurementId !== 'G-XXXXXXXXXX';
    },

    /**
     * Track page view (automatically tracked, but can be called manually)
     * @param {string} pageTitle - Page title
     * @param {string} pageLocation - Page URL
     */
    trackPageView(pageTitle, pageLocation) {
        this.trackEvent('page_view', {
            page_title: pageTitle,
            page_location: pageLocation
        });
    },

    // ==========================================
    // E-COMMERCE EVENTS
    // ==========================================

    /**
     * Track product view
     * @param {object} product - Product object
     */
    trackViewItem(product) {
        this.trackEvent('view_item', {
            currency: 'INR',
            value: product.price,
            items: [{
                item_id: product.id.toString(),
                item_name: product.name,
                item_category: product.category,
                price: product.price,
                quantity: 1
            }]
        });
    },

    /**
     * Track add to cart
     * @param {object} product - Product object
     * @param {number} quantity - Quantity added
     */
    trackAddToCart(product, quantity = 1) {
        this.trackEvent('add_to_cart', {
            currency: 'INR',
            value: product.price * quantity,
            items: [{
                item_id: product.id.toString(),
                item_name: product.name,
                item_category: product.category,
                price: product.price,
                quantity: quantity
            }]
        });
    },

    /**
     * Track remove from cart
     * @param {object} product - Product object
     * @param {number} quantity - Quantity removed
     */
    trackRemoveFromCart(product, quantity = 1) {
        this.trackEvent('remove_from_cart', {
            currency: 'INR',
            value: product.price * quantity,
            items: [{
                item_id: product.id.toString(),
                item_name: product.name,
                item_category: product.category,
                price: product.price,
                quantity: quantity
            }]
        });
    },

    /**
     * Track view cart
     * @param {array} cartItems - Array of cart items
     * @param {number} totalValue - Total cart value
     */
    trackViewCart(cartItems, totalValue) {
        const items = cartItems.map(item => ({
            item_id: item.id.toString(),
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity
        }));

        this.trackEvent('view_cart', {
            currency: 'INR',
            value: totalValue,
            items: items
        });
    },

    /**
     * Track begin checkout
     * @param {array} cartItems - Array of cart items
     * @param {number} totalValue - Total cart value
     */
    trackBeginCheckout(cartItems, totalValue) {
        const items = cartItems.map(item => ({
            item_id: item.id.toString(),
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity
        }));

        this.trackEvent('begin_checkout', {
            currency: 'INR',
            value: totalValue,
            items: items
        });
    },

    /**
     * Track purchase/order completion
     * @param {object} orderData - Order information
     */
    trackPurchase(orderData) {
        const items = orderData.items.map(item => ({
            item_id: item.id.toString(),
            item_name: item.name,
            item_category: item.category || 'unknown',
            price: item.price,
            quantity: item.quantity
        }));

        this.trackEvent('purchase', {
            transaction_id: orderData.orderId,
            value: orderData.total,
            currency: 'INR',
            payment_method: orderData.paymentMethod,
            items: items
        });
    },

    // ==========================================
    // CUSTOM EVENTS
    // ==========================================

    /**
     * Track search
     * @param {string} searchTerm - What user searched for
     */
    trackSearch(searchTerm) {
        this.trackEvent('search', {
            search_term: searchTerm
        });
    },

    /**
     * Track filter usage
     * @param {string} filterType - Type of filter used
     * @param {string} filterValue - Filter value
     */
    trackFilter(filterType, filterValue) {
        this.trackEvent('filter_products', {
            filter_type: filterType,
            filter_value: filterValue
        });
    },

    /**
     * Track social media click
     * @param {string} platform - Social media platform (instagram, facebook, etc.)
     */
    trackSocialClick(platform) {
        this.trackEvent('social_click', {
            platform: platform
        });
    },

    /**
     * Track contact form submission
     * @param {string} subject - Form subject
     */
    trackContactForm(subject) {
        this.trackEvent('contact_form_submit', {
            subject: subject
        });
    },

    /**
     * Track WhatsApp checkout click
     * @param {number} cartValue - Total cart value
     * @param {number} itemCount - Number of items
     */
    trackWhatsAppCheckout(cartValue, itemCount) {
        this.trackEvent('whatsapp_checkout', {
            value: cartValue,
            currency: 'INR',
            item_count: itemCount
        });
    },

    /**
     * Track admin login
     */
    trackAdminLogin() {
        this.trackEvent('admin_login', {
            page: 'admin_panel'
        });
    },

    /**
     * Track product management actions
     * @param {string} action - Action type (add, edit, delete)
     */
    trackProductManagement(action) {
        this.trackEvent('product_management', {
            action: action
        });
    }
};

// Export for use in other scripts
window.Analytics = Analytics;

if (GA4_CONFIG.debug) {
    console.log('📊 Analytics module loaded');
}
