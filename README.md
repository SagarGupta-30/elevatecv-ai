# ElevateCV AI

> **Elevate Your Career with AI**

ElevateCV AI is a production-ready, AI-powered Resume Builder & Career Copilot designed to help job seekers craft professional, ATS-optimized resumes and accelerate their career growth.

---

## 🚀 Vision

To democratize career advancement by providing everyone access to intelligent, AI-driven resume building and career coaching tools — making professional-grade career documents accessible to all.

---

## 🛠️ Tech Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Frontend       | HTML5, CSS3, Vanilla JS |
| Backend        | Node.js, Express.js     |
| Database       | MongoDB Atlas *(planned)* |
| Authentication | JWT *(planned)*         |
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
│   │   ├── pages/
│   │   └── utils/
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
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

### Clone the Repository

```bash
git clone https://github.com/your-username/elevatecv-ai.git
cd elevatecv-ai
```

### Install Backend Dependencies

```bash
cd backend
npm install
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

## 🔮 Future Features

- **AI Resume Builder** — Generate and refine resumes using Google Gemini AI
- **ATS Score Analysis** — Real-time resume scoring against job descriptions
- **Career Copilot Dashboard** — Personalized career insights and recommendations
- **User Authentication** — Secure JWT-based login and registration
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
