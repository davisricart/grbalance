# Claude Knowledge Management System

## 📁 Folder Structure

### **📋 Core Files:**
- `Claude Project Knowledge.txt` - **MASTER knowledge base** (share this with Claude Web)
- `Pattern Learning Enhancements.js` - Silent learning code for AdminPage.tsx
- `Weekly Analysis Script.js` - Run weekly to get knowledge updates
- `Knowledge Updates Log.md` - Track what's been added over time

### **📊 Analysis Files:**
- `Collected Patterns.json` - Raw data collected from script executions (auto-generated)
- `Knowledge Suggestions.md` - Weekly suggestions for knowledge base updates

## 🔄 Weekly Process

### **Step 1: Run Analysis (Weekly)**
```bash
node "Claude Knowledge/Weekly Analysis Script.js"
```

### **Step 2: Review Suggestions**
- Check `Knowledge Suggestions.md` for new patterns discovered
- Look for commonly successful column names, error fixes, etc.

### **Step 3: Update Master Knowledge**
- Add good suggestions to `Claude Project Knowledge.txt`
- Update the `Knowledge Updates Log.md` with what you added
- Continue using updated knowledge file with Claude Web

### **Step 4: Claude Web Usage (Same as Always)**
- Share `Claude Project Knowledge.txt` with Claude Web
- Request script generation
- Copy/paste to admin testing area
- Script works perfectly with enhanced knowledge

## 🎯 Goal
- ✅ Keep same clean workflow
- ✅ Make knowledge base smarter over time  
- ✅ Reduce script debugging
- ✅ Everything organized in one place

## 📝 Action Items
See `Action Items.md` for current tasks and updates to implement. 