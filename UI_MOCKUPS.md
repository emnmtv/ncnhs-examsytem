# UI Screenshots & Mockups

## 1. CLASS LIST VIEW WITH NEW BUTTON

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Class List                                               STUDENTS │
│     View students in your classes                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ Search: [____________________________]  Filter by: [Grade ▼]        │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Name          │ Grade & Section │ Type   │ Subject    │Actions   │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Doe, John     │ Grade 10-A      │Section│ Mathematics│[📊 View] │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Smith, Mary   │ Grade 10-A      │Section│ Mathematics│[📊 View] │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Brown, Alex   │ Grade 10-A      │Direct │ Mathematics│[📊 View] │ │
│ ├─────────────────────────────────────────────────────────────────┤ │
│ │ Davis, Emma   │ Grade 10-A      │Section│ Mathematics│[📊 View] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Showing 1-4 of 32 students    ◀ [1] 2 3 ... ▶                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Button Styling:
┌──────────────────┐
│ 📊 View          │ ← Purple gradient background
│   Performance    │   White text
└──────────────────┘   Hover: elevated shadow
```

## 2. STUDENT PERFORMANCE PAGE - HEADER

```
╔═════════════════════════════════════════════════════════════════════╗
║                                                           PERFORMANCE║
║ ← │ Student Exam Performance                                         ║
║     John Doe                                                         ║
║     LRN: 202400001234                                               ║
╚═════════════════════════════════════════════════════════════════════╝
    ↑ Purple Gradient Background
```

## 3. ANALYTICS CARDS SECTION

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │     📊       │ │  │ │     📈       │ │  │ │     ✓        │ │  │ │     📉       │ │
│ │ (gradient bg)│ │  │ │ (gradient bg)│ │  │ │ (gradient bg)│ │  │ │ (gradient bg)│ │
│ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │
│                  │  │                  │  │                  │  │                  │
│ TOTAL EXAMS      │  │ AVERAGE SCORE    │  │ HIGHEST SCORE    │  │ LOWEST SCORE     │
│      5           │  │     78.50%       │  │     92.00%       │  │     65.00%       │
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘

Cards on hover: translateY(-5px) + enhanced shadow
```

## 4. EXAM RESULTS TABLE - FULL VIEW

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Exam Results                                                                     │
├────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬───────────┬────────┬──────────┬──────────────┬────────┐ │
│ │ EXAM TITLE          │ TEST CODE │ SCORE  │    %     │ DATE TAKEN   │ ACTIONS│ │
│ ├─────────────────────┼───────────┼────────┼──────────┼──────────────┼────────┤ │
│ │ Mathematics Finals  │ MATH-001  │ 92/100 │ 92.00%🟢 │ Nov 20, 2024 │   👁️  │ │ ← Green (Excellent)
│ ├─────────────────────┼───────────┼────────┼──────────┼──────────────┼────────┤ │
│ │ Science Test        │ SCI-045   │ 78/100 │ 78.00%🔵 │ Nov 15, 2024 │   👁️  │ │ ← Blue (Good)
│ ├─────────────────────┼───────────┼────────┼──────────┼──────────────┼────────┤ │
│ │ English Exam        │ ENG-023   │ 65/100 │ 65.00%🟠 │ Nov 10, 2024 │   👁️  │ │ ← Orange (Fair)
│ ├─────────────────────┼───────────┼────────┼──────────┼──────────────┼────────┤ │
│ │ History Assessment  │ HIST-012  │ 58/100 │ 58.00%🔴 │ Nov 05, 2024 │   👁️  │ │ ← Red (Poor)
│ └─────────────────────┴───────────┴────────┴──────────┴──────────────┴────────┘ │
│                                                                                  │
└────────────────────────────────────────────────────────────────────────────────┘

Color Legend:
🟢 Excellent (≥80%)
🔵 Good (70-79%)
🟠 Fair (60-69%)
🔴 Poor (<60%)
```

## 5. PERFORMANCE CHART

```
┌──────────────────────────────────────────────────────────────────────┐
│ Score Trend                                                            │
├──────────────────────────────────────────────────────────────────────┤
│ 100%│                                                                 │
│  90%│    ╱╲                                                           │
│  80%│   ╱  ╲        ╱                                                │
│  70%│  ╱    ╲    ╱  ╲                                               │
│  60%│ ╱      ╲  ╱    ╲                                              │
│     │╱────────╲╱──────╲─────────────                               │
│     └─────────────────────────────────────────                     │
│       Math    Science   English   History                           │
│                                                                      │
│ Legend: ─●─ Score (%)                                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 6. LOADING STATE

```
┌──────────────────────────────────┐
│                                  │
│          🔄 (rotating)           │
│                                  │
│  Loading exam performance...     │
│                                  │
│                                  │
└──────────────────────────────────┘

Spinner: Rotates 360° over 2 seconds
Color: White on gradient background
```

## 7. ERROR STATE

```
┌──────────────────────────────────────────┐
│                                          │
│         ⚠️ (error icon - large)         │
│                                          │
│  Failed to load exam performance data    │
│                                          │
│     [↻ Retry]                            │
│                                          │
└──────────────────────────────────────────┘

Background: Semi-transparent white card
Text: White
Button: White border, transparent background
```

## 8. EMPTY STATE

```
┌──────────────────────────────────────────┐
│                                          │
│        📊 (assessment icon - large)     │
│                                          │
│  No exam performance data available      │
│                                          │
│  This student hasn't taken any exams yet │
│                                          │
└──────────────────────────────────────────┘

Background: Semi-transparent white card
Text: White
Icon: Large (64px)
```

## 9. BUTTON STATES

```
DEFAULT:
┌────────────────────────────┐
│ 📊 View Performance        │  ← gradient background
│                            │     white text
└────────────────────────────┘

HOVER:
┌────────────────────────────┐
│ 📊 View Performance        │  ← elevated (translateY -5px)
│                            │     enhanced shadow
└────────────────────────────┘     darker gradient

ACTIVE/PRESSED:
┌────────────────────────────┐
│ 📊 View Performance        │  ← slightly compressed
│                            │     strong shadow
└────────────────────────────┘

ON TABLE ROW HOVER:
┌────────────────────────────┐
│ 📊 View Performance        │  ← icon visible in circular bg
│                            │
└────────────────────────────┘
```

## 10. RESPONSIVE LAYOUTS

### DESKTOP (≥1025px)
```
[Header]
[4-Column Analytics Grid]
[Full Width Table with all columns]
[Full Width Chart]
```

### TABLET (768px - 1024px)
```
[Header - Compressed]
[2-Column Analytics Grid]
[Table with Some Columns Hidden]
[Chart - Medium Size]
```

### MOBILE (≤767px)
```
[Header - Minimal]
[1-Column Analytics Grid]
[Table with Horizontal Scroll]
[Chart - Small]
```

### EXTRA SMALL (<480px)
```
[Compact Header]
[Stacked Cards]
[Simplified Table]
[Mini Chart]
[Minimal Padding]
```

## 11. COLOR-CODED PERFORMANCE BADGES

```
Excellent (≥80%)         Good (70-79%)        Fair (60-69%)        Poor (<60%)
┌──────────────┐         ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  92.00%      │         │  78.00%      │     │  65.00%      │     │  58.00%      │
│ (Green Bg)   │         │ (Blue Bg)    │     │ (Orange Bg)  │     │ (Red Bg)     │
│ White Text   │         │ White Text   │     │ White Text   │     │ White Text   │
└──────────────┘         └──────────────┘     └──────────────┘     └──────────────┘

#4caf50                  #2196f3              #ff9800              #f44336
```

## 12. NAVIGATION FLOW

```
[Teacher Class List]
        ↓
   Click "📊 View Performance"
        ↓
[Router navigates to /studentperformance/:studentId]
        ↓
[StudentPerformance Component]
    - Fetches data from API
    - Displays analytics
    - Shows table & chart
        ↓
   User can click:
    - "← Back" button (returns to class list)
    - "👁️ View Details" (goes to student answer details)
    - "↻ Retry" (if error occurs)
```

## 13. DATA FLOW

```
Backend              API              Frontend
─────────            ───              ────────
                  /teacher/
                  student/:id/
Fetch Scores  ← exam-performance →  Service Call
from DB           (GET)         →  getStudentExamPerformance()
                                      ↓
                                   Parse Response
                                      ↓
                                   Update State
                                      ↓
                                   Render Component
                                      ↓
                                   Display Data
```

---

**All mockups are ASCII representations for visualization purposes**  
**Actual implementation uses Vue 3 with modern CSS and Material Design**
