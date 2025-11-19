// server.js
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { customAlphabet } = require('nanoid');
const validator = require('validator');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./db');

dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// generate codes from [A-Za-z0-9] length 6 (can be 6-8)
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(alphabet, 6); // default generation length 6

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: '1.0' });
});

/**
 * POST /api/links
 * body: { url: string, code?: string }
 * - returns 201 with saved link object
 * - returns 409 if code exists
 * - returns 400 on invalid input
 */
app.post('/api/links', async (req, res) => {
  try {
    const { url, code } = req.body;

    if (!url || typeof url !== 'string' || !validator.isURL(url, { require_protocol: true })) {
      return res.status(400).json({ error: 'Invalid URL. Include protocol (http:// or https://).' });
    }

    let finalCode = code && String(code).trim();

    if (finalCode) {
      // Validate custom code: only A-Za-z0-9 and length 6-8
      if (!/^[A-Za-z0-9]{6,8}$/.test(finalCode)) {
        return res.status(400).json({ error: 'Custom code must match [A-Za-z0-9]{6,8}.' });
      }
      // check exists
      const exists = await db.query('SELECT code FROM links WHERE code = $1', [finalCode]);
      if (exists.rowCount > 0) {
        return res.status(409).json({ error: 'Code already exists.' });
      }
    } else {
      // generate one (ensure unique)
      let tries = 0;
      while (tries < 5) {
        finalCode = nanoid();
        const exists = await db.query('SELECT code FROM links WHERE code = $1', [finalCode]);
        if (exists.rowCount === 0) break;
        tries++;
      }
      if (!finalCode) return res.status(500).json({ error: 'Failed to generate code.' });
    }

    const insert = await db.query(
      `INSERT INTO links (code, url) VALUES ($1, $2) RETURNING code, url, clicks, created_at, last_clicked`,
      [finalCode, url]
    );

    const row = insert.rows[0];
    res.status(201).json({
      code: row.code,
      url: row.url,
      clicks: row.clicks,
      created_at: row.created_at,
      last_clicked: row.last_clicked,
      short_url: `${BASE_URL}/${row.code}`
    });
  } catch (err) {
    console.error('POST /api/links error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/links
 * list all links
 */
app.get('/api/links', async (req, res) => {
  try {
    const q = await db.query('SELECT code, url, clicks, created_at, last_clicked FROM links ORDER BY created_at DESC');
    res.json(q.rows.map(r => ({ ...r, short_url: `${BASE_URL}/${r.code}` })));
  } catch (err) {
    console.error('GET /api/links error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/links/:code
 * stats for a single code
 */
app.get('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const q = await db.query('SELECT code, url, clicks, created_at, last_clicked FROM links WHERE code = $1', [code]);
    if (q.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const r = q.rows[0];
    res.json({ ...r, short_url: `${BASE_URL}/${r.code}` });
  } catch (err) {
    console.error('GET /api/links/:code error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/links/:code
 * delete a link
 */
app.delete('/api/links/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const del = await db.query('DELETE FROM links WHERE code = $1 RETURNING code', [code]);
    if (del.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/links/:code error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Redirect route GET /:code
 * - If code exists: increment clicks, update last_clicked, redirect 302
 * - If not: 404
 *
 * Important: This should be the last route so it doesn't shadow API paths.
 */
app.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;

    // avoid catching health or api routes
    if (['api', 'healthz', 'code'].includes(code)) return next();

    const q = await db.query('SELECT url FROM links WHERE code = $1', [code]);
    if (q.rowCount === 0) return res.status(404).send('Not found');

    const url = q.rows[0].url;

    // update clicks and last_clicked (two separate statements to avoid race issues we could use transactions but this is simpler)
    await db.query('UPDATE links SET clicks = clicks + 1, last_clicked = NOW() WHERE code = $1', [code]);

    return res.redirect(302, url);
  } catch (err) {
    console.error('Redirect /:code error', err);
    res.status(500).send('Server error');
  }
});

// Serve code page for /code/:code (client-side page)
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'code.html'));
});

// Dashboard root serves public/index.html automatically via static middleware

app.listen(PORT, () => {
  console.log(`TinyLink server listening on port ${PORT}`);
});
