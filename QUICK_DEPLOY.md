# QUICK VERCEL DEPLOYMENT - Al Mulla Exchange
## Deploy in 5 Minutes

---

## 🚀 **OPTION 1: Vercel (Easiest - Recommended)**

### **Step 1: Install Vercel CLI**

```bash
npm install -g vercel
```

### **Step 2: Deploy**

1. Download these 3 files to a folder on your computer:
   - `api/index.js`
   - `package.json`
   - `vercel.json`

2. Open terminal in that folder

3. Run:
```bash
vercel
```

4. Answer the prompts:
   - Set up and deploy? **Y**
   - Which scope? **(select your account)**
   - Link to existing project? **N**
   - Project name? **almulla-vapi** (or whatever you want)
   - Directory? **./  (press Enter)**
   - Override settings? **N**

5. **Done!** You'll get a URL like: `https://almulla-vapi.vercel.app`

---

## 🔗 **Your Webhook URLs Will Be:**

After deployment, your endpoints will be:

```
https://YOUR-PROJECT.vercel.app/get-exchange-rate
https://YOUR-PROJECT.vercel.app/verify-phone-number
https://YOUR-PROJECT.vercel.app/get-transaction-status
```

---

## ⚙️ **STEP 3: Configure VAPI Tools**

### **Tool 1: get_exchange_rate**

1. VAPI Dashboard → Tools → + Create Tool
2. Select **"API Request"**
3. **Name:** `get_exchange_rate`
4. **URL:** `https://YOUR-PROJECT.vercel.app/get-exchange-rate`
5. **Method:** POST
6. **Request Body (JSON Schema):**

```json
{
  "type": "object",
  "properties": {
    "country": {
      "type": "string",
      "description": "The destination country name"
    }
  },
  "required": ["country"]
}
```

7. Save

---

### **Tool 2: verify_phone_number**

1. Create Tool → API Request
2. **Name:** `verify_phone_number`
3. **URL:** `https://YOUR-PROJECT.vercel.app/verify-phone-number`
4. **Method:** POST
5. **Request Body:**

```json
{
  "type": "object",
  "properties": {
    "phoneNumber": {
      "type": "string",
      "description": "Phone number to verify"
    }
  },
  "required": ["phoneNumber"]
}
```

6. Save

---

### **Tool 3: get_transaction_status**

1. Create Tool → API Request
2. **Name:** `get_transaction_status`
3. **URL:** `https://YOUR-PROJECT.vercel.app/get-transaction-status`
4. **Method:** POST
5. **Request Body:**

```json
{
  "type": "object",
  "properties": {
    "phoneNumber": {
      "type": "string",
      "description": "Customer phone number"
    },
    "transactionReference": {
      "type": "string",
      "description": "Transaction reference number"
    },
    "customerName": {
      "type": "string",
      "description": "Customer name for verification"
    }
  }
}
```

6. Save

---

## 🧪 **Test Your Deployment**

### **Test 1: Health Check**

Open browser and go to:
```
https://YOUR-PROJECT.vercel.app/
```

Should see:
```json
{
  "status": "Al Mulla Exchange VAPI Server Running",
  "endpoints": [...]
}
```

### **Test 2: Exchange Rate (using curl or Postman)**

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/get-exchange-rate \
  -H "Content-Type: application/json" \
  -d '{"country": "India"}'
```

Should return rate data.

---

## 🎯 **Add to Your Assistant**

1. Go to your assistant
2. Scroll to **Tools** section
3. Add all 3 tools you created
4. Add **Transfer Call** tool (built-in)
5. Save assistant

---

## 🚀 **DONE!**

Your demo is ready. Test with a call!

---

## 🐛 **Troubleshooting**

### **Vercel deployment failed?**

Make sure files are in correct structure:
```
your-folder/
├── api/
│   └── index.js
├── package.json
└── vercel.json
```

### **VAPI not calling webhook?**

- Check URL is correct (https://)
- Check tool is added to assistant
- Check VAPI logs for errors

### **Getting errors in response?**

Check Vercel logs:
```bash
vercel logs
```

---

## 📞 **For Tomorrow's Demo**

Test these scenarios before demo:

1. ✅ "What's the rate for India?"
2. ✅ "Check my transaction status" (from +919582301703)
3. ✅ "I want to update my address" (should transfer)

**Good luck with the demo!** 🎯
