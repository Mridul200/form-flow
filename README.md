# 🏋️‍♂️ Form Flow (Rehavila)

> **AI-Powered Physical Therapy & Rehabilitation Form Checker**  
> Real-time pose analysis, joint angle tracking, voice coaching, and telehealth connectivity built for patients and physical therapists.

---

## 🌟 Key Features

### 📐 1. Real-Time AI Pose & Form Detection
* **100% Client-Side Processing**: Powered by **MediaPipe Pose (BlazePose)**. Video feeds never leave the user's browser, ensuring complete privacy.
* **Biomechanical Angle Tracking**: Calculates live joint angles (knee flexion, hip extension, spine alignment, shoulder abduction, elbow extension) across 33 key body landmarks.
* **Instant Visual & Form Status**: Live skeleton overlay color-coded by accuracy (**Good** / **Warning** / **Bad**) with real-time feedback banners.

### 🏋️‍♀️ 2. Multi-Exercise Library & Custom Rule Engine
* **Supported Exercises**:
  * 🦵 **Squats**: Knee depth, hip hinge, and back curvature monitoring.
  * 🧘 **Plank**: Core hold duration, spine alignment, and hip elevation checks.
  * 🦵 **Lunges**: Knee over toe detection, stance depth, and torso posture.
  * 💪 **Bicep Curls**: Elbow isolation, full range of motion (ROM), and momentum prevention.
  * 🏋️ **Overhead Press**: Full overhead extension and lumbar hyperextension prevention.
  * 🍑 **Glute Bridges**: Pelvic elevation and knee stability.

### 🎙️ 3. Spoken Audio Coaching & Multilingual Support
* **Real-Time Voice Coaching**: Instant audio cues for form corrections and rep milestones via the Web Speech API.
* **Customizable Audio Controls**: Adjust voice pitch, speech rate, volume, and toggle audio alerts.
* **Multi-Language Options**: Supports English, Spanish, French, Hindi, and German.

### 📹 4. Pre-Session Camera & Environment Check
* Smart diagnostics verify user framing, full-body visibility, distance from camera, and lighting conditions before beginning an exercise session.

### 👤 5. Comprehensive Patient Profiles & Onboarding
* Personalized onboarding to track current physical condition, rehabilitation goals (post-op, recovery, strength), injury history, and motion restrictions.

### 👨‍⚕️ 6. Telehealth & Doctor Connectivity
* **Role-Based Access Control**: Separate interfaces and permissions for **Patients**, **Doctors**, and **Admins**.
* **Connect with Specialists**: Patients can request doctor consultations, pay via integrated payment gateways (test mode), and share session progress.
* **Real-Time Consultation**: Embedded real-time chat and high-definition video calls via Jitsi Meet integration.

### 📊 7. Session Analytics & Reporting
* Post-session performance breakdown: accuracy percentages, valid vs. invalid rep ratio, key biomechanical corrections, and progress trends over time.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, TypeScript, TanStack Router
* **Styling**: Tailwind CSS, Shadcn UI, Lucide Icons
* **Pose Engine**: Google MediaPipe Pose / `@mediapipe/tasks-vision`
* **Backend & Database**: Supabase (Auth, PostgreSQL, Row Level Security)
* **Real-time & Video**: Web Speech API, Jitsi Meet Embed
* **Build System & Package Manager**: npm / bun

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* **npm** or **bun** package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mridul200/form-flow.git
   cd form-flow
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or update the existing `.env`):
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to test the application.

---

## 📁 Project Structure

```
form-flow/
├── public/
│   └── mediapipe/        # Offline MediaPipe pose landmarker models
├── src/
│   ├── components/
│   │   ├── exercise/     # Camera check, Joint angle displays, Form score panels, Voice settings
│   │   ├── profile/      # Patient profile setup modals
│   │   └── ui/           # Reusable Shadcn UI component library
│   ├── context/          # Language & application state providers
│   ├── hooks/            # Custom hooks (useExerciseEngine, usePatientProfile, useAuth)
│   ├── integrations/     # Supabase auth, client initialization & DB types
│   ├── lib/
│   │   └── exercises/    # Rule engine, rep counting algorithms, angle math, voice service
│   ├── routes/           # TanStack file-based routes (Dashboard, Exercise, Progress, Admin)
│   ├── styles.css        # Global CSS & Tailwind imports
│   └── main.tsx          # Application entry point
├── supabase/
│   └── migrations/       # SQL schema migrations & patient profile tables
├── README.md
└── package.json
```

---

## ⚕️ Medical Disclaimer

> **Disclaimer**: Form Flow (Rehavila) is an AI-assisted motion tracking tool designed for educational and fitness assistance. It is **not a substitute for professional medical advice, diagnosis, or treatment**. Always seek the advice of your physician or qualified physical therapist with any questions regarding a medical condition.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
