// DevPooja Admin Panel JavaScript

// Configuration
let IMGBB_API_KEY = localStorage.getItem('imgbb_api_key') || '';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // TODO: Change this!

// Get Apps Script URL from config
function getAppsScriptUrl() {
    if (typeof SHEETS_CONFIG === 'undefined' || !SHEETS_CONFIG.appsScriptUrl) {
        return null;
    }
    return SHEETS_CONFIG.appsScriptUrl;
}

// State
let currentProducts = [];
let currentCustomers = [];
let currentOrders = [];
let editingProductId = null;
let ordersLoaded = false;

// ==========================================
// LOGIN / LOGOUT
// ==========================================

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        sessionStorage.setItem('adminLoggedIn', 'true');
        loadDashboard();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function logout() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('loginForm').reset();
    sessionStorage.removeItem('adminLoggedIn');
}

// Check if already logged in
window.addEventListener('load', function() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadDashboard();
    }
});

// ==========================================
// TAB SWITCHING
// ==========================================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    // Load tab data
    if (tabName === 'dashboard') loadDashboard();
    else if (tabName === 'products') loadProducts();
    else if (tabName === 'customers') loadCustomers();
    else if (tabName === 'orders') loadOrders();
}

// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {
    // Wait for products to load from Google Sheets
    if (typeof products === 'undefined' || products.length === 0) {
        setTimeout(loadDashboard, 500);
        return;
    }

    currentProducts = products;

    // Load orders if not already loaded
    if (!ordersLoaded) {
        currentOrders = await fetchOrdersFromSheets();
        ordersLoaded = true;
    }

    // Update statistics
    document.getElementById('totalProducts').textContent = currentProducts.length;
    document.getElementById('totalCustomers').textContent = currentCustomers.length;
    document.getElementById('totalOrders').textContent = currentOrders.length;

    // Count pending orders (status = "Pending" or "pending")
    const pendingCount = currentOrders.filter(o =>
        o.status.toLowerCase() === 'pending'
    ).length;
    document.getElementById('pendingOrders').textContent = pendingCount;

    loadRecentOrders();
}

function loadRecentOrders() {
    const container = document.getElementById('recentOrders');

    if (currentOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No orders yet</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">Orders will appear here when customers place orders</p>
            </div>
        `;
    } else {
        // Show recent 5 orders in a table
        const recentOrders = currentOrders.slice(0, 5);
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        recentOrders.forEach(order => {
            const date = new Date(order.date);
            const formattedDate = date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
            });

            const statusClass = order.status.toLowerCase() === 'paid' ? 'paid' : 'pending';

            html += `
                <tr>
                    <td><strong>${order.id}</strong></td>
                    <td>${order.customerName}</td>
                    <td>${formattedDate}</td>
                    <td><strong>₹${order.total}</strong></td>
                    <td><span class="status-badge status-${statusClass}">${order.status}</span></td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
        container.innerHTML = html;
    }
}

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

function showProductForm() {
    document.getElementById('productForm').classList.add('active');
    document.getElementById('formTitle').textContent = 'Add New Product';
    document.getElementById('productDataForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    editingProductId = null;
}

function hideProductForm() {
    document.getElementById('productForm').classList.remove('active');
    editingProductId = null;
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Image size must be less than 10MB');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

async function uploadImageToImgBB(file) {
    if (!IMGBB_API_KEY || IMGBB_API_KEY === '') {
        alert('Please configure ImgBB API key in Settings tab first!');
        return null;
    }

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', file);

    try {
        showLoading('Uploading image...');

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        hideLoading();

        if (result.success) {
            return result.data.url;
        } else {
            throw new Error(result.error.message || 'Image upload failed');
        }
    } catch (error) {
        hideLoading();
        console.error('Image upload error:', error);
        alert('Failed to upload image: ' + error.message);
        return null;
    }
}

async function saveProduct(event) {
    event.preventDefault();

    const saveBtn = document.getElementById('saveProductBtn');
    const btnText = saveBtn.querySelector('.btn-text');

    try {
        // Show loader and disable button
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;
        btnText.textContent = 'Saving...';

        const name = document.getElementById('productName').value;
        const category = document.getElementById('productCategory').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const quantity = parseInt(document.getElementById('productQuantity').value);
        const description = document.getElementById('productDescription').value;
        const featuresStr = document.getElementById('productFeatures').value;
        const features = featuresStr ? featuresStr.split('|').map(f => f.trim()).filter(f => f) : [];
        const featured = document.getElementById('productFeatured').checked;

        let imageUrl = document.getElementById('productImageUrl').value;

        // Upload new image if selected
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            btnText.textContent = 'Uploading image...';
            imageUrl = await uploadImageToImgBB(imageFile);
            if (!imageUrl) {
                // Reset button on upload failure
                saveBtn.classList.remove('loading');
                saveBtn.disabled = false;
                btnText.textContent = 'Save Product';
                return;
            }
        }

        if (!imageUrl) {
            alert('Please upload a product image');
            // Reset button
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;
            btnText.textContent = 'Save Product';
            return;
        }

        // Create product object
        const productData = {
            name,
            category,
            price,
            quantity,
            description,
            features,
            image: imageUrl,
            featured: featured
        };

        btnText.textContent = 'Saving to Google Sheets...';

        // Save to Google Sheets via Apps Script
        if (editingProductId) {
            // Update existing product
            await postToAppsScript('update', productData, editingProductId);
            showSuccessMessage('Product updated successfully! Reloading...');
        } else {
            // Add new product
            await postToAppsScript('add', productData);
            showSuccessMessage('Product added successfully! Reloading...');
        }

        hideProductForm();

        // Clear cache and reload page to fetch fresh data
        localStorage.removeItem('devpooja_products_cache');

        // Reload page after 1.5 seconds to show success message and allow Sheets to update
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('Save product error:', error);
        showErrorMessage(error.message);

        // Reset button on error
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
        btnText.textContent = 'Save Product';
    }
}

function loadProducts() {
    const container = document.getElementById('productsTable');

    // Wait for products to load from Google Sheets
    if (typeof products === 'undefined') {
        setTimeout(loadProducts, 500);
        return;
    }

    currentProducts = products;

    if (currentProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <p>No products found</p>
                <button class="btn-add" onclick="showProductForm()" style="margin-top: 20px;">Add First Product</button>
            </div>
        `;
        return;
    }

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Featured</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentProducts.forEach(product => {
        const categoryName = categories[product.category] || product.category;
        const isFeatured = product.featured === true || product.featured === 'TRUE' || product.featured === 'true';
        const featuredBadge = isFeatured
            ? '<span class="status-badge status-paid">⭐ Featured</span>'
            : '<span class="status-badge status-pending">-</span>';

        html += `
            <tr>
                <td><img src="${product.image}" class="product-image-thumb" alt="${product.name}" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td>${product.name}</td>
                <td>${categoryName}</td>
                <td>₹${product.price}</td>
                <td>${product.quantity || 0}</td>
                <td>${featuredBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function editProduct(id) {
    const product = currentProducts.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;

    document.getElementById('productForm').classList.add('active');
    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productQuantity').value = product.quantity || 0;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productFeatures').value = Array.isArray(product.features) ? product.features.join('|') : '';
    document.getElementById('productImageUrl').value = product.image;
    document.getElementById('productFeatured').checked = product.featured === true || product.featured === 'TRUE' || product.featured === 'true';

    if (product.image) {
        document.getElementById('previewImg').src = product.image;
        document.getElementById('imagePreview').style.display = 'block';
    }

    // Scroll to form
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        // Delete from Google Sheets via Apps Script
        await postToAppsScript('delete', null, id);

        showSuccessMessage('Product deleted successfully! Reloading...');

        // Clear cache and reload page to fetch fresh data
        localStorage.removeItem('devpooja_products_cache');

        // Reload page after 1.5 seconds to show success message and allow Sheets to update
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('Delete product error:', error);
        showErrorMessage(error.message);
    }
}

// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================

function loadCustomers() {
    const container = document.getElementById('customersTable');

    // TODO: Load from Google Sheets "Customers" tab
    if (currentCustomers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>No customers yet</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">Customers will appear here when they register on your website</p>
            </div>
        `;
    } else {
        // Show customers table
        let html = '<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Orders</th></tr></thead><tbody>';

        currentCustomers.forEach(customer => {
            html += `
                <tr>
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.joinDate}</td>
                    <td>${customer.orderCount || 0}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }
}

// ==========================================
// ORDER MANAGEMENT
// ==========================================

async function loadOrders() {
    const container = document.getElementById('ordersTable');

    // Show loading
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading orders from Google Sheets...</p>
        </div>
    `;

    // Fetch orders from Google Sheets
    currentOrders = await fetchOrdersFromSheets();
    ordersLoaded = true;

    if (currentOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <p>No orders yet</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">Orders will appear here when customers place orders</p>
            </div>
        `;
        return;
    }

    // Show orders table
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    currentOrders.forEach((order, index) => {
        // Format date nicely
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        // Determine status badge color
        const statusClass = order.status.toLowerCase() === 'paid' ? 'paid' : 'pending';

        html += `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${formattedDate}</td>
                <td>${order.customerName}</td>
                <td>${order.phone}</td>
                <td>${order.itemCount} item${order.itemCount > 1 ? 's' : ''}</td>
                <td><strong>₹${order.total}</strong></td>
                <td>${order.paymentMethod}</td>
                <td><span class="status-badge status-${statusClass}">${order.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-view" onclick="viewOrder(${index})">View</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function viewOrder(index) {
    const order = currentOrders[index];
    if (!order) return;

    // Create modal HTML
    const modalHtml = `
        <div class="order-modal-overlay" onclick="closeOrderModal()">
            <div class="order-modal" onclick="event.stopPropagation()">
                <div class="order-modal-header">
                    <h2>Order Details</h2>
                    <button class="modal-close" onclick="closeOrderModal()">&times;</button>
                </div>

                <div class="order-modal-content">
                    <div class="order-info-section">
                        <h3>Order Information</h3>
                        <div class="order-info-grid">
                            <div class="info-item">
                                <span class="info-label">Order ID:</span>
                                <span class="info-value"><strong>${order.id}</strong></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Date:</span>
                                <span class="info-value">${new Date(order.date).toLocaleString('en-IN')}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Status:</span>
                                <span class="info-value"><span class="status-badge status-${order.status.toLowerCase() === 'paid' ? 'paid' : 'pending'}">${order.status}</span></span>
                            </div>
                        </div>
                    </div>

                    <div class="order-info-section">
                        <h3>Customer Details</h3>
                        <div class="order-info-grid">
                            <div class="info-item">
                                <span class="info-label">Name:</span>
                                <span class="info-value">${order.customerName}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Phone:</span>
                                <span class="info-value"><a href="tel:${order.phone}">${order.phone}</a></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${order.email || 'Not provided'}</span>
                            </div>
                            <div class="info-item full-width">
                                <span class="info-label">Delivery Address:</span>
                                <span class="info-value">${order.address}</span>
                            </div>
                        </div>
                    </div>

                    <div class="order-info-section">
                        <h3>Order Items</h3>
                        <div class="order-items-list">
                            ${order.itemsArray.map(item => `<div class="order-item">📦 ${item}</div>`).join('')}
                        </div>
                    </div>

                    <div class="order-info-section">
                        <h3>Payment Details</h3>
                        <div class="order-info-grid">
                            <div class="info-item">
                                <span class="info-label">Payment Method:</span>
                                <span class="info-value">${order.paymentMethod}</span>
                            </div>
                            ${order.paymentId ? `
                                <div class="info-item">
                                    <span class="info-label">Payment ID:</span>
                                    <span class="info-value"><code>${order.paymentId}</code></span>
                                </div>
                            ` : ''}
                            <div class="info-item">
                                <span class="info-label">Total Amount:</span>
                                <span class="info-value"><strong style="font-size: 18px; color: #667eea;">₹${order.total}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="order-modal-footer">
                    <button class="btn-cancel" onclick="closeOrderModal()">Close</button>
                    <a href="https://wa.me/91${order.phone.replace(/^0+/, '')}?text=Hello ${order.customerName}, regarding your order ${order.id}"
                       target="_blank"
                       class="btn-save">
                        Contact Customer via WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeOrderModal() {
    const modal = document.querySelector('.order-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// ==========================================
// SETTINGS
// ==========================================

function saveSettings() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const btnText = saveBtn.querySelector('.btn-text');

    try {
        // Show loader and disable button
        saveBtn.classList.add('loading');
        saveBtn.disabled = true;
        btnText.textContent = 'Saving...';

        const imgbbKey = document.getElementById('imgbbApiKey').value;
        const instagramUrl = document.getElementById('instagramUrl')?.value || '';
        const facebookUrl = document.getElementById('facebookUrl')?.value || '';
        const youtubeUrl = document.getElementById('youtubeUrl')?.value || '';

        // Save ImgBB API key
        if (imgbbKey) {
            IMGBB_API_KEY = imgbbKey;
            localStorage.setItem('imgbb_api_key', imgbbKey);
        }

        // Save social media links
        const socialLinks = {
            instagram: instagramUrl,
            facebook: facebookUrl,
            youtube: youtubeUrl,
        };
        localStorage.setItem('social_links', JSON.stringify(socialLinks));

        // Dispatch event to update footer
        window.dispatchEvent(new CustomEvent('socialLinksUpdated', { detail: socialLinks }));

        // Simulate brief save delay for UX
        setTimeout(() => {
            // Reset button state
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;
            btnText.textContent = 'Save Settings';

            showSuccessMessage('Settings saved successfully! Social links will appear in the footer.');
        }, 500);

    } catch (error) {
        console.error('Save settings error:', error);

        // Reset button state on error
        saveBtn.classList.remove('loading');
        saveBtn.disabled = false;
        btnText.textContent = 'Save Settings';

        showErrorMessage('Failed to save settings: ' + error.message);
    }
}

// Load saved settings
window.addEventListener('load', function() {
    // Load ImgBB API key
    const savedKey = localStorage.getItem('imgbb_api_key');
    if (savedKey) {
        IMGBB_API_KEY = savedKey;
        const keyInput = document.getElementById('imgbbApiKey');
        if (keyInput) {
            keyInput.value = savedKey;
        }
    }

    // Load social media links
    const savedSocialLinks = localStorage.getItem('social_links');
    if (savedSocialLinks) {
        try {
            const socialLinks = JSON.parse(savedSocialLinks);
            const instagramInput = document.getElementById('instagramUrl');
            const facebookInput = document.getElementById('facebookUrl');
            const youtubeInput = document.getElementById('youtubeUrl');

            if (instagramInput) instagramInput.value = socialLinks.instagram || '';
            if (facebookInput) facebookInput.value = socialLinks.facebook || '';
            if (youtubeInput) youtubeInput.value = socialLinks.youtube || '';
        } catch (error) {
            console.error('Error loading social links:', error);
        }
    }
});

// ==========================================
// GOOGLE APPS SCRIPT API
// ==========================================

/**
 * Post data to Google Apps Script Web App
 * @param {string} action - 'add', 'update', or 'delete'
 * @param {object} data - Product data
 * @param {number} id - Product ID (for update/delete)
 * @returns {Promise<object>} - Response from Apps Script
 */
async function postToAppsScript(action, data, id = null) {
    const appsScriptUrl = getAppsScriptUrl();

    if (!appsScriptUrl || appsScriptUrl === '') {
        throw new Error('Apps Script URL not configured. Please add it to config.js');
    }

    const payload = {
        action: action,
        data: data,
        id: id
    };

    showLoading('Saving to Google Sheets...');

    try {
        const response = await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires no-cors mode
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Note: no-cors mode doesn't allow reading the response
        // We assume success if no error is thrown
        hideLoading();

        // Clear cache so products reload from sheet
        localStorage.removeItem('devpooja_products_cache');

        return { success: true };

    } catch (error) {
        hideLoading();
        console.error('Apps Script error:', error);
        throw new Error('Failed to save to Google Sheets: ' + error.message);
    }
}

// ==========================================
// FETCH ORDERS FROM GOOGLE SHEETS
// ==========================================

/**
 * Fetch orders from Google Sheets "Orders" tab
 * Uses the same Google Sheets API as products
 */
async function fetchOrdersFromSheets() {
    if (typeof SHEETS_CONFIG === 'undefined' || !SHEETS_CONFIG.apiKey || !SHEETS_CONFIG.spreadsheetId) {
        console.error('Google Sheets config not found');
        return [];
    }

    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEETS_CONFIG.spreadsheetId}/values/Orders!A2:K?key=${SHEETS_CONFIG.apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length === 0) {
            console.log('No orders found in sheet');
            return [];
        }

        // Transform sheet data into order objects
        const orders = data.values.map((row, index) => {
            // Parse items string (format: "Product (2x₹299) | Product2 (1x₹499)")
            const itemsStr = row[6] || '';
            const itemsArray = itemsStr.split('|').map(item => item.trim()).filter(item => item);

            return {
                id: row[0] || '',                    // Order ID
                date: row[1] || '',                  // Date
                customerName: row[2] || '',          // Customer Name
                phone: row[3] || '',                 // Phone
                email: row[4] || '',                 // Email
                address: row[5] || '',               // Address
                items: itemsStr,                     // Items string
                itemsArray: itemsArray,              // Items as array
                itemCount: itemsArray.length,        // Number of items
                total: parseFloat(row[7]) || 0,      // Total
                paymentMethod: row[8] || '',         // Payment Method
                paymentId: row[9] || '',             // Payment ID
                status: row[10] || 'Pending'         // Status
            };
        });

        console.log(`Loaded ${orders.length} orders from Google Sheets`);
        return orders;

    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showSuccessMessage(message) {
    const successMsg = document.getElementById('productSuccess');
    if (successMsg) {
        successMsg.textContent = '✅ ' + message;
        successMsg.style.display = 'block';
        setTimeout(() => successMsg.style.display = 'none', 5000);
    }
}

function showErrorMessage(message) {
    const successMsg = document.getElementById('productSuccess');
    if (successMsg) {
        successMsg.textContent = '❌ ' + message;
        successMsg.style.display = 'block';
        successMsg.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)';
        setTimeout(() => {
            successMsg.style.display = 'none';
            successMsg.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }, 5000);
    }
}

function showLoading(message) {
    // TODO: Implement global loading indicator
    console.log('Loading:', message);
}

function hideLoading() {
    // TODO: Hide global loading indicator
}

// ==========================================
// INIT ON PRODUCTS LOADED
// ==========================================

document.addEventListener('productsLoaded', function() {
    currentProducts = products;
    console.log('[Admin] Products loaded:', currentProducts.length);
});

console.log('[Admin Panel] Initialized');
