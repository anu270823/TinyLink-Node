# TinyLink — URL Shortener (Node.js + Express + PostgreSQL)

A fast and fully functional URL shortener application. It supports URL shortening, custom aliases, click tracking, analytics, and a live-updating dashboard. This project was built as part of a coding assignment.

---

## 🚀 Features

### Core Features
- Shorten long URLs into shareable short links
- Optional custom short codes (6–8 alphanumeric characters)
- Instant redirection using short links
- Tracks:
  - Total clicks
  - Last clicked time
  - Created date
- Link statistics page for each short link
- Dashboard with all links
- Delete links
- Search bar
- Real-time click updates (no page refresh)

### Technical Features
- Node.js + Express backend
- PostgreSQL (Neon) database
- REST API
- Input validation + error handling
- Deployed and publicly accessible
- Clean UI with Tailwind + custom CSS

---

## 🛠 Tech Stack

Frontend:
- HTML
- Tailwind CSS
- Custom CSS
- Vanilla JavaScript

Backend:
- Node.js
- Express.js

Database:
- PostgreSQL (Neon)

Hosting:
- Render.com

---

## 📂 Project Structure

tinylink/
│── server.js
│── package.json
│── README.md
│── .env (ignored)
│
└── public/
     │── index.html
     │── code.html
     │── app.js
     │── style.css
     │
     └── images/
           └── background.jpg

---

# 📡 API Documentation

## 1. Create Short URL
POST /api/links

Body:
{
  "url": "https://example.com",
  "code": "custom12" 
}

Success:
{
  "code": "custom12",
  "short_url": "https://yourdomain.com/custom12"
}

---

## 2. Get All Links
GET /api/links

[
  {
    "code": "abc123",
    "url": "https://example.com",
    "short_url": "https://yourdomain.com/abc123",
    "clicks": 4,
    "created_at": "2025-01-01T10:00:00Z",
    "last_clicked": "2025-01-03T16:20:00Z"
  }
]

---

## 3. Get Stats of One Link
GET /api/links/:code

{
  "code": "abc123",
  "url": "https://example.com",
  "short_url": "https://yourdomain.com/abc123",
  "clicks": 14,
  "created_at": "2025-01-01T10:00:00Z",
  "last_clicked": "2025-01-03T16:20:00Z"
}

---

## 4. Delete Link
DELETE /api/links/:code

{
  "message": "Link deleted"
}

---

## 5. Health Check
GET /api/health

{
  "status": "ok"
}

---

# 🔁 Redirection Endpoint

GET /:code  
→ Redirects to the original long URL and increments click count.

Example:
GET /abc123  
→ https://example.com

---

# 🧪 Running Locally

1. Clone project:
git clone https://github.com/yourusername/tinylink.git

2. Install packages:
npm install

3. Create .env:
DATABASE_URL=your_neon_postgres_url
BASE_URL=http://localhost:3000
PORT=3000

4. Run:
npm start

Or with nodemon:
npm run dev

Open:
http://localhost:3000

---

# 🌐 Deployment (Render)

1. Push project to GitHub
2. Create New Web Service on Render
3. Add environment variables
4. Deploy
5. Visit your live URL

---

# 📸 Recommended Screenshots
- Dashboard
- Stats page
- Redirect working
- Neon database panel

---

# 📝 Assignment Summary

This project includes:
✔ URL shortening  
✔ Custom short codes  
✔ Click tracking  
✔ Analytics  
✔ Delete functionality  
✔ Search  
✔ Real-time updates  
✔ Good UI  
✔ REST API  
✔ Deployment  
✔ README  

---

# 🎉 Thank You!
