# PromptForge AI ⚡

> Transform basic prompts into powerful, structured AI instructions — for free.

PromptForge AI is an AI-powered prompt enhancement tool that takes your simple inputs and converts them into detailed, well-structured prompts that get significantly better results from any AI model.

## ✨ Features

- **Instant Enhancement** — Prompts improved in seconds using Groq AI (Llama 3.3-70b)
- **5 Tone Options** — Professional, Creative, Technical, Casual, Academic
- **Prompt History** — Save and revisit your enhanced prompts (requires account)
- **User Authentication** — Secure signup/login with JWT tokens
- **Dark/Light Mode** — Full theme support
- **Responsive Design** — Works on desktop, tablet, and mobile
- **100% Free** — No subscriptions, no hidden costs

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML, CSS, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **AI API** | Groq (Llama 3.3-70b-versatile) |
| **Auth** | JWT + bcrypt.js |
| **Security** | Helmet, CORS, Rate Limiting |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ 
- A free [Groq API key](https://console.groq.com/keys)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anas-khan1/Prompt-Forge.git
   cd Prompt-Forge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your actual values:
   - `GROQ_API_KEY` — Your Groq API key
   - `MONGODB_URI` — Your MongoDB Atlas connection string
   - `JWT_SECRET` — A random secret string for JWT signing

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3001
   ```

### Development Mode

```bash
npm run dev
```
This uses `nodemon` for auto-restart on file changes.

## 📁 Project Structure

```
PromptForge AI/
├── server.js              # Express.js backend (API routes, auth, Groq integration)
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── LICENSE                # MIT License
└── public/                # Frontend (served as static files)
    ├── index.html         # Main app page
    ├── style.css          # Full CSS design system
    ├── script.js          # Frontend JavaScript
    ├── history.html       # Prompt history page
    ├── legal-nav.js       # Shared legal page navigation
    ├── privacy-policy.html
    ├── terms-of-service.html
    ├── help-and-support.html
    └── faq.html
```

## 🌐 Deployment

### Render (Recommended)

1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repository
4. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables in Render's dashboard:
   - `GROQ_API_KEY`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = `https://your-app-name.onrender.com`

### Railway / Vercel / Other

The app works on any Node.js hosting platform. Set the same environment variables listed above.

## 📝 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/tones` | No | List available tones |
| `POST` | `/api/enhance` | Optional | Enhance a prompt |
| `POST` | `/api/auth/signup` | No | Create account |
| `POST` | `/api/auth/login` | No | Log in |
| `DELETE` | `/api/auth/account` | Yes | Delete account |
| `GET` | `/api/history` | Yes | Get prompt history |
| `DELETE` | `/api/history/:id` | Yes | Delete history entry |
| `DELETE` | `/api/history` | Yes | Clear all history |

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Anas Khan**
- GitHub: [@anas-khan1](https://github.com/anas-khan1)
- Email: contactanas56@gmail.com

---

Made in India with ❤️ for productivity
