# CareerPath AI 🎯
> **Agentic AI Career Preparation Platform for Students**

CareerPath AI is a full-stack, AI-powered career preparation platform designed to help students analyze target job descriptions, discover skill gaps, follow personalized learning roadmaps, and pass technical assessments to reach job readiness.

---

## 🌟 Key Features

### 1. Resume Vault & AI Skill Extraction
- Upload versioned PDF resumes stored securely via ImageKit (with local fallback).
- AI extraction parses resumes into structured skills, categories, and proficiency levels with direct textual citations.
- Interactive skill confirmation modal allowing students to review and refine skills before saving to their profile.

### 2. Job Description Analysis & 4-Tier Matching
- Upload target job postings via PDF or paste raw text.
- AI matching engine classifies requirements into 4 distinct tiers:
  - **Matched**: Skills verified from the student's profile.
  - **Partial**: Related or foundational skills needing deeper expertise.
  - **Missing**: Core job requirements the student lacks.
  - **Optional**: Good-to-have supplementary qualifications.
- Calculates an instant match score and extracted role requirements breakdown.

### 3. Personalized Dual Roadmaps (All Modules Unlocked)
- Generates two dedicated learning paths:
  - **Roadmap A (Existing Skills Mastery)**: Deepen knowledge in verified skills.
  - **Roadmap B (Missing Skills Acquisition)**: Rapidly bridge identified skill gaps.
  - **Open Learning Model**: All modules and assessments are unlocked, allowing students to learn and take assessments in whatever order suits their study habits.

### 4. Interactive Assessment Engine with Code Highlighting
- Dynamic technical MCQ tests generated for each roadmap module.
- Strict schema separation for code snippets rendered with syntax highlighting (`prismjs`).
- Pass threshold at 75% score updates module completion and boosts profile skill proficiency.
- Immediate attempt reviews with question-by-question explanations.

### 5. Deterministic Career Readiness Index
Transparent, aggregate readiness formula reflecting genuine preparation:
$$\text{Readiness Index} = (40\% \times \text{Job Match}) + (35\% \times \text{Assessment Proficiency}) + (25\% \times \text{Roadmap Progress})$$

### 6. Editorial Design & Navigation Safety
- Distraction-free, warm neutral editorial UI with refined typography and zero generic gradient blobs.
- Global navigation lock and animated progress bar that prevents broken states during active AI generation workflows.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 + Vite
  - React Router v7
  - Lucide React (editorial iconography)
  - PrismJS (code block syntax highlighting)
  - Vanilla CSS design tokens & responsive grid
- **Backend**:
  - Node.js & Express (ES Modules)
  - MongoDB & Mongoose
  - `@langchain/langgraph` & `@langchain/google-genai` (Gemini 2.5 Flash)
  - JSON Web Tokens (JWT) & HTTP-only cookies
  - Multer & `pdf-parse`
  - ImageKit SDK

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)
- [Google Gemini API Key](https://aistudio.google.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/pabhi0901/CareerPathAI.git
cd CareerPathAI
```

---

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see `backend/.env.example`):
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
GOOGLE_API_KEY=your_google_gemini_api_key

# ImageKit (Optional - falls back to local uploads if omitted)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

Start the backend server:
```bash
npm run dev
# Running on http://localhost:5000
```

---

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🔒 Security
- All sensitive environment files (`.env`, `.env.local`) and user uploads are strictly excluded from version control via `.gitignore`.
- Password hashing using `bcryptjs` with salted rounds.
- JWT authentication with Bearer token validation and HTTP-only cookie support.

---

## 📄 License
This project is licensed under the MIT License.
