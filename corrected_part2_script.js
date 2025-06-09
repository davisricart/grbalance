// Script Name: Date and Column Processing Script with Top 5 Transactions  
// Enhanced version that uses window.addAdditionalTable API

(async function() {
  try {
    console.log('🚀 Starting Date and Column Processing Script...');
    
    // Get data using GR Balance system
    const files = await window.parseFiles();
    if (!files) {
      window.showError('Failed to parse files. Please check that files are uploaded correctly.');
      return;
    }
    
    const data1 = files.data1;
    
    // Validate required data
    if (!data1 || data1.length === 0) {
      window.showError('File 1 is required and must contain data');
      return;
    }
    
    // Debug logging
    console.log('📊 File 1 columns:', Object.keys(data1[0] || {}));
    console.log('📊 Total rows:', data1.length);
    
    // Find required columns using flexible matching
    const dateColumn = window.findColumn(data1[0], ['Date', 'date', 'DATE', 'Transaction Date']);
    const customerColumn = window.findColumn(data1[0], ['Customer Name', 'customer_name', 'CUSTOMER_NAME', 'Customer']);
    const totalAmountColumn = window.findColumn(data1[0], ['Total Transaction Amount', 'total_transaction_amount', 'TOTAL_TRANSACTION_AMOUNT', 'Total Amount', 'Amount']);
    const cashDiscountColumn = window.findColumn(data1[0], ['Cash Discounting Amount', 'cash_discounting_amount', 'CASH_DISCOUNTING_AMOUNT', 'Cash Discount', 'Discount']);
    const cardBrandColumn = window.findColumn(data1[0], ['Card Brand', 'card_brand', 'CARD_BRAND', 'Brand']);
    
    // Validate required columns
    const missingColumns = [];
    if (!dateColumn) missingColumns.push('Date');
    if (!customerColumn) missingColumns.push('Customer Name');
    if (!totalAmountColumn) missingColumns.push('Total Transaction Amount');
    if (!cashDiscountColumn) missingColumns.push('Cash Discounting Amount');
    if (!cardBrandColumn) missingColumns.push('Card Brand');
    
    if (missingColumns.length > 0) {
      window.showError(`Missing required columns: ${missingColumns.join(', ')}. Available columns: ${Object.keys(data1[0]).join(', ')}`);
      return;
    }
    
    console.log('✅ All required columns found');
    
    // Helper function to convert Excel serial date to readable format
    function convertExcelDate(excelDate) {
      if (typeof excelDate === 'number') {
        const excelEpoch = new Date(1900, 0, 1);
        const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * 24 * 60 * 60 * 1000);
        return jsDate.toLocaleDateString('en-US');
      } else if (typeof excelDate === 'string') {
        const spaceIndex = excelDate.indexOf(' ');
        if (spaceIndex !== -1) {
          return excelDate.substring(0, spaceIndex);
        }
        return excelDate;
      }
      return excelDate;
    }

    // Process the data
    const processedData = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < data1.length; i++) {
      const row = data1[i];
      
      let dateValue = row[dateColumn];
      if (dateValue !== null && dateValue !== undefined && dateValue !== '') {
        dateValue = convertExcelDate(dateValue);
      }
      
      if (dateValue && dateValue.toString().trim() !== '') {
        const totalAmount = parseFloat(row[totalAmountColumn]) || 0;
        const cashDiscount = parseFloat(row[cashDiscountColumn]) || 0;
        const totals = totalAmount - cashDiscount;
        
        const processedRow = {
          'Date': dateValue,
          'Customer Name': row[customerColumn] || '',
          'Total Transaction Amount': totalAmount,
          'Cash Discounting Amount': cashDiscount,
          'Card Brand': row[cardBrandColumn] || '',
          'Totals': totals
        };
        
        processedData.push(processedRow);
        processedCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`📊 Processing complete: ${processedCount} rows processed, ${skippedCount} rows skipped (no date)`);
    
    if (processedData.length === 0) {
      window.showError('No valid data rows found. Make sure the Date column contains values.');
      return;
    }
    
    // Calculate summary statistics
    const totalTransactionSum = processedData.reduce((sum, row) => sum + row['Total Transaction Amount'], 0);
    const totalCashDiscountSum = processedData.reduce((sum, row) => sum + row['Cash Discounting Amount'], 0);
    const totalCalculatedSum = processedData.reduce((sum, row) => sum + row['Totals'], 0);
    
    // Create top 5 transactions table
    const top5Transactions = [...processedData]
      .sort((a, b) => b['Total Transaction Amount'] - a['Total Transaction Amount'])
      .slice(0, 5)
      .map((row, index) => ({
        'Rank': index + 1,
        'Date': row['Date'],
        'Customer Name': row['Customer Name'],
        'Total Transaction Amount': row['Total Transaction Amount'],
        'Card Brand': row['Card Brand']
      }));

    console.log('🏆 Top 5 transactions identified');

    // Display main results FIRST
    window.showResults(processedData, {
      title: 'Processed Transaction Data',
      summary: `Successfully processed ${processedCount} transactions. Date column cleaned, Total Transaction Amount: ${totalTransactionSum.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}, Net Totals: ${totalCalculatedSum.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
    });

    // Add Top 5 table using NEW API
    if (top5Transactions.length > 0) {
      const top5Html = `
        <div style="margin-top: 30px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">🏆 Top 5 Highest Transaction Amounts</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Rank</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Date</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Customer Name</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Total Transaction Amount</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Card Brand</th>
              </tr>
            </thead>
            <tbody>
              ${top5Transactions.map(row => `
                <tr style="background-color: ${row.Rank % 2 === 0 ? '#f9f9f9' : 'white'};">
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: center; font-weight: bold; color: #007bff;">#${row.Rank}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${row.Date}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${row['Customer Name']}</td>
                  <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold; color: #28a745;">${row['Total Transaction Amount'].toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td style="border: 1px solid #ddd; padding: 10px;">${row['Card Brand']}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="color: #666; font-size: 14px; margin-top: 10px;">
            💡 Highest transaction: ${top5Transactions[0]['Total Transaction Amount'].toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} | 
            Average of top 5: ${(top5Transactions.reduce((sum, t) => sum + t['Total Transaction Amount'], 0) / top5Transactions.length).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      `;
      
      // USE NEW API INSTEAD OF BROKEN DOM SELECTOR
      window.addAdditionalTable(top5Html, 'top-5-transactions');
      console.log('🏆 Top 5 table added via new window.addAdditionalTable function');
    }
    
    console.log('✅ Script completed successfully!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
    window.showError(`Processing failed: ${error.message}`);
  }
})(); 