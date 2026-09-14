const { analyzeReceiptImage } = require("../services/aiService");

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

module.exports = { scanReceipt };
