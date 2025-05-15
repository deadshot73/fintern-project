import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import axios from 'axios';

function CompanyAdminPage() {
  const [company, setCompany] = useState({ name: '', sector: '', exchange: '', country: '', ticker: '' });
  const [uploadForm, setUploadForm] = useState({ ticker: '', statement: 'income', year: '' });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleCompanySubmit = async () => {
    try {
      await axios.post(`http://localhost:5000/api/companies/${company.ticker}`, company);
      setMessage('✅ Company added or updated!');
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to save company.');
    }
  };

  const handleExcelUpload = async () => {
    if (!file) return setMessage('❌ Please upload a file');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const wb = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const financialData = {};

      data.forEach(row => {
        if (row[0] && row[1] !== undefined) {
          financialData[row[0]] = row[1] === '--' ? null : row[1];
        }
      });

      try {
        await axios.post(`http://localhost:5000/api/companies/${uploadForm.ticker}/${uploadForm.statement}/${uploadForm.year}`, {
          data: financialData
        });
        setMessage('✅ Financial data uploaded!');
      } catch (err) {
        console.error(err);
        setMessage('❌ Upload failed.');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="container mt-4">
      <h3>Company Admin Panel</h3>
      {message && <Alert variant="info">{message}</Alert>}

      {/* Add Company Section */}
      <Card className="mb-4 p-3">
        <h5>Add Company</h5>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Ticker</Form.Label>
            <Form.Control onChange={(e) => setCompany({ ...company, ticker: e.target.value.toUpperCase() })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Name</Form.Label>
            <Form.Control onChange={(e) => setCompany({ ...company, name: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Sector</Form.Label>
            <Form.Control onChange={(e) => setCompany({ ...company, sector: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Exchange</Form.Label>
            <Form.Control onChange={(e) => setCompany({ ...company, exchange: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Country</Form.Label>
            <Form.Control onChange={(e) => setCompany({ ...company, country: e.target.value })} />
          </Form.Group>
          <Button variant="primary" onClick={handleCompanySubmit}>Add Company</Button>
        </Form>
      </Card>

      {/* Upload Financials */}
      <Card className="p-3">
        <h5>Upload Financials</h5>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Company Ticker</Form.Label>
            <Form.Control onChange={(e) => setUploadForm({ ...uploadForm, ticker: e.target.value.toUpperCase() })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Statement Type</Form.Label>
            <Form.Select onChange={(e) => setUploadForm({ ...uploadForm, statement: e.target.value })}>
              <option value="income">Income Statement</option>
              <option value="balance">Balance Sheet</option>
              <option value="cashflow">Cash Flow</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Year</Form.Label>
            <Form.Control onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Excel File</Form.Label>
            <Form.Control type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} />
          </Form.Group>
          <Button variant="success" onClick={handleExcelUpload}>Upload Financials</Button>
        </Form>
      </Card>
    </div>
  );
}

export default CompanyAdminPage;
