const mongoose = require('mongoose');

/**
 * Every bag/tonne of maize bought from a supplier.
 * quantityKg is the canonical unit; bags is a convenience display field.
 */
const maizePurchaseSchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true, trim: true, maxlength: 150 },
    quantityKg: { type: Number, required: true, min: 0.01 },
    bags: { type: Number, min: 0 }, // optional, e.g. 90kg bags count
    pricePerKg: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 }, // quantityKg * pricePerKg, validated in route
    purchaseDate: { type: Date, required: true, default: Date.now },
    moisturePercent: { type: Number, min: 0, max: 100 }, // quality check at intake
    notes: { type: String, maxlength: 500 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

maizePurchaseSchema.index({ purchaseDate: -1 });

module.exports = mongoose.model('MaizePurchase', maizePurchaseSchema);
