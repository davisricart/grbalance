# 🧪 GR Balance Testing Guide

## Quick Start

1. **Setup Testing Environment**
   ```bash
   node testing-setup.cjs
   ```

2. **Generate Test Data**
   ```bash
   node test-automation-helper.cjs generate
   ```

3. **Run Comprehensive Tests**
   Follow the `COMPREHENSIVE_TESTING_CHECKLIST.md`

## Testing Tools

### 🔧 Available Scripts
- `testing-setup.cjs` - Environment setup
- `test-automation-helper.cjs` - Test data generation
- `performance-monitor.js` - Real-time performance monitoring

### 📁 Directory Structure
```
testing/
├── test-data/          # Generated test files
├── test-results/       # Test execution results
├── test-reports/       # Generated reports
├── test-screenshots/   # UI test screenshots
├── performance-logs/   # Performance data
└── security-logs/      # Security test results
```

## Testing Priorities

### P0 (Critical) - Must Pass
- [ ] File upload edge cases
- [ ] Data integrity validation
- [ ] Security vulnerability protection
- [ ] Core user workflows

### P1 (High) - Important
- [ ] Browser compatibility
- [ ] Performance targets
- [ ] Error handling
- [ ] UI responsiveness

### P2 (Medium) - Quality
- [ ] Advanced features
- [ ] Edge case handling
- [ ] Mobile experience

### P3 (Low) - Enhancement
- [ ] Future feature preparation
- [ ] Advanced edge cases

## Quick Test Commands

### Performance Testing
```javascript
// In browser console
testHelpers.measure('fileUpload', () => {
    // Upload file here
});
testHelpers.report(); // View metrics
testHelpers.export(); // Download data
```

### Memory Testing
```javascript
testHelpers.memoryStressTest();
```

## Environment URLs

- **Development:** http://localhost:5180
- **Staging:** https://staging.grbalance.com
- **Production:** https://grbalance.com

## Test Data Files

| File | Purpose | Size | Rows |
|------|---------|------|------|
| small-sample.csv | Basic functionality | <1KB | 3 |
| medium-5k-rows.csv | Performance testing | ~500KB | 5,000 |
| large-20k-rows.csv | Stress testing | ~2MB | 20,000 |
| special-characters.csv | Unicode handling | <10KB | 5 |
| xss-injection-test.csv | Security testing | <5KB | 4 |

## Reporting Issues

When reporting bugs, include:
1. **Priority level** (P0-P3)
2. **Steps to reproduce**
3. **Expected vs actual result**
4. **Browser and version**
5. **Screenshots/videos**
6. **Performance data** (if relevant)

## Contact

For testing questions or support:
- Documentation: `COMPREHENSIVE_TESTING_CHECKLIST.md`
- Performance: `performance-monitor.js`
- Test Data: `test-automation-helper.cjs`
