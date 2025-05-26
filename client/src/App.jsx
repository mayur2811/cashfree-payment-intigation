import { useState } from 'react'
import axios from "axios"
import { load } from '@cashfreepayments/cashfree-js'

function App() {
  let cashfree;

  // Initialize the Cashfree SDK
  let initializeSDK = async function () {
    cashfree = await load({
      mode: "sandbox",  // Change to "production" in live mode
    })
  }

  // Initialize SDK when the component mounts
  initializeSDK()

  // State for storing order ID, amount, and customer details
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState(1);  // Default amount set to 1
  const [formData, setFormData] = useState({
    customer_name: "",
    country_code: "+91",  // Default country code (India)
    customer_phone: "",
    customer_email: ""
  });

  // List of country codes for the dropdown
  const countryCodes = [
    { code: "+1", country: "USA" },
    { code: "+91", country: "India" },
    { code: "+44", country: "UK" },
    { code: "+61", country: "Australia" },
    { code: "+81", country: "Japan" },
    // Add more country codes as needed
  ];

  // Handle payment session creation
  const getSessionId = async () => {
    try {
      let res = await axios.get("http://localhost:8000/payment", {
        params: {
          amount: amount,
          ...formData,  // Send customer details as well
        }
      });

      if (res.data && res.data.payment_session_id) {
        console.log(res.data);
        setOrderId(res.data.order_id);
        return res.data.payment_session_id;
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Verify payment
  const verifyPayment = async () => {
    try {
      let res = await axios.post("http://localhost:8000/verify", {
        orderId: orderId,
      });

      if (res && res.data) {
        alert("Payment verified");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Handle the payment process
  const handleClick = async (e) => {
    e.preventDefault();
    try {
      let sessionId = await getSessionId();
      let checkoutOptions = {
        paymentSessionId: sessionId,
        redirectTarget: "_modal",  // Modal for payment interface
      };

      cashfree.checkout(checkoutOptions).then(() => {
        
        console.log("Payment initialized");
        verifyPayment(orderId);
      });
    } catch (error) {
      console.log(error);
    }
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "order_amount" && value >= 0) {
      setAmount(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  }

  return (
    <div className="container">
      <h1>Cashfree Payment Gateway</h1>
      
      {/* Payment Form */}
      <form onSubmit={handleClick}>
        <label htmlFor="customer_name">Full Name</label>
        <input
          type="text"
          name="customer_name"
          placeholder="Enter your name"
          value={formData.customer_name}
          onChange={handleChange}
          required
        />

        <label htmlFor="country_code">Country Code</label>
        <select
          name="country_code"
          value={formData.country_code}
          onChange={handleChange}
          required
        >
          {countryCodes.map((country) => (
            <option key={country.code} value={country.code}>
              {country.code} ({country.country})
            </option>
          ))}
        </select>

        <label htmlFor="customer_phone">Phone Number</label>
        <input
          type="text"
          name="customer_phone"
          placeholder="Enter your phone number"
          value={formData.customer_phone}
          onChange={handleChange}
          required
        />

        <label htmlFor="customer_email">Email</label>
        <input
          type="email"
          name="customer_email"
          placeholder="Enter your email"
          value={formData.customer_email}
          onChange={handleChange}
          required
        />

        <label htmlFor="amount">Enter Payment Amount (INR)</label>
        <input
          type="number"
          name="order_amount"
          placeholder="Enter amount"
          value={amount}
          onChange={handleChange}
          min="0"  // Prevent negative input directly
          required
        />

        <div >
          <button type="submit">Pay Now</button>
        </div>
      </form>
    </div>
  );
}

export default App;
