import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

export default function AgentTable({ data }) {
    const [copySuccess, setCopySuccess] = useState(false);
    
    console.log('📊 AgentTable received data:', data);
    console.log('📊 Data type:', typeof data);
    console.log('📊 Is array:', Array.isArray(data));
    
    // Handle different data formats
    let tableData = data;
    
    // If data is not an array, try to convert it
    if (!Array.isArray(data)) {
      if (data && typeof data === 'object') {
        // If it's the FinancialCalculator output format, convert it
        if (data.values && Array.isArray(data.values)) {
          tableData = data.values;
        } else if (data.rows && typeof data.rows === 'string') {
          // Handle the current format where rows is a concatenated string
          // Parse "20211.0720220.8820230.9920240.87" into proper table format
          const rowsString = data.rows;
          console.log('📊 Parsing rows string:', rowsString);
          
          // Parse the concatenated rows string - look for 4-digit year followed by decimal
          const yearPattern = /(\d{4})(\d+\.\d+)/g;
          const matches = [];
          let match;
          
          while ((match = yearPattern.exec(rowsString)) !== null) {
            matches.push({
              year: match[1],
              value: parseFloat(match[2])
            });
          }
          
          console.log('📊 Parsed matches:', matches);
          
          tableData = matches.map(item => ({
            'Year': item.year,
            'Current Ratio': item.value
          }));
        } else {
          // Try to convert object to array format
          tableData = Object.entries(data).map(([key, value]) => ({ key, value }));
        }
      } else {
        return <div className="text-muted">Invalid table data format</div>;
      }
    }
    
    if (!tableData || tableData.length === 0) {
      return <div className="text-muted">No data available</div>;
    }

    // Convert table data to CSV format
    const convertToCSV = (data) => {
      if (!data || data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      
      // Create CSV with proper formatting for Google Sheets
      const csvRows = [];
      
      // Add headers
      csvRows.push(headers.map(header => `"${header}"`).join(','));
      
      // Add data rows
      data.forEach(row => {
        const rowValues = headers.map(header => {
          const value = row[header];
          // Always wrap values in quotes to ensure proper parsing
          if (value === null || value === undefined) {
            return '""';
          }
          // Escape any quotes in the value
          const escapedValue = String(value).replace(/"/g, '""');
          return `"${escapedValue}"`;
        });
        csvRows.push(rowValues.join(','));
      });
      
      return csvRows.join('\r\n'); // Use \r\n for better compatibility
    };

    // Convert table data to TSV (Tab Separated Values) format
    const convertToTSV = (data) => {
      if (!data || data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      
      // Create TSV with tab separation
      const tsvRows = [];
      
      // Add headers
      tsvRows.push(headers.join('\t'));
      
      // Add data rows
      data.forEach(row => {
        const rowValues = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) {
            return '';
          }
          return String(value);
        });
        tsvRows.push(rowValues.join('\t'));
      });
      
      return tsvRows.join('\n');
    };

    const handleCopyToClipboard = async () => {
      try {
        // Use TSV format which works better with Google Sheets
        const tsvData = convertToTSV(tableData);
        await navigator.clipboard.writeText(tsvData);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = convertToTSV(tableData);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    };

    const handleDownloadCSV = () => {
      const csvData = convertToCSV(tableData);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'table_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    
    return (
      <div className="me-auto" style={{ maxWidth: '90%' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">Table Data</h6>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleDownloadCSV}
              style={{ fontSize: '0.8rem' }}
            >
              📥 Download CSV
            </Button>
            <Button 
              variant={copySuccess ? "success" : "outline-primary"} 
              size="sm"
              onClick={handleCopyToClipboard}
              style={{ fontSize: '0.8rem' }}
            >
              {copySuccess ? '✓ Copied!' : '📋 Copy Table'}
            </Button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-bordered table-sm">
            <thead>
              <tr>
                {Object.keys(tableData[0] || {}).map((key, idx) => (
                  <th key={idx}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  