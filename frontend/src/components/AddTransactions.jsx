import { useEffect, useState } from "react";
import API from "../services/api";

const TRANSACTION_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Other",
];

const emptyManualForm = {
  type: "expense",
  amount: "",
  merchant: "",
  category: "",
  description: "",
  date: "",
};

const AddTransaction = ({ onAdd }) => {
  const [form, setForm] = useState(emptyManualForm);

  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [scanError, setScanError] = useState("");
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [confirmSuccess, setConfirmSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Do not send source — model default keeps source = "manual"
      const payload = {
        amount: form.amount,
        type: form.type,
        category: form.category,
        description: form.description,
        merchant: form.merchant || "",
        date: form.date,
      };

      const res = await API.post("/transactions", payload);

      onAdd(res.data); // update parent UI

      setForm(emptyManualForm);
    } catch (error) {
      console.log(error);
    }
  };

  const clearPreview = () => {
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const handleReceiptSelect = (e) => {
    const file = e.target.files?.[0] || null;
    clearPreview();
    setReceiptFile(file);
    setReceiptData(null);
    setScanError("");
    setConfirmError("");
    setConfirmSuccess("");
  };

  const handleViewReceipt = () => {
    if (!receiptFile) return;

    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(receiptFile);
    });
  };

  const handleHideReceipt = () => {
    clearPreview();
  };

  const handleScanReceipt = async () => {
    if (!receiptFile) {
      setScanError("Please select a receipt image first.");
      return;
    }

    const formData = new FormData();
    formData.append("receipt", receiptFile);

    try {
      setScanning(true);
      setScanError("");
      setReceiptData(null);
      setConfirmError("");
      setConfirmSuccess("");

      const res = await API.post("/ai/scan-receipt", formData);

      const { merchant, amount, category, description, date } = res.data;
      setReceiptData({
        merchant: merchant ?? "",
        amount: amount ?? "",
        category: category ?? "",
        description: description ?? "",
        date: date ?? "",
      });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to scan receipt. Please try again.";
      setScanError(message);
    } finally {
      setScanning(false);
    }
  };

  const handleReceiptDataChange = (e) => {
    const { name, value } = e.target;
    setReceiptData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConfirmExpense = async (e) => {
    e.preventDefault();
    setConfirmError("");
    setConfirmSuccess("");

    const amountNum = Number(receiptData.amount);
    if (
      receiptData.amount === "" ||
      receiptData.amount === null ||
      Number.isNaN(amountNum)
    ) {
      setConfirmError("Please enter a valid amount.");
      return;
    }

    if (!receiptData.category) {
      setConfirmError("Please select a category.");
      return;
    }

    if (!receiptData.date) {
      setConfirmError("Please select a date.");
      return;
    }

    const payload = {
      amount: receiptData.amount,
      type: "expense",
      category: receiptData.category,
      description: receiptData.description,
      date: receiptData.date,
      merchant: receiptData.merchant,
      source: "receipt_ai",
    };

    try {
      setSavingReceipt(true);

      const res = await API.post("/transactions", payload);

      onAdd(res.data);

      clearPreview();
      setReceiptFile(null);
      setReceiptData(null);
      setConfirmSuccess("Expense added successfully");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to save expense. Please try again.";
      setConfirmError(message);
    } finally {
      setSavingReceipt(false);
    }
  };

  return (
    <div className="mb-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-xl shadow mb-4"
      >
        <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>

        <label className="block text-sm text-gray-600 mb-1">Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border p-2 w-full mb-2 rounded"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <label className="block text-sm text-gray-600 mb-1">Amount</label>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className="border p-2 w-full mb-2 rounded"
          required
        />

        <label className="block text-sm text-gray-600 mb-1">Merchant</label>
        <input
          type="text"
          name="merchant"
          placeholder="Merchant (optional)"
          value={form.merchant}
          onChange={handleChange}
          className="border p-2 w-full mb-2 rounded"
        />

        <label className="block text-sm text-gray-600 mb-1">Category</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 w-full mb-2 rounded"
          required
        >
          <option value="">Select category</option>
          {TRANSACTION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label className="block text-sm text-gray-600 mb-1">Description</label>
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full mb-2 rounded"
        />

        <label className="block text-sm text-gray-600 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="border p-2 w-full mb-4 rounded"
          required
        />

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Scan Receipt</h2>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={handleReceiptSelect}
          className="border p-2 w-full mb-2"
        />

        {receiptFile && (
          <p className="text-sm text-gray-600 mb-2">
            Selected: {receiptFile.name}
          </p>
        )}

        {receiptFile && !previewUrl && (
          <button
            type="button"
            onClick={handleViewReceipt}
            className="bg-gray-600 text-white px-4 py-2 rounded mr-2 mb-2"
          >
            View Receipt
          </button>
        )}

        {previewUrl && (
          <div className="mb-4">
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="max-w-full max-h-80 rounded border mb-2"
            />
            <button
              type="button"
              onClick={handleHideReceipt}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Hide Receipt
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleScanReceipt}
          disabled={scanning || !receiptFile}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Scan Receipt
        </button>

        {scanning && (
          <p className="text-sm text-gray-600 mt-2">Scanning receipt...</p>
        )}

        {scanError && (
          <p className="text-sm text-red-500 mt-2">{scanError}</p>
        )}

        {receiptData && (
          <form
            onSubmit={handleConfirmExpense}
            className="mt-4 p-3 bg-gray-50 rounded-lg border space-y-2"
          >
            <h3 className="font-semibold mb-2">Review Receipt</h3>

            <p className="text-sm text-gray-600">
              Type: <span className="font-medium text-gray-800">Expense</span>
            </p>

            <label className="block text-sm text-gray-600">Amount</label>
            <input
              type="number"
              name="amount"
              value={receiptData.amount}
              onChange={handleReceiptDataChange}
              className="border p-2 w-full rounded"
            />

            <label className="block text-sm text-gray-600">Merchant</label>
            <input
              type="text"
              name="merchant"
              value={receiptData.merchant}
              onChange={handleReceiptDataChange}
              className="border p-2 w-full rounded"
            />

            <label className="block text-sm text-gray-600">Category</label>
            <select
              name="category"
              value={receiptData.category}
              onChange={handleReceiptDataChange}
              className="border p-2 w-full rounded"
            >
              <option value="">Select category</option>
              {TRANSACTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="block text-sm text-gray-600">Description</label>
            <textarea
              name="description"
              value={receiptData.description}
              onChange={handleReceiptDataChange}
              className="border p-2 w-full rounded"
              rows={2}
            />

            <label className="block text-sm text-gray-600">Date</label>
            <input
              type="date"
              name="date"
              value={receiptData.date}
              onChange={handleReceiptDataChange}
              className="border p-2 w-full rounded"
            />

            <button
              type="submit"
              disabled={savingReceipt}
              className="bg-green-600 text-white px-4 py-2 rounded mt-2 disabled:opacity-50"
            >
              Confirm Expense
            </button>

            {savingReceipt && (
              <p className="text-sm text-gray-600 mt-2">Saving...</p>
            )}

            {confirmError && (
              <p className="text-sm text-red-500 mt-2">{confirmError}</p>
            )}
          </form>
        )}

        {confirmSuccess && (
          <p className="text-sm text-green-600 mt-2">{confirmSuccess}</p>
        )}
      </div>
    </div>
  );
};

export default AddTransaction;
