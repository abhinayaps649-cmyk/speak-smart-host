# 🎤 SpeakSmart – Confidence Quest

> A gamified web-based platform to help you build public speaking confidence through structured levels, real-time speech analysis, and AI-powered feedback.

---

## 👥 Team

**Team Name:** ELEMENTS

| Member | Role |
|--------|------|
| Harinanda R | Developer |
| Abhinaya P S | Developer |

---

## 📌 About the Project

**SpeakSmart – Confidence Quest** helps users overcome the fear of public speaking through a structured, gamified learning experience. Using browser-based speech recognition, the platform analyzes your speech in real time and provides meaningful feedback across key performance metrics:

- 🕐 **Speech Duration** – How long you spoke
- 📝 **Words Per Minute (WPM)** – Your speaking pace
- 🚫 **Filler Word Detection** – Tracks overused fillers like "um", "uh", "like"
- 💯 **Confidence Score** – A composite score of your overall performance

Users progress through structured levels — **Beginner → Intermediate → Confident** — and earn XP, badges, and rewards to stay motivated.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🎙 Real-time Speech-to-Text | Converts your speech to text instantly in the browser |
| 📊 Performance Analytics | Tracks duration, WPM, and confidence score |
| 🔍 Filler Word Detection | Flags overused words that reduce speaking impact |
| 🤖 AI-Powered Questions | Gemini AI generates interactive questions for Level 2 practice |
| 🏆 Gamification System | Earn XP, unlock badges, and progress through levels |
| 📈 Level-Based Practice | Structured path from Beginner to Confident speaker |

---

## 🛠 Tech Stack

### Frontend
- HTML5
- CSS3 (`style.css`)
- JavaScript (`script.js`)

### Backend
- Python
- Flask

### APIs & Libraries
- [Google Generative AI (Gemini)](https://ai.google.dev/) — AI-generated questions
- `SpeechRecognition` — Speech-to-text processing
- `Pydub` — Audio manipulation
- `python-dotenv` — Environment variable management
- `FFmpeg` — Audio format conversion

---

## ⚙️ Installation

### Prerequisites
- Python 3.8+
- FFmpeg installed and added to system PATH ([Download here](https://ffmpeg.org/download.html))
- A [Gemini API Key](https://ai.google.dev/)

### Step 1 — Clone the Repository
```bash
git clone https://github.com/your-username/speaksmart.git
cd speaksmart
```

### Step 2 — Create a Virtual Environment *(recommended)*
```bash
python -m venv venv
```

### Step 3 — Activate the Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### Step 4 — Install Dependencies

Using `requirements.txt` *(recommended)*:
```bash
pip install -r requirements.txt
```

Or install manually:
```bash
pip install flask
pip install google-generativeai
pip install python-dotenv
pip install SpeechRecognition
pip install pydub
```

### Step 5 — Configure Environment Variables

Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_api_key_here
```

---

## ▶️ Running the App

```bash
python app.py
```

Then open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (HTML/CSS/JS)         │
│  Speech Recognition  |  UI & Gamification│
└────────────────┬────────────────────────┘
                 │ HTTP Requests
┌────────────────▼────────────────────────┐
│            Flask Backend                │
│   Route Handling  |  Business Logic     │
└──────┬────────────────────┬────────────┘
       │                    │
┌──────▼──────┐    ┌────────▼────────────┐
│  Speech     │    │   Gemini API        │
│  Processing │    │   (AI Questions)    │
│  (pydub +   │    │                     │
│  SpeechRec) │    └─────────────────────┘
└─────────────┘
```

---

## 📘 API Reference

### `POST /analyze`

Analyzes a speech input and returns performance metrics.

**Request Body:**
```json
{
  "audio": "<base64-encoded audio or text input>"
}
```

**Response:**
```json
{
  "duration": 45.3,
  "wpm": 132,
  "confidence_score": 87,
  "filler_word_count": 4,
  "filler_words": ["um", "uh", "like", "you know"]
}
```

---

## 📸 Screenshots

> *(Add at least 3 screenshots below)*

| Homepage | Level 1 Practice | Analytics Dashboard |
|----------|-----------------|---------------------|
| ![Homepage](screenshots/homepage.png) | ![Level 1](screenshots/level1.png) | ![Analytics](screenshots/analytics.png) |

---

## 🎥 Demo Video

> *(Replace the link below with your actual demo video URL)*

[![Watch Demo](https://img.shields.io/badge/▶%20Watch-Demo%20Video-red?style=for-the-badge)](https://your-demo-video-link.com)

---

## 📁 Project Structure

```
speaksmart/
├── app.py                  # Flask application entry point
├── .env                    # Environment variables (not committed)
├── requirements.txt        # Python dependencies
├── static/
│   ├── style.css           # Stylesheet
│   └── script.js           # Frontend JavaScript
├── templates/
│   └── index.html          # Main HTML template
└── screenshots/            # App screenshots
```

---

## 📜 License

This project was developed for **educational and hackathon purposes**.

Licensed under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ by Team <strong>ELEMENTS</strong>
</div>