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
    range: 'Products!A2:M',

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
    
    // keyId: 'rzp_test_S3gfDCKXmD4STn',  // Added Test Key
    keyId: 'rzp_live_SA8ii30C3BvBK8',  // Added Live Key

    // Business information (displayed in Razorpay checkout modal)
    businessName: 'DevPooja',
    businessLogo: 'https://coolcoder375.github.io/devpooja/images/logo.png',
    businessDescription: 'Premium Pooja Items & Hindu Worship Essentials',

    // Theme color for checkout modal
    themeColor: '#F37254',

    // Currency
    currency: 'INR',

    // WhatsApp business number for order confirmation
    whatsappNumber: '917057307300',

    // Feature flags
    features: {
        enableRazorpay: true,  // Set to false to disable Razorpay temporarily
        enableWhatsAppCheckout: true,  // Keep WhatsApp option available
        enableCOD: false  // Cash on Delivery (future feature)
    }
};

// Google Analytics 4 Configuration
const GA4_CONFIG = {
    // Your GA4 Measurement ID
    // Get this from: Google Analytics → Admin → Data Streams → Web → Measurement ID
    measurementId: 'G-P8H3YN9D8F',  // Replace with your actual Measurement ID

    // Enable/disable analytics
    enabled: true,

    // Debug mode (shows events in console)
    debug: false
};

// Google OAuth Configuration for Admin Panel
const ADMIN_AUTH_CONFIG = {
    // Google OAuth Client ID
    // Get from: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
    // IMPORTANT: Add your domain to "Authorized JavaScript origins"
    clientId: '655717427904-q86n5m4s5q4ghc6si7n4arf9267ebcdo.apps.googleusercontent.com',  // Replace with your Client ID

    // Allowed email addresses (only these can access admin panel)
    allowedEmails: [
        'atharva.deshpande.375@gmail.com',
        'thedevpooja@gmail.com'
    ]
};