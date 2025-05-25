// Standard Reconciliation Script
// Place in scripts/standardReconciliation.js

/**
 * Compare and process Payment Hub and Sales Totals data.
 * @param {Object} XLSX - The SheetJS library object
 * @param {ArrayBuffer} file1 - The first uploaded Excel file data
 * @param {ArrayBuffer} file2 - The second uploaded Excel file data
 * @returns {Array} An array of arrays representing the processed data
 */
function standardReconciliation(XLSX, file1, file2) {
    function formatDateForComparison(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '';
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    // Define the allowed columns
    const allowedColumns = [
        "Date", "Transaction Source", "Transaction Type", "Account Number", "DBA", "Invoice", "Auth", "BRIC", "Sold By", "Customer Name", "Total Transaction Amount", "Payment Amount", "Authorized Amount", "Tip", "$ Discount", "% Discount", "$ Tax", "Cash Discounting Amount", "State Tax", "County Tax", "City Tax", "Custom Tax", "Payment Type", "Card Brand", "First 6", "Last 4", "Comment"
    ];
    // Step 1: Process First File
    const workbook1 = XLSX.read(file1, { cellDates: true, dateNF: 'yyyy-mm-dd' });
    const sheetName1 = workbook1.SheetNames[0];
    const worksheet1 = workbook1.Sheets[sheetName1];
    const rawData = XLSX.utils.sheet_to_json(worksheet1, { header: 1 });
    const headers = rawData[0] || [];
    const columnsToKeepIndices = [];
    headers.forEach((header, index) => {
        if (allowedColumns.includes(header)) {
            columnsToKeepIndices.push(index);
        }
    });
    const filteredData = [];
    const filteredHeaders = columnsToKeepIndices.map(index => headers[index]);
    filteredData.push(filteredHeaders);
    for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        const filteredRow = columnsToKeepIndices.map(index => index < row.length ? row[index] : "");
        filteredData.push(filteredRow);
    }
    const jsonData1 = [];
    for (let i = 1; i < filteredData.length; i++) {
        const obj = {};
        filteredData[0].forEach((header, index) => {
            obj[header] = filteredData[i][index];
        });
        jsonData1.push(obj);
    }
    // Step 2: Process Second File (if provided)
    let jsonData2 = [];
    let file2Headers = [];
    let dateClosedIndex = -1;
    let nameIndex = -1;
    let amountIndex = -1;
    if (file2) {
        const workbook2 = XLSX.read(file2, { cellDates: true, dateNF: 'yyyy-mm-dd' });
        const sheetName2 = workbook2.SheetNames[0];
        const worksheet2 = workbook2.Sheets[sheetName2];
        const data = XLSX.utils.sheet_to_json(worksheet2, { header: 1 });
        file2Headers = data[0] || [];
        dateClosedIndex = file2Headers.findIndex(header => typeof header === "string" && header.trim().toLowerCase() === "date closed");
        nameIndex = file2Headers.findIndex(header => typeof header === "string" && header.trim().toLowerCase() === "name");
        amountIndex = file2Headers.findIndex(header => typeof header === "string" && header.trim().toLowerCase() === "amount");
        jsonData2 = data.slice(1);
        if (amountIndex !== -1) {
            jsonData2.forEach(row => {
                if (amountIndex < row.length && row[amountIndex] !== undefined) {
                    let amount = row[amountIndex];
                    if (typeof amount === "string") {
                        amount = amount.replace(/[^0-9.-]+/g, "");
                    }
                    row[amountIndex] = parseFloat(amount) || 0;
                }
            });
        }
    }
    // Step 3: Filter First File and Add New Columns
    const columnsToKeep = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand"];
    const newColumns = ["Total (-) Fee", "Count", "Final Count"];
    const resultData = [columnsToKeep.concat(newColumns)];
    const firstFileData = [];
    jsonData1.forEach(row => {
        const filteredRow = [];
        let firstFileDate = null;
        let cardBrand = "";
        let krValue = 0;
        columnsToKeep.forEach(column => {
            if (column === "Date") {
                if (row[column] instanceof Date) {
                    const date = row[column];
                    firstFileDate = new Date(date);
                    firstFileDate.setHours(12, 0, 0, 0);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    filteredRow.push(`${month}/${day}/${year}`);
                } else {
                    filteredRow.push(row[column] !== undefined ? row[column] : "");
                    if (row[column]) {
                        try {
                            firstFileDate = new Date(row[column]);
                            firstFileDate.setHours(12, 0, 0, 0);
                        } catch (e) {
                            firstFileDate = null;
                        }
                    }
                }
            } else if (column === "Card Brand") {
                cardBrand = row[column] || "";
                filteredRow.push(cardBrand);
            } else {
                filteredRow.push(row[column] !== undefined ? row[column] : "");
            }
        });
        const totalAmount = parseFloat(row["Total Transaction Amount"]) || 0;
        const discountAmount = parseFloat(row["Cash Discounting Amount"]) || 0;
        krValue = totalAmount - discountAmount;
        filteredRow.push(krValue.toFixed(2));
        let countMatches = 0;
        if (dateClosedIndex !== -1 && nameIndex !== -1 && amountIndex !== -1 && firstFileDate) {
            jsonData2.forEach(secondRow => {
                if (secondRow.length > Math.max(dateClosedIndex, nameIndex, amountIndex)) {
                    let secondFileDate = null;
                    const dateValue = secondRow[dateClosedIndex];
                    if (typeof dateValue === 'string') {
                        try {
                            secondFileDate = new Date(dateValue);
                            secondFileDate.setHours(12, 0, 0, 0);
                        } catch (e) {
                            secondFileDate = null;
                        }
                    } else if (dateValue instanceof Date) {
                        secondFileDate = new Date(dateValue);
                        secondFileDate.setHours(12, 0, 0, 0);
                    }
                    const secondFileName = String(secondRow[nameIndex] || "").trim().toLowerCase();
                    const secondFileAmount = parseFloat(secondRow[amountIndex]) || 0;
                    const firstFileDateStr = formatDateForComparison(firstFileDate);
                    const secondFileDateStr = formatDateForComparison(secondFileDate);
                    const dateMatches = firstFileDateStr && secondFileDateStr && firstFileDateStr === secondFileDateStr;
                    const nameMatches = secondFileName && cardBrand && (cardBrand.trim().toLowerCase().includes(secondFileName) || secondFileName.includes(cardBrand.trim().toLowerCase()));
                    const amountMatches = Math.abs(krValue - secondFileAmount) < 0.01;
                    if (dateMatches && nameMatches && amountMatches) {
                        countMatches++;
                    }
                }
            });
        }
        filteredRow.push(countMatches.toString());
        filteredRow.push("");
        resultData.push(filteredRow);
        firstFileData.push(filteredRow);
    });
    // Step 4: Process Second File Data and Calculate Count2 Values
    if (file2 && file2Headers.length > 0) {
        const secondFileWithCount2 = [];
        jsonData2.forEach(row => {
            const processedRow = [...row];
            let secondFileDate = null;
            let secondFileName = "";
            let secondFileAmount = 0;
            if (dateClosedIndex !== -1 && dateClosedIndex < row.length) {
                const dateValue = row[dateClosedIndex];
                if (typeof dateValue === 'string') {
                    try {
                        secondFileDate = new Date(dateValue);
                        secondFileDate.setHours(12, 0, 0, 0);
                    } catch (e) {
                        secondFileDate = null;
                    }
                } else if (dateValue instanceof Date) {
                    secondFileDate = new Date(dateValue);
                    secondFileDate.setHours(12, 0, 0, 0);
                }
            }
            if (nameIndex !== -1 && nameIndex < row.length) {
                secondFileName = String(row[nameIndex] || "").trim().toLowerCase();
            }
            if (amountIndex !== -1 && amountIndex < row.length) {
                let amountValue = row[amountIndex];
                if (typeof amountValue === 'string') {
                    amountValue = amountValue.replace(/[^0-9.-]+/g, "");
                }
                secondFileAmount = parseFloat(amountValue) || 0;
            }
            const secondFileDateStr = formatDateForComparison(secondFileDate);
            let countMatches = 0;
            firstFileData.forEach(firstFileRow => {
                let firstFileDate = null;
                if (firstFileRow[0]) {
                    const parts = firstFileRow[0].split('/');
                    if (parts.length === 3) {
                        const month = parseInt(parts[0]) - 1;
                        const day = parseInt(parts[1]);
                        const year = parseInt(parts[2]);
                        firstFileDate = new Date(year, month, day);
                        firstFileDate.setHours(12, 0, 0, 0);
                    }
                }
                const firstFileDateStr = formatDateForComparison(firstFileDate);
                const firstFileCardBrand = String(firstFileRow[4] || "").trim().toLowerCase();
                const firstFileKR = parseFloat(firstFileRow[5] || 0);
                const dateMatches = firstFileDateStr && secondFileDateStr && firstFileDateStr === secondFileDateStr;
                const nameMatches = secondFileName && firstFileCardBrand && (firstFileCardBrand.includes(secondFileName) || secondFileName.includes(firstFileCardBrand));
                const amountMatches = Math.abs(firstFileKR - secondFileAmount) < 0.01;
                if (dateMatches && nameMatches && amountMatches) {
                    countMatches++;
                }
            });
            processedRow.push(countMatches.toString());
            secondFileWithCount2.push(processedRow);
        });
        // Step 5: Calculate Final Count for First File Rows
        firstFileData.forEach((firstFileRow, index) => {
            const date = firstFileRow[0];
            const cardBrand = String(firstFileRow[4] || "").trim().toLowerCase();
            const kr = parseFloat(firstFileRow[5] || 0);
            const count = parseInt(firstFileRow[6] || 0);
            let firstFileDate = null;
            if (date) {
                const parts = date.split('/');
                if (parts.length === 3) {
                    const month = parseInt(parts[0]) - 1;
                    const day = parseInt(parts[1]);
                    const year = parseInt(parts[2]);
                    firstFileDate = new Date(year, month, day);
                    firstFileDate.setHours(12, 0, 0, 0);
                }
            }
            const firstFileDateStr = formatDateForComparison(firstFileDate);
            let finalCount = 0;
            secondFileWithCount2.forEach(secondFileRow => {
                let secondFileDate = null;
                if (dateClosedIndex !== -1 && dateClosedIndex < secondFileRow.length) {
                    const dateValue = secondFileRow[dateClosedIndex];
                    if (typeof dateValue === 'string') {
                        try {
                            secondFileDate = new Date(dateValue);
                            secondFileDate.setHours(12, 0, 0, 0);
                        } catch (e) {
                            secondFileDate = null;
                        }
                    } else if (dateValue instanceof Date) {
                        secondFileDate = new Date(dateValue);
                        secondFileDate.setHours(12, 0, 0, 0);
                    }
                }
                const secondFileDateStr = formatDateForComparison(secondFileDate);
                const secondFileName = nameIndex !== -1 && nameIndex < secondFileRow.length ? String(secondFileRow[nameIndex] || "").trim().toLowerCase() : "";
                const secondFileAmount = amountIndex !== -1 && amountIndex < secondFileRow.length ? parseFloat(secondFileRow[amountIndex]) || 0 : 0;
                const secondFileCount2 = parseInt(secondFileRow[secondFileRow.length - 1] || 0);
                const dateMatches = firstFileDateStr && secondFileDateStr && firstFileDateStr === secondFileDateStr;
                const nameMatches = secondFileName && cardBrand && (cardBrand.includes(secondFileName) || secondFileName.includes(cardBrand));
                const amountMatches = Math.abs(kr - secondFileAmount) < 0.01;
                const countMatches = count === secondFileCount2;
                if (dateMatches && nameMatches && amountMatches && countMatches) {
                    finalCount++;
                }
            });
            resultData[index + 1][7] = finalCount.toString();
        });
    }
    // Step 6: Filter results to only show rows with Final Count = 0
    const displayColumns = ["Date", "Customer Name", "Total Transaction Amount", "Cash Discounting Amount", "Card Brand", "Total (-) Fee"];
    const filteredResults = [displayColumns];
    for (let i = 1; i < resultData.length; i++) {
        const row = resultData[i];
        if (row.every(cell => cell === "")) break; // stop at separator
        const finalCount = parseInt(row[7] || 0);
        if (finalCount === 0) {
            const displayRow = row.slice(0, 6);
            if (displayRow[2] && !isNaN(parseFloat(displayRow[2]))) displayRow[2] = parseFloat(displayRow[2]);
            if (displayRow[3] && !isNaN(parseFloat(displayRow[3]))) displayRow[3] = parseFloat(displayRow[3]);
            if (displayRow[5] && !isNaN(parseFloat(displayRow[5]))) displayRow[5] = parseFloat(displayRow[5]);
            filteredResults.push(displayRow);
        }
    }
    filteredResults.push(["", "", "", "", "", ""]);
    filteredResults.push(["", "", "", "", "", ""]);
    filteredResults.push(["Card Brand", "Hub Report", "Sales Report", "Difference", "", ""]);
    const cardBrandTotals = {};
    for (let i = 1; i < resultData.length; i++) {
        const row = resultData[i];
        if (row.every(cell => cell === "")) {
            break;
        }
        const cardBrand = row[4];
        if (cardBrand && cardBrand.toLowerCase().includes("cash")) {
            continue;
        }
        const netAmount = parseFloat(row[5] || 0);
        if (cardBrand) {
            if (!cardBrandTotals[cardBrand]) {
                cardBrandTotals[cardBrand] = 0;
            }
            cardBrandTotals[cardBrand] += netAmount;
        }
    }
    const nameTotals = {};
    if (file2 && file2Headers.length > 0 && nameIndex !== -1 && amountIndex !== -1) {
        const commonNames = {
            "visa": "Visa",
            "mastercard": "Mastercard",
            "master": "Mastercard",
            "american express": "American Express",
            "amex": "American Express",
            "discover": "Discover"
        };
        jsonData2.forEach(row => {
            if (row.length > Math.max(nameIndex, amountIndex)) {
                const name = String(row[nameIndex] || "").trim();
                if (name.toLowerCase().includes("cash")) {
                    return;
                }
                const amount = parseFloat(row[amountIndex]) || 0;
                if (name) {
                    let displayName = name;
                    const lowerName = name.toLowerCase();
                    for (const [key, value] of Object.entries(commonNames)) {
                        if (lowerName.includes(key) || key.includes(lowerName)) {
                            displayName = value;
                            break;
                        }
                    }
                    if (!nameTotals[displayName]) {
                        nameTotals[displayName] = 0;
                    }
                    nameTotals[displayName] += amount;
                }
            }
        });
    }
    const commonCardBrands = ["Visa", "Mastercard", "American Express", "Discover"];
    commonCardBrands.forEach(brand => {
        const leftValue = cardBrandTotals[brand] ? parseFloat(cardBrandTotals[brand].toFixed(2)) : 0;
        const rightValue = nameTotals[brand] ? parseFloat(nameTotals[brand].toFixed(2)) : 0;
        const difference = parseFloat((leftValue - rightValue).toFixed(2));
        filteredResults.push([
            brand,
            leftValue,
            rightValue,
            difference,
            "",
            ""
        ]);
        delete cardBrandTotals[brand];
        delete nameTotals[brand];
    });
    const otherBrands = new Set([
        ...Object.keys(cardBrandTotals).filter(b => !b.toLowerCase().includes("cash") && !commonCardBrands.includes(b)),
        ...Object.keys(nameTotals).filter(n => !n.toLowerCase().includes("cash") && !commonCardBrands.includes(n))
    ]);
    [...otherBrands].sort().forEach(brand => {
        const leftValue = cardBrandTotals[brand] ? parseFloat(cardBrandTotals[brand].toFixed(2)) : 0;
        const rightValue = nameTotals[brand] ? parseFloat(nameTotals[brand].toFixed(2)) : 0;
        const difference = parseFloat((leftValue - rightValue).toFixed(2));
        filteredResults.push([
            brand,
            leftValue || 0,
            rightValue || 0,
            difference,
            "",
            ""
        ]);
    });
    return filteredResults;
}

export default standardReconciliation; 