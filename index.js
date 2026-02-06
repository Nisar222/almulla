// Al Mulla Exchange - VAPI Webhook Server
// Deploy to Vercel

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// CORS for VAPI
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Exchange rates data
const exchangeRates = {
  "India": {
    country: "India",
    currency: "Indian Rupee",
    currencyCode: "INR",
    rate: "293.005",
    commission: 1.25
  },
  "Pakistan": {
    country: "Pakistan",
    currency: "Pakistani Rupee",
    currencyCode: "PKR",
    rate: "895.014",
    commission: 0
  },
  "Sri Lanka": {
    country: "Sri Lanka",
    currency: "Sri Lankan Rupee",
    currencyCode: "LKR",
    rate: "1000.01",
    commission: 1.25
  },
  "United States": {
    country: "United States",
    currency: "US Dollar",
    currencyCode: "USD",
    rate: "3.25839",
    commission: 12
  },
  "Bangladesh": {
    country: "Bangladesh",
    currency: "Bangladeshi Taka",
    currencyCode: "BDT",
    rate: "400.49",
    commission: 1.25
  },
  "Saudi Arabia": {
    country: "Saudi Arabia",
    currency: "Saudi Riyal",
    currencyCode: "SAR",
    rate: "12.152",
    commission: 2.5
  },
  "Philippines": {
    country: "Philippines",
    currency: "Philippine Peso",
    currencyCode: "PHP",
    rate: "189.508",
    commission: 1.25
  },
  "Egypt": {
    country: "Egypt",
    currency: "Egyptian Pound",
    currencyCode: "EGP",
    rate: "For 1000 EGP = 6.588 KWD",
    commission: 1.5
  }
};

// Customer transactions data
const transactions = [
  {
    transactionReference: "6573670",
    customerName: "Nithin",
    mobileNumber: "919582301703",
    transactionDate: "November 7th, 2025",
    amountKWD: 300.0,
    beneficiaryName: "Nithin",
    beneficiaryBank: "SBI",
    nationality: "India",
    status: "Transaction processed to beneficiary bank",
    channel: "Online"
  },
  {
    transactionReference: "4560157",
    customerName: "Kareem",
    mobileNumber: "96597215518",
    transactionDate: "November 5th, 2025",
    amountKWD: 300.0,
    beneficiaryName: "Kareem",
    beneficiaryBank: "BMR",
    nationality: "Egypt",
    status: "Transaction on hold",
    channel: "Online"
  },
  {
    transactionReference: "7603475",
    customerName: "Nazmul",
    mobileNumber: "96550480304",
    transactionDate: "November 4th, 2025",
    amountKWD: 300.0,
    beneficiaryName: "Nazmul",
    beneficiaryBank: "Agrani",
    nationality: "Bangladesh",
    status: "Transaction rejected",
    channel: "Branch"
  },
  {
    transactionReference: "20031630",
    customerName: "Philip Koshy",
    mobileNumber: "96597271511",
    transactionDate: "November 6th, 2025",
    amountKWD: 400.0,
    beneficiaryName: "Philip Koshy",
    beneficiaryBank: "ICICI",
    nationality: "India",
    status: "Transaction rejected",
    channel: "Kiosk"
  }
];

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Al Mulla Exchange VAPI Server Running',
    endpoints: ['/get-exchange-rate', '/verify-phone-number', '/get-transaction-status']
  });
});

// Function 1: Get Exchange Rate
app.post('/get-exchange-rate', (req, res) => {
  console.log('Exchange rate request:', req.body);
  
  const country = req.body.message?.toolCalls?.[0]?.function?.arguments?.country || 
                  req.body.country;
  
  if (!country) {
    return res.json({ error: "Country parameter required" });
  }

  // Case-insensitive search
  const foundCountry = Object.keys(exchangeRates).find(
    key => key.toLowerCase() === country.toLowerCase()
  );

  if (foundCountry) {
    const result = exchangeRates[foundCountry];
    console.log('Rate found:', result);
    return res.json({ results: [result] });
  }

  console.log('Country not found:', country);
  res.json({ results: [{ error: "Country not found" }] });
});

// Function 2: Verify Phone Number
app.post('/verify-phone-number', (req, res) => {
  console.log('Phone verification request:', req.body);
  
  const phoneNumber = req.body.message?.toolCalls?.[0]?.function?.arguments?.phoneNumber || 
                      req.body.phoneNumber;
  
  if (!phoneNumber) {
    return res.json({ 
      results: [{
        verified: false,
        customerName: null,
        hasTransactions: false
      }]
    });
  }

  // Normalize phone number
  const normalized = phoneNumber.replace(/[^0-9]/g, '');
  console.log('Normalized phone:', normalized);

  // Find customer
  const customer = transactions.find(t => {
    const txnPhone = t.mobileNumber.replace(/[^0-9]/g, '');
    return txnPhone === normalized || 
           normalized.endsWith(txnPhone) || 
           txnPhone.endsWith(normalized);
  });

  if (customer) {
    console.log('Customer found:', customer.customerName);
    return res.json({ 
      results: [{
        verified: true,
        customerName: customer.customerName,
        hasTransactions: true
      }]
    });
  }

  console.log('Customer not found');
  res.json({ 
    results: [{
      verified: false,
      customerName: null,
      hasTransactions: false
    }]
  });
});

// Function 3: Get Transaction Status
app.post('/get-transaction-status', (req, res) => {
  console.log('Transaction status request:', req.body);
  
  const args = req.body.message?.toolCalls?.[0]?.function?.arguments || req.body;
  const phoneNumber = args.phoneNumber;
  const transactionReference = args.transactionReference;
  const customerName = args.customerName;

  let transaction = null;

  // Search by phone number
  if (phoneNumber) {
    const normalized = phoneNumber.replace(/[^0-9]/g, '');
    console.log('Searching by phone:', normalized);
    
    const customerTxns = transactions.filter(t => {
      const txnPhone = t.mobileNumber.replace(/[^0-9]/g, '');
      return txnPhone === normalized || 
             normalized.endsWith(txnPhone) || 
             txnPhone.endsWith(normalized);
    });

    if (customerTxns.length > 0) {
      transaction = customerTxns[customerTxns.length - 1]; // Most recent
    }
  } 
  // Search by reference and name
  else if (transactionReference && customerName) {
    console.log('Searching by reference:', transactionReference);
    transaction = transactions.find(t =>
      t.transactionReference === transactionReference &&
      t.customerName.toLowerCase() === customerName.toLowerCase()
    );
  }

  if (transaction) {
    console.log('Transaction found:', transaction.transactionReference);
    return res.json({ results: [transaction] });
  }

  console.log('Transaction not found');
  res.json({ results: [{ error: "No transactions found" }] });
});

// For Vercel serverless
module.exports = app;

// For local testing
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Al Mulla Exchange VAPI Server running on port ${PORT}`);
  });
}
