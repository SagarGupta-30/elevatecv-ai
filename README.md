# ElevateCV AI

> **Elevate Your Career with AI****

ElevateCV AI is a production-ready, AI-powered Resume Builder & Career Copilot designed to help job seekers craft professional, ATS-optimized resumes and accelerate their career growth.

---

## 🚀 Vision....

To democratize career advancement by providing everyone access to intelligent, AI-driven resume building and career coaching tools — making professional-grade career documents accessible to all.

---

## 🛠️ Tech Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Frontend       | HTML5, CSS3, Vanilla JS |
| Backend        | Node.js, Express.js     |
| Database       | MongoDB Atlas           |
| Authentication | JWT + bcrypt            |
| AI Engine      | Google Gemini API *(planned)* |
| Frontend Host  | Netlify                 |
| Backend Host   | Render                  |

---

## 📁 Folder Structure

```
elevatecv-ai/
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   ├── images/
│   │   └── icons/
│   ├── js/
│   │   ├── components/
│   │   ├── pages/        ← login.js, signup.js
│   │   └── utils/
│   ├── pages/            ← login.html, signup.html
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── config/           ← db.js
│   ├── controllers/      ← auth.controller.js
│   ├── middleware/       ← auth.middleware.js
│   ├── models/           ← User.js
│   ├── routes/           ← auth.routes.js
│   ├── services/         ← auth.service.js
│   ├── utils/
│   ├── uploads/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── docs/
├── presentation/
├── screenshots/
│
├── README.md
├── .gitignore
└── LICENSE
```

---

## ⚙️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm
- [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)

### Clone the Repository

```bash
git clone https://github.com/SagarGupta-30/elevatecv-ai.git
cd elevatecv-ai
```

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Configure Environment Variables

Update `backend/.env` with your credentials:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/elevatecv-ai
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## ▶️ Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The API server will start at **http://localhost:5000**.

Verify it's running:

```bash
curl http://localhost:5000/
```

Expected response:

```json
{
  "status": "running",
  "project": "ElevateCV AI",
  "version": "1.0.0"
}
```

### Start the Frontend

```bash
cd frontend
npx live-server --port=3000
```

Or open `frontend/index.html` directly in your browser.

---

## 🔐 Authentication API

| Method | Endpoint            | Description            | Auth     |
|--------|---------------------|------------------------|----------|
| POST   | `/api/auth/register`| Create new account     | Public   |
| POST   | `/api/auth/login`   | Login & get JWT        | Public   |
| GET    | `/api/auth/me`      | Get current user       | Required |

---

## 🔮 Future Features

- **AI Resume Builder** — Generate and refine resumes using Google Gemini AI
- **ATS Score Analysis** — Real-time resume scoring against job descriptions
- **Career Copilot Dashboard** — Personalized career insights and recommendations
- **Template Library** — Professional, ATS-friendly resume templates
- **Export Options** — Download resumes as PDF, DOCX, and more
- **Job Matching** — AI-powered job recommendation engine

---

## 👥 Contributors

| Name | Role |
|------|------|
| Sagar Gupta | Full Stack Developer & Creator |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by the ElevateCV AI Team
</p>
