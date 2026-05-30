# C4 Architecture Diagrams — Current "As-Is" System

This document provides a comprehensive C4 model representation of the **Nutino** system as it is **currently implemented in the codebase**. Unlike theoretical or future-state diagrams, this reflects the exact active components, data flows, and technologies present in the `/01newssum` (Frontend) and `/server` (Backend) directories.

> [!NOTE]
> **Key Distinctions of the Active Implementation:**
> - **Authentication:** User authentication and registration are not currently implemented or mounted on the backend routes.
> - **Caching:** Instead of an external Redis cluster, the backend uses a local, in-memory Node.js cache object in `newsRoutes.js` with a 5-minute TTL to throttle NewsAPI requests.
> - **Fallback Engine:** The summarization backend includes a dual-LLM pipeline: it tries **Google Gemini Pro (`gemini-2.0-flash`)** first, and falls back to **Groq (`llama-3.1-8b-instant`)** if Gemini fails or is rate-limited.

---

## 📂 System C4 Level 1: Context Diagram

The Context diagram shows how users interact with the Nutino dashboard, and how Nutino integrates with external APIs to fetch live news and generate AI-driven summaries.

```mermaid
C4Context
    title System Context Diagram for Nutino (Current)

    Person(user, "User", "A reader browsing headlines, requesting AI summaries, and reviewing saved insights.")
    
    System(nutino, "Nutino System", "AI-powered news dashboard offering live news, automated summarization, and a persistent library of saved summaries.")
    
    System_Ext(newsapi, "NewsAPI", "External REST API providing real-time global news headlines and articles based on categories.")
    System_Ext(gemini, "Google Gemini Pro API", "Primary AI service used to generate 3-bullet-point article summaries via gemini-2.0-flash.")
    System_Ext(groq, "Groq API", "Fallback AI service providing high-speed Llama-3.1-8b-instant inference if Gemini fails.")
    
    Rel(user, nutino, "Browses categories, triggers summaries, views library", "HTTPS")
    Rel(nutino, newsapi, "Fetches top headlines by category", "REST/HTTPS")
    Rel(nutino, gemini, "Generates 3-bullet summaries (Primary)", "REST/HTTPS")
    Rel(nutino, groq, "Generates 3-bullet summaries (Fallback)", "REST/HTTPS")
```

---

## 📦 System C4 Level 2: Container Diagram

The Container diagram decomposes the Nutino system into its executable components: the Single Page Application (SPA), the API Backend service, and the persistent Database.

```mermaid
C4Container
    title Container Diagram for Nutino (Current)

    Person(user, "User", "Browses news and views summaries in the browser.")

    System_Boundary(nutino_boundary, "Nutino System") {
        Container(web, "Web Application (SPA)", "React 18, Vite, Tailwind CSS", "Renders the modern, dark-themed responsive dashboard, manages category states, and triggers summary API calls.")
        
        Container(api, "API Backend Application", "Node.js, Express", "Handles API routing, manages the news caching layer, coordinates the 3-stage summarization pipeline, and interfaces with the database.")
        
        ContainerDb(db, "Database", "MongoDB (via Mongoose)", "Stores successfully generated summaries for retrieval in the Intelligence Library.")
    }

    System_Ext(newsapi, "NewsAPI", "External news feeds.")
    System_Ext(gemini, "Gemini API", "Primary LLM provider.")
    System_Ext(groq, "Groq API", "Fallback LLM provider.")

    Rel(user, web, "Interacts with", "HTTPS")
    Rel(web, api, "Fetches news & requests summaries", "JSON/HTTPS (Port 5001)")
    Rel(api, db, "Reads/writes saved summaries", "Mongoose ODM / TCP")
    Rel(api, newsapi, "Fetches headlines", "HTTPS")
    Rel(api, gemini, "Generates summaries", "HTTPS")
    Rel(api, groq, "Fallback generation", "HTTPS")
```

---

## 🧩 System C4 Level 3: Component Diagrams

### 1. Web Frontend Component Diagram (`/01newssum`)

Decomposes the client side into pages, UI components, state management, and the Axios API service layer.

```mermaid
C4Component
    title Component Diagram for Web Frontend (React)

    Container_Boundary(frontend, "Web Application Container") {
        Component(router, "React Router DOM", "Library", "Manages client-side page routing ('/' and '/summaries').")
        Component(navbar, "Navbar", "React Component", "Provides brand identity and navigation links.")
        Component(tabs, "Tabs", "React Component", "Handles category selection (General, Business, Tech, etc.).")
        
        Component(homePage, "Home Page", "React Page", "Main dashboard displaying live feed, handles 'Summarize' clicks, and coordinates layout.")
        Component(mySummariesPage, "MySummaries Page", "React Page", "Displays the saved summaries fetched from the Database.")
        
        Component(articleCard, "ArticleCard", "React Component", "Renders an individual news article, showing title, source, image, and triggering detail modal.")
        Component(articleDetail, "ArticleDetail", "React Component", "A detailed modal view showing full article context and the 3-bullet AI summary loader/content.")
        
        Component(newsApiService, "newsAPI.js", "Javascript Service", "Performs GET requests to `/api/news` using Axios.")
        Component(geminiApiService, "geminiAPI.js", "Javascript Service", "Performs POST requests to `/api/summarize` and handles error states.")
    }

    Container(backend_api, "API Backend", "Express", "Receives frontend requests.")

    Rel(router, homePage, "Renders '/'")
    Rel(router, mySummariesPage, "Renders '/summaries'")
    
    Rel(homePage, tabs, "Uses")
    Rel(homePage, articleCard, "Renders list")
    Rel(articleCard, articleDetail, "Opens on click")
    
    Rel(homePage, newsApiService, "Uses")
    Rel(articleDetail, geminiApiService, "Uses")
    
    Rel(mySummariesPage, backend_api, "GET /api/summaries", "Axios/HTTPS")
    Rel(newsApiService, backend_api, "GET /api/news", "Axios/HTTPS")
    Rel(geminiApiService, backend_api, "POST /api/summarize", "Axios/HTTPS")
```

---

### 2. API Backend Component Diagram (`/server`)

Decomposes the Express application into routers, controllers, the core pipeline engine, models, and custom utility scripts.

```mermaid
C4Component
    title Component Diagram for API Backend (Express)

    Container_Boundary(backend, "API Backend Container") {
        Component(server, "Express App (index.js)", "Node.js / Express", "Initializes middlewares (CORS, JSON parser), connects to database, and mounts routes.")
        
        Component(newsRouter, "News Router (newsRoutes.js)", "Express Router", "Defines `/api/news` route. Manages local caching logic.")
        Component(newsCache, "newsCache", "In-Memory Object", "Caches NewsAPI results by category with a 5-minute TTL.")
        
        Component(summarizeRouter, "Summarize Router (summarizeRoutes.js)", "Express Router", "Defines `/api/summarize` (single) and `/api/summarize/batch` routes.")
        Component(summarizeCtrl, "Summarize Controller (summarizeController.js)", "Javascript Controller", "Handles client payloads, orchestrates the 3-stage pipeline, and aggregates batch responses.")
        
        Component(summaryRouter, "Summary Router (summaryRoutes.js)", "Express Router", "Defines GET and POST routes for `/api/summaries`.")
        Component(summaryCtrl, "Summary Controller (summaryController.js)", "Javascript Controller", "Directly saves summaries to or fetches all summaries from the DB.")
        
        Component(pipeline, "Pipeline Engine (pipeline.js)", "Core Service Module", "Encapsulates the core processing engine in 3 decoupled stages.")
        
        Component(ingestStage, "ingestArticle()", "Stage 1 Function", "Validates character counts (min 100), trimming, and checks non-printable character ratio (< 30%).")
        Component(summarizeStage, "summarizeArticle()", "Stage 2 Function", "Triggers LLM calls. Manages Gemini Pro attempts, retry pauses, and Groq fallback.")
        Component(storeStage, "storeSummary()", "Stage 3 Function", "Maps successful summaries to Mongoose entities and saves to MongoDB.")
        
        Component(summaryModel, "Summary Model (Summary.js)", "Mongoose Schema", "Defines the database entity structure (title, source, date, url, summary).")
        Component(logger, "Logger Pipeline (logger.js)", "Utility", "Handles structured stdout prefixing for each pipeline stage (`[INGEST]`, `[SUMMARIZE]`, `[STORE]`).")
    }

    Container(web_app, "Web Application", "React", "Sends frontend requests.")
    ContainerDb(mongodb, "MongoDB", "Database", "Stores persisted records.")
    System_Ext(newsapi, "NewsAPI", "External API")
    System_Ext(gemini, "Gemini API", "External API")
    System_Ext(groq, "Groq API", "External API")

    Rel(web_app, server, "HTTP Requests")
    Rel(server, newsRouter, "Mounts '/api/news'")
    Rel(server, summarizeRouter, "Mounts '/api/summarize'")
    Rel(server, summaryRouter, "Mounts '/api/summaries'")

    Rel(newsRouter, newsCache, "Checks / Writes")
    Rel(newsCache, newsapi, "Fetches headlines on cache miss", "HTTPS")

    Rel(summarizeRouter, summarizeCtrl, "Dispatches")
    Rel(summarizeCtrl, pipeline, "Calls pipeline stages")
    
    Rel(pipeline, ingestStage, "Ingests")
    Rel(pipeline, summarizeStage, "Summarizes")
    Rel(pipeline, storeStage, "Stores")
    
    Rel(summarizeStage, gemini, "Attempts primary inference", "REST/HTTPS")
    Rel(summarizeStage, groq, "Fallback on Gemini fail", "REST/HTTPS")
    
    Rel(summaryRouter, summaryCtrl, "Dispatches")
    Rel(summaryCtrl, summaryModel, "Uses")
    Rel(storeStage, summaryModel, "Saves document")
    
    Rel(summaryModel, mongodb, "TCP/IP Connection")
    
    Rel(pipeline, logger, "Logs pipeline states")
```

---

## 🔄 Core Data Flow: The 3-Stage AI Summarization Pipeline

A key design feature of Nutino is the sequential processing pipeline inside `server/pipeline/pipeline.js` when a user requests a summary:

```mermaid
flowchart TD
    Start([User Clicks 'Summarize']) --> Ingest[Stage 1: Ingest & Validate]
    
    Ingest --> LengthCheck{Is Content Length >= 100?}
    LengthCheck -- No --> RejectErr[Return 400 Bad Request]
    LengthCheck -- Yes --> MalformCheck{Is Non-Printable Ratio <= 30%?}
    MalformCheck -- No --> RejectErr
    
    MalformCheck -- Yes --> Summarize[Stage 2: AI Summarize]
    
    Summarize --> GeminiAttempt{Try Gemini API}
    GeminiAttempt -- Success --> Store[Stage 3: Save to Database]
    GeminiAttempt -- Fail (Try 1) --> GeminiRetry{Retry Gemini}
    
    GeminiRetry -- Success --> Store
    GeminiRetry -- Fail (Try 2) --> GroqFallback{Try Groq Fallback}
    
    GroqFallback -- Success --> Store
    GroqFallback -- Fail --> FailErr[Return 502/500 Server Error]
    
    Store --> DBWrite{Save via Mongoose}
    DBWrite -- Success --> SuccessRes[Return 200 OK + Stored Summary]
    DBWrite -- Fail --> WarnRes[Return 200 OK + Summary + DB Warning]
```

---

## 🗄️ Database Entity Schema (MongoDB)

The data model for saved insights is simple and highly indexable.

```mermaid
erDiagram
    SUMMARIES {
        ObjectId _id PK
        string title "Required"
        string source "Required"
        string date "Required"
        string url "Optional"
        string summary "Required, 3 bullet points"
        datetime createdAt "Default: Date.now"
    }
```
