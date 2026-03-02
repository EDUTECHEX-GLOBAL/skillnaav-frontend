const express = require("express");
const router = express.Router();
const axios = require("axios");
const { getAccessToken } = require("../../utils/paypal");
const Payment = require("../../models/webapp-models/PaymentModel");
const User = require("../../models/webapp-models/userModel");
const { authenticate } = require("../../middlewares/authMiddleware"); // ✅ Auth middleware

// ─────────────────────────────────────────────
// POST /api/payments/paypal/order
// ─────────────────────────────────────────────
router.post("/paypal/order", authenticate, async (req, res) => {
  const { amount, userId, planType, email, duration } = req.body;

  if (!amount || !userId || !planType || !email || !duration)
    return res.status(400).json({ success: false, message: "Missing required fields" });

  try {
    const accessToken = await getAccessToken();
    const value = parseFloat(amount).toFixed(2);

    const response = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [{ amount: { currency_code: "USD", value } }],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ success: true, id: response.data.id });
  } catch (err) {
    if (err.response) {
      console.error("❌ Error creating PayPal order:", err.response.data);
      res.status(500).json({ success: false, message: "Error creating order", details: err.response.data });
    } else {
      console.error("❌ Error creating PayPal order:", err.message);
      res.status(500).json({ success: false, message: "Error creating order", details: err.message });
    }
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/paypal/verify
// ─────────────────────────────────────────────
router.post("/paypal/verify", authenticate, async (req, res) => {
  const { orderID, userId, planType, amount, email, duration } = req.body;

  if (!orderID || !userId || !planType || !amount || !email || !duration) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // ✅ Fixed: safe numeric parse (handles "2", "7", "30", etc.)
  const days = parseInt(duration, 10);
  if (!Number.isFinite(days) || days <= 0) {
    return res.status(400).json({ success: false, message: "Invalid duration" });
  }

  try {
    const accessToken = await getAccessToken();

    // ✅ Fixed: capture response verified before trusting success
    const captureRes = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${orderID}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureStatus = captureRes.data?.status;
    if (captureStatus !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: `Payment capture not completed. Status: ${captureStatus}`,
      });
    }

    // ✅ Fixed: real capture transaction ID extracted
    const captureId =
      captureRes.data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderID;

    const now = Date.now();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Stack expiry on top of existing active premium
    let baseTime = now;
    if (userDoc.premiumExpiration && new Date(userDoc.premiumExpiration).getTime() > now) {
      baseTime = new Date(userDoc.premiumExpiration).getTime();
    }
    const premiumExpiration = new Date(baseTime + days * MS_PER_DAY);

    // ✅ Fixed: amount as Number, paymentId = capture ID, orderId = order ID
    const payment = new Payment({
      userId,
      planType,
      email,
      amount: parseFloat(amount),
      paymentId: captureId,
      orderId: orderID,
      status: "Success",
      premiumExpiration,
    });
    await payment.save();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isPremium: true, planType, premiumExpiration } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found after update" });
    }

    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    const issue = err.response?.data?.details?.[0]?.issue;

    if (issue === "INSTRUMENT_DECLINED") {
      return res.status(400).json({
        success: false,
        retry: true,
        details: err.response.data,
      });
    }

    console.error("❌ FULL ERROR in /paypal/verify:", err.response?.data || err);

    return res.status(500).json({
      success: false,
      message: "PayPal capture failed",
      details: err.response?.data || null,
    });
  }
});

module.exports = router;
