const productRoutes = require("./routes/products");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

const db = require("./db/pool");

app.get("/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json(result.rows);
  }  catch (err) {
  console.error("DB ERROR:", err); // 👈 ADD THIS LINE
  res.status(500).json({ error: err.message || "DB failed" });
}
});

app.get("/products", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.use("/api/products", productRoutes);
// START SERVER (always at bottom)
app.listen(3000, () => {
  console.log("Server running on port 3000");
});


