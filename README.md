# 🤖 Shifra - Virtual Assistant

A full-stack voice-controlled virtual assistant built with HTML, CSS, JavaScript, Node.js, Express, and MongoDB.

## ✨ Features

- 🎙️ Voice commands (English + Hindi)
- 🌐 Open/Close 25+ websites by voice
- 💻 Open/Close laptop apps by voice
- 🔌 Chrome Extension for tab control
- 🧮 Voice calculator
- 😂 Jokes
- 🔍 Wikipedia & Google search
- ⏰ Time & Date
- 🔴 Shutdown / Restart / Sleep commands
- 👤 User authentication (Register/Login)
- 💬 Chat history saved in MongoDB
- ⚙️ User profile (change name/password)

## 🚀 Setup

### Requirements
- Node.js v18+
- MongoDB (Community Server)

### Installation

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Create .env file in backend folder
MONGO_URI=mongodb://127.0.0.1:27017/shifra_db
JWT_SECRET=shifra_super_secret_key_2024
PORT=5000

# 3. Start MongoDB service

# 4. Start backend
npm run dev
```

### Run
Open Chrome and go to:
```
http://localhost:5000/login.html
```

### Chrome Extension (for tab close commands)
1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select the `shifra-extension` folder

## 📋 Commands
Visit `http://localhost:5000/commands.html` for full command list.

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JavaScript, Web Speech API
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT, bcryptjs
- **Extension:** Chrome Manifest V3
