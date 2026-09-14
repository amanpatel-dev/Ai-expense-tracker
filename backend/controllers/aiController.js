const {
  analyzeReceiptImage,
  generateExpenseSummary,
} = require("../services/aiService");
const Transaction = require("../models/Transaction");

const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No receipt image uploaded. Use form field name: receipt",
      });
    }

    const extracted = await analyzeReceiptImage(req.file.path);

    return res.status(200).json(extracted);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Failed to scan receipt",
    });
  }
};

// Auth + date filter + prepare data → AI summary → return result
const getExpenseSummary = async (req, res) => {
  try {
    const allowedRanges = [7, 10, 30];
    const range = req.query.range === undefined ? 7 : Number(req.query.range);

    if (!allowedRanges.includes(range)) {
      return res.status(400).json({
        message: "Invalid range. Use 7, 10, or 30 days.",
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    const transactions = await Transaction.find({
      user: req.user.id,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    const summaryData = transactions.map((t) => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description || "",
      merchant: t.merchant || "",
      date: t.date,
      source: t.source || "manual",
    }));

    const aiSummary = await generateExpenseSummary(summaryData);

    return res.status(200).json({
      range,
      startDate,
      endDate,
      transactionCount: summaryData.length,
      summary: aiSummary,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Failed to prepare expense summary data",
    });
  }
};

module.exports = { scanReceipt, getExpenseSummary };
