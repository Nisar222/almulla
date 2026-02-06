// Al Mulla Exchange - VAPI Webhook Server (Vercel)
// Endpoints:
//  POST /get-exchange-rate
//  POST /verify-phone-number
//  POST /get-transaction-status

const express = require("express");
const app = express();

app.use(express.json());

// CORS (simple demo). In production, restrict origins + add API key auth.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/**
 * OPTIONAL (recommended): simple API key protection
 * Set in Vercel env: API_KEY="..."
 * Then configure Vapi tool to send header x-api-key
 */
function requireApiKey(req, res) {
  const required = process.env.API_KEY;
  if (!required) return true; // allow if not configured (demo mode)
  const provided = req.headers["x-api-key"];
  if (provided && provided === required) return true;

  res.status(401).json({
    results: [
      {
        success: false,
        errorCode: "UNAUTHORIZED",
        message: "Invalid API key",
      },
    ],
  });
  return false;
}

/** Helpers */
function vapiArgs(req) {
  // Supports Vapi tool call shape OR direct JSON
  return req.body?.message?.toolCalls?.[0]?.function?.arguments || req.body || {};
}

function normalizeDigits(s) {
  return String(s || "").replace(/[^0-9]/g, "");
}

function normalizeText(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function ok(payload) {
  return { results: [{ success: true, ...payload }] };
}

function fail(errorCode, message, extra = {}) {
  return { results: [{ success: false, errorCode, message, ...extra }] };
}

/** Mock Exchange Rates (TODO: replace with Excel / data source) */
const exchangeRates = {
  India: { country: "India", currency: "Indian Rupee", currencyCode: "INR", rate: "293.005", commission: 1.25 },
  Pakistan: { country: "Pakistan", currency: "Pakistani Rupee", currencyCode: "PKR", rate: "895.014", commission: 0 },
  "Sri Lanka": { country: "Sri Lanka", currency: "Sri Lankan Rupee", currencyCode: "LKR", rate: "1000.01", commission: 1.25 },
  "United States": { country: "United States", currency: "US Dollar", currencyCode: "USD", rate: "3.25839", commission: 12 },
  Bangladesh: { country: "Bangladesh", currency: "Bangladeshi Taka", currencyCode: "BDT", rate: "400.49", commission: 1.25 },
  "Saudi Arabia": { country: "Saudi Arabia", currency: "Saudi Riyal", currencyCode: "SAR", rate: "12.152", commission: 2.5 },
  Philippines: { country: "Philippines", currency: "Philippine Peso", currencyCode: "PHP", rate: "189.508", commission: 1.25 },
  Egypt: { country: "Egypt", currency: "Egyptian Pound", currencyCode: "EGP", rate: "For 1000 EGP = 6.588 KWD", commission: 1.5 },
};

// Simple aliases for caller language variations
const countryAliases = {
  usa: "United States",
  us: "United States",
  uae: "United Arab Emirates", // (only if you add it to exchangeRates)
};

function findCountryRate(countryInput) {
  const c = normalizeText(countryInput);
  const aliased = countryAliases[c] || countryInput;

  const foundKey = Object.keys(exchangeRates).find(
    (k) => normalizeText(k) === normalizeText(aliased)
  );
  return foundKey ? exchangeRates[foundKey] : null;
}

/** Mock Transactions (TODO: replace with CRM/core system) */
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
    channel: "Online",
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
    channel: "Online",
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
    channel: "Branch",
  },
];

function findCustomerByPhone(phoneNumber) {
  const normalized = normalizeDigits(phoneNumber);
  if (!normalized) return null;

  return transactions.find((t) => {
    const txnPhone = normalizeDigits(t.mobileNumber);
    return txnPhone === normalized || normalized.endsWith(txnPhone) || txnPhone.endsWith(normalized);
  });
}

function findLastTransactionByPhone(phoneNumber) {
  const normalized = normalizeDigits(phoneNumber);
  const list = transactions.filter((t) => {
    const txnPhone = normalizeDigits(t.mobileNumber);
    return txnPhone === normalized || normalized.endsWith(txnPhone) || txnPhone.endsWith(normalized);
  });
  return list.length ? list[list.length - 1] : null;
}

function findTransactionByReferenceAndName(reference, customerName) {
  const ref = String(reference || "").trim();
  const name = normalizeText(customerName);
  if (!ref || !name) return null;

  return transactions.find(
    (t) => t.transactionReference === ref && normalizeText(t.customerName) === name
  );
}

function kycMatches(txn, kyc) {
  // Only enforce checks for fields that were provided
  const mismatches = [];

  if (kyc.nationality) {
    if (normalizeText(txn.nationality) !== normalizeText(kyc.nationality)) {
      mismatches.push("nationality");
    }
  }
  if (kyc.beneficiaryName) {
    if (normalizeText(txn.beneficiaryName) !== normalizeText(kyc.beneficiaryName)) {
      mismatches.push("beneficiaryName");
    }
  }
  if (kyc.beneficiaryBank) {
    if (normalizeText(txn.beneficiaryBank) !== normalizeText(kyc.beneficiaryBank)) {
      mismatches.push("beneficiaryBank");
    }
  }

  return { ok: mismatches.length === 0, mismatches };
}

/** Health check */
app.get("/", (req, res) => {
  res.json(
    ok({
      status: "Al Mulla Exchange VAPI Server Running",
      endpoints: ["/get-exchange-rate", "/verify-phone-number", "/get-transaction-status"],
    })
  );
});

/** Tool 1: get_exchange_rate */
app.post("/get-exchange-rate", (req, res) => {
  if (!requireApiKey(req, res)) return;

  const args = vapiArgs(req);
  const country = args.country;

  if (!country) {
    return res.json(fail("MISSING_COUNTRY", "Country parameter required"));
  }

  const rate = findCountryRate(country);
  if (!rate) {
    return res.json(fail("COUNTRY_NOT_FOUND", "Country not found", { country }));
  }

  return res.json(ok(rate));
});

/** Tool 2: verify_phone_number */
app.post("/verify-phone-number", (req, res) => {
  if (!requireApiKey(req, res)) return;

  const args = vapiArgs(req);
  const phoneNumber = args.phoneNumber;

  if (!phoneNumber) {
    return res.json(ok({ verified: false, customerName: null, hasTransactions: false }));
  }

  const customer = findCustomerByPhone(phoneNumber);
  if (!customer) {
    return res.json(ok({ verified: false, customerName: null, hasTransactions: false }));
  }

  return res.json(
    ok({
      verified: true,
      customerName: customer.customerName,
      hasTransactions: true,
    })
  );
});

/**
 * Tool 3: get_transaction_status
 * Supports:
 *  - phoneNumber (preferred)
 *  - OR transactionReference + customerName
 * Optional KYC checks:
 *  - nationality
 *  - beneficiaryName
 *  - beneficiaryBank
 */
app.post("/get-transaction-status", (req, res) => {
  if (!requireApiKey(req, res)) return;

  const args = vapiArgs(req);

  const phoneNumber = args.phoneNumber;
  const transactionReference = args.transactionReference;
  const customerName = args.customerName;

  const nationality = args.nationality;
  const beneficiaryName = args.beneficiaryName;
  const beneficiaryBank = args.beneficiaryBank;

  let txn = null;

  if (phoneNumber) {
    txn = findLastTransactionByPhone(phoneNumber);
  } else if (transactionReference && customerName) {
    txn = findTransactionByReferenceAndName(transactionReference, customerName);
  } else {
    return res.json(
      fail(
        "MISSING_LOOKUP_FIELDS",
        "Provide phoneNumber OR transactionReference + customerName"
      )
    );
  }

  if (!txn) {
    return res.json(fail("TXN_NOT_FOUND", "No transactions found"));
  }

  // Enforce KYC checks if provided
  const kyc = { nationality, beneficiaryName, beneficiaryBank };
  const anyKycProvided = Object.values(kyc).some(Boolean);

  if (anyKycProvided) {
    const check = kycMatches(txn, kyc);
    if (!check.ok) {
      return res.json(
        fail(
          "KYC_MISMATCH",
          "KYC details do not match our records",
          { mismatchedFields: check.mismatches }
        )
      );
    }
  }

  // Return the transaction details
  return res.json(ok(txn));
});

module.exports = app;

// Local dev
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on :${PORT}`));
}
