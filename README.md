# AI Mock Interview App — Resume Personalized Gemini Voice Edition

A full-stack MERN-style AI Mock Interview project where questions are generated from the candidate's own resume instead of random role-based prompts.

## Main Idea

The candidate uploads or pastes a resume. Gemini analyzes the resume, detects skills/projects/focus areas, then asks personalized interview questions using browser voice. The candidate answers by microphone, and the app generates a resume-based evaluation report with PDF download.

## Features

- Login and signup with JWT authentication
- Resume upload: PDF, DOCX, DOC or TXT
- Manual resume text paste fallback
- Gemini resume analysis
- Personalized questions from actual resume projects, skills and gaps
- AI interviewer speaks every question aloud
- Candidate answers through microphone voice-to-text
- Manual typing fallback
- Resume reference shown for every question
- Expected answer signals shown for practice
- Gemini-generated evaluation report
- Resume alignment score and project depth score
- Question-wise feedback
- Saved report history in MongoDB
- PDF report download
- Report read-aloud option

## Tech Stack

### Frontend

- React + Vite
- React Router
- Axios
- jsPDF
- Browser Web Speech API for AI voice and answer transcription

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- bcryptjs password hashing
- Gemini API using `@google/genai`
- Multer for resume upload
- pdf-parse for PDF resume text extraction
- Mammoth for DOCX/DOC resume text extraction

## Important API Key Note

A real Gemini API key is not included in this zip because API keys are private secrets. Create your own free Gemini API key from Google AI Studio and paste it into `server/.env`.

## Setup Steps

### 1. Extract the zip

Open the extracted folder in VS Code.

### 2. Start MongoDB

Make sure MongoDB is running locally. Default connection:

```bash
mongodb://127.0.0.1:27017/ai_mock_interview_resume
```

### 3. Create backend `.env`

Go to the `server` folder and copy `.env.example` to `.env`.

```bash
cd server
copy .env.example .env
```

On Mac/Linux:

```bash
cp .env.example .env
```

Now open `server/.env` and paste your Gemini key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Install dependencies

From the project root:

```bash
npm run install-all
```

Or manually:

```bash
cd server
npm install

cd ../client
npm install
```

### 5. Run project

From root:

```bash
npm run dev
```

Or run separately:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

Frontend URL:

```bash
http://localhost:5173
```

Backend URL:

```bash
http://localhost:5000
```

## How to Use

1. Signup or login.
2. Select target role, experience, difficulty and number of questions.
3. Upload resume PDF/DOCX/TXT or paste resume text manually.
4. Click **Start resume-based voice interview**.
5. AI will analyze the resume and generate personalized questions.
6. AI will speak each question aloud.
7. Click **Start recording** and answer through microphone.
8. Edit transcript if needed.
9. Click **Save & next**.
10. After the final answer, the app generates a resume-based report.
11. Open report history and download PDF.

## Example Personalized Questions

The app can ask questions like:

- “Your resume mentions JWT authentication. Explain your complete login flow.”
- “In your MERN project, what MongoDB schema design did you use and why?”
- “Your resume says microservices. How did your services communicate?”
- “What was the hardest bug in your project and how did you debug it?”
- “What part of your resume project would fail first at high traffic?”

## API Routes

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Interview

```txt
POST /api/interviews/resume/extract
POST /api/interviews/questions
POST /api/interviews/submit
GET  /api/interviews/reports
GET  /api/interviews/reports/:id
```

## Project Structure

```txt
ai-mock-interview-resume-gemini
├── client
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── utils
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   └── package.json
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── utils
│   │   ├── gemini.js
│   │   └── resumeParser.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## Troubleshooting

### Questions are still generic

Check these things:

1. Resume text is actually pasted/extracted.
2. `server/.env` has a valid Gemini API key.
3. Backend was restarted after editing `.env`.

### PDF upload gives extraction error

Some resumes are scanned images, not text PDFs. For those, copy-paste the resume text manually into the textarea.

### Mic not working

- Use Chrome or Edge.
- Allow microphone permission.
- Check Windows microphone privacy settings.
- You can still type the answer manually.

### MongoDB connection failed

Make sure MongoDB service is running. If your MongoDB URI is different, update `MONGO_URI` in `server/.env`.

### CORS error

Make sure frontend is running on `http://localhost:5173` or update `CLIENT_URL` in `server/.env`.
