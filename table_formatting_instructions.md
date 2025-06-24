# Fix Script Testing Table Formatting - Claude Web Instructions

## Problem
Script testing results table in AdminPage.tsx shows no row dividers/borders between data rows. User expects standard table formatting with visible horizontal lines separating each row.

## File to Modify
`src/pages/AdminPage.tsx`

## Location
Around line 1572-1590, in the `createResultsHTML` function inside the `runTestScript` function.

## Current Code (BROKEN):
```javascript
const createResultsHTML = (results: any[], title?: string, summary?: string) => {
  const headers = results.length > 0 ? Object.keys(results[0]) : [];
  
  return `
    <div class="p-4">
      <div class="overflow-x-auto">
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr style="border-bottom: 2px solid #000000 !important;">
              ${headers.map(header => `<th style="padding: 12px 24px; text-align: left; font-size: 12px; font-weight: 500; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; background-color: #F3F4F6; border-bottom: 2px solid #000000 !important;">${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${results.slice(0, 5).map((row, index) => `
              <tr style="background-color: white; border-bottom: 1px solid #D1D5DB !important;">
                ${headers.map(header => `<td style="padding: 16px 24px; white-space: nowrap; font-size: 14px; color: #111827; border-bottom: 1px solid #D1D5DB !important;">${row[header] || row[header] === 0 ? row[header] : '0'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 text-sm text-gray-500">
        ${Math.min(results.length, 5)} of ${results.length} rows displayed${results.length > 5 ? ' (showing first 5)' : ''}
      </div>
    </div>
  `;
};
```

## Fixed Code (WORKING):
Replace the entire `createResultsHTML` function with:

```javascript
const createResultsHTML = (results: any[], title?: string, summary?: string) => {
  const headers = results.length > 0 ? Object.keys(results[0]) : [];
  
  return `
    <div class="p-4">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead class="bg-gray-50">
            <tr>
              ${headers.map(header => `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${results.slice(0, 5).map((row, index) => `
              <tr class="hover:bg-gray-50">
                ${headers.map(header => `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">${row[header] || row[header] === 0 ? row[header] : '0'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="mt-4 text-sm text-gray-500">
        ${Math.min(results.length, 5)} of ${results.length} rows displayed${results.length > 5 ? ' (showing first 5)' : ''}
      </div>
    </div>
  `;
};
```

## What This Fixes
- Replaces inline CSS styles with proper Tailwind CSS classes
- Uses the standard GR Balance table format (matches other tables in the admin interface)
- Adds visible row dividers with `divide-y divide-gray-200`
- Adds proper borders with `border border-gray-300`
- Adds gray header background with `bg-gray-50`
- Adds hover effects with `hover:bg-gray-50`
- Uses consistent spacing and typography

## Expected Result
After this change, when users run script tests in the admin dashboard, the results table will show:
- Clear horizontal lines between each row
- Gray header background
- Professional table styling matching the rest of the interface
- Proper borders around the entire table

## Testing
1. Go to admin dashboard script testing section
2. Upload Excel files and run a test script
3. Verify the results table now shows clear row dividers
4. Verify it matches the styling of other tables in the admin interface 