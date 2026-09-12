const express = require("express");
const router = express.Router();

const { addTransaction,getTransactions ,deleteTransaction,getSummary} = require("../controllers/transactionController");
const protect = require("../middleware/authMiddleware");

router.post("/",protect, addTransaction);
router.get("/",protect, getTransactions);
router.get("/summary",protect,getSummary);
router.delete("/:id",protect, deleteTransaction);

module.exports = router;