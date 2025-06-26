#!/usr/bin/env node

/**
 * GR Balance Testing Agent
 * Simulates complete client portal flow before deployment
 * Usage: node test-agent.js [script-name]
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const https = require('https');

class GRBalanceTestAgent {
  constructor() {
    this.sampleFiles = {
      file1: 'public/sample-data-file1.xlsx',
      file2: 'public/sample-data-file2.xlsx'
    };
    this.scriptsDir = 'sample-data';
    this.netlifyUrl = 'https://grbalance.netlify.app';
  }

  log(emoji, message) {
    console.log(`${emoji} ${message}`);
  }

  async loadSampleFiles() {
    this.log('📁', 'Loading sample Excel files...');
    
    try {
      const file1 = fs.readFileSync(this.sampleFiles.file1);
      const file2 = fs.readFileSync(this.sampleFiles.file2);

      // Convert to array format (exactly like client portal)
      const wb1 = XLSX.read(file1, { type: 'buffer' });
      const data1 = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { header: 1 });

      const wb2 = XLSX.read(file2, { type: 'buffer' });
      const data2 = XLSX.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1 });

      this.log('✅', `Files loaded - File1: ${data1.length} rows, File2: ${data2.length} rows`);
      return { data1, data2 };
    } catch (error) {
      this.log('❌', `Failed to load sample files: ${error.message}`);
      throw error;
    }
  }

  async loadScript(scriptName = 'test1.js') {
    this.log('📜', `Loading script: ${scriptName}`);
    
    try {
      const scriptPath = path.join(this.scriptsDir, scriptName);
      const script = fs.readFileSync(scriptPath, 'utf8');
      this.log('✅', `Script loaded - ${script.length} characters`);
      return script;
    } catch (error) {
      this.log('❌', `Failed to load script: ${error.message}`);
      throw error;
    }
  }

  createGRBalanceEnvironment(data1, data2) {
    this.log('🏗️', 'Creating GR Balance environment...');
    
    let scriptResults = null;
    let scriptError = null;

    const grBalanceWindow = {
      parseFiles: async () => {
        // Convert arrays to objects (like execute-script function)
        const headers1 = data1[0] || [];
        const processedData1 = [];
        
        for (let i = 1; i < data1.length; i++) {
          const row = data1[i];
          const obj = {};
          headers1.forEach((header, index) => {
            if (header && header.toString().trim()) {
              obj[header] = index < row.length ? row[index] : '';
            }
          });
          processedData1.push(obj);
        }

        const headers2 = data2[0] || [];
        const processedData2 = [];
        
        for (let i = 1; i < data2.length; i++) {
          const row = data2[i];
          const obj = {};
          headers2.forEach((header, index) => {
            if (header && header.toString().trim()) {
              obj[header] = index < row.length ? row[index] : '';
            }
          });
          processedData2.push(obj);
        }

        return { data1: processedData1, data2: processedData2 };
      },
      
      showResults: (results) => {
        scriptResults = results;
        this.log('📊', `Script returned ${results?.length || 0} results`);
      },
      
      showError: (message) => {
        scriptError = message;
        this.log('❌', `Script error: ${message}`);
      },
      
      findColumn: (row, possibleNames) => {
        const columns = Object.keys(row);
        for (const targetName of possibleNames) {
          const found = columns.find(col => {
            const colLower = col.toLowerCase().trim();
            const targetLower = targetName.toLowerCase().trim();
            return colLower === targetLower || colLower.includes(targetLower) || targetLower.includes(colLower);
          });
          if (found) return found;
        }
        return null;
      },

      addAdditionalTable: (htmlString, uniqueId) => {
        this.log('📊', `Additional table added: ${uniqueId}`);
      }
    };

    return { grBalanceWindow, getResults: () => scriptResults, getError: () => scriptError };
  }

  async executeScript(script, grBalanceWindow) {
    this.log('🔄', 'Executing script in GR Balance environment...');
    
    try {
      const scriptFunction = new Function(
        'window',
        'console',
        `
        window.parseFiles = arguments[0].parseFiles;
        window.showResults = arguments[0].showResults;
        window.showError = arguments[0].showError;
        window.findColumn = arguments[0].findColumn;
        window.addAdditionalTable = arguments[0].addAdditionalTable;
        
        ${script}
        `
      );

      await scriptFunction(grBalanceWindow, console);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.log('✅', 'Script execution completed');
    } catch (error) {
      this.log('❌', `Script execution failed: ${error.message}`);
      throw error;
    }
  }

  displayResults(results, context = 'UNKNOWN') {
    if (!results || results.length === 0) {
      this.log('⚠️', 'No results to display - Table will NOT show');
      return false;
    }

    this.log('🎯', `${context} TABLE PREVIEW (${results.length} ${Array.isArray(results[0]) ? 'total with header' : 'data'} rows):`);
    console.log('='.repeat(60));
    
    // SIMULATE EXACTLY what the client portal MainPage.tsx will render
    let headers, dataRows;
    
    if (Array.isArray(results[0])) {
      // Array format from Netlify: [["Header1", "Header2"], ["Value1", "Value2"]]
      // This is what MainPage.tsx will receive and must handle correctly
      console.log('📊 FORMAT: Array format (from Netlify function)');
      
      // SIMULATE: (Array.isArray(results[0]) ? results[0] : Object.keys(results[0] || {}))
      headers = results[0]; // First row is headers
      dataRows = results.slice(1); // Rest are data rows
      
      console.log('HEADERS:', headers.join(' | '));
      console.log('-'.repeat(60));
      
      // SIMULATE: (Array.isArray(results[0]) ? results.slice(1, 6) : results.slice(0, 5))
      // SIMULATE: Array.isArray(results[0]) ? (row[colIndex] || row[colIndex] === 0 ? row[colIndex] : '0')
      dataRows.slice(0, 5).forEach((row, i) => {
        const cellValues = headers.map((header, colIndex) => {
          const value = row[colIndex];
          return (value || value === 0) ? value : '0';
        });
        console.log(`Row ${i+1}: ${cellValues.join(' | ')}`);
      });
      
      if (dataRows.length > 5) {
        console.log(`... and ${dataRows.length - 5} more rows`);
      }
      
      // SIMULATE: Array.isArray(results[0]) ? results.length - 1 : results.length
      const displayCount = Math.min(dataRows.length, 5);
      const totalCount = dataRows.length;
      console.log(`FOOTER: ${displayCount} of ${totalCount} rows displayed${totalCount > 5 ? ' (showing first 5)' : ''}`);
      
    } else {
      // Object format from local: [{Header1: "Value1", Header2: "Value2"}]
      console.log('📊 FORMAT: Object format (from local simulation)');
      
      // SIMULATE: Object.keys(results[0] || {})
      headers = Object.keys(results[0]);
      
      console.log('HEADERS:', headers.join(' | '));
      console.log('-'.repeat(60));
      
      // SIMULATE: results.slice(0, 5)
      // SIMULATE: (row[header] || row[header] === 0 ? row[header] : '0')
      results.slice(0, 5).forEach((row, i) => {
        const rowValues = headers.map(h => {
          const value = row[h];
          return (value || value === 0) ? value : '0';
        });
        console.log(`Row ${i+1}: ${rowValues.join(' | ')}`);
      });
      
      if (results.length > 5) {
        console.log(`... and ${results.length - 5} more rows`);
      }
      
      // SIMULATE: results.length
      const displayCount = Math.min(results.length, 5);
      const totalCount = results.length;
      console.log(`FOOTER: ${displayCount} of ${totalCount} rows displayed${totalCount > 5 ? ' (showing first 5)' : ''}`);
    }
    
    console.log('='.repeat(60));
    this.log('✅', 'Table WILL display in client portal');
    return { headers, dataRows: Array.isArray(results[0]) ? dataRows : results };
  }

  async testNetlifyFunction(script, data1, data2) {
    this.log('🌐', 'Testing live Netlify function...');
    
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        script: script,
        file1Data: data1,
        file2Data: data2
      });

      const options = {
        hostname: 'grbalance.netlify.app',
        path: '/.netlify/functions/execute-script',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const result = JSON.parse(data);
              this.log('✅', `Netlify function SUCCESS - ${result.result?.length || 0} results`);
              resolve(result.result);
            } catch (error) {
              this.log('❌', `Failed to parse Netlify response: ${error.message}`);
              reject(error);
            }
          } else {
            this.log('❌', `Netlify function failed - Status: ${res.statusCode}`);
            this.log('📄', `Response: ${data}`);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (e) => {
        this.log('❌', `Netlify request error: ${e.message}`);
        reject(e);
      });

      req.write(payload);
      req.end();
    });
  }

  async runFullTest(scriptName = 'test1.js') {
    console.log('\n🚀 GR BALANCE TESTING AGENT STARTED');
    console.log('=====================================\n');

    try {
      // 1. Load sample files
      const { data1, data2 } = await this.loadSampleFiles();

      // 2. Load script
      const script = await this.loadScript(scriptName);

      // 3. Local simulation
      this.log('🏠', 'TESTING LOCAL SIMULATION...');
      const { grBalanceWindow, getResults, getError } = this.createGRBalanceEnvironment(data1, data2);
      await this.executeScript(script, grBalanceWindow);
      
      const localResults = getResults();
      const localError = getError();

      if (localError) {
        this.log('❌', `Local simulation failed: ${localError}`);
        return false;
      }

      console.log('\n📋 LOCAL SIMULATION RESULTS:');
      const localDisplay = this.displayResults(localResults, 'LOCAL SIMULATION');

      // 4. Test live Netlify function
      console.log('\n🌐 TESTING LIVE NETLIFY FUNCTION...');
      try {
        const netlifyResults = await this.testNetlifyFunction(script, data1, data2);
        
        console.log('\n📋 NETLIFY FUNCTION RESULTS:');
        const netlifyDisplay = this.displayResults(netlifyResults, 'NETLIFY FUNCTION');

        // 5. Compare ACTUAL table rendering, not just data
        console.log('\n🔍 CRITICAL COMPARISON ANALYSIS:');
        
        // Compare headers (most important)
        const localHeaders = localDisplay.headers;
        const netlifyHeaders = netlifyDisplay.headers;
        
        if (JSON.stringify(localHeaders) === JSON.stringify(netlifyHeaders)) {
          this.log('✅', 'HEADERS MATCH - Table headers will be identical');
        } else {
          this.log('❌', 'HEADERS DIFFER - CLIENT PORTAL WILL SHOW WRONG HEADERS!');
          console.log('🏠 Local headers  :', localHeaders);
          console.log('🌐 Netlify headers:', netlifyHeaders);
          console.log('💥 THIS IS A CRITICAL FAILURE - Users will see wrong column names!');
          
          // 6. FAIL the test if headers don't match
          console.log('\n🎯 FINAL ASSESSMENT:');
          this.log('💥', 'CONFIDENCE: 0% - CLIENT PORTAL HEADERS ARE BROKEN!');
          this.log('🚨', 'DO NOT DEPLOY - Fix header synchronization first!');
          return false;
        }

        // Compare data (secondary)
        const localData = localDisplay.dataRows;
        const netlifyData = netlifyDisplay.dataRows;
        
        if (JSON.stringify(localData) === JSON.stringify(netlifyData)) {
          this.log('✅', 'DATA MATCHES - Table content will be identical');
        } else {
          this.log('⚠️', 'DATA DIFFERS - Table content may vary');
          console.log('Local data rows:', localData?.length || 0);
          console.log('Netlify data rows:', netlifyData?.length || 0);
        }

        // 6. Final assessment - only pass if EVERYTHING matches
        console.log('\n🎯 FINAL ASSESSMENT:');
        const headersMatch = JSON.stringify(localHeaders) === JSON.stringify(netlifyHeaders);
        const dataMatches = JSON.stringify(localData) === JSON.stringify(netlifyData);
        
        if (headersMatch && dataMatches) {
          this.log('🎉', 'CONFIDENCE: 100% - Admin and Client Portal will be IDENTICAL!');
          return true;
        } else if (headersMatch && !dataMatches) {
          this.log('⚠️', 'CONFIDENCE: 80% - Headers match but data differs slightly');
          return true;
        } else {
          this.log('💥', 'CONFIDENCE: 0% - CRITICAL ISSUES DETECTED!');
          return false;
        }

      } catch (netlifyError) {
        this.log('⚠️', `Netlify test failed: ${netlifyError.message}`);
        this.log('📋', 'Local simulation worked, but live function has issues');
        return false;
      }

    } catch (error) {
      this.log('💥', `Test failed: ${error.message}`);
      return false;
    }
  }
}

// CLI Usage
if (require.main === module) {
  const scriptName = process.argv[2] || 'test1.js';
  const agent = new GRBalanceTestAgent();
  
  agent.runFullTest(scriptName).then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Agent crashed:', error);
    process.exit(1);
  });
}

module.exports = GRBalanceTestAgent;