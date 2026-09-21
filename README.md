# 🧠 EduMind — AI-Powered Adaptive Learning Platform

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

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Proposed Solution](#-proposed-solution)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [AI Architecture](#-ai-architecture)
- [RAG Pipeline](#-retrieval-augmented-generation-rag)
- [System Architecture](#-system-architecture)
- [Application Workflow](#-application-workflow)
- [Authentication Workflow](#-authentication-workflow)
- [Document Processing Workflow](#-document-processing-workflow)
- [Quiz Generation Workflow](#-quiz-generation-workflow)
- [Flashcard Generation Workflow](#-flashcard-generation-workflow)
- [Adaptive Learning Architecture](#-adaptive-learning-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-folder-structure)
- [API Architecture](#-api--backend-architecture)
- [Database Architecture](#-database-architecture)
- [Security](#-security)
- [Local Installation](#-local-installation)
- [PostgreSQL Setup](#-postgresql-setup)
- [Ollama Setup](#-ollama-setup)
- [Running the Backend](#-running-the-backend)
- [Running the Frontend](#-running-the-frontend)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Deployment Architecture](#-deployment-architecture)
- [Deployment](#-deployment-with-vercel-render-and-postgresql)
- [Important AI Deployment Note](#-important-ai-deployment-note)
- [Current Project Status](#-current-project-status)
- [Future Enhancements](#-future-enhancements)
- [Sustainable Development Goal](#-sustainable-development-goal)
- [Developer](#-developer)
- [License](#-license)

---

# 🚀 Live Application

### Frontend

**EduMind Web Application**

https://edu-mind-project.vercel.app

### Backend

**EduMind FastAPI Backend**

https://edumind-backend-d0lt.onrender.com

### Backend Health Check

https://edumind-backend-d0lt.onrender.com/api/health

The health endpoint returns:

```json
{
  "status": "healthy",
  "service": "EduMind API"
}
