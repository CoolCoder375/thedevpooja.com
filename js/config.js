/**
 * Google Sheets API Configuration for DevPooja
 *
 * IMPORTANT: Replace the placeholder values with your actual credentials
 * See config.example.js for detailed setup instructions
 */

const SHEETS_CONFIG = {
    // Your Google API Key (for reading products)
    apiKey: 'AIzaSyDfsTaZyVzk2uu3sQeEPFhSca0Wk3adJKY',

    // Your Google Spreadsheet ID
    spreadsheetId: '1A4s3oVEamoZJxE-lDl9mDuT2iZhrQTueWu2VtrWwro8',

    // Data range (Sheet name and columns)
    range: 'Products!A2:H',

    // Apps Script Web App URL (for writing products from admin panel)
    // IMPORTANT: Deploy your Apps Script first, then paste the URL here
    // See docs/GOOGLE_SHEETS_APPS_SCRIPT.md for setup instructions
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbzMQfNcBsOgLp4N4BP1NO7VpzaOf_7Skiv1vzN6MoY-NscT4SI9Ahr7ys_4yDU3fhLh/exec'  // Example: 'https://script.google.com/macros/s/AKfycby.../exec'
};

// Razorpay Configuration
const RAZORPAY_CONFIG = {
    // Razorpay Key ID (public - safe to expose in frontend)
    // Get from: https://dashboard.razorpay.com/app/keys
    // Test Mode: rzp_test_xxxxx (for testing with test cards)
    // Live Mode: rzp_live_xxxxx (after KYC approval)
    keyId: '',  // Add your Razorpay Key ID here

    // Business information (displayed in Razorpay checkout modal)
    businessName: 'DevPooja',
    businessLogo: 'https://coolcoder375.github.io/devpooja/images/logo.png',
    businessDescription: 'Premium Pooja Items & Hindu Worship Essentials',

    // Theme color for checkout modal
    themeColor: '#F37254',

    // Currency
    currency: 'INR',

    // WhatsApp business number for order confirmation
    whatsappNumber: '919067615208',

    // Feature flags
    features: {
        enableRazorpay: true,  // Set to false to disable Razorpay temporarily
        enableWhatsAppCheckout: true,  // Keep WhatsApp option available
        enableCOD: false  // Cash on Delivery (future feature)
    }
};
