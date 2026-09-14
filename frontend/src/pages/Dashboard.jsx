import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { Summary, AddTransactions } from "../components";

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

const emptyEditForm = {
  type: "expense",
  amount: "",
  merchant: "",
  category: "",
  description: "",
  date: "",
};

// Convert Mongo/ISO date to YYYY-MM-DD for <input type="date" />
const toDateInputValue = (dateValue) => {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // which row is being edited
  const [editForm, setEditForm] = useState(emptyEditForm);
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await API.get("/transactions");
      setTransactions(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAdd = (newTransaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/transactions/${id}`);
      setTransactions(transactions.filter((t) => t._id !== id));
    } catch (error) {
      console.log(error);
    }
  };

  // Fill the form with the row the user clicked Edit on
  const startEdit = (t) => {
    setEditingId(t._id);
    setEditForm({
      type: t.type || "expense",
      amount: t.amount ?? "",
      merchant: t.merchant || "",
      category: t.category || "",
      description: t.description || "",
      date: toDateInputValue(t.date),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyEditForm);
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const payload = {
      amount: editForm.amount,
      type: editForm.type,
      category: editForm.category,
      description: editForm.description,
      merchant: editForm.merchant,
      date: editForm.date,
    };

    try {
      const res = await API.put(`/transactions/${editingId}`, payload);

      // Replace the old item in the list with the updated one
      setTransactions(
        transactions.map((t) => (t._id === editingId ? res.data : t))
      );

      cancelEdit();
    } catch (error) {
      console.log(error);
    }
  };

  const formatAmountDisplay = (type, amount) => {
    const formatted = Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
    return type === "income" ? `+ ₹${formatted}` : `- ₹${formatted}`;
  };

  const formatDateDisplay = (dateValue) => {
    if (!dateValue) return "—";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <Summary transactions={transactions} />

      <AddTransactions onAdd={handleAdd} />

      <div className="bg-white p-4 md:p-5 rounded-2xl shadow border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {transactions.length}{" "}
            {transactions.length === 1 ? "transaction" : "transactions"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
            <p className="text-gray-800 font-medium mb-1">No transactions yet</p>
            <p className="text-sm text-gray-500">
              Add a transaction manually or scan a receipt to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div
                key={t._id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-shadow"
              >
                {editingId === t._id ? (
                  <form onSubmit={handleUpdate} className="space-y-2">
                    <label className="block text-sm text-gray-600">Type</label>
                    <select
                      name="type"
                      value={editForm.type}
                      onChange={handleEditChange}
                      className="border p-2 w-full rounded"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>

                    <label className="block text-sm text-gray-600">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={editForm.amount}
                      onChange={handleEditChange}
                      className="border p-2 w-full rounded"
                      required
                    />

                    <label className="block text-sm text-gray-600">
                      Merchant
                    </label>
                    <input
                      type="text"
                      name="merchant"
                      value={editForm.merchant}
                      onChange={handleEditChange}
                      className="border p-2 w-full rounded"
                      placeholder="Merchant (optional)"
                    />

                    <label className="block text-sm text-gray-600">
                      Category
                    </label>
                    <select
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      className="border p-2 w-full rounded"
                      required
                    >
                      <option value="">Select category</option>
                      {!TRANSACTION_CATEGORIES.includes(editForm.category) &&
                        editForm.category && (
                          <option value={editForm.category}>
                            {editForm.category}
                          </option>
                        )}
                      {TRANSACTION_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <label className="block text-sm text-gray-600">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      className="border p-2 w-full rounded"
                    />

                    <label className="block text-sm text-gray-600">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      className="border p-2 w-full rounded"
                    />

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-300 px-3 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    {/* Left: category + description */}
                    <div className="flex items-start gap-3 min-w-0 md:flex-1">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          t.type === "income"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {(t.category || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {t.category}
                          </p>
                          {t.source === "receipt_ai" && (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              AI Receipt
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {t.description || "No description"}
                        </p>
                      </div>
                    </div>

                    {/* Middle: merchant + date */}
                    <div className="md:w-40 lg:w-48 shrink-0 pl-12 md:pl-0">
                      <p className="text-sm text-gray-700 truncate">
                        {t.merchant ? t.merchant : "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateDisplay(t.date)}
                      </p>
                    </div>

                    {/* Right: amount + actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pl-12 md:pl-0">
                      <span
                        className={`font-bold text-base whitespace-nowrap ${
                          t.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatAmountDisplay(t.type, t.amount)}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(t)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-100 bg-blue-50 px-2.5 py-1 rounded-md"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(t._id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800 border border-red-100 bg-red-50 px-2.5 py-1 rounded-md"
                          aria-label="Delete transaction"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
