const mongoose = require('mongoose');

const flourSaleSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, maxlength: 150 },
    balesSold: { type: Number, required: true, min: 0.01 },
    pricePerBale: { type: Number, required: true, min: 0 },
    amountSold: { type: Number, required: true, min: 0 }, // balesSold * pricePerBale, validated in route
    saleDate: { type: Date, required: true, default: Date.now },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'paid',
    },
    amountPaid: { type: Number, min: 0, default: 0 },
    notes: { type: String, maxlength: 500 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

flourSaleSchema.index({ saleDate: -1 });

module.exports = mongoose.model('FlourSale', flourSaleSchema);
