/**
 * Template reconciliation script for new clients.
 * Customize this script based on client-specific requirements.
 */

/**
 * Compare and process Excel files to analyze payment data.
 * @param {Object} XLSX - The SheetJS library object
 * @param {ArrayBuffer} file1 - The first uploaded Excel file data
 * @param {ArrayBuffer} file2 - The second uploaded Excel file data
 * @returns {Array} An array of arrays representing the processed data
 */
function compareAndDisplayData(XLSX, file1, file2) {
    // SECTION 1: CONFIGURATION
    // Modify these settings based on client requirements
    const CONFIG = {
        // Column definitions for the first file
        file1Columns: [
            "Date",
            "Customer Name",
            "Total Transaction Amount",
            "Cash Discounting Amount",
            "Card Brand",
            // Add more columns as needed
        ],
        
        // Column definitions for the second file
        file2Columns: {
            date: "Date Closed",
            name: "Name",
            amount: "Amount",
            // Add more columns as needed
        },
        
        // Card brand mappings (customize based on client's naming conventions)
        cardBrands: [
            "Visa",
            "Mastercard",
            "American Express",
            "Discover",
            // Add more card brands as needed
        ],
        
        // Date format for display (customize as needed)
        dateFormat: "MM/DD/YYYY",
        
        // Number formatting options
        numberFormat: {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }
    };

    // SECTION 2: HELPER FUNCTIONS
    function formatDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        // Customize date formatting as needed
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    }

    function formatNumber(num) {
        num = parseFloat(num);
        return Number.isInteger(num) ? num.toString() : num.toFixed(CONFIG.numberFormat.maximumFractionDigits);
    }

    function cleanCardBrand(brand) {
        // Customize card brand cleaning logic
        return brand.replace('Credit ', '').trim();
    }

    // SECTION 3: PROCESS FIRST FILE
    const workbook1 = XLSX.read(file1, { cellDates: true });
    const worksheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
    const jsonData1 = XLSX.utils.sheet_to_json(worksheet1);

    // SECTION 4: PROCESS SECOND FILE
    const workbook2 = file2 ? XLSX.read(file2, { cellDates: true }) : null;
    const jsonData2 = workbook2 ? 
        XLSX.utils.sheet_to_json(workbook2.Sheets[workbook2.SheetNames[0]]) : 
        [];

    // SECTION 5: CREATE RESULTS ARRAY
    const results = [CONFIG.file1Columns]; // Headers

    // Process transactions
    jsonData1.forEach(row => {
        const processedRow = [
            formatDate(row[CONFIG.file1Columns[0]]),
            row[CONFIG.file1Columns[1]],
            formatNumber(row[CONFIG.file1Columns[2]]),
            formatNumber(row[CONFIG.file1Columns[3]]),
            cleanCardBrand(row[CONFIG.file1Columns[4]]),
            // Add more columns as needed
        ];
        results.push(processedRow);
    });

    // SECTION 6: COMPARISON SECTION
    results.push([]); // Blank row separator
    results.push(["Card Brand", "Hub Report", "Sales Report", "Difference"]);

    // Process card brand totals
    const hubTotals = {};
    const salesTotals = {};

    // Calculate totals from first file
    jsonData1.forEach(row => {
        const cardBrand = cleanCardBrand(row[CONFIG.file1Columns[4]]);
        const amount = parseFloat(row[CONFIG.file1Columns[2]]) || 0;
        hubTotals[cardBrand] = (hubTotals[cardBrand] || 0) + amount;
    });

    // Calculate totals from second file
    if (file2) {
        jsonData2.forEach(row => {
            const cardBrand = row[CONFIG.file2Columns.name];
            const amount = parseFloat(row[CONFIG.file2Columns.amount]) || 0;
            salesTotals[cardBrand] = (salesTotals[cardBrand] || 0) + amount;
        });
    }

    // Add comparison rows
    CONFIG.cardBrands.forEach(brand => {
        const hubTotal = Math.round(hubTotals[brand] || 0);
        const salesTotal = Math.round(salesTotals[brand] || 0);
        const difference = hubTotal - salesTotal;
        
        results.push([
            brand,
            hubTotal,
            salesTotal,
            difference
        ]);
    });

    return results;
}

module.exports = compareAndDisplayData; 