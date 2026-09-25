# 🏛️ CGSSB & CGPSC Exam Prep Portal & Content Management System
[![Release](https://img.shields.io/badge/release-v2.5.1-emerald.svg)](https://github.com/chandrakar-shubham/cgssb-portal-live)
[![Build](https://img.shields.io/badge/build-B%23260925.1414-blue.svg)](https://github.com/chandrakar-shubham/cgssb-portal-live)

An enterprise-grade, high-concurrency Mock Test, Question Bank & Official Previous Year Paper (PYP) platform designed for **CGSSB (Chhattisgarh State Staff Selection Board / Vyapam)** and **CGPSC (Chhattisgarh Public Service Commission)** examinations.

The platform is engineered to support **large-scale simultaneous candidate test submissions** (up to 10,000+ candidates) with local checkpoint auto-saving, real-time diagnostic sector analysis, bilingual Hindi/English rendering, and a dual-mode database persistence architecture (**MySQL 8.0+ / MariaDB** or **Local JSON Storage**).

---

## 📐 1. Technical Architecture Overview

```
                          ┌─────────────────────────────────────────┐
                          │    Student Web App & Mobile Browsers    │
                          │      React 18 + Vite + Tailwind CSS     │
                          └───────────────────┬─────────────────────┘
                                              │
                                              │ HTTP REST / JSON
                                              ▼
                          ┌─────────────────────────────────────────┐
                          │       Express.js Node.js Server         │
                          │              (server.ts)                │
                          └───────────┬─────────────────┬───────────┘
                                      │                 │
                ┌─────────────────────┴───┐         ┌───┴─────────────────────┐
                ▼                         ▼         ▼                         ▼
    ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
    │   MySQL / MariaDB     │ │  Local JSON Storage   │ │  Android REST API     │
    │  (Production Mode)    │ │  (Fallback / Dev)     │ │  Sync Engine          │
    │   utf8mb4_unicode_ci  │ │  (data/cgssb-db.json) │ │  (/api/android/*)     │
    └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

## 💡 2. Core Business Logics & Functional Pipelines

### A. 📄 Manual PDF $\to$ Admin JSON Ingestion Pipeline
1. **Raw Ingestion**: Exam administrators parse official PDF question papers into JSON formatted structures.
2. **Schema Validation (`src/utils/jsonQuestionMapper.ts`)**:
   - Validates required fields: bilingual stem (`questionText` & `questionHindi`), options A–D array, correct option key (`A`, `B`, `C`, `D`), and subject/topic taxonomy.
   - Generates a `uniqueQuestionId` (e.g. `CGSSB-2024-HOS-001`) to guarantee zero duplicate imports.
3. **Draft & Preview Mode (`BulkImportPreviewModal.tsx`)**:
   - Displays a live preview modal before committing items to persistent storage.
4. **Publish**: Writes validated records into MySQL (`questions` table) or local persistence.

---

### B. ⏱️ Exam Engine & Client-Side Resiliency Logic (`ExamEngine.tsx`)
* **Local Auto-Save Checkpointing**: To protect candidates against sudden power loss, browser crashes, or internet disconnects, the candidate's chosen options are saved to `localStorage` every 5 seconds.
* **Palette Status Tracking**: Tracks candidate status per question:
  * `not_visited` (Grey)
  * `unanswered` (Red)
  * `answered` (Green)
  * `marked_for_review` (Purple)
  * `answered_and_marked` (Blue Badge)
* **Scoring Rules**:
  * Positive marking added per question type (e.g., +1.0 or +2.0 marks).
  * Negative marking deduction (e.g., -0.333 or -0.666 marks).
  * Bonus credit awarded automatically for questions officially flagged `isCancelled: true` by exam boards.

---

### C. 📊 Scoring, Percentile & Sector Diagnostic Logic
* **Net Score Calculation**:
  $$\text{Net Score} = (\text{Correct Responses} \times \text{Marks}) - (\text{Incorrect Responses} \times \text{Negative Penalty})$$
* **Accuracy Percentage**:
  $$\text{Accuracy (\%)} = \left( \frac{\text{Correct Count}}{\text{Correct Count} + \text{Incorrect Count}} \right) \times 100$$
* **Simulated Percentile & State Ranking**:
  Calculates candidate rank and percentile across all stored attempt logs in the database.
* **Sector Analysis**:
  Groups performance by Subject, Subtopic, and Difficulty (`Easy`, `Medium`, `Hard`) to pinpoint weak areas for targeted revision.

---

### D. 👑 Pass Pro Monetization Locks
* Tests marked `isPro: true` require an active **Pass Pro** subscription.
* Unsubscribed students can unlock tests using accumulated reward credits or by activating a Pass Pro subscription plan.

---

### E. 📖 Mistake Notebook & Bookmarks
* **Mistake Notebook (`MistakeNotebook.tsx`)**: Automatically records questions answered incorrectly or skipped during live tests. Allows students to re-test mistake items until resolved.
* **Bookmarks Manager (`BookmarksManager.tsx`)**: Saves starred high-yield questions with custom notes for quick revision prior to exam day.

---

## 🗄️ 3. Relational Database Schema (MySQL 8.0+ / MariaDB)

Character Set: `utf8mb4` with collation `utf8mb4_unicode_ci` (Full Devnagari Hindi and LaTeX formula support).

```
 ┌──────────────────────┐         1:N         ┌──────────────────────┐
 │      mock_tests      │────────────────────►│      questions       │
 └──────────┬───────────┘                     └──────────────────────┘
            │                                            ▲
            │ 1:1                                        │ 1:N
            ▼                                            │
 ┌──────────────────────┐                     ┌──────────┴───────────┐
 │ previous_year_papers │                     │    test_attempts     │
 └──────────────────────┘                     └──────────────────────┘
```

### Key Tables & Column Breakdown:

1. **`questions`** (28 Columns)
   - `id` (VARCHAR 64, PK)
   - `unique_question_id` (VARCHAR 100, UK)
   - `category`, `subject`, `topic`, `subtopic`, `difficulty` (Indexed)
   - `question_text`, `question_hindi` (TEXT)
   - `options`, `statements`, `column_a`, `column_b` (JSON)
   - `correct_option` (ENUM 'A','B','C','D')
   - `marks`, `negative_marks` (DECIMAL)
   - `explanation`, `explanation_hindi` (TEXT)

2. **`mock_tests`** (22 Columns)
   - `id` (VARCHAR 64, PK)
   - `title`, `category`, `duration_minutes`, `total_marks`
   - `is_pyp`, `is_pro`, `is_published` (BOOLEAN)
   - `sections` (JSON embedding array of `questionIds` referencing `questions.id`)

3. **`previous_year_papers`** (18 Columns)
   - `id` (VARCHAR 64, PK)
   - `title`, `exam_category`, `exam_year`
   - `linked_mock_test_id` (VARCHAR 64, FK $\to$ `mock_tests.id`)
   - `linked_question_ids` (JSON $\to$ `questions.id[]`)
   - `download_file_name`, `download_url`

4. **`test_attempts`** (20 Columns)
   - `id` (VARCHAR 64, PK)
   - `user_id`, `test_id` (Indexed)
   - `score`, `accuracy`, `percentage`, `simulated_rank`, `percentile`
   - `responses` (JSON)
   - `sector_analysis` (JSON)

---

## 🎨 3. WordPress-Style No-Code Content Management System (CMS) & Customizer

The platform includes a **100% No-Code Content Management System (CMS)** allowing administrators and exam controllers to customize the website layout, create pages, publish news, bundle test series, and modify themes without touching code.

### A. 🌐 Dynamic Page Builder (`AdminCMSPageBuilder.tsx` & `DynamicPageRenderer.tsx`)
- **Route**: Accessible at `/p/:slug` (e.g. `/p/about`, `/p/coaching-partner`, `/p/syllabus-guide`).
- **Drag & Drop Block Inserter**:
  - `hero`: Large customizable hero banner with title, subtitle, and CTA button.
  - `heading`: Section divider headers.
  - `paragraph`: Rich text prose sections.
  - `features`: Feature grid cards with titles and descriptions.
  - `faq`: Collapsible FAQ accordion.
  - `test_series_widget`: Embedded mock test launcher.
  - `raw_html`: Custom HTML or iframe embed code.
- **Live Preview Toggle**: Instant side-by-side desktop/mobile responsive preview.

### B. 📰 Article, News & Exam Notification Publisher (`AdminCMSPostManager.tsx` & `DynamicPostRenderer.tsx`)
- **Route**: Accessible at `/posts` and `/posts/:slug`.
- **Publisher Features**:
  - Categories: `Exam Notifications`, `Study Material & Tips`, `Syllabus Updates`, `Answer Keys & Results`.
  - Rich Markdown / Prose text formatting.
  - Comma-separated tags, author attributes, and publication dates.

### C. 👑 Test Series Bundle Customizer (`AdminCMSTestSeriesManager.tsx`)
- **No-Code Bundle Assembler**: Select and group multiple mock tests into a single Test Series Pack.
- Set custom prices (₹ INR), badges (`Best Seller`, `Popular`, `New Launch`), and Pass Pro tier access locks.

### D. 🎨 Site Customizer & Theme Editor (`AdminCMSThemeCustomizer.tsx`)
- **Site Branding**: Site Title, Tagline, Support Phone/WhatsApp numbers, and Email.
- **Theme Color Palette**: 1-click accent color switching (`Indigo`, `Emerald`, `Amber`, `Rose`, `Violet`, `Cyan`).
- **Header Navigation Menu Editor**: Add, remove, and reorder header menu links (`/p/slug`, `/exams/cgpsc`, `/posts`).
- **Top Announcement Bar**: Customizable dismissible or persistent top banner message with CTA button.

---

## 📥 4. Mock Test & Question JSON Import/Export Schemas

### Question JSON Schema (Bulk Import)
```json
[
  {
    "id": "q-cgpsc-2026-001",
    "subject": "Chhattisgarh General Studies",
    "topic": "History of Chhattisgarh",
    "subtopic": "Kalchuri Dynasty",
    "difficulty": "Medium",
    "questionText": "Who was the founder of the Kalchuri dynasty of Ratanpur?",
    "questionHindi": "रतनपुर के कलचुरी वंश के संस्थापक कौन थे?",
    "options": [
      { "id": "A", "text": "Kalingaraj", "textHindi": "कलिंगराज" },
      { "id": "B", "text": "Ratnaraja I", "textHindi": "रत्नराज प्रथम" },
      { "id": "C", "text": "Prithvideva I", "textHindi": "पृथ्वीदेव प्रथम" },
      { "id": "D", "text": "Jajalladeva I", "textHindi": "जाजल्लदेव प्रथम" }
    ],
    "correctOption": "A",
    "marks": 2.0,
    "negativeMarks": 0.667,
    "explanation": "Kalingaraj established Kalchuri rule in Tumman around 1000 AD.",
    "explanationHindi": "कलिंगराज ने लगभग 1000 ई. में तुम्माण में कलचुरी शासन की स्थापना की।"
  }
]
```

### Mock Test JSON Schema
```json
{
  "id": "test-cgpsc-2026-mock-1",
  "title": "CGPSC Prelims General Studies Grand Mock Test 2026",
  "category": "CGPSC",
  "description": "Full-length bilingual mock paper matching official CGPSC pattern.",
  "durationMinutes": 120,
  "marksPerQuestion": 2.0,
  "negativeMarksPerQuestion": 0.667,
  "sections": [
    {
      "id": "sec-1",
      "name": "General Studies & Chhattisgarh GK",
      "questionIds": ["q-cgpsc-2026-001"]
    }
  ],
  "questionCount": 100,
  "isPublished": true
}
```

---

## 🌐 5. REST API Documentation Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tests` | Fetch active mock test catalog |
| `GET` | `/api/tests/:id` | Download full mock paper with questions |
| `POST` | `/api/tests/:id/submit` | Submit candidate answers & evaluate rank/accuracy |
| `GET` | `/api/questions` | Filter question bank by subject/topic/difficulty |
| `POST` | `/api/questions/bulk` | Bulk import questions array |
| `GET` | `/api/pyp` | Fetch Previous Year Papers list |
| `GET` | `/api/cms/pages` | Get all dynamic CMS pages |
| `GET` | `/api/cms/pages/:slug` | Get single page by slug |
| `POST` | `/api/cms/pages` | Save/publish dynamic CMS page |
| `GET` | `/api/cms/posts` | Get all news/articles |
| `GET` | `/api/cms/posts/:slug` | Get single post by slug |
| `POST` | `/api/cms/posts` | Save/publish news post |
| `GET` | `/api/cms/series` | Get Test Series Packs |
| `POST` | `/api/cms/series` | Save Test Series Pack |
| `GET` | `/api/cms/settings` | Get site customizer settings |
| `POST` | `/api/cms/settings` | Save site customizer settings |
| `GET` | `/api/android/sync` | Full offline sync payload for mobile app |

---

| Role | Access URL | Default Email / Username | Default Password |
| :--- | :--- | :--- | :--- |
| **Exam Controller Admin** | Click **"Admin CMS"** on top navbar | `admin@cgssbtest.com` *(or `admin`)* | `admin123` *(or `cgssb2024`)* |

---

## ⚙️ 5. Environment Variables (`.env`)

```env
# Application Port
PORT=3000

# Database Mode: 'mysql' (Production with MySQL/PostgreSQL) or 'json' (Local Persistence)
DATABASE_MODE=mysql

# MySQL Connection Details
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=cgssb_db
MYSQL_CONNECTION_LIMIT=30
```

---

## 🚀 6. Local Development & Deployment Commands

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (Vite + Express)
npm run dev

# 3. Check TypeScript types and ESLint rules
npm run lint

# 4. Build for production (Generates /dist static files and root index.html)
npm run build

# 5. Start production server
npm start
```
