/**
 * Google Sheets API Configuration Template for DevPooja
 *
 * SETUP INSTRUCTIONS:
 * ====================
 * 1. Copy this file and rename it to 'config.js' in the same directory (js/)
 * 2. Replace the placeholder values below with your actual credentials
 * 3. Save the file
 * 4. DO NOT commit config.js to version control (it's in .gitignore)
 *
 * HOW TO GET YOUR CREDENTIALS:
 * =============================
 *
 * STEP 1: Get Google API Key
 * ---------------------------
 * 1. Go to Google Cloud Console: https://console.cloud.google.com
 * 2. Create a new project or select an existing one
 * 3. Enable the Google Sheets API:
 *    - Navigate to "APIs & Services" > "Library"
 *    - Search for "Google Sheets API"
 *    - Click "Enable"
 * 4. Create API credentials:
 *    - Go to "APIs & Services" > "Credentials"
 *    - Click "Create Credentials" > "API Key"
 *    - Copy the generated API key
 * 5. IMPORTANT - Restrict your API key for security:
 *    - Click on the key to edit it
 *    - Under "API restrictions", select "Restrict key"
 *    - Select only "Google Sheets API"
 *    - Under "Application restrictions", add your website domain
 *    - Save restrictions
 *
 * STEP 2: Get Spreadsheet ID
 * ---------------------------
 * 1. Open your Google Sheet or use the template provided
 * 2. Look at the URL in your browser:
 *    https://docs.google.com/spreadsheets/d/1ABC...XYZ123/edit
 *                                          ^^^^^^^^^^^
 *                                          This is your Spreadsheet ID
 * 3. Copy the ID (the long string between /d/ and /edit)
 * 4. IMPORTANT - Make sure your sheet is shared:
 *    - Click "Share" button
 *    - Under "General access", select "Anyone with the link"
 *    - Permission: "Viewer"
 *    - This allows the website to read the data
 *
 * SECURITY NOTE:
 * ===============
 * - This API key will be visible in client-side code
 * - It's safe for read-only public data with proper restrictions
 * - ALWAYS restrict the key to Sheets API only
 * - NEVER commit config.js to public repositories
 * - The template config.example.js is safe to commit
 */

const SHEETS_CONFIG = {
    // Your Google API Key from Google Cloud Console
    // Example: 'AIzaSyBk7..._your_actual_key_here'
    apiKey: 'YOUR_GOOGLE_API_KEY_HERE',

    // Your Google Spreadsheet ID (from the URL)
    // Example: '1ABCdefGHI...xyz123'
    spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',

    // Data range to fetch (Sheet name and cell range)
    // A2:H means columns A through H, starting from row 2 (skipping header)
    // Usually you don't need to change this unless you reorganize the sheet
    range: 'Products!A2:H',

    // Optional: Separate categories sheet
    // Uncomment if you create a dedicated Categories sheet
    // categoriesRange: 'Categories!A2:B'
};
