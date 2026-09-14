import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import { Summary, AddTransactions } from "../components";

const emptyEditForm = {
  amount: "",
  type: "expense",
  category: "",
  description: "",
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
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description || "",
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

    try {
      const res = await API.put(`/transactions/${editingId}`, editForm);

      // Replace the old item in the list with the updated one
      setTransactions(
        transactions.map((t) => (t._id === editingId ? res.data : t))
      );

      cancelEdit();
    } catch (error) {
      console.log(error);
    }
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

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">Transactions</h2>

        {loading ? (
          <div className="text-center py-4 text-gray-500">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <p>No transactions yet</p>
        ) : (
          transactions.map((t) => (
            <div key={t._id} className="bg-gray-50 p-3 rounded-lg mb-2">
              {editingId === t._id ? (
                <form onSubmit={handleUpdate} className="space-y-2">
                  <input
                    type="number"
                    name="amount"
                    value={editForm.amount}
                    onChange={handleEditChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleEditChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                  <input
                    type="text"
                    name="category"
                    value={editForm.category}
                    onChange={handleEditChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                  <input
                    type="text"
                    name="description"
                    value={editForm.description}
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
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{t.category}</p>
                    <p className="text-sm text-gray-500">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`font-bold ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ₹{t.amount}
                    </span>

                    <button
                      onClick={() => startEdit(t)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(t._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
