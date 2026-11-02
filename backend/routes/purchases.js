const express = require('express');
const { body, query } = require('express-validator');
const MaizePurchase = require('../models/MaizePurchase');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect); // every route below requires login

const purchaseValidators = [
  body('supplierName').trim().notEmpty().withMessage('Supplier name is required').isLength({ max: 150 }),
  body('quantityKg').isFloat({ gt: 0 }).withMessage('Quantity (kg) must be a positive number'),
  body('bags').optional().isFloat({ min: 0 }),
  body('pricePerKg').isFloat({ min: 0 }).withMessage('Price per kg must be zero or positive'),
  body('purchaseDate').optional().isISO8601().toDate(),
  body('moisturePercent').optional().isFloat({ min: 0, max: 100 }),
  body('notes').optional().isLength({ max: 500 }),
];

// GET /api/purchases?page=1&limit=20&from=&to=
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
        filter.purchaseDate = {};
        if (req.query.from) filter.purchaseDate.$gte = new Date(req.query.from);
        if (req.query.to) filter.purchaseDate.$lte = new Date(req.query.to);
      }

      const [items, total] = await Promise.all([
        MaizePurchase.find(filter)
          .sort({ purchaseDate: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('recordedBy', 'name email'),
        MaizePurchase.countDocuments(filter),
      ]);

      res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/', authorize('admin', 'manager', 'operator'), purchaseValidators, validate, async (req, res, next) => {
  try {
    const { supplierName, quantityKg, bags, pricePerKg, purchaseDate, moisturePercent, notes } = req.body;
    const totalCost = Number((quantityKg * pricePerKg).toFixed(2));

    const purchase = await MaizePurchase.create({
      supplierName,
      quantityKg,
      bags,
      pricePerKg,
      totalCost,
      purchaseDate,
      moisturePercent,
      notes,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('admin', 'manager'), purchaseValidators, validate, async (req, res, next) => {
  try {
    const { supplierName, quantityKg, bags, pricePerKg, purchaseDate, moisturePercent, notes } = req.body;
    const totalCost = Number((quantityKg * pricePerKg).toFixed(2));

    const purchase = await MaizePurchase.findByIdAndUpdate(
      req.params.id,
      { supplierName, quantityKg, bags, pricePerKg, totalCost, purchaseDate, moisturePercent, notes },
      { new: true, runValidators: true }
    );
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found.' });
    res.json({ success: true, data: purchase });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const purchase = await MaizePurchase.findByIdAndDelete(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found.' });
    res.json({ success: true, message: 'Purchase deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
