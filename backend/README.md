# Shifra Backend — Setup Guide

## Requirements
- Node.js (already installed ✅)
- MongoDB (install karo — free)

---

## Step 1: MongoDB Install karo

1. https://www.mongodb.com/try/download/community pe jao
2. "MongoDB Community Server" download karo
3. Install karo (default settings theek hain)
4. MongoDB automatically background mein chalne lagega

---

## Step 2: Backend Start karo

```bash
cd backend
npm run dev
```

Console mein yeh dikhega:
```
✅ MongoDB Connected Successfully
🚀 Shifra Backend running at: http://localhost:5000
```

---

## Step 3: Frontend Open karo

Browser mein open karo:
```
http://localhost:5000/login.html
```

---

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/register | New user register |
| POST | /api/auth/login | User login |
| GET  | /api/auth/verify | Token verify |
| GET  | /api/health | Server health check |

---

## Data Storage
- Users MongoDB mein store hote hain
- Passwords bcrypt se hashed hote hain (secure)
- Login session JWT token se manage hota hai (7 days valid)
