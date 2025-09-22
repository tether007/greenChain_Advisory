// routes/marketplace.js
import express from "express";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const router = express.Router();

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- PostgreSQL connection (reuse same config as index.js) ---
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "crop_advisor",
  password: process.env.DB_PASSWORD || "1234",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Ensure marketplace table exists
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS marketplace (
      id SERIAL PRIMARY KEY,
      item_id VARCHAR(255) UNIQUE NOT NULL,
      farmer_address VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sold BOOLEAN DEFAULT FALSE
    )
  `);
  console.log("Marketplace table ready");
})();

// ---------------------- ROUTES ----------------------

// Add new item to marketplace
router.post("/list", async (req, res) => {
  try {
    const { itemId, farmerAddress, title, description, price } = req.body;

    if (!itemId || !farmerAddress || !title || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await pool.query(
      `INSERT INTO marketplace (item_id, farmer_address, title, description, price)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (item_id) DO NOTHING`,
      [itemId, farmerAddress, title, description || "", price]
    );

    res.json({ ok: true, message: "Item listed successfully" });
  } catch (error) {
    console.error("Error listing item:", error);
    res.status(500).json({ error: "Failed to list item" });
  }
});

// Fetch all items
router.get("/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM marketplace WHERE sold = FALSE ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Mark item as sold (later tie this to smart contract or Nitrolite payment)
router.post("/buy", async (req, res) => {
  try {
    const { itemId, buyerAddress } = req.body;
    if (!itemId || !buyerAddress) {
      return res.status(400).json({ error: "itemId and buyerAddress required" });
    }

    await pool.query(
      `UPDATE marketplace
       SET sold = TRUE
       WHERE item_id = $1`,
      [itemId]
    );

    res.json({ ok: true, message: `Item ${itemId} marked as sold to ${buyerAddress}` });
  } catch (error) {
    console.error("Error buying item:", error);
    res.status(500).json({ error: "Failed to buy item" });
  }
});

export default router;
