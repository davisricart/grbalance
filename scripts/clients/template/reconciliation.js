/**
 * Template reconciliation logic
 * Customize this file for each client's specific needs
 */

import config from '../../../config/template.json';

/**
 * Compare and process Excel files to analyze payment data
 * @param {Object} XLSX - The SheetJS library object
 * @param {ArrayBuffer} hubReport - The hub report Excel file data
 * @param {ArrayBuffer} salesReport - The sales report Excel file data
 * @returns {Array} Processed comparison data
 */
function compareAndDisplayData(XLSX, hubReport, salesReport) {
    // Helper function to format date for comparison
    function formatDateForComparison(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        const { dateFormat } = config.reconciliation;
        // Format according to client config
        return date.toISOString().split('T')[0]; // Default YYYY-MM-DD
    }

    // Helper function to normalize card brand names
    function normalizeCardBrand(brand) {
        if (!brand) return '';
        brand = brand.trim().toUpperCase();
        
        const { mappings } = config.reconciliation.cardBrands;
        for (const [standardBrand, variations] of Object.entries(mappings)) {
            if (variations.some(v => brand.includes(v.toUpperCase()))) {
                return standardBrand;
            }
        }
        return brand;
    }

    // Helper function to format amounts
    function formatAmount(amount) {
        const { decimalPlaces } = config.reconciliation.amountFormat;
        return typeof amount === 'number' ? amount.toFixed(decimalPlaces) : '0.00';
    }

    // Process Hub Report
    const hubWorkbook = XLSX.read(hubReport, { cellDates: true });
    const hubSheet = hubWorkbook.Sheets[hubWorkbook.SheetNames[0]];
    const hubData = XLSX.utils.sheet_to_json(hubSheet);

    // Process Sales Report
    const salesWorkbook = XLSX.read(salesReport, { cellDates: true });
    const salesSheet = salesWorkbook.Sheets[salesWorkbook.SheetNames[0]];
    const salesData = XLSX.utils.sheet_to_json(salesSheet);

    // Map column names from config
    const { hubReport: hubColumns, salesReport: salesColumns } = config.reconciliation;

    // Process transactions
    const transactions = hubData.map(row => ({
        date: formatDateForComparison(row[hubColumns.dateColumn]),
        customerName: row[hubColumns.customerNameColumn],
        amount: parseFloat(row[hubColumns.amountColumn]) || 0,
        fee: parseFloat(row[hubColumns.feeColumn]) || 0,
        cardBrand: normalizeCardBrand(row[hubColumns.cardBrandColumn])
    }));

    // Calculate totals by card brand
    const totals = {};
    const salesTotals = {};

    // Initialize totals for all configured card brands
    Object.keys(config.reconciliation.cardBrands.mappings).forEach(brand => {
        totals[brand] = 0;
        salesTotals[brand] = 0;
    });

    // Calculate Hub Report totals
    transactions.forEach(transaction => {
        if (totals.hasOwnProperty(transaction.cardBrand)) {
            totals[transaction.cardBrand] += transaction.amount;
        }
    });

    // Calculate Sales Report totals
    salesData.forEach(row => {
        const cardBrand = normalizeCardBrand(row[salesColumns.cardBrandColumn]);
        const amount = parseFloat(row[salesColumns.amountColumn]) || 0;
        if (salesTotals.hasOwnProperty(cardBrand)) {
            salesTotals[cardBrand] += amount;
        }
    });

    // Prepare results
    const results = [
        // Headers
        ['Date', 'Customer Name', 'Amount', 'Fee', 'Card Brand', 'Net Amount'],
        
        // Transaction details
        ...transactions.map(t => [
            t.date,
            t.customerName,
            formatAmount(t.amount),
            formatAmount(t.fee),
            t.cardBrand,
            formatAmount(t.amount - t.fee)
        ]),

        // Empty row as separator
        [],

        // Comparison section header
        ['Card Brand', 'Hub Report', 'Sales Report', 'Difference'],

        // Comparison rows
        ...Object.entries(totals).map(([brand, hubTotal]) => [
            brand,
            formatAmount(hubTotal),
            formatAmount(salesTotals[brand]),
            formatAmount(hubTotal - salesTotals[brand])
        ]),

        // Total row
        [
            'Total',
            formatAmount(Object.values(totals).reduce((sum, val) => sum + val, 0)),
            formatAmount(Object.values(salesTotals).reduce((sum, val) => sum + val, 0)),
            formatAmount(
                Object.values(totals).reduce((sum, val) => sum + val, 0) -
                Object.values(salesTotals).reduce((sum, val) => sum + val, 0)
            )
        ]
    ];

    return results;
}

export { compareAndDisplayData }; 