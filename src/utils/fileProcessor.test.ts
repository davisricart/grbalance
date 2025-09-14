import { parseFile, ParsedFileData } from './fileProcessor';

// Simplified validation mocks - bulletproof validator removed

// Mock XLSX
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn()
  }
}));

describe('fileProcessor', () => {
  describe('parseFile', () => {
    it('should parse a valid CSV file successfully', async () => {
      // Mock file
      const mockFile = new File(['name,amount\nJohn,100\nJane,200'], 'test.csv', {
        type: 'text/csv'
      });

      // Mock XLSX behavior
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      };

      const mockJsonData = [
        ['name', 'amount'],
        ['John', '100'],
        ['Jane', '200']
      ];

      const XLSX = require('xlsx');
      XLSX.read.mockReturnValue(mockWorkbook);
      XLSX.utils.sheet_to_json.mockReturnValue(mockJsonData);

      // Test
      const result = await parseFile(mockFile);

      // Assertions
      expect(result).toBeDefined();
      expect(result.filename).toBe('test.csv');
      expect(result.headers).toEqual(['name', 'amount']);
      expect(result.rows).toHaveLength(2);
      expect(result.summary.totalRows).toBe(2);
      expect(result.summary.columns).toBe(2);
    });

    it('should reject invalid files', async () => {
      // Skip bulletproof validation test - validator removed

      const mockFile = new File(['malicious content'], 'bad.exe', {
        type: 'application/exe'
      });

      await expect(parseFile(mockFile)).rejects.toThrow('Invalid file type');
    });

    it('should handle empty files', async () => {
      const mockFile = new File([''], 'empty.csv', {
        type: 'text/csv'
      });

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      };

      const XLSX = require('xlsx');
      XLSX.read.mockReturnValue(mockWorkbook);
      XLSX.utils.sheet_to_json.mockReturnValue([]);

      await expect(parseFile(mockFile)).rejects.toThrow('File appears to be empty');
    });

    it('should handle Excel files', async () => {
      const mockFile = new File(['mock excel data'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      };

      const mockJsonData = [
        ['Product', 'Price'],
        ['Widget', '25.99'],
        ['Gadget', '15.50']
      ];

      const XLSX = require('xlsx');
      XLSX.read.mockReturnValue(mockWorkbook);
      XLSX.utils.sheet_to_json.mockReturnValue(mockJsonData);

      const result = await parseFile(mockFile);

      expect(result.filename).toBe('test.xlsx');
      expect(result.headers).toEqual(['Product', 'Price']);
      expect(result.rows).toHaveLength(2);
    });
  });
});