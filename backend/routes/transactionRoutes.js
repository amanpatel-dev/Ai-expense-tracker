const express = require("express");
const router = express.Router();

const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
  getSummary,
} = require("../controllers/transactionController");
const protect = require("../middleware/authMiddleware");

router.post("/", protect, addTransaction);
router.get("/", protect, getTransactions);
router.get("/summary", protect, getSummary);
router.put("/:id", protect, updateTransaction); // edit one transaction
router.delete("/:id", protect, deleteTransaction);

module.exports = router;