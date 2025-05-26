const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { Cashfree } = require('cashfree-pg');
require('dotenv').config();
const PORT = process.env.PORT 

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Cashfree credentials
Cashfree.XClientId = process.env.CLIENT_ID;
Cashfree.XClientSecret = process.env.CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX; // Change to PRODUCTION for live mode

// Generate a unique order ID
function generateOrderId() {
  const uniqueId = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256');
  hash.update(uniqueId);
  const orderId = hash.digest('hex');
  return orderId.substr(0, 12); // Limit to first 12 characters
}

// Route to handle payment request
app.get('/payment', async (req, res) => {
  try {
    const { amount, customer_name, country_code, customer_phone, customer_email } = req.query;

    // Validate incoming data
    if (!amount || !customer_name || !country_code || !customer_phone || !customer_email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const orderId = await generateOrderId();

    const safeCustomerId = `${customer_name}_${customer_phone}`.replace(/[^a-zA-Z0-9_-]/g, "_");

    const request = {
      order_amount: parseFloat(amount), // Convert amount to number
      order_currency: "INR",
      order_id: orderId,
      customer_details: {
        customer_id: safeCustomerId, // Use email as unique customer ID
        customer_phone,
        customer_name,
        customer_email,
      },
    };

    // Create a payment session
    Cashfree.PGCreateOrder("2023-08-01", request)
      .then(response => {
        console.log(response.data);
        res.json({
          payment_session_id: response.data.payment_session_id,
          order_id: orderId
        });
      })
      .catch(error => {
        console.error(error.response?.data?.message || error.message);
        res.status(500).json({ message: "Error while creating payment session" });
      });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Route to verify payment status
app.post('/verify', async (req, res) => {
  try {
    const { orderId } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    // Fetch payment status
    Cashfree.PGOrderFetchPayments("2023-08-01", orderId)
      .then(response => {
        console.log(response.data);
        res.json(response.data); // Return the payment verification details
      })
      .catch(error => {
        console.error(error.response?.data?.message || error.message);
        res.status(500).json({ message: "Error while verifying payment" });
      });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
