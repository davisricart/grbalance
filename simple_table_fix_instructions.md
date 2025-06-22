# SIMPLE TABLE FIX - Claude Web Copy Box Instructions

## PROBLEM
Script testing results table shows NO BORDERS/LINES between rows. User needs simple Excel-style table with visible lines.

## SOLUTION
Replace Tailwind classes with simple inline CSS that always works.

## FILE TO EDIT
`src/pages/AdminPage.tsx`

## FIND THIS FUNCTION (around line 1572):
```javascript
const createResultsHTML = (results: any[], title?: string, summary?: string) => {
```

## REPLACE THE ENTIRE RETURN STATEMENT WITH:
```javascript
return `
  <div style="padding: 16px;">
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            ${headers.map(header => `<th style="padding: 12px; text-align: left; border: 1px solid #ccc; font-weight: bold;">${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${results.slice(0, 5).map((row, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
              ${headers.map(header => `<td style="padding: 12px; border: 1px solid #ccc;">${row[header] || row[header] === 0 ? row[header] : '0'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div style="margin-top: 16px; color: #666; font-size: 14px;">
      ${Math.min(results.length, 5)} of ${results.length} rows displayed${results.length > 5 ? ' (showing first 5)' : ''}
    </div>
  </div>
`;
```

## WHAT THIS DOES
- Uses simple inline CSS (no Tailwind dependencies)
- Adds `border: 1px solid #ccc` to EVERY cell
- Creates Excel-style table with clear lines
- Alternating row colors for readability
- Gray header background

## RESULT
Table will look like Excel with visible borders between all rows and columns. 