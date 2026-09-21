# 🎓 EduMind — AI-Powered Adaptive Learning Platform

<p align="center">
  <strong>Learn Smarter. Study Better.</strong>
</p>

<p align="center">
  An AI-powered adaptive learning platform that transforms study materials into personalized,
  interactive learning experiences through AI tutoring, summaries, quizzes, flashcards,
  adaptive learning, and learning analytics.
</p>

<p align="center">
  <a href="https://edu-mind-project.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Live Demo">
  </a>
  <a href="https://edumind-backend-d0lt.onrender.com">
    <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render" alt="Backend">
  </a>
  <a href="https://edumind-backend-d0lt.onrender.com/api/health">
    <img src="https://img.shields.io/badge/API-Healthy-success?style=for-the-badge" alt="API Health">
  </a>
</p>

---

## 📖 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Proposed Solution](#proposed-solution)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [AI Architecture](#ai-architecture)
- [Retrieval-Augmented Generation (RAG)](#retrieval-augmented-generation-rag)
- [System Architecture](#system-architecture)
- [Application Workflow](#application-workflow)
- [Authentication Workflow](#authentication-workflow)
- [Document Processing Workflow](#document-processing-workflow)
- [Quiz Generation Workflow](#quiz-generation-workflow)
- [Flashcard Generation Workflow](#flashcard-generation-workflow)
- [Adaptive Learning Architecture](#adaptive-learning-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Backend / API Architecture](#backend--api-architecture)
- [Database Architecture](#database-architecture)
- [Security](#security)
- [Local Installation](#local-installation)
- [PostgreSQL Setup](#postgresql-setup)
- [Ollama Setup](#ollama-setup)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [Deployment](#deployment)
- [Current Project Status](#current-project-status)
- [Future Enhancements](#future-enhancements)
- [SDG 4 — Quality Education](#sdg-4--quality-education)
- [Academic Significance](#academic-significance)
- [Developer](#developer)
- [Acknowledgements](#acknowledgements)
- [License](#license)

---

## 🌍 Live Application

### Frontend
**EduMind Web Application**: [https://edu-mind-project.vercel.app](https://edu-mind-project.vercel.app)

### Backend
**EduMind FastAPI Backend**: [https://edumind-backend-d0lt.onrender.com](https://edumind-backend-d0lt.onrender.com)

**Backend Health Check**: [https://edumind-backend-d0lt.onrender.com/api/health](https://edumind-backend-d0lt.onrender.com/api/health)

```json
{
  "status": "healthy",
  "service": "EduMind API"
}
```

---

## 🔎 Overview

EduMind is an AI-powered adaptive learning platform designed to help students study more effectively using their own academic materials. 

Students can upload PDF documents, DOCX documents, PPTX presentations, lecture notes, course material, and revision material. The platform transforms this static study material into an interactive learning environment.

Core learning capabilities include:
- AI-generated summaries
- AI Tutor
- Retrieval-Augmented Generation (RAG)
- Quiz generation
- Flashcard generation
- Adaptive learning
- Learning analytics
- Student dashboard
- Authentication
- PostgreSQL-backed data management

The project combines full-stack web development, Artificial Intelligence, Natural Language Processing, Retrieval-Augmented Generation, vector similarity search, database management, authentication, and cloud deployment.

---

## ❗ Problem Statement

Students often work with large amounts of academic material. Common problems include:

- Important information is difficult to locate inside lengthy documents.
- Searching through study material takes time.
- Creating summaries manually is time-consuming.
- Creating practice questions manually requires additional effort.
- Preparing flashcards manually requires effort.
- Students may not know which topics require additional practice.
- Generic educational tools may not be based on the student's own material.
- Learning progress and performance may not be available in one unified workspace.

EduMind addresses this by transforming existing study material into personalized and interactive learning resources.

---

## 💡 Proposed Solution

The core concept of EduMind is: **"One study material → Multiple personalized learning experiences"**

**General Workflow:**
1. User creates an account.
2. User logs in.
3. User uploads academic documents.
4. Backend processes the documents.
5. Extracted content is indexed for RAG.
6. AI Summary generates summaries.
7. AI Tutor answers questions using retrieved material.
8. Quiz generation creates questions from study content.
9. Flashcard generation creates revision cards.
10. Learning activity is recorded.
11. Analytics provide learning information.
12. Adaptive learning analyzes learning information.
13. Recommendations are generated.

---

## 🎯 Objectives

The primary objectives of the platform are:

1. **Centralized Learning**: Provide a single platform for managing and interacting with study material.
2. **AI-Assisted Learning**: Transform static documents into interactive learning resources.
3. **Document-Grounded Answers**: Use RAG to provide responses based on uploaded study material.
4. **Personalized Revision**: Generate summaries, quizzes, and flashcards from the student's own material.
5. **Adaptive Learning**: Analyze learning activity and provide personalized recommendations.
6. **Learning Analytics**: Provide information about learning activity and performance.
7. **Secure Access**: Protect user accounts and resources through authentication and secure password handling.

---

## ⭐ Key Features

### 1. Learning Library
A centralized location for managing study materials.

### 2. Document Upload
Supported formats:
- PDF
- DOCX
- PPTX

### 3. AI-Powered Summaries
Generate concise representations of important concepts from uploaded study material.

### 4. AI Tutor
Students can ask questions about their uploaded material. The system retrieves relevant document content before generating an answer. Example: *"Explain the difference between scalability and elasticity."*

### 5. Retrieval-Augmented Generation
Pipeline processes include document processing, text extraction, text chunking, embedding generation, vector similarity search, context retrieval, and LLM generation.

### 6. Quiz Intelligence
The quiz system:
- Retrieves available study content.
- Creates a broad candidate content pool.
- Selects diverse source content.
- Generates questions and answer options.
- Validates generated questions.
- Retries using alternate content when generation fails.
- Attempts to avoid unnecessary duplicate questions.

*Supported quiz sizes: 5, 10, 15, and 20 questions.*

### 7. Flashcards
Flashcards are generated from study material for active recall and revision. 
*Supported sizes: 5, 10, 15, and 20 cards.*

### 8. Adaptive Learning
The adaptive learning layer uses quiz performance, learning activity, topic performance, study progress, and interaction patterns. Core learning analysis contains deterministic analysis logic so that it does not depend entirely on an AI model. AI-generated recommendations can then use the analyzed learning information.

### 9. Learning Analytics
Learning-related activity contributes to quiz performance, learning activity, study progress, recommendations, and dashboard statistics.

### 10. Student Dashboard
The dashboard provides a view of study materials, quizzes taken, average quiz score, flashcards reviewed, study streak, learning focus, and learning progress.

### 11. Authentication
Authentication uses email-based accounts, password authentication, JWT access tokens, and bcrypt password hashing.

---

## 🧠 AI Architecture

The AI system is locally hosted for the complete local demonstration.

| Component | Technology |
|---|---|
| AI Runtime | Ollama |
| Language Model | Llama 3.2 3B |
| Embedding Model | nomic-embed-text |
| Vector Search | FAISS |
| AI Architecture | Retrieval-Augmented Generation |

The local AI system uses:

```text
Ollama
├── Llama 3.2 3B
└── nomic-embed-text
```

- **Llama 3.2 3B** is used for: Summarization, AI Tutor, Quiz generation, Flashcard generation, and Learning recommendations.
- **nomic-embed-text** is used for: Document chunk embeddings, Query embeddings, and Semantic retrieval.
- **FAISS** is used for: Vector storage/indexing, Similarity search, and Retrieval of semantically relevant document chunks.

---

## 🔍 Retrieval-Augmented Generation (RAG)

RAG retrieves relevant content before generation so the model can use the student's uploaded material as context.

```mermaid
flowchart TD
    A[Uploaded Document] --> B[Text Extraction]
    B --> C[Text Chunking]
    C --> D[Embedding Generation]
    D --> E[(FAISS Index)]
    F[User Question] --> G[Query Embedding]
    G --> H[Similarity Search]
    E --> H
    H --> I[Relevant Document Chunks]
    I --> J[AI Context]
    J --> K[Llama 3.2 3B]
    K --> L[Generated Answer]
```

---

## 🏗 System Architecture

```mermaid
flowchart TD
    User([User Browser]) --> Frontend[React + Vite Frontend]
    Frontend --> Backend[FastAPI Backend]
    
    subgraph Backend Services
        Auth[Authentication]
        Materials[Materials]
        Analytics[Analytics]
        Planner[Planner]
        Adaptive[Adaptive Learning]
        Profile[Profile]
    end

    Backend --> Auth
    Backend --> Materials
    Backend --> Analytics
    Backend --> Planner
    Backend --> Adaptive
    Backend --> Profile
    
    Backend --> DB[(PostgreSQL)]

    subgraph AI Enabled Local Mode
        AIService[AI Service]
        Ollama[Ollama]
        Llama[Llama 3.2 3B]
        Nomic[nomic-embed-text]
        RAG[RAG Service]
        FAISS[(FAISS Vector Store)]
        
        AIService --> Ollama
        Ollama --> Llama
        Ollama --> Nomic
        RAG --> FAISS
    end
    
    Backend -.-> AIService
    Backend -.-> RAG
```

---

## 🔄 Application Workflow

```mermaid
flowchart TD
    User([User]) --> Auth[Registration / Login]
    Auth --> Dash[Dashboard]
    Dash --> Lib[Learning Library]
    Lib --> Upload[Upload Study Material]
    Upload --> Process[Document Processing]
    
    Process --> Feat[AI Learning Features]
    
    subgraph Features
        Sum[Summary]
        Tutor[AI Tutor]
        Quiz[Quiz]
        Cards[Flashcards]
    end
    
    Feat --> Sum
    Feat --> Tutor
    Feat --> Quiz
    Feat --> Cards
    
    Feat --> Activity[Learning Activity]
    Activity --> Analytics[Analytics]
    Analytics --> Adapt[Adaptive Recommendations]
```

---

## 🔐 Authentication Workflow

**Registration:**
```mermaid
flowchart LR
    User([User]) --> Reg[Registration]
    Reg --> Hash[Password Hashing]
    Hash --> DB[(PostgreSQL)]
```

**Login:**
```mermaid
flowchart LR
    Creds[Email + Password] --> BackendAuth[Backend Authentication]
    BackendAuth --> Verify[Password Verification]
    Verify --> JWT[JWT Token]
    JWT --> Frontend[Frontend]
    Frontend --> AuthAPI[Authenticated API Requests]
```
JWT is used for authenticated requests to protected backend resources.

---

## 📄 Document Processing Workflow

```mermaid
flowchart TD
    Upload[Document Upload] --> Val[File Validation]
    Val --> Detect[Document Type Detection]
    
    Detect --> PDF[PDF]
    Detect --> DOCX[DOCX]
    Detect --> PPTX[PPTX]
    
    PDF & DOCX & PPTX --> Extract[Text Extraction]
    Extract --> Process[Content Processing]
    Process --> Chunk[Text Chunking]
    Chunk --> Embed[Embedding Generation]
    Embed --> FAISS[(FAISS Vector Store)]
```

---

## 📝 Quiz Generation Workflow

```mermaid
flowchart TD
    Material[Uploaded Material] --> Avail[Available Study Content]
    Avail --> Pool[Candidate Content Pool]
    Pool --> Select[Diverse Source Selection]
    Select --> Gen[AI Question Generation]
    Gen --> Val[Question Validation]
    
    Val -->|Valid| Keep[Keep]
    Val -->|Invalid| Retry[Retry with alternate content]
    
    Keep & Retry --> Final[Final Quiz]
```
*Supported sizes: 5, 10, 15, and 20 questions.*

---

## 📇 Flashcard Generation Workflow

```mermaid
flowchart TD
    Mat[Study Material] --> Pool[Study Content Pool]
    Pool --> Select[Content Selection]
    Select --> Gen[AI Flashcard Generation]
    Gen --> Val[Validation]
    
    Val -->|Valid| Keep[Keep]
    Val -->|Failed| Retry[Retry]
    
    Keep & Retry --> Final[Final Flashcard Set]
```
*Supported sizes: 5, 10, 15, and 20 cards.*

---

## 📈 Adaptive Learning Architecture

```mermaid
flowchart TD
    Activity[Student Activity] --> Data[Learning Data]
    Data --> Analys[Performance Analysis]
    Analys --> Profile[Topic / Learning Profile]
    Profile --> Gen[Recommendation Generation]
    
    Gen --> Determin[Deterministic Analysis]
    Gen --> AILayer[AI Recommendation Layer]
    
    Determin & AILayer --> Recs[Personalized Learning Recommendations]
```
The core analysis contains deterministic logic and AI recommendations act as an additional layer.

---

## 🛠 Technology Stack

**Frontend:**
- React, Vite, JavaScript, HTML5, CSS, Tailwind CSS

**Backend:**
- Python, FastAPI, Uvicorn, SQLAlchemy, PostgreSQL, PyJWT, bcrypt, python-dotenv

**AI / ML:**
- Ollama, Llama 3.2 3B, nomic-embed-text, FAISS, Retrieval-Augmented Generation (RAG)

**Document Processing:**
- PyMuPDF, python-docx, python-pptx, pytesseract, Pillow

**Deployment:**
- GitHub, Vercel, Render, Render PostgreSQL

---

## 📂 Project Structure

```text
EduMind-Project/
│
├── README.md
│
├── edumind-backend/
│   ├── api/
│   │   ├── auth.py
│   │   ├── materials.py
│   │   ├── analytics.py
│   │   ├── planner.py
│   │   ├── adaptive.py
│   │   └── profile.py
│   │
│   ├── core/
│   │   ├── database.py
│   │   └── security.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── material.py
│   │   ├── analytics.py
│   │   └── planner.py
│   │
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── rag_service.py
│   │   └── adaptive_planner.py
│   │
│   ├── uploads/
│   ├── vector_store/
│   ├── main.py
│   ├── requirements.txt
│   └── .python-version
│
└── edumind-frontend/
    ├── src/
    ├── public/
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## ⚙️ Backend / API Architecture

**Backend entry point:** `edumind-backend/main.py`

**Main API routers:**
Located in `api/` (e.g., `auth.py`, `materials.py`, `analytics.py`, `planner.py`, `adaptive.py`, `profile.py`)

**Service layer:**
Located in `services/` (e.g., `ai_service.py`, `rag_service.py`, `adaptive_planner.py`)

This separation keeps API routing, AI functionality, RAG functionality, and adaptive learning logic organized.

---

## 🗄️ Database Architecture

- **Database:** PostgreSQL
- **ORM:** SQLAlchemy

Application data includes: Users, Study materials, Analytics events, Study tasks, and Learning-related information.

```mermaid
flowchart TD
    FastAPI --> SQL[SQLAlchemy ORM]
    SQL --> DB[(PostgreSQL)]
```

Connection is configured through the `DATABASE_URL`. Tables are created using SQLAlchemy model definitions.

---

## 🔒 Security

- **JWT authentication:** Managed via `JWT_SECRET_KEY` and `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`.
- **Password hashing:** bcrypt.
- **Environment variables:** `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`, `VITE_API_URL`, `AI_ENABLED`, `FRONTEND_URL`. (Never include actual secrets in source control).
- **CORS:** FastAPI CORSMiddleware is used. Local development supports `localhost`/`127.0.0.1` origins, while the deployed environment uses the configured frontend URL.

---

## 💻 Local Installation

**Prerequisites:**
- Python 3.13+
- Node.js
- npm
- PostgreSQL
- Ollama
- Git

**Backend Setup:**
```bash
cd edumind-backend
python -m venv venv
```
Windows Git Bash activation:
```bash
source venv/Scripts/activate
```
Install dependencies:
```bash
pip install -r requirements.txt
```

---

## 🐘 PostgreSQL Setup

Example database name: `edumind`

Example backend `.env` configuration (do not use real credentials in source control):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/edumind
JWT_SECRET_KEY=your_secret_key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
AI_ENABLED=true
FRONTEND_URL=http://localhost:5173
```

---

## 🤖 Ollama Setup

Install Ollama, then pull the required models:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Verify models are installed:
```bash
ollama list
```
*The local demo uses Llama 3.2 3B and nomic-embed-text.*

---

## ▶️ Running Locally

**Backend:**
```bash
cd edumind-backend
source venv/Scripts/activate
uvicorn main:app --reload
```
- Backend URL: `http://127.0.0.1:8000`
- Health Endpoint: `http://127.0.0.1:8000/api/health`

**Frontend:**
```bash
cd edumind-frontend
npm install
npm run dev
```
- Frontend URL: `http://localhost:5173`

*Note: AI must be enabled for the full local AI demonstration (`AI_ENABLED=true`).*

---

## ✅ Testing

The project has been tested for:

- **Authentication**: Registration, Login, JWT authentication, Dashboard access.
- **Learning Library**: Material upload, Existing material access, Document opening.
- **AI**: AI Tutor, AI Summary, Quiz generation, Flashcard generation, RAG retrieval.
- **Quiz**: 5, 10, 15, and 20 questions.
- **Flashcards**: 5, 10, 15, and 20 cards.
- **Backend**: FastAPI startup, Database connectivity, Health endpoint, CORS, Production deployment.
- **Frontend**: Production build, Vercel deployment, Frontend/backend communication, Authentication against deployed backend.

---

## 🚀 Deployment Architecture

```mermaid
flowchart TD
    User([User Browser]) --> Vercel[Vercel]
    Vercel --> React[React Frontend]
    React --> Render[Render]
    Render --> FastAPI[FastAPI Backend]
    FastAPI --> RenderDB[(Render PostgreSQL)]
```

---

## ☁️ Deployment

- **Live frontend**: [https://edu-mind-project.vercel.app](https://edu-mind-project.vercel.app)
- **Live backend**: [https://edumind-backend-d0lt.onrender.com](https://edumind-backend-d0lt.onrender.com)
- **Backend health endpoint**: [https://edumind-backend-d0lt.onrender.com/api/health](https://edumind-backend-d0lt.onrender.com/api/health)

---

## ⚠️ Important AI Deployment Note

**The public Render backend runs with `AI_ENABLED=false`.**

This is intentional. The public deployment is a lightweight deployed infrastructure/demo environment. 

The complete AI experience is demonstrated locally using:
```text
Ollama
├── Llama 3.2 3B
└── nomic-embed-text
```

- **Local mode**: `AI_ENABLED=true`
- **Public lightweight deployment**: `AI_ENABLED=false`

---

## 📊 Current Project Status

**Working features:**
- User registration and login
- JWT authentication
- Dashboard and Learning Library
- PDF, DOCX, and PPTX upload
- Document processing
- AI Summary and AI Tutor
- RAG-based retrieval
- Quiz generation (5, 10, 15, 20 questions)
- Flashcard generation (5, 10, 15, 20 cards)
- Learning analytics and Adaptive learning analysis
- Learning recommendations
- PostgreSQL integration
- Local Ollama AI with FAISS vector search
- Vercel deployment, Render deployment, and Render PostgreSQL
- Production frontend/backend communication

**Mock Examination — Coming Soon**  
Mock Examination is NOT implemented yet. It is represented in the frontend as *"Coming Soon"*.

---

## 🔮 Future Enhancements

Possible future enhancements:
- **Advanced AI**: Cloud-based AI inference, Larger language models, More advanced RAG strategies, Improved document understanding, Better contextual memory, Multi-document reasoning.
- **Mobile**: Android/iOS application.
- **Voice**: Voice AI Tutor, Voice input, Audio responses.
- **Advanced Analytics**: Topic mastery, Learning trends, Weak-topic identification, Time-based learning analysis.
- **Teacher Dashboard**: Student performance, Class analytics, Quiz creation, Learning progress, Material management.
- **Mock Examination**: Timed exams, Randomized questions, Difficulty levels, Automatic evaluation, Detailed results, Performance analysis.
- **Notifications**: Pending study tasks, Revision reminders, Quizzes, Weak topics, Study streaks.
- **Cloud Storage**: Cloud object storage for uploaded documents.

---

## 📚 SDG 4 — Quality Education

EduMind aligns with the **United Nations Sustainable Development Goal 4 — Quality Education**.

The project focuses on improving the learning experience through AI-assisted understanding, revision, assessment, and personalized learning. Students can interact with educational resources efficiently, create personalized revision material, practice using generated quizzes, revise using flashcards, receive learning recommendations, and track their learning activity.

---

## 🎓 Academic Significance

EduMind demonstrates integration of:
- **Artificial Intelligence**: Llama 3.2 3B for language generation and educational assistance.
- **Natural Language Processing**: Processing and working with textual educational content.
- **Retrieval-Augmented Generation**: Combining retrieval with language generation.
- **Vector Similarity Search**: Embeddings + FAISS for semantic retrieval.
- **Web Development**: React + FastAPI full-stack application.
- **Database Management**: PostgreSQL + SQLAlchemy.
- **Cybersecurity**: Authentication, bcrypt, JWT, environment-based secrets, CORS.
- **Cloud Computing**: Vercel, Render, and PostgreSQL deployment.

---

## 👨‍💻 Developer

**Faraz Ahmed**  
Master of Computer Applications (MCA)

**Project:**  
EduMind — AI-Powered Adaptive Learning Platform

Academic capstone project focused on combining Artificial Intelligence, Adaptive Learning, Full-stack Web Development, RAG, Database Systems, and Cloud Deployment.

---

## 🙏 Acknowledgements

I would like to express my sincere gratitude to the faculty members, mentors, and peers who provided invaluable guidance, feedback, and support throughout the development of EduMind. Their insights were instrumental in shaping this academic capstone project.

---

## 📜 License

This is an academic project.  
All rights reserved unless otherwise specified.
