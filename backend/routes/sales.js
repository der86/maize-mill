const express = require('express');
const { body, query } = require('express-validator');
const FlourSale = require('../models/FlourSale');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(protect);

const saleValidators = [
  body('customerName').trim().notEmpty().withMessage('Customer name is required').isLength({ max: 150 }),
  body('balesSold').isFloat({ gt: 0 }).withMessage('Bales sold must be a positive number'),
  body('pricePerBale').isFloat({ min: 0 }).withMessage('Price per bale must be zero or positive'),
  body('saleDate').optional().isISO8601().toDate(),
  body('paymentStatus').optional().isIn(['paid', 'partial', 'unpaid']),
  body('amountPaid').optional().isFloat({ min: 0 }),
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
        filter.saleDate = {};
        if (req.query.from) filter.saleDate.$gte = new Date(req.query.from);
        if (req.query.to) filter.saleDate.$lte = new Date(req.query.to);
      }

      const [items, total] = await Promise.all([
        FlourSale.find(filter)
          .sort({ saleDate: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('recordedBy', 'name email'),
        FlourSale.countDocuments(filter),
      ]);

      res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/', authorize('admin', 'manager', 'operator'), saleValidators, validate, async (req, res, next) => {
  try {
    const { customerName, balesSold, pricePerBale, saleDate, paymentStatus, amountPaid, notes } = req.body;
    const amountSold = Number((balesSold * pricePerBale).toFixed(2));

    const sale = await FlourSale.create({
      customerName,
      balesSold,
      pricePerBale,
      amountSold,
      saleDate,
      paymentStatus,
      amountPaid: paymentStatus === 'paid' ? amountSold : amountPaid || 0,
      notes,
      recordedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authorize('admin', 'manager'), saleValidators, validate, async (req, res, next) => {
  try {
    const { customerName, balesSold, pricePerBale, saleDate, paymentStatus, amountPaid, notes } = req.body;
    const amountSold = Number((balesSold * pricePerBale).toFixed(2));

    const sale = await FlourSale.findByIdAndUpdate(
      req.params.id,
      { customerName, balesSold, pricePerBale, amountSold, saleDate, paymentStatus, amountPaid, notes },
      { new: true, runValidators: true }
    );
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found.' });
    res.json({ success: true, data: sale });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const sale = await FlourSale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found.' });
    res.json({ success: true, message: 'Sale deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
