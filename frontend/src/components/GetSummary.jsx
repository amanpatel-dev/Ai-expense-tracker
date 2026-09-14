import { useState } from "react";
import API from "../services/api";

const formatCurrency = (value) =>
  `₹${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Summary = ({ transactions }) => {
  const [showSummary, setShowSummary] = useState(false);
  let income = 0;
  let expense = 0;

  transactions.forEach((t) => {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });

  const balance = income - expense < 0 ? 0 : income - expense;

  const [selectedRange, setSelectedRange] = useState(7);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get(
        `/ai/expense-summary?range=${selectedRange}`
      );

      setAiSummary(response.data.summary);
    } catch (err) {
      setAiSummary(null);
      setError(
        err.response?.data?.message || "Failed to generate expense summary"
      );
    } finally {
      setLoading(false);
    }
  };

  const getCategoryPercent = (amount) => {
    const total = Number(aiSummary?.totalExpense) || 0;
    if (total <= 0) return 0;
    return Math.min(100, (Number(amount) / total) * 100);
  };

  return (
    <div className="mb-6">
      {/* Existing manual summary */}
      <button
        onClick={() => setShowSummary(!showSummary)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {showSummary ? "Hide " : "Show"}
      </button>

      {showSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-100 p-5 rounded-xl shadow">
            <p className="text-gray-600">Income</p>
            <h2 className="text-2xl font-bold text-green-600">₹{income}</h2>
          </div>

          <div className="bg-red-100 p-5 rounded-xl shadow">
            <p className="text-gray-600">Expense</p>
            <h2 className="text-2xl font-bold text-red-600">₹{expense}</h2>
          </div>

          <div className="bg-blue-100 p-5 rounded-xl shadow">
            <p className="text-gray-600">Balance</p>
            <h2 className="text-2xl font-bold text-blue-600">₹{balance}</h2>
          </div>
        </div>
      )}

      {/* AI Expense Insights — presentation only */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow mt-6 border border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              AI Expense Insights
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Smart analysis of your spending
            </p>
          </div>
          <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            ✦ AI Powered
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <label className="block text-sm text-gray-500 mb-1">Period</label>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(Number(e.target.value))}
              className="border border-gray-200 p-2.5 w-full rounded-lg bg-white"
            >
              <option value={7}>Last 7 Days</option>
              <option value={10}>Last 10 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerateSummary}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50 whitespace-nowrap"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {!aiSummary && !loading && !error && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
            <p className="text-2xl mb-2">✦</p>
            <p className="font-semibold text-gray-800 mb-1">
              Generate your personalized expense insights
            </p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Select a time period and click &quot;Generate Summary&quot; to
              analyze your spending.
            </p>
          </div>
        )}

        {aiSummary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl bg-red-50 border border-red-100 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-red-400 mb-2">
                  Total Expense
                </p>
                <p className="text-2xl md:text-3xl font-bold text-red-600 break-all">
                  {formatCurrency(aiSummary.totalExpense)}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 border border-green-100 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-green-500 mb-2">
                  Total Income
                </p>
                <p className="text-2xl md:text-3xl font-bold text-green-600 break-all">
                  {formatCurrency(aiSummary.totalIncome)}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                <p className="text-xs uppercase tracking-wide text-indigo-400 mb-2">
                  Top Category
                </p>
                <p className="text-2xl md:text-3xl font-bold text-indigo-700">
                  {aiSummary.topCategory}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">
                  Expense Transactions
                </p>
                <p className="text-xl font-semibold text-gray-800">
                  {aiSummary.expenseTransactionCount}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs text-gray-500 mb-1">
                  Income Transactions
                </p>
                <p className="text-xl font-semibold text-gray-800">
                  {aiSummary.incomeTransactionCount}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Category Breakdown
              </h3>
              {aiSummary.categoryBreakdown ? (
                <div className="space-y-3">
                  {Object.entries(aiSummary.categoryBreakdown).map(
                    ([category, amount]) => {
                      const percent = getCategoryPercent(amount);
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1 gap-2">
                            <span className="text-gray-700 font-medium">
                              {category}
                            </span>
                            <span className="text-gray-800 font-semibold whitespace-nowrap">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>

            <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-4">
              <h3 className="font-semibold text-indigo-900 mb-3">
                AI Insights
              </h3>
              {aiSummary.insights?.length ? (
                <ul className="space-y-2">
                  {aiSummary.insights.map((insight, index) => (
                    <li
                      key={`insight-${index}`}
                      className="flex gap-2 rounded-lg bg-white border border-indigo-50 px-3 py-2 text-sm text-gray-700"
                    >
                      <span className="text-indigo-500 shrink-0">✦</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">—</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Summary;
