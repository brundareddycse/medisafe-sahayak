# MediSafe Sahayak — AI Medicine Safety Checker

India's first AI-powered medicine safety checker for patients and caregivers.
Scan prescriptions · Detect dangerous interactions · Find generic alternatives · Save money

Live App: https://medisafe-sahayak.lovable.app

---

## What it does

MediSafe Sahayak ("Sahayak" means helper in Hindi) is a free web app built for Indian patients, senior citizens, and caregivers.

- Scan any prescription using your phone camera — even handwritten ones
- Detect dangerous drug interactions before they cause harm
- Find generic alternatives that cost up to 90% less than branded medicines
- Locate the nearest Jan Aushadhi store selling government-quality generics
- Set medicine reminders with sound alarms so you never miss a dose
- Manage family profiles — track medicines for parents, grandparents, spouse separately

Works in 6 Indian languages — English, Hindi, Telugu, Tamil, Bengali, Marathi.

---

## Features

### AI Medicine Analysis
- Upload a photo of your prescription or medicine strip
- AI reads it using Google Gemini Vision OCR
- Detects all medicines and checks for dangerous interactions
- Classifies risks as Critical / Moderate / Minor
- Shows food interactions (e.g. avoid grapefruit with certain BP medicines)
- Gives a medicine schedule — morning, afternoon, night
- Reads results aloud using text-to-speech

### Generic Alternatives & Savings
- Shows cheaper generic equivalents for every branded medicine
- Calculates exact monthly savings in rupees
- After showing savings, instantly offers to find the nearest Jan Aushadhi store in your city

### Jan Aushadhi Store Finder
- Enter your city or use GPS auto-detection
- Opens Google Maps showing all nearby Jan Aushadhi Kendras
- Also links to the official government store locator at janaushadhi.gov.in
- Shows real savings examples (Metformin Rs 85 to Rs 12, saving 86%)

### Medicine Reminders
- Add reminders for multiple medicines with custom times
- Labels: Empty Stomach, After Breakfast, After Lunch, After Dinner, Before Sleep
- Sound alarm with browser notification
- Toggle reminders on/off per medicine

### User Profiles & Family Management
- Optional login — app works fully without an account
- Sign in with Google, Phone OTP, or Email
- Medicine history, family profiles, saved location

---

## Tech Stack

- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Animations: Framer Motion
- Backend: Supabase (PostgreSQL + Edge Functions)
- AI / OCR: Google Gemini 2.0 Flash
- OCR Fallback: Tesseract.js
- Auth: Supabase Auth
- Hosting: Lovable

---

## Setup

1. Clone the repo and run npm install
2. Create a .env file:
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
3. Add GOOGLE_API_KEY to Supabase Edge Function secrets
4. Run npm run dev

Get a free Gemini API key at aistudio.google.com (1500 requests/day free)

---

## Privacy & Safety

- No prescription data is stored on our servers
- Login is optional — the app works fully without an account
- Medicine interaction data is AI-generated and should not replace professional medical advice
- Always consult your doctor or pharmacist before changing medicines

Disclaimer: MediSafe Sahayak is an informational tool only. It does not provide medical advice, diagnosis, or treatment.

---

## Roadmap

Done:
- AI prescription scanner
- Drug interaction checker
- Generic alternatives and savings calculator
- Jan Aushadhi store finder
- Medicine reminders with alarm
- 6 Indian languages
- Optional login and family profiles

