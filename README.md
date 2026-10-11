# FindBack 🔍

FindBack is an intelligent, AI-powered Lost & Found platform designed for campuses and communities. It uses Gemini AI for ownership verification quizzes, automated item matching, masked catalog browsing for privacy, and secure handover coordination.

---

## 🌟 Key Features

- **🛡️ Masked Catalog**: Prevents fraudulent claims by hiding sensitive item details until genuine ownership is verified.
- **🤖 AI Verification Quiz**: Uses Google Gemini to generate dynamic verification questions based on finder reports to authenticate genuine owners.
- **💬 Secure Handover Chat**: Facilitates safe communication between finders and claimers without sharing private contact numbers.
- **✨ Nemo AI Assistant**: In-app conversational assistant helping users track lost items and navigate claims.
- **🏆 Karma & Leaderboard**: Gamified reward system that celebrates helpful community members who return lost items.
- **📊 Admin & Security Desk View**: Dedicated tools for campus security and administrators to oversee returns and resolves.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage)
- **AI / LLM**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Icons & UI**: [Lucide React](https://lucide.dev/), Canvas Confetti

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/<your-username>/FindBack.git
cd FindBack
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and configure the required environment variables:

```env
# Google Gemini API
GOOGLE_API_KEY=your_gemini_api_key_here

# External Integrations (Optional)
OPENWEATHER_API_KEY=your_openweather_key_here
TINY_FISH_API_KEY=your_tinyfish_key_here
```

> **Note:** Never commit your actual `.env` file to version control.

### 4. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

### 5. Building for Production

```bash
npm run build
npm run start
```

---

## 🔒 Security & Privacy

- All sensitive credentials and environment files (`.env`) are kept strictly out of version control.
- Image matching and descriptions are handled with privacy-first masking to protect owners and finders.

---

## 📄 License

This project is licensed under the MIT License.
