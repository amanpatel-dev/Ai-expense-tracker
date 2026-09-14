import { useEffect, useRef, useState } from "react";
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
  const fileInputRef = useRef(null);

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

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveReceipt = () => {
    clearPreview();
    setReceiptFile(null);
    setReceiptData(null);
    setScanError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const currentStep = receiptData ? 3 : scanning ? 2 : 1;

  return (
    <div className="mb-6">
      {/* Scan Receipt — ABOVE manual Add Transaction */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow border border-gray-100 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Scan Receipt</h2>
            <p className="text-sm text-gray-500 mt-1">
              Turn your receipt into an expense automatically.
            </p>
            <p className="text-sm text-gray-400">
              Upload a receipt and we&apos;ll extract the details for you.
            </p>
          </div>
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            ✦ AI Powered
          </span>
        </div>

        {/* Simple stage indicator */}
        <div className="flex flex-wrap items-center gap-2 text-xs mb-5 mt-4">
          <span
            className={`px-2.5 py-1 rounded-full border ${
              currentStep === 1
                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            1. Upload Receipt
          </span>
          <span className="text-gray-300">→</span>
          <span
            className={`px-2.5 py-1 rounded-full border ${
              currentStep === 2
                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            2. AI Extraction
          </span>
          <span className="text-gray-300">→</span>
          <span
            className={`px-2.5 py-1 rounded-full border ${
              currentStep === 3
                ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            3. Review & Confirm
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={handleReceiptSelect}
          className="hidden"
        />

        {!receiptFile ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center max-w-xl mx-auto">
            <div className="text-3xl mb-2" aria-hidden="true">
              📷
            </div>
            <p className="font-semibold text-gray-800 mb-1">
              Upload your receipt
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported: JPG, PNG, WebP
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 font-medium"
            >
              Choose Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start max-w-3xl mx-auto">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain rounded-lg bg-white"
                />
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
                  Preview unavailable
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                  Selected file
                </p>
                <p className="text-sm font-medium text-gray-800 break-all">
                  {receiptFile.name}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={handleRemoveReceipt}
                  className="text-sm border border-red-100 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100"
                >
                  Remove
                </button>
              </div>

              <button
                type="button"
                onClick={handleScanReceipt}
                disabled={scanning || !receiptFile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 w-full sm:w-auto"
              >
                {scanning ? "Scanning..." : "Scan Receipt"}
              </button>
            </div>
          </div>
        )}

        {scanError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 max-w-3xl mx-auto">
            {scanError}
          </div>
        )}

        {confirmSuccess && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 max-w-3xl mx-auto">
            {confirmSuccess}
          </div>
        )}

        {receiptData && (
          <form
            onSubmit={handleConfirmExpense}
            className="mt-6 p-4 md:p-5 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3 max-w-3xl mx-auto"
          >
            <div className="mb-2">
              <h3 className="font-semibold text-indigo-950">
                AI extracted your expense details
              </h3>
              <p className="text-sm text-gray-500">
                Review and correct anything before saving.
              </p>
            </div>

            <p className="text-sm text-gray-600">
              Type: <span className="font-medium text-gray-800">Expense</span>
            </p>

            <label className="block text-sm text-gray-600">Merchant</label>
            <input
              type="text"
              name="merchant"
              value={receiptData.merchant}
              onChange={handleReceiptDataChange}
              className="border border-gray-200 p-2 w-full rounded-lg bg-white"
            />

            <label className="block text-sm text-gray-600">Amount</label>
            <input
              type="number"
              name="amount"
              value={receiptData.amount}
              onChange={handleReceiptDataChange}
              className="border border-gray-200 p-2 w-full rounded-lg bg-white"
            />

            <label className="block text-sm text-gray-600">Category</label>
            <select
              name="category"
              value={receiptData.category}
              onChange={handleReceiptDataChange}
              className="border border-gray-200 p-2 w-full rounded-lg bg-white"
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
              className="border border-gray-200 p-2 w-full rounded-lg bg-white"
              rows={2}
            />

            <label className="block text-sm text-gray-600">Date</label>
            <input
              type="date"
              name="date"
              value={receiptData.date}
              onChange={handleReceiptDataChange}
              className="border border-gray-200 p-2 w-full rounded-lg bg-white"
            />

            <button
              type="submit"
              disabled={savingReceipt}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg mt-2 disabled:opacity-50 font-medium"
            >
              {savingReceipt ? "Saving..." : "Confirm Expense"}
            </button>

            {confirmError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {confirmError}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Manual Add Transaction — UI redesign only */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 md:p-6 rounded-2xl shadow border border-gray-100 mb-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Transaction</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your income or expense manually.
            </p>
          </div>
          <span className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
            Manual Entry
          </span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">
            Type
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border border-gray-200 p-2.5 w-full rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                className="border border-gray-200 pl-7 pr-3 py-2.5 w-full rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Merchant
            </label>
            <input
              type="text"
              name="merchant"
              placeholder="Merchant (optional)"
              value={form.merchant}
              onChange={handleChange}
              className="border border-gray-200 p-2.5 w-full rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="border border-gray-200 p-2.5 w-full rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              required
            >
              <option value="">Select category</option>
              {TRANSACTION_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="border border-gray-200 p-2.5 w-full rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              required
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            placeholder="What was this transaction for?"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="border border-gray-200 p-2.5 w-full rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-y"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium w-full sm:w-auto"
          >
            Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;
