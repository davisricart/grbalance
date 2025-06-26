# GR Balance Client Portal - Visual Structure Guide

## 🎯 PURPOSE
This guide shows Claude Web exactly what the client portal looks like and how scripts should integrate with it.

## 📱 CLIENT PORTAL LAYOUT

```
┌─────────────────────────────────────────────────────────────┐
│                    GR BALANCE HEADER                        │
│  [Logo] [Home] [Billing] [Pricing] [Docs] [Support] [User] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   FILE UPLOAD SECTION                       │
│                                                             │
│  ┌─────────────────┐        ┌─────────────────┐            │
│  │   📁 Primary    │        │  📁 Secondary   │            │
│  │   Dataset       │        │   Dataset       │            │
│  │                 │        │                 │            │
│  │ [Upload File 1] │        │ [Upload File 2] │            │
│  │                 │        │                 │            │
│  │ ✅ file1.xlsx   │        │ ✅ file2.xlsx   │            │
│  └─────────────────┘        └─────────────────┘            │
│                                                             │
│           [🔄 Run Comparison] [⬇️ Download]                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     RESULTS SECTION                         │
│                                                             │
│  📊 Results                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Header 1  │  Header 2  │  Header 3  │  Header 4     │ │
│  ├────────────┼────────────┼────────────┼───────────────┤ │
│  │  Value 1   │  Value 2   │  Value 3   │  Value 4      │ │
│  │  Value 1   │  Value 2   │  Value 3   │  Value 4      │ │
│  │  Value 1   │  Value 2   │  Value 3   │  Value 4      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Showing 3 of 150 rows                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 VISUAL STYLING

### Upload Sections
- **Primary Dataset**: Light green background (#f0fdf4) when file uploaded
- **Secondary Dataset**: Light blue background (#dbeafe) when file uploaded  
- **Border**: Dashed border, rounded corners
- **Icons**: File icon with checkmark when uploaded

### Results Table
- **Headers**: Light green background (#f0fdf4), bold text
- **Borders**: 1px solid #666 between columns
- **Background**: Clean white with subtle hover effects
- **Typography**: Professional, readable font

### Buttons
- **Run Comparison**: Emerald green primary button
- **Download**: Emerald green secondary button
- **Processing**: Shows spinner and "Processing Your Files" text

## 📍 KEY INTEGRATION POINTS

1. **File Upload Areas**: Files drop here → get converted to arrays
2. **Run Button**: Triggers script execution  
3. **Results Table**: Where `window.showResults(data)` output appears
4. **Download**: Exports results to Excel

## ⚡ CRITICAL SUCCESS FACTORS

- Script results MUST display in the results table exactly as shown
- Table headers must be clear and descriptive  
- Data must be properly formatted for Excel download
- Results should be visually scannable and professional

This is what the user sees - scripts must integrate seamlessly with this interface.