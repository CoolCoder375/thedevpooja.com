// Global product state
let products = [];
let categories = {};

// Cache configuration
const CACHE_KEY = 'devpooja_products_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// ==========================================
// CACHE FUNCTIONS
// ==========================================

/**
 * Check if cached data is still valid (less than 5 minutes old)
 * @returns {boolean} True if cache is valid, false otherwise
 */
function isCacheValid() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    try {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        return age < CACHE_DURATION;
    } catch (error) {
        console.warn('[DevPooja Products] Invalid cache data, clearing:', error);
        localStorage.removeItem(CACHE_KEY);
        return false;
    }
}

/**
 * Get cached product data from localStorage
 * @returns {Object|null} Cached data object or null if not available
 */
function getCachedData() {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
        return JSON.parse(cached);
    } catch (error) {
        console.warn('[DevPooja Products] Failed to parse cache:', error);
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

/**
 * Save product data to localStorage cache
 * @param {Array} productsData - Array of product objects
 * @param {Object} categoriesData - Categories object
 * @param {string} source - Source of data ('sheets' or 'json')
 */
function setCachedData(productsData, categoriesData, source) {
    const cacheData = {
        timestamp: Date.now(),
        products: productsData,
        categories: categoriesData,
        source: source
    };

    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('[DevPooja Products] Failed to cache data:', error);
    }
}

// ==========================================
// GOOGLE SHEETS API FUNCTIONS
// ==========================================

/**
 * Extract categories mapping from products array
 * @param {Array} productsData - Array of product objects
 * @returns {Object} Categories mapping object
 */
function extractCategories(productsData) {
    const categoriesMap = {};

    // Default category display names
    const categoryDisplayNames = {
        'incense': 'Incense & Dhoop',
        'garlands': 'Garlands & Flowers',
        'idols': 'Idols & Statues',
        'diyas': 'Diyas & Lamps',
        'pooja-items': 'Pooja Items',
        'coconuts': 'Coconuts & Fruits'
    };

    // Extract unique categories from products
    productsData.forEach(product => {
        const cat = product.category;
        if (cat && !categoriesMap[cat]) {
            categoriesMap[cat] = categoryDisplayNames[cat] || cat;
        }
    });

    return categoriesMap;
}

/**
 * Parse Google Sheets API response data into product objects
 * @param {Object} response - Response from Google Sheets API
 * @returns {Array} Array of product objects
 */
function parseSheetData(response) {
    const headers = ['id', 'name', 'category', 'price', 'image', 'description', 'features', 'quantity'];

    return response.values.map((row, index) => {
        const product = {};

        headers.forEach((header, colIndex) => {
            let value = row[colIndex];

            // Handle missing cells
            if (value === undefined || value === null || value === '') {
                switch (header) {
                    case 'id':
                        value = index + 1; // Auto-generate ID
                        break;
                    case 'features':
                        value = '';
                        break;
                    case 'quantity':
                        value = 0;
                        break;
                    case 'price':
                        value = 0;
                        break;
                    default:
                        value = '';
                }
            }

            // Type conversions
            if (header === 'id') {
                product[header] = parseInt(value) || (index + 1);
            } else if (header === 'quantity') {
                product[header] = parseInt(value) || 0;
            } else if (header === 'price') {
                product[header] = parseFloat(value) || 0;
            } else if (header === 'features') {
                // Parse pipe-separated features
                product[header] = String(value)
                    .split('|')
                    .map(f => f.trim())
                    .filter(f => f.length > 0);
            } else {
                product[header] = String(value).trim();
            }
        });

        return product;
    });
}

/**
 * Fetch product data from Google Sheets API
 * @returns {Promise<Object>} Promise resolving to {products, categories}
 * @throws {Error} If API call fails or data is invalid
 */
async function fetchFromSheets() {
    // Validate configuration exists
    if (typeof SHEETS_CONFIG === 'undefined') {
        throw new Error('SHEETS_CONFIG is not defined. Please create js/config.js');
    }

    const { apiKey, spreadsheetId, range } = SHEETS_CONFIG;

    // Validate required fields
    if (!apiKey || apiKey.includes('YOUR_') || !spreadsheetId || spreadsheetId.includes('YOUR_')) {
        throw new Error('Google Sheets configuration incomplete. Please update js/config.js with your API key and Spreadsheet ID');
    }

    // Construct API URL
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

    // Fetch with timeout (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors'
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 403) {
                throw new Error('API key invalid or Sheets API not enabled');
            } else if (response.status === 404) {
                throw new Error('Spreadsheet not found or not publicly accessible');
            } else if (response.status === 429) {
                throw new Error('API quota exceeded, please try again later');
            } else {
                throw new Error(`Sheets API error: ${response.status} ${response.statusText}`);
            }
        }

        const data = await response.json();

        // Validate response structure
        if (!data.values || !Array.isArray(data.values)) {
            throw new Error('Invalid response format from Sheets API');
        }

        if (data.values.length === 0) {
            throw new Error('Spreadsheet is empty');
        }

        // Parse the sheet data
        const productsData = parseSheetData(data);

        // Extract categories from products
        const categoriesData = extractCategories(productsData);

        return { products: productsData, categories: categoriesData };

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Request timeout - Google Sheets API took too long to respond');
        }

        throw error;
    }
}

// ==========================================
// JSON FALLBACK FUNCTIONS
// ==========================================

/**
 * Fetch product data from local JSON file (fallback)
 * @returns {Promise<Object>} Promise resolving to {products, categories}
 * @throws {Error} If JSON file cannot be loaded
 */
async function fetchFromJSON() {
    // Determine correct path based on current page location
    const isInSubfolder = window.location.pathname.includes('/pages/');
    const dataPath = isInSubfolder ? '../data/products.json' : './data/products.json';

    const response = await fetch(dataPath);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// ==========================================
// MAIN LOAD FUNCTION
// ==========================================

/**
 * Load product data from cache, Google Sheets, or JSON fallback
 * Dispatches 'productsLoaded' event when complete
 * @returns {Promise<Object|null>} Product data or null on failure
 */
async function loadProductData() {
    try {
        // Step 1: Check cache validity
        if (isCacheValid()) {
            const cached = getCachedData();
            products = cached.products;
            categories = cached.categories;
            const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000);
            console.info(`[DevPooja Products] Loaded from ${cached.source} cache (age: ${cacheAge}s)`);
            document.dispatchEvent(new CustomEvent('productsLoaded'));
            return { products, categories };
        }

        console.info('[DevPooja Products] Cache expired or missing, fetching fresh data...');

        // Step 2: Try Google Sheets API
        try {
            const data = await fetchFromSheets();
            products = data.products;
            categories = data.categories;

            // Cache the successful result
            setCachedData(products, categories, 'sheets');

            console.info(`[DevPooja Products] Successfully loaded ${products.length} products from Google Sheets`);
            document.dispatchEvent(new CustomEvent('productsLoaded'));
            return data;

        } catch (sheetsError) {
            console.warn('[DevPooja Products] Google Sheets API failed:', sheetsError.message);
            console.info('[DevPooja Products] Falling back to static JSON file...');

            // Step 3: Fallback to static JSON
            try {
                const data = await fetchFromJSON();
                products = data.products;
                categories = data.categories;

                // Cache the fallback data
                setCachedData(products, categories, 'json');

                console.info(`[DevPooja Products] Successfully loaded ${products.length} products from JSON fallback`);
                document.dispatchEvent(new CustomEvent('productsLoaded'));
                return data;

            } catch (jsonError) {
                console.error('[DevPooja Products] All data sources failed!', jsonError);

                // Step 4: Ultimate fallback - empty state
                products = [];
                categories = {};

                // Still dispatch event so UI doesn't hang
                document.dispatchEvent(new CustomEvent('productsLoaded'));
                return null;
            }
        }

    } catch (error) {
        console.error('[DevPooja Products] Unexpected error in loadProductData:', error);
        products = [];
        categories = {};
        document.dispatchEvent(new CustomEvent('productsLoaded'));
        return null;
    }
}

// ==========================================
// HELPER FUNCTIONS (Preserved for backward compatibility)
// ==========================================

/**
 * Get products filtered by category
 * @param {string} category - Category key to filter by
 * @returns {Array} Filtered array of products
 */
function getProductsByCategory(category) {
    return products.filter(product => product.category === category);
}

/**
 * Get a single product by ID
 * @param {number|string} id - Product ID
 * @returns {Object|undefined} Product object or undefined if not found
 */
function getProductById(id) {
    return products.find(product => product.id === parseInt(id));
}

/**
 * Render a product card HTML (for Swiper carousel)
 * @param {Object} product - Product object
 * @returns {string} HTML string for product card
 */
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

// ==========================================
// INITIALIZATION
// ==========================================

// Auto-load products when script executes
loadProductData();
