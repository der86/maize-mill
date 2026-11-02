const express = require('express');
const MaizePurchase = require('../models/MaizePurchase');
const MillingBatch = require('../models/MillingBatch');
const FlourSale = require('../models/FlourSale');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Standard maize bag weight used to convert kg stock into bags for display.
// Override with MAIZE_BAG_WEIGHT_KG in .env if your plant uses a different bag size.
const BAG_WEIGHT_KG = Number(process.env.MAIZE_BAG_WEIGHT_KG) || 90;

/**
 * GET /api/dashboard/summary
 * Single call that powers the dashboard screen:
 *  - total maize bought (kg) & spend
 *  - total flour bales produced & total bran produced (kg)
 *  - total flour bales sold & revenue
 *  - current stock on hand: flour bales = produced - sold, bran kg = produced (bran sales not tracked separately, extend if needed)
 *  - last 30 days trend for a simple chart
 */
router.get('/summary', async (req, res, next) => {
  try {
    const [purchaseAgg, millingAgg, salesAgg] = await Promise.all([
      MaizePurchase.aggregate([
        { $group: { _id: null, totalKg: { $sum: '$quantityKg' }, totalCost: { $sum: '$totalCost' }, count: { $sum: 1 } } },
      ]),
      MillingBatch.aggregate([
        {
          $group: {
            _id: null,
            totalMaizeUsedKg: { $sum: '$maizeUsedKg' },
            totalFlourBales: { $sum: '$flourBalesProduced' },
            totalBranKg: { $sum: '$branProducedKg' },
            count: { $sum: 1 },
          },
        },
      ]),
      FlourSale.aggregate([
        {
          $group: {
            _id: null,
            totalBalesSold: { $sum: '$balesSold' },
            totalRevenue: { $sum: '$amountSold' },
            totalCollected: { $sum: '$amountPaid' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const purchases = purchaseAgg[0] || { totalKg: 0, totalCost: 0, count: 0 };
    const milling = millingAgg[0] || { totalMaizeUsedKg: 0, totalFlourBales: 0, totalBranKg: 0, count: 0 };
    const sales = salesAgg[0] || { totalBalesSold: 0, totalRevenue: 0, totalCollected: 0, count: 0 };

    const maizeInStockKg = Math.max(0, purchases.totalKg - milling.totalMaizeUsedKg);
    const maizeInStockBags = maizeInStockKg / BAG_WEIGHT_KG;
    const flourBalesInStock = Math.max(0, milling.totalFlourBales - sales.totalBalesSold);
    const outstandingBalance = Math.max(0, sales.totalRevenue - sales.totalCollected);

    // Last 30 days daily trend for purchases / production / sales (for the dashboard chart)
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const dateGroup = { $dateToString: { format: '%Y-%m-%d', date: '$$dateField' } };

    const [purchaseTrend, millingTrend, salesTrend] = await Promise.all([
      MaizePurchase.aggregate([
        { $match: { purchaseDate: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$purchaseDate' } }, kg: { $sum: '$quantityKg' } } },
        { $sort: { _id: 1 } },
      ]),
      MillingBatch.aggregate([
        { $match: { millingDate: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$millingDate' } },
            bales: { $sum: '$flourBalesProduced' },
            bran: { $sum: '$branProducedKg' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      FlourSale.aggregate([
        { $match: { saleDate: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
            bales: { $sum: '$balesSold' },
            revenue: { $sum: '$amountSold' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        stock: {
          maizeInStockKg: Number(maizeInStockKg.toFixed(2)),
          maizeInStockBags: Number(maizeInStockBags.toFixed(1)),
          maizeBagWeightKg: BAG_WEIGHT_KG,
          flourBalesInStock: Number(flourBalesInStock.toFixed(2)),
          branProducedKg: Number(milling.totalBranKg.toFixed(2)),
        },
        purchases: {
          totalKg: Number(purchases.totalKg.toFixed(2)),
          totalCost: Number(purchases.totalCost.toFixed(2)),
          totalRecords: purchases.count,
        },
        milling: {
          totalMaizeUsedKg: Number(milling.totalMaizeUsedKg.toFixed(2)),
          totalFlourBalesProduced: Number(milling.totalFlourBales.toFixed(2)),
          totalBranProducedKg: Number(milling.totalBranKg.toFixed(2)),
          totalBatches: milling.count,
        },
        sales: {
          totalBalesSold: Number(sales.totalBalesSold.toFixed(2)),
          totalRevenue: Number(sales.totalRevenue.toFixed(2)),
          totalCollected: Number(sales.totalCollected.toFixed(2)),
          outstandingBalance: Number(outstandingBalance.toFixed(2)),
          totalRecords: sales.count,
        },
        trend: { purchases: purchaseTrend, milling: millingTrend, sales: salesTrend },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
