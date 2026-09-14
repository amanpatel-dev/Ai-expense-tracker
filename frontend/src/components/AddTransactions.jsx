import { useState } from "react";
import API from "../services/api";

const AddTransaction = ({ onAdd }) => {
  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    category: "",
    description: "",
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [scanError, setScanError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/transactions", form);

      onAdd(res.data); // update parent UI

      // reset form
      setForm({
        amount: "",
        type: "expense",
        category: "",
        description: "",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleReceiptSelect = (e) => {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    setExtracted(null);
    setScanError("");
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
      setExtracted(null);

      const res = await API.post("/ai/scan-receipt", formData);

      setExtracted(res.data);
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

  return (
    <div className="mb-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-xl shadow mb-4"
      >
        <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          className="border p-2 w-full mb-2"
          required
        />

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full mb-4"
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

        {extracted && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold mb-2">AI Extracted Receipt</h3>
            <p>
              <span className="text-gray-600">Merchant:</span>{" "}
              {extracted.merchant ?? "—"}
            </p>
            <p>
              <span className="text-gray-600">Amount:</span>{" "}
              {extracted.amount ?? "—"}
            </p>
            <p>
              <span className="text-gray-600">Category:</span>{" "}
              {extracted.category ?? "—"}
            </p>
            <p>
              <span className="text-gray-600">Description:</span>{" "}
              {extracted.description ?? "—"}
            </p>
            <p>
              <span className="text-gray-600">Date:</span>{" "}
              {extracted.date ?? "—"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddTransaction;
