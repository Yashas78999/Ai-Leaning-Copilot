# AI Learning Copilot - Architecture & Folder Structure

This document outlines the production-ready, clean architecture designed for **AI Learning Copilot**—a scalable educational AI SaaS application. The project is separated into a FastAPI backend, a React frontend, and infrastructure/CI-CD configuration files.

---

## 1. Directory Tree Structure

```text
ai-learning-copilot/
├── .github/                      # GitHub Actions workflows
│   └── workflows/
│       └── ci-cd.yml             # Automated testing, linting, and deployment
├── docs/                         # Project architecture, api specs, and documentation
│   ├── api_spec.md
│   └── architecture.md
├── backend/                      # FastAPI Backend
│   ├── alembic/                  # Database migration scripts & history
│   ├── app/                      # Application core package
│   │   ├── api/                  # API endpoints and routes (versioned v1)
│   │   │   ├── v1/
│   │   │   │   ├── auth.py       # Authentication endpoints (Login, Register)
│   │   │   │   ├── flashcards.py # Flashcard CRUD endpoints
│   │   │   │   ├── pdfs.py       # PDF upload, management, processing endpoints
│   │   │   │   ├── quizzes.py    # Quiz CRUD and generation endpoints
│   │   │   │   ├── router.py     # Main API router combining v1 routes
│   │   │   │   ├── study_plans.py# Study plan creation/management endpoints
│   │   │   │   ├── tutor.py      # AI Tutor Chat/Voice interactive agent endpoints
│   │   │   │   └── users.py      # User profile and account endpoints
│   │   │   └── __init__.py
│   │   ├── core/                 # Shared core settings and configs
│   │   │   ├── config.py         # Application configuration (env variables, secret keys)
│   │   │   ├── database.py       # Database sessionmaker, engine initialization, and dependencies
│   │   │   ├── security.py       # Password hashing, JWT token operations, and CORS setups
│   │   │   └── __init__.py
│   │   ├── models/               # SQLAlchemy Models (Database schemas)
│   │   │   ├── base.py           # Shared DeclarativeBase for model registration
│   │   │   ├── flashcard.py      # Flashcard and FlashcardDeck models
│   │   │   ├── pdf.py            # PDF metadata and document storage models
│   │   │   ├── quiz.py           # Quiz, Question, and Answer models
│   │   │   ├── study_plan.py     # StudyPlan, Milestone, and Task models
│   │   │   ├── user.py           # User account database models
│   │   │   └── __init__.py
│   │   ├── schemas/              # Pydantic Schemas (Request/Response validation)
│   │   │   ├── auth.py           # Login, Token, and Password schemas
│   │   │   ├── flashcard.py      # Flashcard input/output validation schemas
│   │   │   ├── pdf.py            # PDF upload and processing validation schemas
│   │   │   ├── quiz.py           # Quiz metadata and structure validation schemas
│   │   │   ├── study_plan.py     # Study plan generation and update schemas
│   │   │   ├── user.py           # User detail, update, and creation schemas
│   │   │   └── __init__.py
│   │   ├── services/             # Core Business Logic (Service Layer)
│   │   │   ├── ai.py             # Interfaces for LangChain, LLMs, and generation tasks
│   │   │   ├── auth.py           # User registration, authentication, token logic
│   │   │   ├── flashcard.py      # Flashcard curation logic
│   │   │   ├── pdf.py            # PDF file processing and storage handling
│   │   │   ├── quiz.py           # Quiz orchestration logic
│   │   │   ├── study_plan.py     # Study plan generation and progress tracking
│   │   │   └── __init__.py
│   │   ├── utils/                # Helper files and custom libraries
│   │   │   ├── helpers.py        # Generic utilities (formatting, timestamps)
│   │   │   ├── pdf_parser.py     # Text extraction and parsing handlers
│   │   │   └── __init__.py
│   │   ├── vector_db/            # RAG (Retrieval-Augmented Generation) & Embeddings
│   │   │   ├── embeddings.py     # Embedding model integrations (OpenAI/HuggingFace)
│   │   │   ├── faiss_store.py    # FAISS local indexing, storage, and retrieval logic
│   │   │   └── __init__.py
│   │   └── __init__.py
│   ├── tests/                    # Backend automated tests
│   │   ├── api/                  # Integration tests for routes
│   │   ├── services/             # Unit tests for business services
│   │   └── conftest.py           # Test configurations, fixtures, DB overrides
│   ├── .env.example              # Sample environment variables file
│   ├── alembic.ini               # Alembic configuration for DB migrations
│   ├── Dockerfile                # Backend containerization config
│   └── requirements.txt          # Python packages list
├── frontend/                     # React + Tailwind CSS Frontend
│   ├── src/
│   │   ├── assets/               # Static resources (images, SVGs, brand assets)
│   │   ├── components/           # Reusable React components
│   │   │   ├── chat/             # Chat interfaces and conversation boxes
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   └── MessageBubble.jsx
│   │   │   ├── common/           # Generic building blocks (UI elements)
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Spinner.jsx
│   │   │   ├── flashcard/        # Study review and flashcard widgets
│   │   │   │   └── FlashcardFlip.jsx
│   │   │   ├── layout/           # Shared page wrappers
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Sidebar.jsx
│   │   │   ├── pdf/              # Document uploaders and viewers
│   │   │   │   ├── PDFUpload.jsx
│   │   │   │   └── PDFViewer.jsx
│   │   │   ├── quiz/             # Quiz layouts and result trackers
│   │   │   │   ├── QuizCard.jsx
│   │   │   │   └── QuizResults.jsx
│   │   │   └── study_plan/       # Roadmaps and calendar widgets
│   │   │       └── PlanCalendar.jsx
│   │   ├── context/              # Context API for Global State Management
│   │   │   ├── AuthContext.jsx   # Authentication context (user state, credentials)
│   │   │   └── ThemeContext.jsx  # Dark/Light mode state management
│   │   ├── hooks/                # Custom hooks for abstraction
│   │   │   ├── useAuth.js        # Helper hook for accessing Auth state
│   │   │   └── useChat.js        # Helper hook for active RAG and tutor chat state
│   │   ├── pages/                # High-level route views
│   │   │   ├── ChatRoom.jsx      # Chat interface page
│   │   │   ├── Dashboard.jsx     # Main workspace page
│   │   │   ├── Flashcards.jsx    # Review deck page
│   │   │   ├── Login.jsx         # Sign-in page
│   │   │   ├── Quizzes.jsx       # Interactive quiz page
│   │   │   ├── Register.jsx      # Signup page
│   │   │   └── StudyPlans.jsx    # Generated roadmap overview page
│   │   ├── services/             # API client modules (Axios/Fetch config)
│   │   │   ├── api.js            # Base Axios client setup (interceptors, headers)
│   │   │   ├── auth.js           # Authentication API calls
│   │   │   ├── chat.js           # RAG and tutoring chat endpoints logic
│   │   │   ├── pdfs.js           # PDF upload and process API calls
│   │   │   └── quizzes.js        # Quiz generation and scoring API calls
│   │   ├── styles/               # Styling configuration
│   │   │   └── index.css         # Global Tailwind and custom styles
│   │   ├── utils/                # Helper functions (date-formatters, token-decoders)
│   │   │   └── helpers.js
│   │   ├── App.jsx               # Root element and page routing definition
│   │   └── main.jsx              # Entry mount point for React DOM
│   ├── .env.example              # Sample environment variables for Vite
│   ├── Dockerfile                # Frontend Nginx/Vite build container configuration
│   ├── package.json              # NPM package metadata and command scripts
│   ├── postcss.config.js         # PostCSS plugins config (autoprefixer)
│   ├── tailwind.config.js        # Tailwind CSS variables and design tokens configuration
│   └── vite.config.js            # Vite build engine configurations
├── docker-compose.yml            # Multi-container orchestration (Backend, Frontend, Postgres, FAISS storage)
└── README.md                     # Main project overview and setup guide
```

---

## 2. Component and Folder Explanation

### Core DevOps & Docs
- **`.github/workflows/`**: Holds CI/CD configuration files (GitHub Actions). Automates code formatting checks, static analysis, test runs, and container build/deploy triggers.
- **`docs/`**: Main documentation hub containing development specs, architecture diagrams, and API routing designs.

---

### Backend (FastAPI - Clean Architecture)
- **`backend/alembic/`**: Stores auto-generated migration files to manage PostgreSQL database migrations.
- **`backend/app/api/v1/`**: The controller layer of the FastAPI application. Routes API endpoints, handles requests, and references service modules. Grouped logically by features (Auth, PDFs, Quizzes, Flashcards, Study Plans, AI Tutor).
- **`backend/app/core/`**: Houses global configurations (Pydantic settings), security logic (bcrypt, JWT encode/decode), and base database connections.
- **`backend/app/models/`**: SQL database models representing system schemas in PostgreSQL via SQLAlchemy ORM.
- **`backend/app/schemas/`**: Pydantic models for data input/output payload validation, defining precise serialization formats.
- **`backend/app/services/`**: The Core Service Layer. Keeps routes thin and reusable by grouping core business logic. Includes `ai.py` which abstracts LLMs, prompt engineering, and conversational workflows.
- **`backend/app/vector_db/`**: Isolates text chunking, FAISS index construction, embeddings retrieval, and vector queries.
- **`backend/app/utils/`**: Shared helper methods, including parsing functions (like custom PDF layout extraction).
- **`backend/tests/`**: Includes backend automated tests (unit and integration tests) using `pytest`.

---

### Frontend (React + Tailwind CSS)
- **`frontend/src/assets/`**: Uncompiled asset files like product logos, default avatars, and graphics.
- **`frontend/src/components/`**: Standard React components segmented by context (e.g. `pdf/` for document management, `chat/` for interactions, and `common/` for UI controls).
- **`frontend/src/context/`**: Global state variables (e.g. Auth tokens, theme toggles) accessible by all components.
- **`frontend/src/hooks/`**: Custom hooks encapsulating state and side-effects (e.g., streaming chat content or token auto-refresh).
- **`frontend/src/pages/`**: Primary page screens structured around frontend routes (Vite + React Router).
- **`frontend/src/services/`**: Formulates network client calls (Axios) to clean-up API communications.
- **`frontend/src/styles/`**: Custom Tailwind guidelines and utilities (e.g., standard color palettes, shadows).
- **`frontend/src/utils/`**: Lightweight utility modules for formatting, validations, and local storage bindings.
