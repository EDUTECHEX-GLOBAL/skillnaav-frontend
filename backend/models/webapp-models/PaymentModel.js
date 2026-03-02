const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    planType: { type: String, required: true },
    amount: { type: Number, required: true },      // ✅ Fixed: Number instead of String
    paymentId: { type: String, required: true },   // ✅ Real capture transaction ID
    orderId: { type: String, required: true },     // ✅ PayPal order ID
    status: { type: String, default: "Pending" },
    premiumExpiration: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", PaymentSchema);
