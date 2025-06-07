# AdminPage Debug Guide

## What You Should See

### 1. **🔴 RED BOX (Always Visible)**
- **Location**: Fixed position, top-right corner of AdminPage
- **Content**: 
  - "FAILSAFE ADMIN TEST"
  - Current activeTab value
  - Current time
  - StepBuilderDemo component test
- **If you DON'T see this**: AdminPage isn't loading at all

### 2. **🟢 GREEN BOX (Testing Tab Only)**
- **Location**: In main content area when Testing tab is active
- **Content**: 
  - "TESTING TAB IS ACTIVE!"
  - activeTab value should show "testing"
  - Current time
- **If you DON'T see this**: Testing tab isn't working or you're on wrong tab

### 3. **🟠 ORANGE BOX (StepBuilderDemo)**
- **Location**: Below green box when Testing tab is active
- **Content**: 
  - "STEPBUILDERDEMO IS RENDERING!"
  - Test ClientPreview component
- **If you DON'T see this**: StepBuilderDemo has import/rendering issues

### 4. **🟣 PURPLE BOX (ClientPreviewTest)**
- **Location**: Below orange box in StepBuilderDemo
- **Content**: 
  - "Standalone ClientPreview Test"
  - Working VirtualTable with test data
- **If you DON'T see this**: ClientPreview component has issues

## Console Logs to Watch For

```
🚨🚨🚨 STEPBUILDERDEMO COMPONENT IS RENDERING 🚨🚨🚨
🚨🚨🚨 CLIENT PREVIEW COMPONENT IS RENDERING 🚨🚨🚨
🚨 ClientPreviewTest component rendering
```

## Expected UI Flow

1. **Load AdminPage** → See red box (top-right)
2. **Click "Script Testing" tab** → See green box (main area)
3. **Testing tab loads** → See orange box (StepBuilderDemo)
4. **StepBuilderDemo renders** → See purple box (ClientPreviewTest)
5. **All components work** → See tables with test data

## Troubleshooting

### Issue A: No red box
- **Problem**: AdminPage not loading
- **Check**: URL, routing, authentication

### Issue B: Red box but no green box on Testing tab
- **Problem**: Tab logic broken
- **Check**: activeTab state, tab click handlers

### Issue C: Green box but no orange box
- **Problem**: StepBuilderDemo import/render issue
- **Check**: Import statement, component export

### Issue D: Orange box but no purple box
- **Problem**: ClientPreview component issue
- **Check**: Component definition, VirtualTable import

### Issue E: All boxes but no data tables
- **Problem**: VirtualTable or data rendering issue
- **Check**: VirtualTable component, data format

## Current URLs
- AdminPage: http://localhost:5173/admin
- Main App: http://localhost:5173

## Next Steps
1. Navigate to AdminPage
2. Look for colored boxes
3. Click Testing tab
4. Report what you see vs. what's expected above