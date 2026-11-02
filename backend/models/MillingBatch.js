const mongoose = require('mongoose');

/**
 * One milling run: consumes maize (kg) and produces flour bales + bran (kg).
 * This is the conversion step between raw stock and sellable stock.
 */
const millingBatchSchema = new mongoose.Schema(
  {
    batchNumber: { type: String, required: true, unique: true, trim: true },
    maizeUsedKg: { type: Number, required: true, min: 0.01 },

    flourBaleWeightKg: { type: Number, required: true, default: 50, min: 0.01 }, // standard bale size used for this batch
    flourBalesProduced: { type: Number, required: true, min: 0 },

    branProducedKg: { type: Number, required: true, min: 0 },

    millingDate: { type: Date, required: true, default: Date.now },
    machineOperator: { type: String, trim: true, maxlength: 150 },
    notes: { type: String, maxlength: 500 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Yield% = (flour output kg + bran output kg) / maize input kg — useful QA metric
millingBatchSchema.virtual('flourOutputKg').get(function () {
  return this.flourBalesProduced * this.flourBaleWeightKg;
});

millingBatchSchema.virtual('yieldPercent').get(function () {
  const outputKg = this.flourBalesProduced * this.flourBaleWeightKg + this.branProducedKg;
  return this.maizeUsedKg > 0 ? Number(((outputKg / this.maizeUsedKg) * 100).toFixed(2)) : 0;
});

millingBatchSchema.set('toJSON', { virtuals: true });
millingBatchSchema.set('toObject', { virtuals: true });
millingBatchSchema.index({ millingDate: -1 });

module.exports = mongoose.model('MillingBatch', millingBatchSchema);
