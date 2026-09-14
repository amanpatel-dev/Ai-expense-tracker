require("dotenv").config();
const mongoose = require("mongoose");
const Transaction = require("./models/transaction");

const USER_ID = "6aa7a5f51072f0ce7d3e3bfa";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Other",
];

const merchants = [
  "CCD",
  "Amazon",
  "Uber",
  "Swiggy",
  "Zomato",
  "Reliance",
  "Netflix",
  "DMart",
  "Apollo Pharmacy",
  "Flipkart",
];

const descriptions = {
  Food: ["Lunch", "Dinner", "Groceries", "Coffee", "Breakfast"],
  Transport: ["Uber ride", "Auto ride", "Fuel", "Metro"],
  Shopping: ["Clothes", "Electronics", "Household items"],
  Entertainment: ["Movie", "Netflix subscription", "Game"],
  Bills: ["Electricity bill", "Internet bill", "Mobile bill"],
  Health: ["Medicine", "Doctor consultation", "Pharmacy"],
  Education: ["Books", "Online course", "Study material"],
  Other: ["Miscellaneous expense", "Personal expense"],
};

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomAmount(category) {
  const ranges = {
    Food: [100, 1500],
    Transport: [50, 1000],
    Shopping: [300, 5000],
    Entertainment: [200, 2000],
    Bills: [500, 4000],
    Health: [200, 3000],
    Education: [300, 5000],
    Other: [100, 2000],
  };

  const [min, max] = ranges[category];

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate() {
  const date = new Date();

  // Random date within the last 30 days
  const daysAgo = Math.floor(Math.random() * 30);

  date.setDate(date.getDate() - daysAgo);

  return date;
}

async function seedTransactions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB");

    const transactions = [];

    for (let i = 0; i < 30; i++) {
      const category = randomItem(categories);

      transactions.push({
        user: USER_ID,
        amount: randomAmount(category),
        type: "expense",
        category,
        description: randomItem(descriptions[category]),
        merchant: randomItem(merchants),
        date: randomDate(),

        // Mix manual and AI transactions
        source: Math.random() > 0.7 ? "receipt_ai" : "manual",
      });
    }

    await Transaction.insertMany(transactions);

    console.log("✅ 30 fake transactions inserted");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedTransactions();