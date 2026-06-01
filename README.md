# Ini_yoruvithiseivom Trust – Web App

A React + Vite web application for the Ini_yoruvithiseivom Trust NGO.  
Features: public website, donation via Razorpay/UPI, contact form → Firestore, admin gallery upload.

---

## Tech Stack

| Layer       | Technology |
|-------------|-----------|
| Frontend    | React 19, Vite 6, React Router 7 |
| Styling     | Custom CSS (`index.css`), AOS animations |
| Backend     | Firebase Auth, Firestore, Storage |
| Payments    | Razorpay + UPI deep-links |
| Hosting     | Firebase Hosting **or** Vercel (both configured) |
| CI/CD       | GitHub Actions |

---

## Quick Start (Local Development)

```bash
# 1. Clone and install
git clone https://github.com/YOUR_ORG/trust.git
cd trust
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and fill in all VITE_FIREBASE_* values (see Firebase Setup below)

# 3. Start dev server
npm run dev
```

---

## Firebase Setup

### 1 – Create / open your Firebase project
Go to https://console.firebase.google.com and open project **ini-trust-f0f99**.

### 2 – Enable services
- **Authentication** → Sign-in method → Email/Password → Enable  
- **Firestore** → Create database → `asia-south1` region  
- **Storage** → Get started → production mode  

### 3 – Register a Web App
Project Settings → Your apps → Add app (Web) → copy the config object.

### 4 – Fill `.env`
Paste each field from the config object into `.env`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
VITE_RAZORPAY_KEY_ID=rzp_live_...   # or rzp_test_... for testing
```

### 5 – Deploy Firestore rules & Storage rules
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,storage
```

### 6 – Create admin user
In Firebase Console → Authentication → Users → Add user  
(email + password for your admin account).

---

## Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Or push to `main` branch – GitHub Actions deploys automatically.

### GitHub Secrets required
Add these in GitHub → Repo → Settings → Secrets → Actions:

| Secret name | Value |
|-------------|-------|
| `FIREBASE_SERVICE_ACCOUNT_INI_TRUST_F0F99` | Service account JSON (from Firebase Console → Project Settings → Service accounts) |
| `VITE_FIREBASE_API_KEY` | from Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | from Firebase config |
| `VITE_FIREBASE_DATABASE_URL` | from Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | from Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | from Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase config |
| `VITE_FIREBASE_APP_ID` | from Firebase config |
| `VITE_FIREBASE_MEASUREMENT_ID` | from Firebase config |
| `VITE_RAZORPAY_KEY_ID` | your Razorpay publishable key |

---

## Deploy to Vercel

### Option A – Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Option B – Vercel Dashboard (recommended)
1. Go to https://vercel.com/new → Import Git Repository  
2. Select this repo  
3. Framework: **Vite** (auto-detected)  
4. Add all `VITE_*` environment variables under **Settings → Environment Variables**  
5. Click Deploy  

The `vercel.json` in this repo handles SPA rewrites and security headers automatically.

---

## Remaining Manual TODOs

| Item | File | What to do |
|------|------|-----------|
| YouTube video ID | `src/pages/About.jsx` | Replace `YOUR_VIDEO_ID` with real ID |
| UPI ID | `src/pages/Home.jsx` | Replace `yourupiid@upi` with real UPI handle |
| UPI QR code | `public/upi-qr.png` | Add your QR image to `/public/` |
| Volunteer photos | `public/volunteer1-4.jpg` | Add real volunteer photos |
| Favicon | `public/favicon.png` | Replace with your trust logo |
| Razorpay key | `.env` | Set `VITE_RAZORPAY_KEY_ID` to live key before going live |

---

## Project Structure

```
trust/
├── public/              # Static assets served as-is
│   ├── gallery/         # Gallery images referenced by ServiceGallery
│   ├── upi-qr.png       # UPI QR code (add your own)
│   └── poverty1.mp4     # Hero background video
├── src/
│   ├── admin/           # AdminLogin, AdminDashboard, ProtectedRoute
│   ├── components/      # Header, Footer, HeroSection, Services, ServiceGallery
│   ├── pages/           # Home, About, ServicesPage, OurWork, Contact, Donate
│   ├── firebaseConfig.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example         # Copy to .env and fill in secrets
├── firebase.json        # Firebase Hosting + Firestore config
├── firestore.rules      # Firestore security rules
├── storage.rules        # Firebase Storage security rules
├── vercel.json          # Vercel deployment config
└── vite.config.js
```
