# 🔧 AI Development Cheat Sheet - Critical Fixes & Patterns

## 🚨 **SYNTAX ERROR PATTERNS** (Most Common)

### **1. Escaped Backticks - "Unicode escape sequence" Error**
```
❌ WRONG: \`template string\`
✅ CORRECT: `template string`

Search Pattern: \`
Replace With: `
```

### **2. Escaped Newlines in Strings**
```
❌ WRONG: "header\\n" + data.join("\\n")
✅ CORRECT: "header\n" + data.join("\n")

Search Pattern: \\n
Replace With: \n
```

### **3. Template Literal Syntax**
```
❌ WRONG: showNotification('title', \`message\`)
✅ CORRECT: showNotification('title', `message`)
```

## 🎯 **REACT/TYPESCRIPT INTEGRATION PATTERNS**

### **Script Builder Auto-Integration**
```typescript
// ALWAYS add this after successful script execution
if (results && Array.isArray(results) && results.length > 0) {
  const stepDescription = `Step 1: Analysis - Found ${results.length} items`;
  addScriptStep(stepDescription);
  setTimeout(() => updateScriptStepsTable(), 100);
}
```

### **Clear Results Button Pattern**
```typescript
// ALWAYS ensure Clear Results button is conditionally rendered
{(file1Data.length > 0 || file2Data.length > 0 || lastScriptResults) && (
  <button onClick={clearResults} className="bg-red-500...">
    🗑️ Clear Results
  </button>
)}
```

## 🔍 **DEBUGGING WORKFLOW**

### **When Syntax Errors Persist:**
1. **Search exact error pattern**: `grep_search` for `\`` or `\\n`
2. **Read specific line numbers**: Use exact line from error message
3. **Fix ALL instances**: Don't assume one fix solves all
4. **Verify with terminal logs**: Check if error actually disappears

### **When Features Don't Work:**
1. **Check state management**: Results stored in correct variables?
2. **Verify function calls**: Are functions actually being called?
3. **Console.log everything**: Add logging to trace execution
4. **Check conditional rendering**: UI elements showing when expected?

## 🎨 **UI/UX PATTERNS**

### **No Popup Notifications**
```typescript
❌ WRONG: showNotification('success', 'message');
✅ CORRECT: console.log('✅ Success: message');
// OR inline UI messages within existing components
```

### **Results Display Pattern**
```typescript
// Results should flow: Script → Step Builder Table → Client Preview
// NOT: Script → Popup → Separate Display
```

## 📋 **TROUBLESHOOTING CHECKLIST**

### **Before Making Changes:**
- [ ] Read the EXACT error message line number
- [ ] Search for ALL instances of the problem pattern
- [ ] Understand what the user actually wants (not what I think they want)

### **After Making Changes:**
- [ ] Verify error actually disappears from terminal
- [ ] Test the actual user workflow
- [ ] Check if new issues were introduced

### **When Stuck:**
- [ ] Re-read user's exact requirements
- [ ] Check this cheat sheet for similar patterns
- [ ] Focus on ONE specific error at a time
- [ ] Don't create documentation when asked to fix bugs

## 🎯 **USER WORKFLOW UNDERSTANDING**

### **Script Builder Flow:**
1. User uploads files
2. User runs script → **Results auto-appear as Step 1 in Script Builder table**
3. User clicks "+ Add Step" to build Step 2, 3, etc.
4. NOT: Results appear above Script Builder or in popups

### **What User Values:**
- **Clean, working functionality** > fancy features
- **No popups** > notifications
- **Fix bugs first** > add new features
- **Understand requirements** > assume what they want

## 🔥 **CRITICAL REMINDERS**

### **ALWAYS:**
- Fix the EXACT line number from error messages
- Search for ALL instances of a problem pattern
- Test in browser after each fix
- Read user requirements literally

### **NEVER:**
- Assume one fix solves all instances
- Add popup notifications without asking
- Create documentation when asked to fix bugs
- Leave console errors unresolved

---

**📌 This cheat sheet should be updated every time a new pattern is discovered or mistake is repeated.** 