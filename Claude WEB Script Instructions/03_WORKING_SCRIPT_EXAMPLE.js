// ===================================================================
// WORKING SCRIPT EXAMPLE - Card Brand Reconciliation
// ===================================================================
// This script demonstrates the correct pattern for GR Balance scripts
// Copy this structure for all new scripts

(async () => {
  try {
    // ===================================================================
    // STEP 1: GET DATA FROM UPLOADED FILES
    // ===================================================================
    console.log('🔄 Starting script execution...');
    
    const { data1, data2 } = await window.parseFiles();
    
    if (!data1 || data1.length === 0) {
      window.showError('Primary dataset is empty or invalid');
      return;
    }
    
    console.log(`📊 Loaded ${data1.length} rows from primary file`);
    console.log(`📊 Loaded ${data2?.length || 0} rows from secondary file`);

    // ===================================================================
    // STEP 2: FIND REQUIRED COLUMNS (Smart Column Matching)
    // ===================================================================
    
    // Find card brand column in file 1
    const cardBrandColumn1 = window.findColumn(data1[0], [
      'Card Brand',
      'Card Type', 
      'Payment Method',
      'card_brand',
      'CardBrand',
      'CARD_BRAND'
    ]);
    
    if (!cardBrandColumn1) {
      window.showError('Could not find card brand column in primary file. Expected columns: Card Brand, Card Type, or Payment Method');
      return;
    }
    
    // Find amount column in file 1
    const amountColumn1 = window.findColumn(data1[0], [
      'Amount',
      'Transaction Amount',
      'Total',
      'amount',
      'transaction_amount'
    ]);
    
    console.log(`✅ Found columns - Card Brand: "${cardBrandColumn1}", Amount: "${amountColumn1}"`);

    // ===================================================================
    // STEP 3: PROCESS DATA (Your Business Logic Here)
    // ===================================================================
    
    // Group transactions by card brand
    const cardBrandSummary = {};
    
    data1.forEach((row, index) => {
      try {
        const cardBrand = row[cardBrandColumn1];
        const amount = parseFloat(row[amountColumn1]) || 0;
        
        if (!cardBrand) {
          console.warn(`Row ${index + 1}: Missing card brand`);
          return;
        }
        
        if (!cardBrandSummary[cardBrand]) {
          cardBrandSummary[cardBrand] = {
            count: 0,
            totalAmount: 0
          };
        }
        
        cardBrandSummary[cardBrand].count++;
        cardBrandSummary[cardBrand].totalAmount += amount;
        
      } catch (error) {
        console.warn(`Error processing row ${index + 1}:`, error);
      }
    });

    // ===================================================================
    // STEP 4: FORMAT RESULTS FOR DISPLAY
    // ===================================================================
    
    const results = [];
    
    Object.entries(cardBrandSummary).forEach(([cardBrand, summary]) => {
      results.push({
        "Card Brand": cardBrand,                                    // Clear header
        "Transaction Count": summary.count,                         // Descriptive
        "Total Amount": `$${summary.totalAmount.toFixed(2)}`,      // Formatted currency
        "Average Amount": `$${(summary.totalAmount / summary.count).toFixed(2)}`,
        "Percentage": `${((summary.count / data1.length) * 100).toFixed(1)}%`
      });
    });
    
    // Sort by transaction count (highest first)
    results.sort((a, b) => b["Transaction Count"] - a["Transaction Count"]);

    // ===================================================================
    // STEP 5: DISPLAY RESULTS
    // ===================================================================
    
    if (results.length === 0) {
      window.showError('No valid transactions found to analyze');
      return;
    }
    
    console.log(`✅ Analysis complete. Found ${results.length} unique card brands`);
    console.log('📊 Displaying results in table...');
    
    // This displays the results in the client portal table
    window.showResults(results);
    
  } catch (error) {
    // ===================================================================
    // ERROR HANDLING
    // ===================================================================
    console.error('❌ Script execution error:', error);
    window.showError(`Script error: ${error.message}`);
  }
})();

// ===================================================================
// EXPECTED OUTPUT EXAMPLE:
// ===================================================================
/*
Table will show:
┌──────────────────┬──────────────────┬──────────────┬──────────────┬──────────────┐
│ Card Brand       │ Transaction Count│ Total Amount │ Average Amount│ Percentage   │
├──────────────────┼──────────────────┼──────────────┼──────────────┼──────────────┤
│ Visa             │ 125              │ $15,750.50   │ $126.00      │ 45.5%        │
│ Mastercard       │ 89               │ $11,200.25   │ $125.84      │ 32.4%        │
│ American Express │ 45               │ $8,950.75    │ $198.91      │ 16.4%        │
│ Discover         │ 16               │ $2,100.00    │ $131.25      │ 5.8%         │
└──────────────────┴──────────────────┴──────────────┴──────────────┴──────────────┘
*/

// ===================================================================
// KEY SUCCESS PATTERNS:
// ===================================================================
// 1. ✅ Always wrap in async IIFE: (async () => { ... })()
// 2. ✅ Always use try/catch for error handling  
// 3. ✅ Always check if data exists before processing
// 4. ✅ Use window.findColumn() for flexible column matching
// 5. ✅ Use descriptive column names in results
// 6. ✅ Format numbers/currency for readability
// 7. ✅ Add console.log() for debugging
// 8. ✅ Handle edge cases (missing data, invalid formats)
// 9. ✅ Sort results logically (by count, amount, etc.)
// 10. ✅ Always call window.showResults() at the end