require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const argon2 = require("argon2");
const crypto = require("crypto");
const { pool, initializeDatabase } = require("./db");
const { signToken, requireAuth } = require("./auth");
const { encryptVaultItem, decryptVaultItem } = require("./crypto");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "32kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/health", async (_req, res) => {
  const result = await pool.query("SELECT NOW() AS now");
  res.json({
    message: "SecureVault API is healthy.",
    databaseTime: result.rows[0].now,
  });
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.length < 12) {
      return res
        .status(400)
        .json({ message: "Password must be at least 12 characters." });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "That email is already registered." });
    }

    const id = crypto.randomUUID();
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, created_at`,
      [id, email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create account." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const result = await pool.query(
      "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const valid = await argon2.verify(user.password_hash, password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = signToken(user);

    res.json({
      token,
      user: { id: user.id, email: user.email, created_at: user.created_at },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not sign in." });
  }
});

app.get("/api/vault/items", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, ciphertext, iv, auth_tag, created_at, updated_at
       FROM vault_items
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );

    const items = result.rows.map((row) => ({
      id: row.id,
      ...decryptVaultItem(row),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load vault." });
  }
});

app.post("/api/vault/items", requireAuth, async (req, res) => {
  try {
    const item = normalizeVaultInput(req.body);
    if (!item.name || !item.username || !item.password) {
      return res
        .status(400)
        .json({ message: "Name, username, and password are required." });
    }

    const encrypted = encryptVaultItem(item);
    const id = crypto.randomUUID();

    const result = await pool.query(
      `INSERT INTO vault_items (id, user_id, ciphertext, iv, auth_tag)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING created_at, updated_at`,
      [
        id,
        req.user.id,
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.authTag,
      ]
    );

    res.status(201).json({
      item: {
        id,
        ...item,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not save credential." });
  }
});

app.put("/api/vault/items/:id", requireAuth, async (req, res) => {
  try {
    const item = normalizeVaultInput(req.body);
    if (!item.name || !item.username || !item.password) {
      return res
        .status(400)
        .json({ message: "Name, username, and password are required." });
    }

    const encrypted = encryptVaultItem(item);
    const result = await pool.query(
      `UPDATE vault_items
       SET ciphertext = $1, iv = $2, auth_tag = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING created_at, updated_at`,
      [
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.authTag,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Credential not found." });
    }

    res.json({
      item: {
        id: req.params.id,
        ...item,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not update credential." });
  }
});

app.delete("/api/vault/items/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM vault_items WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Credential not found." });
    }

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not delete credential." });
  }
});

function normalizeVaultInput(body) {
  return {
    name: String(body.name || "").trim().slice(0, 120),
    username: String(body.username || "").trim().slice(0, 255),
    password: String(body.password || "").slice(0, 512),
    url: String(body.url || "").trim().slice(0, 500),
    notes: String(body.notes || "").trim().slice(0, 2000),
  };
}

async function start() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`SecureVault backend running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start SecureVault:", error);
  process.exit(1);
});
