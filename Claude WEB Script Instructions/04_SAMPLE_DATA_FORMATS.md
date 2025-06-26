# Sample Data Formats

## 📋 TYPICAL FILE STRUCTURES

### Primary Dataset Example (Payment Transactions)
```csv
Transaction ID,Date,Card Brand,Amount,Merchant,Status
TXN001,2024-01-15,Visa,125.50,Coffee Shop,Approved
TXN002,2024-01-15,Mastercard,89.25,Gas Station,Approved  
TXN003,2024-01-16,Visa,245.75,Restaurant,Approved
TXN004,2024-01-16,American Express,455.00,Hotel,Approved
TXN005,2024-01-17,Discover,67.30,Grocery Store,Declined
TXN006,2024-01-17,Visa,188.90,Department Store,Approved
```

### Secondary Dataset Example (Daily Totals)
```csv
Date,Card Type,Total Amount,Transaction Count,Average
2024-01-15,Visa,1250.75,15,83.38
2024-01-15,Mastercard,890.50,12,74.21
2024-01-15,American Express,675.25,8,84.41
2024-01-16,Visa,1456.80,18,80.93
2024-01-16,Mastercard,1023.45,14,73.10
```

## 🔍 DATA PATTERNS TO EXPECT

### Column Name Variations
**Card Brand/Type columns might be named:**
- "Card Brand", "Card Type", "Payment Method"
- "card_brand", "CardBrand", "CARD_BRAND"  
- "Type", "Brand", "Method"

**Amount columns might be named:**
- "Amount", "Total", "Transaction Amount"
- "amount", "transaction_amount", "total_amount"
- "Value", "Sum", "Cost"

**Date columns might be named:**
- "Date", "Transaction Date", "Created Date"
- "date", "transaction_date", "created_at"
- "Timestamp", "DateTime"

### Data Type Variations
```javascript
// Numbers might be:
125.50          // Clean float
"125.50"        // String number  
"$125.50"       // Currency formatted
"1,250.75"      // Comma separated
"125.5"         // Missing trailing zero

// Dates might be:
"2024-01-15"    // ISO format
"01/15/2024"    // US format
"15/01/2024"    // European format
"Jan 15, 2024"  // Text format

// Text might be:
"Visa"          // Clean
" Visa "        // With spaces
"VISA"          // All caps
"visa"          // All lowercase
```

## 🛠️ HANDLING DATA INCONSISTENCIES

### Example: Robust Amount Parsing
```javascript
function parseAmount(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[$,\s]/g, '');
  const number = parseFloat(cleaned);
  
  return isNaN(number) ? 0 : number;
}

// Usage in script:
data1.forEach(row => {
  const amount = parseAmount(row[amountColumn]);
  // ... rest of processing
});
```

### Example: Robust Text Cleaning
```javascript
function cleanText(value) {
  if (!value) return '';
  return value.toString().trim().toLowerCase();
}

// Usage for grouping:
const cardBrand = cleanText(row[cardBrandColumn]);
if (!cardBrand) return; // Skip empty values
```

## 📊 COMMON FILE SCENARIOS

### Scenario 1: Transaction Detail vs Summary
- **File 1**: Individual transactions (1000+ rows)
- **File 2**: Daily/monthly summaries (30-50 rows)  
- **Goal**: Verify detail totals match summary totals

### Scenario 2: Two Different Systems
- **File 1**: POS system export
- **File 2**: Payment processor export
- **Goal**: Find discrepancies between systems

### Scenario 3: Before vs After
- **File 1**: Previous month data
- **File 2**: Current month data
- **Goal**: Compare trends and changes

### Scenario 4: Multiple Locations
- **File 1**: Store A transactions
- **File 2**: Store B transactions  
- **Goal**: Compare performance between locations

## ⚠️ COMMON DATA QUALITY ISSUES

1. **Missing Headers**: First row might not contain column names
2. **Empty Rows**: Random empty rows in the middle of data
3. **Mixed Data Types**: Numbers stored as text, dates as numbers
4. **Inconsistent Formatting**: "Visa" vs "VISA" vs " Visa "
5. **Currency Symbols**: "$1,250.50" instead of clean numbers
6. **Date Formats**: Multiple date formats in same column
7. **Merged Cells**: Excel formatting that breaks parsing

## 🎯 SCRIPT REQUIREMENTS

Your script should:
- ✅ Handle column name variations with `window.findColumn()`
- ✅ Clean and parse data robustly
- ✅ Skip invalid/empty rows gracefully
- ✅ Provide meaningful error messages
- ✅ Show progress for large datasets
- ✅ Format output consistently