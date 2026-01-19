// DevPooja - Google Apps Script for Product Management
// This script enables the admin panel to add/edit/delete products in Google Sheets

// Configuration
const SHEET_NAME = 'Products';
const HEADER_ROW = 1;
const DATA_START_ROW = 2;

// Column mapping (must match your sheet structure)
const COLUMNS = {
  ID: 0,          // Column A
  NAME: 1,        // Column B
  CATEGORY: 2,    // Column C
  PRICE: 3,       // Column D
  IMAGE: 4,       // Column E
  DESCRIPTION: 5, // Column F
  FEATURES: 6,    // Column G
  QUANTITY: 7,    // Column H
  FEATURED: 8,    // Column I
  IMAGE2: 9,      // Column J (optional additional image)
  IMAGE3: 10,     // Column K (optional additional image)
  IMAGE4: 11,     // Column L (optional additional image)
  IMAGE5: 12      // Column M (optional additional image)
};

/**
 * Main entry point for POST requests from admin panel
 */
function doPost(e) {
  console.log('=== doPost STARTED ===');
  console.log('Time:', new Date().toISOString());

  try {
    // Parse request body
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    console.log('Action:', action);
    console.log('Has data?', requestData.data ? 'YES' : 'NO');

    // Route to appropriate handler
    let result;
    switch(action) {
      case 'add':
        console.log('→ Calling addProduct...');
        result = addProduct(requestData.data);
        break;
      case 'update':
        console.log('→ Calling updateProduct...');
        result = updateProduct(requestData.id, requestData.data);
        break;
      case 'delete':
        console.log('→ Calling deleteProduct...');
        result = deleteProduct(requestData.id);
        break;
      case 'addOrder':
        console.log('→ Calling addOrder...');
        result = addOrder(requestData.data);
        break;
      default:
        console.error('❌ Invalid action:', action);
        return createResponse(false, 'Invalid action: ' + action);
    }

    console.log('✅ doPost SUCCESS');
    return createResponse(true, result);

  } catch (error) {
    console.error('❌ doPost ERROR');
    console.error('Error:', error.toString());
    console.error('Stack:', error.stack);
    return createResponse(false, 'Error: ' + error.toString());
  }
}

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'DevPooja Product API is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Add a new product to the sheet
 */
function addProduct(productData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }

  // Generate new ID (timestamp)
  const newId = Date.now();

  // Prepare features string (pipe-separated)
  const featuresStr = Array.isArray(productData.features)
    ? productData.features.join('|')
    : productData.features || '';

  // Create new row
  const newRow = [
    newId,                           // ID
    productData.name,                // Name
    productData.category,            // Category
    productData.price,               // Price
    productData.image,               // Image URL
    productData.description,         // Description
    featuresStr,                     // Features
    productData.quantity || 0,       // Quantity
    productData.featured || false,   // Featured
    productData.image2 || '',        // Additional Image 2 (optional)
    productData.image3 || '',        // Additional Image 3 (optional)
    productData.image4 || '',        // Additional Image 4 (optional)
    productData.image5 || ''         // Additional Image 5 (optional)
  ];

  // Append row to sheet
  sheet.appendRow(newRow);

  Logger.log('Product added successfully - ID: ' + newId);

  return {
    message: 'Product added successfully',
    id: newId,
    product: productData
  };
}

/**
 * Update an existing product in the sheet
 */
function updateProduct(productId, productData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }

  // Find the row with matching ID
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  let rowIndex = -1;
  for (let i = DATA_START_ROW - 1; i < values.length; i++) {
    if (values[i][COLUMNS.ID].toString() === productId.toString()) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('Product not found with ID: ' + productId);
  }

  // Prepare features string
  const featuresStr = Array.isArray(productData.features)
    ? productData.features.join('|')
    : productData.features || '';

  // Update row (keep existing ID)
  const updatedRow = [
    productId,                       // Keep existing ID
    productData.name,                // Name
    productData.category,            // Category
    productData.price,               // Price
    productData.image,               // Image URL
    productData.description,         // Description
    featuresStr,                     // Features
    productData.quantity || 0,       // Quantity
    productData.featured || false,   // Featured
    productData.image2 || '',        // Additional Image 2 (optional)
    productData.image3 || '',        // Additional Image 3 (optional)
    productData.image4 || '',        // Additional Image 4 (optional)
    productData.image5 || ''         // Additional Image 5 (optional)
  ];

  // Write updated data to the row
  const range = sheet.getRange(rowIndex, 1, 1, updatedRow.length);
  range.setValues([updatedRow]);

  Logger.log('Product updated successfully - ID: ' + productId);

  return {
    message: 'Product updated successfully',
    id: productId,
    product: productData
  };
}

/**
 * Delete a product from the sheet
 */
function deleteProduct(productId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }

  // Find the row with matching ID
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  let rowIndex = -1;
  for (let i = DATA_START_ROW - 1; i < values.length; i++) {
    if (values[i][COLUMNS.ID].toString() === productId.toString()) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('Product not found with ID: ' + productId);
  }

  // Delete the row
  sheet.deleteRow(rowIndex);

  Logger.log('Product deleted successfully - ID: ' + productId);

  return {
    message: 'Product deleted successfully',
    id: productId
  };
}

/**
 * Create a standardized JSON response
 */
function createResponse(success, data) {
  const response = {
    success: success,
    timestamp: new Date().toISOString()
  };

  if (success) {
    response.data = data;
  } else {
    response.error = data;
  }

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - Run this to verify the script works
 */
function testAddProduct() {
  const testProduct = {
    name: 'Test Product',
    category: 'incense',
    price: 299,
    quantity: 50,
    image: 'https://via.placeholder.com/150',
    description: 'This is a test product',
    features: ['Feature 1', 'Feature 2', 'Feature 3']
  };

  const result = addProduct(testProduct);
  Logger.log(result);
}

/**
 * Test function - Clear cache on all clients
 */
function notifyClientsToRefresh() {
  // This is a placeholder - actual implementation would use
  // Cloud Messaging or WebSocket for real-time updates
  Logger.log('Products updated - clients should refresh cache');
}

/**
 * Reduce product quantity after order is placed
 */
function reduceProductQuantity(productId, quantityToReduce) {
  console.log(`Reducing quantity for product ${productId} by ${quantityToReduce}`);

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }

  // Find the product row
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  let rowIndex = -1;
  let currentQuantity = 0;

  for (let i = DATA_START_ROW - 1; i < values.length; i++) {
    if (values[i][COLUMNS.ID].toString() === productId.toString()) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      currentQuantity = parseInt(values[i][COLUMNS.QUANTITY]) || 0;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('Product not found with ID: ' + productId);
  }

  // Check if sufficient quantity available
  if (currentQuantity < quantityToReduce) {
    throw new Error(`Insufficient stock for product ID ${productId}. Available: ${currentQuantity}, Requested: ${quantityToReduce}`);
  }

  // Calculate new quantity
  const newQuantity = currentQuantity - quantityToReduce;

  // Update the quantity in the sheet
  const quantityCell = sheet.getRange(rowIndex, COLUMNS.QUANTITY + 1); // +1 because columns are 1-indexed
  quantityCell.setValue(newQuantity);

  console.log(`✅ Product ${productId} quantity reduced: ${currentQuantity} → ${newQuantity}`);

  return {
    productId: productId,
    oldQuantity: currentQuantity,
    newQuantity: newQuantity,
    reduced: quantityToReduce
  };
}

/**
 * Check if all items in order have sufficient quantity
 */
function validateOrderQuantities(items) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found');
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  const insufficientItems = [];

  // Check each item in the order
  for (const item of items) {
    // Find product in sheet
    for (let i = DATA_START_ROW - 1; i < values.length; i++) {
      if (values[i][COLUMNS.ID].toString() === item.id.toString()) {
        const availableQty = parseInt(values[i][COLUMNS.QUANTITY]) || 0;
        const requestedQty = item.quantity;

        if (availableQty < requestedQty) {
          insufficientItems.push({
            id: item.id,
            name: item.name,
            available: availableQty,
            requested: requestedQty
          });
        }
        break;
      }
    }
  }

  return insufficientItems;
}

/**
 * Add a new order to the Orders sheet (Enhanced with detailed logging)
 */
function addOrder(orderData) {
  console.log('=== addOrder START ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Order ID:', orderData.orderId);
  console.log('Customer:', orderData.customer.name);

  try {
    // STEP 1: Validate quantities before creating order
    console.log('Validating product quantities...');
    const insufficientItems = validateOrderQuantities(orderData.items);

    if (insufficientItems.length > 0) {
      const errorMsg = insufficientItems.map(item =>
        `${item.name}: Available ${item.available}, Requested ${item.requested}`
      ).join('; ');
      throw new Error('Insufficient stock: ' + errorMsg);
    }
    console.log('✅ All items have sufficient quantity');

    // STEP 2: Reduce product quantities
    console.log('Reducing product quantities...');
    const quantityReductions = [];

    for (const item of orderData.items) {
      const reduction = reduceProductQuantity(item.id, item.quantity);
      quantityReductions.push(reduction);
    }
    console.log('✅ All quantities reduced successfully');

    // STEP 3: Add order to Orders sheet
    // Use hardcoded spreadsheet ID to ensure correct sheet
    const ss = SpreadsheetApp.openById('1A4s3oVEamoZJxE-lDl9mDuT2iZhrQTueWu2VtrWwro8');
    console.log('✅ Spreadsheet opened:', ss.getName());

    let sheet = ss.getSheetByName('Orders');
    console.log('Orders sheet exists?', sheet !== null);

    // Create Orders sheet if it doesn't exist
    if (!sheet) {
      console.log('Creating new Orders sheet...');
      sheet = ss.insertSheet('Orders');

      // Add headers
      sheet.appendRow([
        'Order ID',
        'Date',
        'Customer Name',
        'Phone',
        'Email',
        'Address',
        'Items',
        'Total',
        'Payment Method',
        'Payment ID',
        'Status'
      ]);
      console.log('✅ Headers added to Orders sheet');
    }

    // Prepare order items string
    console.log('Processing', orderData.items.length, 'items...');
    const itemsStr = orderData.items.map(item =>
      `${item.name} (${item.quantity}x₹${item.price})`
    ).join(' | ');
    console.log('Items string:', itemsStr);

    // Create new row
    const newRow = [
      orderData.orderId,
      new Date(orderData.timestamp),
      orderData.customer.name,
      orderData.customer.phone,
      orderData.customer.email || '',
      orderData.deliveryAddress,
      itemsStr,
      orderData.total,
      orderData.paymentMethod,
      orderData.paymentId || '',
      orderData.status
    ];
    console.log('Row prepared with', newRow.length, 'columns');

    // Append row to sheet
    console.log('Appending row to sheet...');
    sheet.appendRow(newRow);
    console.log('✅ Row appended successfully!');

    // Verify row was added
    const lastRow = sheet.getLastRow();
    console.log('Sheet now has', lastRow, 'rows (including header)');

    console.log('=== addOrder SUCCESS ===');

    return {
      message: 'Order added successfully',
      orderId: orderData.orderId,
      rowNumber: lastRow,
      quantityReductions: quantityReductions
    };

  } catch (error) {
    console.error('=== addOrder ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to be caught by doPost
  }
}
