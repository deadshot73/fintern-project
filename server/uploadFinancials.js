const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Company = require('./models/Company');
const FinancialReport = require('./models/FinancialReport');

const workbook = xlsx.readFile('./Apple_Financials.xlsx'); // replace with your actual file
const companyTicker = 'AAPL';

async function uploadData() {
  await mongoose.connect('mongodb+srv://...'); // replace with your Mongo URI

  const company = await Company.findOne({ ticker: companyTicker });
  if (!company) {
    console.error('Company not found in DB. Create it first.');
    return;
  }

  const statementTypes = ['income', 'cash_flow', 'balance'];
  for (const type of statementTypes) {
    const sheet = workbook.Sheets[type];
    if (!sheet) continue;

    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const fields = json.slice(1).map(row => row[0]);
    const years = json[0].slice(1);

    for (let y = 0; y < years.length; y++) {
      const data = {};
      for (let i = 0; i < fields.length; i++) {
        const value = json[i + 1][y + 1]; // +1 to skip first column
        if (fields[i]) data[fields[i]] = value || 0;
      }

      const report = new FinancialReport({
        companyId: company._id,
        fiscalYear: years[y],
        statementType: type,
        data,
      });

      await report.save();

      // Add report to company
      const key = `${type}Statements`;
      company.financials[key].push(report._id);
    }
  }

  await company.save();
  console.log('Upload complete ✅');
  mongoose.disconnect();
}

uploadData();
