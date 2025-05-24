/**
 * Compare and process Excel files to analyze payment data.
 * 
 * @param {Object} XLSX - The SheetJS library object
 * @param {ArrayBuffer} file1 - The first uploaded Excel file data
 * @param {ArrayBuffer} file2 - The second uploaded Excel file data
 * @returns {Array} An array of arrays representing the processed data
 */
function compareAndDisplayData(XLSX, file1, file2) {
    // Helper function to format date for comparison
    function formatDateForComparison(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    try {
        // Read workbooks with date parsing enabled
        const workbook1 = XLSX.read(file1, { cellDates: true });
        const workbook2 = XLSX.read(file2, { cellDates: true });
        
        // Get first sheet from each workbook
        const sheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
        const sheet2 = workbook2.Sheets[workbook2.SheetNames[0]];
        
        // Convert sheets to JSON
        const data1 = XLSX.utils.sheet_to_json(sheet1);
        const data2 = XLSX.utils.sheet_to_json(sheet2);
        
        if (!data1.length || !data2.length) {
            throw new Error('One or both files are empty');
        }

        // Find the date column in the second file
        const dateColumn = Object.keys(data2[0]).find(key => 
            key.toLowerCase().includes('date')
        );

        // Define columns to keep from the filtered data
        const columnsToKeep = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
        const newColumns = ["Total (-) Fee"];
        
        // Create result array starting with header
        const resultData = [columnsToKeep.concat(newColumns)];
        
        // Process each row of first file
        data1.forEach(row => {
            const filteredRow = [];
            let firstFileDate = null;
            let cardBrand = "";
            let krValue = 0;
            
            // Filter columns
            columnsToKeep.forEach(column => {
                if (column === "Date") {
                    if (row[column] instanceof Date) {
                        const date = row[column];
                        firstFileDate = new Date(date);
                        firstFileDate.setHours(0, 0, 0, 0);
                        
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        filteredRow.push(`${month}/${day}/${year}`);
                    } else {
                        filteredRow.push(row[column] !== undefined ? row[column] : "");
                        if (row[column]) {
                            try {
                                firstFileDate = new Date(row[column]);
                                firstFileDate.setHours(0, 0, 0, 0);
                            } catch (e) {
                                firstFileDate = null;
                            }
                        }
                    }
                } else if (column === "Card Brand") {
                    cardBrand = (row[column] || "").toString().toLowerCase();
                    filteredRow.push(row[column] || "");
                } else {
                    filteredRow.push(row[column] !== undefined ? row[column] : "");
                }
            });
            
            // Calculate K-R value (Total - Discount)
            const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
            const discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
            krValue = totalAmount - discountAmount;
            
            // Add K-R value
            filteredRow.push(krValue.toFixed(2));
            
            // Find matching transaction in second file
            let found = false;
            
            if (firstFileDate && cardBrand) {
                for (const secondRow of data2) {
                    // Get date from second file
                    let secondFileDate = null;
                    if (dateColumn) {
                        const dateValue = secondRow[dateColumn];
                        if (dateValue instanceof Date) {
                            secondFileDate = new Date(dateValue);
                            secondFileDate.setHours(0, 0, 0, 0);
                        } else if (typeof dateValue === 'string') {
                            try {
                                secondFileDate = new Date(dateValue);
                                secondFileDate.setHours(0, 0, 0, 0);
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    // Skip if dates don't match
                    if (!secondFileDate || secondFileDate.getTime() !== firstFileDate.getTime()) {
                        continue;
                    }
                    
                    // Get name and amount from second file
                    const name = (secondRow["Name"] || "").toString().toLowerCase();
                    const amount = parseFloat(secondRow["Amount"]) || 0;
                    
                    // Check if card brand matches name and amounts match
                    if (
                        (cardBrand.includes(name) || name.includes(cardBrand)) &&
                        Math.abs(krValue - amount) < 0.01
                    ) {
                        found = true;
                        break;
                    }
                }
            }
            
            // Only add rows that don't have matches
            if (!found) {
                resultData.push(filteredRow);
            }
        });

        // Add summary section
        resultData.push(["", "", "", "", "", ""]);
        resultData.push(["Summary", "", "", "", "", ""]);
        resultData.push(["Card Brand", "Total Amount", "", "", "", ""]);

        // Calculate totals by card brand
        const cardBrandTotals = {};
        for (let i = 1; i < resultData.length - 3; i++) {
            const row = resultData[i];
            const cardBrand = row[4];
            const amount = parseFloat(row[5]) || 0;

            if (cardBrand && !cardBrand.toLowerCase().includes('cash')) {
                cardBrandTotals[cardBrand] = (cardBrandTotals[cardBrand] || 0) + amount;
            }
        }

        // Add card brand totals to results
        Object.entries(cardBrandTotals)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([brand, total]) => {
                resultData.push([brand, total.toFixed(2), "", "", "", ""]);
            });

        return resultData;
    } catch (error) {
        console.error('Error in comparison:', error);
        return [
            ['Error'],
            ['An error occurred while comparing the files:'],
            [error.message]
        ];
    }
}