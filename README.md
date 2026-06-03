# Civil Service Exam (CSE) Digital Reviewer Platform

An interactive, high-performance web-based exam prep platform designed to help students review for the Philippine Civil Service Examination (Professional and Sub-Professional levels). Built using modern React 19, Next.js 16 (App Router), Tailwind CSS v4, and Supabase.

---

## 🚀 Key Functions & Core Features

### 1. User Authentication & Session Control
* **Secure Login/Registration**: Powered by **Supabase Auth**, enabling users to sign up using their full name, email, and password.
* **Session Protection**: Route-guarding prevents unauthorized users from accessing the command center or mock exams.
* **Persistent States**: Tracks user-specific records and dynamically maps their scores and analytics based on active database sessions.

### 2. Command Center Dashboard
* **Dynamic Analytics Panel**: Calculates and showcases real-time performance indicators:
  * **Average Accuracy**: Overall percent score based on all answered questions.
  * **Completed Modules Tracker**: Tracks completed categories out of the 9 total modules.
  * **Total Questions Aggregator**: Displays the total pool of questions available.
* **Adaptive Theme Controller**: Fully integrated dark/light mode toggle with pre-hydration theme injection script to eliminate FOUC (Flash of Unstyled Content).
* **Responsive Sidebar Layout**: Collapsible/expandable navigation sidebar containing account details and navigation tools.

### 3. Official-Aligned Exam Modules (9 Categories)
The reviewer matches the official Civil Service Commission (CSC) exam guidelines:
1. **Graphs / Charts / Data** (10 Questions): Focuses on data interpretation, trend analysis, and reading pie/bar graphs.
2. **Vocabulary** (20 Questions): Focuses on word meanings, context clues, and synonyms.
3. **Idiomatic Expressions & Grammar** (20 Questions): Covers correct grammar usage, idiomatic meanings, and spelling accuracy.
4. **Analogy and Logic Test** (20 Questions): Focuses on word analogies, logical sequences, and conditional premises.
5. **Reading Comprehension** (20 Questions): Covers passage analysis, main ideas, and structural critical reading.
6. **Paragraph Organization** (15 Questions): Arranges chronological logic and coherent sentence structures.
7. **Clerical Operations** (10 Questions): Office documents, basic filing systems, and vocational procedures.
8. **Constitution & General Info** (15 Questions): Focuses on the Philippine Constitution, civic mandates, and national events.
9. **Numerical Reasoning** (30 Questions): PEMDAS arithmetic, percentages, algebraic word problems, and number/letter series.

### 4. Custom Visualizer Canvas Engine
Includes lightweight, custom SVG-based visualizer components to serve as data charts for interpretation-based questions:
* **Grouped Bar Charts**: Displays multi-variable distribution (e.g., bonds vs. stocks distribution in securities).
* **FDI Bar Chart**: Renders vertical neon-colored bars depicting Philippine Foreign Direct Investment volumes.
* **Pie/Donut Charts**: Represents data distributions in percentage form (e.g., Insurance securities country of origin).
* **Periodical Performance Vector**: Renders interactive line graphs plotting marks over time.
* **Steve's Bird-Watching Registry**: Visualizes tabular data arrays for clerical operations/math logic tasks.

### 5. Advanced Mock Exam Engine
* **Focused Mode**: Start review sessions of individual subject modules. Progress is auto-saved (e.g., index of the last question attempted, count of answered questions) when navigating back to the dashboard.
* **Full Diagnostic Exam Mode**: Creates a full exam session that randomly groups and shuffles questions from all modules using the Fisher-Yates shuffle algorithm.
* **Mid-Exam Exit Guard**: Prevents accidental exit during full diagnostic tests, prompting warning alerts that disqualify the attempt if ignored.
* **Live Score & Review Mode**: Submitting tests reveals a detailed results panel indicating passing/failing state (70% passing threshold) and displays complete text explanations for every question.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 16.2 (App Router), React 19.2, Tailwind CSS v4, TypeScript 5.
* **Database & Auth**: Supabase (JS Client SDK).
* **Theme**: Custom Context-driven Theme Provider (Tailwind Dark Mode support).


