const mongoose = require('mongoose');
const Company = require('./models/Company');

mongoose.connect('mongodb+srv://mailparththakral:2Ba72zNukWjm5oiN@fintern.waeq6ms.mongodb.net/?retryWrites=true&w=majority&appName=fintern', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

Company.create({
  name: 'Apple Inc.',
  ticker: 'AAPL',
  sector: 'Technology',
  exchange: 'NASDAQ',
  country: 'USA',
  financials: {
    incomeStatements: [],
    balanceSheets: [],
    cashFlowStatements: []
  }
}).then(() => {
  console.log('Company created');
  mongoose.disconnect();
});
