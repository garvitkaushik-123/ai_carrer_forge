# Interview Readiness Scorer — Design Spec

## Context

Millions of students graduate yearly and enter the job market unprepared for interviews, discovering gaps only after failed interviews. This tool lets students objectively measure their interview readiness and identify improvement areas BEFORE facing real recruiters — in under 2 minutes of active time.

**Stack:** React + Tailwind CSS (frontend), FastAPI (backend), Claude API (LLM analysis)

---

## User Flow

### Step 1 — Landing Page (~10 sec)
- Hero with value prop: "Know if you're interview-ready before the call."
- Single CTA: drag-and-drop resume upload zone (PDF/DOCX, max 5MB)
- Optional LinkedIn URL paste field
- "Analyze My Readiness" button (disabled until file uploaded)

### Step 2 — Resume Processing (~5 sec)
- Animated scanner loading screen with rotating status text
- Backend extracts text, parses sections, detects target role type
- AI generates 4-5 targeted questions based on resume gaps

### Step 3 — Adaptive Wizard (~45-60 sec)
- 4-5 AI-generated questions presented one at a time
- Progress bar + step dots at top
- Mix of MCQ (clickable option cards with letter badges) and short-answer (textarea with character counter)
- Questions are adaptive — generated based on what the resume is missing
- Example questions:
  - "Your resume lists React and Node.js. Which best describes your experience level?" (MCQ)
  - "You don't have a portfolio link. Do you have any public projects or GitHub repos?" (short answer)
  - "Describe in one sentence why you're a good fit for a [detected role] position" (communication probe)

### Step 4 — Analysis (~15-20 sec)
- Sequential dimension reveal animation — each dimension appears with its icon and progress bar filling
- Builds anticipation as the score is "constructed" in real-time

### Step 5 — Results Report Card
- Overall score (0-100) with animated SVG semicircle gauge
- Score band pill with message
- 4 expandable dimension cards with sub-scores, strengths, improvements, resources
- "Download PDF Report" button + "Retake Assessment" link

**Total user active time: ~60-75 seconds.** Well under 2 minutes.

---

## Scoring System

### Overall Score: 0-100 (Weighted Average)

| Dimension | Weight | What It Measures |
|---|---|---|
| Technical Skills | 35% | Skill relevance to target role, depth indicators, tool/framework coverage, certifications |
| Resume Quality | 25% | Structure, formatting, quantified achievements, ATS-friendliness, section completeness |
| Communication | 20% | Clarity of wizard answers, sentence structure, ability to articulate value proposition |
| Portfolio/Projects | 20% | Presence of GitHub/portfolio links, project description quality, relevance to target role |

Each dimension scores 0-100 independently.

### Score Bands

| Range | Label | Color | Message Tone |
|---|---|---|---|
| 80-100 | Interview Ready | Green | "You're well-prepared. Fine-tune these areas." |
| 60-79 | Almost There | Yellow | "Solid foundation, but these gaps could cost you." |
| 40-59 | Needs Work | Orange | "Significant gaps to address before interviewing." |
| 0-39 | Not Ready | Red | "Focus on building fundamentals first." |

### Feedback Structure Per Dimension
- 2-3 specific strengths (what's working)
- 2-3 specific improvement items with concrete next steps (e.g., "Add quantified impact metrics using the XYZ formula: Accomplished X by doing Y, resulting in Z")
- One recommended resource per improvement item (course, article, tool)

---

## Backend Architecture (FastAPI)

### API Endpoints

```
POST /api/upload-resume          -> Parse resume, extract text, detect role type
POST /api/generate-questions     -> AI generates 4-5 adaptive questions based on resume
POST /api/submit-answers         -> Receive wizard answers, trigger analysis pipeline
GET  /api/results/{session_id}   -> Fetch completed assessment results
```

### Multi-Step LLM Pipeline

All 4 analysis calls run in parallel using `asyncio.gather()`:

1. **Technical Skills Analyzer** — extracted skills list + wizard answers about experience levels -> scores skill coverage, depth, relevance to detected role
2. **Resume Quality Analyzer** — raw resume text + structure metadata -> scores formatting, sections, quantified achievements, ATS compatibility
3. **Communication Analyzer** — wizard free-text answers -> scores clarity, conciseness, ability to articulate value
4. **Portfolio Analyzer** — extracted links + project descriptions + wizard answers about projects -> scores presence, quality, relevance

**Aggregator** — takes all 4 dimension results, applies weights, computes overall score, merges feedback into final report.

### Backend File Structure

```
backend/
  main.py                  # FastAPI app, CORS, router includes
  config.py                # Settings, API keys, model config
  models.py                # Pydantic schemas for all request/response types
  session.py               # In-memory session store (dict) for state between steps
  routers/
    upload.py              # /api/upload-resume endpoint
    questions.py           # /api/generate-questions endpoint
    analysis.py            # /api/submit-answers + /api/results endpoints
  services/
    resume_parser.py       # Text extraction (PDF/DOCX), section detection, skill extraction, link extraction
    question_generator.py  # Analyzes resume gaps, generates adaptive questions
    scoring.py             # Aggregation logic, weight application, band classification
  analyzers/
    technical.py           # Technical skills dimension analyzer
    resume_quality.py      # Resume quality dimension analyzer
    communication.py       # Communication dimension analyzer
    portfolio.py           # Portfolio/projects dimension analyzer
  prompts/
    technical.txt          # System prompt for technical analyzer
    resume_quality.txt     # System prompt for resume quality analyzer
    communication.txt      # System prompt for communication analyzer
    portfolio.txt          # System prompt for portfolio analyzer
    question_generator.txt # System prompt for question generation
  requirements.txt
```

### LLM Integration
- Claude API via Anthropic SDK (claude-sonnet-4-6 for cost/speed balance)
- Each analyzer gets a focused system prompt with structured JSON output schema
- Parallel execution keeps total analysis time to ~15-20 seconds

### Resume Parsing
- PyPDF2 or pdfplumber for PDF text extraction
- python-docx for DOCX text extraction
- Custom section detection (experience, education, skills, projects, contact)
- Skill keyword extraction using pattern matching against known tech skill lists
- Link extraction (GitHub, LinkedIn, portfolio URLs)

---

## Frontend Architecture (React + Tailwind)

### Color Palette

```
Brand (Indigo):
  50: #EEF2FF    200: #C7D2FE    500: #6366F1    700: #3730A3    900: #1E1B4B

Score Bands:
  Green  (80-100): bg #DCFCE7, border #4ADE80, text #15803D, fill #22C55E
  Yellow (60-79):  bg #FEF9C3, border #FDE047, text #854D0E, fill #EAB308
  Orange (40-59):  bg #FFEDD5, border #FB923C, text #9A3412, fill #F97316
  Red    (0-39):   bg #FEE2E2, border #F87171, text #991B1B, fill #EF4444
```

### Typography
- **Headings:** Plus Jakarta Sans (600, 700) — geometric, modern
- **Body:** Inter (400, 500) — clean, readable
- **Score numbers:** JetBrains Mono (700) — signals precision

### Frontend File Structure

```
frontend/src/
  components/
    layout/
      Navbar.jsx
      PageWrapper.jsx
    landing/
      HeroSection.jsx
      UploadZone.jsx
      LinkedInInput.jsx
      HowItWorks.jsx
    wizard/
      QuestionCard.jsx
      MCQOptions.jsx
      ShortAnswerInput.jsx
      ProgressBar.jsx
      WizardNav.jsx
    loading/
      ProcessingScreen.jsx
      AnalysisScreen.jsx
      DimensionAnalysisRow.jsx
    results/
      ScoreGauge.jsx
      ScoreBandPill.jsx
      DimensionCard.jsx
      StrengthsList.jsx
      ImprovementsList.jsx
      ResourceLinks.jsx
      DownloadButton.jsx
  hooks/
    useCountUp.js
    useIntersectionObserver.js
  utils/
    scoreBands.js
    constants.js
    api.js
  context/
    AssessmentContext.jsx
  styles/
    globals.css
  App.jsx
```

### Landing Page UI
- Two-column hero (60/40 desktop, stacked mobile)
- Left: pill badge ("AI-Powered - 2 Minutes - Free"), bold H1, subheading, upload zone + CTA
- Right: stylized mockup preview of results dashboard at score ~73
- Upload zone: dashed border `border-2 border-dashed border-brand-300`, drag-over state with scale pulse + border highlight, file-selected state with green pill
- CTA: `bg-brand-700` full-width button with shadow, disabled until upload complete
- Below hero: "How It Works" 3-step horizontal strip

### Wizard UI
- Centered single column (`max-w-2xl`)
- Progress bar with step dots
- Question cards slide in/out (slideInRight 350ms / slideOutLeft 250ms)
- MCQ: full-width selectable cards with letter badges (A/B/C/D), selected state indigo with checkmark
- Short-answer: textarea with character counter (turns orange at 80%)
- Category pill above each question (e.g., "Technical Skills")
- Navigation: ghost "Back" button + indigo "Next Question" / "See My Results" CTA

### Loading Screens
- **Processing:** Animated scanner square + rotating status text + three bouncing dots
- **Analysis:** 4 dimension rows appear sequentially (3-4 sec stagger). Each row has icon, name, progress bar animating to partial score. Current row has pulsing ring. Final overall score counts up at bottom, then auto-navigates to results.

### Results Dashboard
- Thin sticky color strip at top (score band color)
- SVG semicircle gauge with spring animation (overshoot cubic-bezier 0.34, 1.56, 0.64, 1)
- Score counts up from 0 using requestAnimationFrame + ease-out-cubic
- Score band pill below gauge
- 4 dimension cards in 2x2 grid (desktop), stacked (mobile)
  - Collapsed: icon + name + score badge + preview text + progress bar
  - Expanded: Strengths (green markers) -> Improvements (orange markers) -> Resources (indigo links)
  - Strengths always first — validation before critique
  - Expand/collapse with max-height transition + chevron rotation
- "Download PDF Report" button + "Retake Assessment" link

### Key Micro-interactions
1. Score count-up with ease-out-cubic deceleration (1.5s duration)
2. Score bars animate on viewport entry (IntersectionObserver) with 100ms stagger per card
3. Dimension card hover: subtle lift (`-translate-y-0.5`) + shadow increase
4. Gauge SVG spring overshoot animation
5. Question slide transitions with directional awareness
6. Upload zone drag-over: border highlight + icon bounce

### Mobile Considerations
- All tap targets minimum 48px
- Upload zone and MCQ options full-width
- Gauge scales to 224px width, score `text-5xl`
- All dimension cards start collapsed on mobile
- Back button becomes icon-only on mobile

### State Management
- React Context (`AssessmentContext`) — no Redux needed for linear flow
- Holds: session ID, resume data, questions, answers, results
- Single context provider wrapping App

---

## Target Roles Supported

Broad tech roles: Software Engineering, Data Science, Product Management, Design, DevOps. The system detects the target role from resume content and tailors:
- Technical skill evaluation criteria per role
- Relevant question generation
- Role-specific improvement recommendations

---

## Verification Plan

### Backend Testing
1. Upload a sample PDF resume -> verify text extraction and section parsing
2. Call generate-questions -> verify 4-5 relevant questions returned with correct types
3. Submit mock answers -> verify all 4 analyzers run and return structured JSON
4. Check aggregated score math (weighted average matches manual calculation)
5. Test with resumes of varying quality to verify score differentiation

### Frontend Testing
1. Upload zone: test drag-drop, file picker, file type validation, size limit
2. Wizard: navigate forward/back, verify all question types render, answers persist
3. Loading screens: verify animations play, status text rotates
4. Results: verify gauge animation, score count-up, card expand/collapse, all data displays
5. Mobile: test at 375px width — tap targets, scrolling, collapsed cards

### End-to-End
1. Full flow: upload resume -> answer questions -> view results (under 2 min total)
2. Test with 3+ different resumes (strong, medium, weak) to verify score differentiation
3. Verify feedback is specific and actionable (not generic platitudes)
4. Test "Download Report" and "Retake Assessment" flows
