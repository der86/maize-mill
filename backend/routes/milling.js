const express = require('express');
const { body, query } = require('express-validator');
const MillingBatch = require('../models/MillingBatch');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

const millingValidators = [
  body('batchNumber').trim().notEmpty().withMessage('Batch number is required').isLength({ max: 50 }),
  body('maizeUsedKg').isFloat({ gt: 0 }).withMessage('Maize used (kg) must be positive'),
  body('flourBaleWeightKg').optional().isFloat({ gt: 0 }),
  body('flourBalesProduced').isFloat({ min: 0 }).withMessage('Flour bales produced must be zero or positive'),
  body('branProducedKg').isFloat({ min: 0 }).withMessage('Bran produced (kg) must be zero or positive'),
  body('millingDate').optional().isISO8601().toDate(),
  body('machineOperator').optional().isLength({ max: 150 }),
  body('notes').optional().isLength({ max: 500 }),
];

router.get(
  '/',
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 200 })],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filter = {};
      if (req.query.from || req.query.to) {
        filter.millingDate = {};
        if (req.query.from) filter.millingDate.$gte = new Date(req.query.from);
        if (req.query.to) filter.millingDate.$lte = new Date(req.query.to);
      }

      const [items, total] = await Promise.all([
        MillingBatch.find(filter)
          .sort({ millingDate: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('recordedBy', 'name email'),
        MillingBatch.countDocuments(filter),
      ]);

      res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/', authorize('admin', 'manager', 'operator'), millingValidators, validate, async (req, res, next) => {
  try {
    const {
      batchNumber,
      maizeUsedKg,
      flourBaleWeightKg,
      flourBalesProduced,
      branProducedKg,
      millingDate,
      machineOperator,
      notes,
    } = req.body;

    const batch = await MillingBatch.create({
      batchNumber,
      maizeUsedKg,
      flourBaleWeightKg,
      flourBalesProduced,
      branProducedKg,
      millingDate,
      machineOperator,
      notes,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('admin', 'manager'), millingValidators, validate, async (req, res, next) => {
  try {
    const {
      batchNumber,
      maizeUsedKg,
      flourBaleWeightKg,
      flourBalesProduced,
      branProducedKg,
      millingDate,
      machineOperator,
      notes,
    } = req.body;

    const batch = await MillingBatch.findByIdAndUpdate(
      req.params.id,
      {
        batchNumber,
        maizeUsedKg,
        flourBaleWeightKg,
        flourBalesProduced,
        branProducedKg,
        millingDate,
        machineOperator,
        notes,
      },
      { new: true, runValidators: true }
    );
    if (!batch) return res.status(404).json({ success: false, message: 'Milling batch not found.' });
    res.json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const batch = await MillingBatch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Milling batch not found.' });
    res.json({ success: true, message: 'Milling batch deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
