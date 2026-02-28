# 🚀 CivicReport — Deployment Guide

## Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Vercel CLI: `npm install -g vercel`

---

## 1️⃣ Firebase Project Setup

### Step 1 — Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add Project"** → Name it `civic-report`
3. Disable Google Analytics (optional)

### Step 2 — Enable Authentication
1. Build → Authentication → Get Started
2. Sign-in method → Enable **Email/Password**

### Step 3 — Create Firestore Database
1. Build → Firestore Database → Create Database
2. Choose **Production mode**
3. Select your region (e.g. `asia-south1` for India)

### Step 4 — Enable Firebase Storage
1. Build → Storage → Get Started
2. Use default security rules for now (we'll deploy ours)

### Step 5 — Get Client SDK Config
1. Project Settings → General → Your apps
2. Add Web App → Register
3. Copy the `firebaseConfig` object

### Step 6 — Generate Admin SDK Service Account
1. Project Settings → Service Accounts
2. Click **"Generate new private key"**
3. Download the JSON file

---

## 2️⃣ Environment Variables

### `.env.local` (local dev)
```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (from downloaded JSON)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3️⃣ Deploy Firestore Rules & Indexes
```bash
# Login to Firebase
firebase login

# Set your project
firebase use your_project_id

# Deploy rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage:rules
```

---

## 4️⃣ Create Admin User

After registering via the UI, promote a user to admin:
```javascript
// Run once in Firebase Console → Firestore
// Or use Firebase Admin SDK in a script:

const admin = require('firebase-admin');
// Update role in users collection:
await admin.firestore()
  .collection('users')
  .doc('YOUR_USER_UID')
  .update({ role: 'admin' });
```

---

## 5️⃣ Vercel Deployment

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your/repo.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"** → Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Click **"Environment Variables"**

### Step 3 — Add Environment Variables in Vercel
Add every variable from your `.env.local`:
- For `FIREBASE_ADMIN_PRIVATE_KEY`: paste the raw key **with literal `\n`**

### Step 4 — Deploy
```bash
# Or via CLI:
vercel --prod
```

---

## 6️⃣ Post-Deployment Checklist

- [ ] Auth email/password works (register + login)
- [ ] Citizen can submit issue with images
- [ ] Real-time status updates work
- [ ] Admin login redirects to `/admin/dashboard`
- [ ] Firestore rules block unauthorized access
- [ ] Storage rules block non-owner uploads
- [ ] Analytics page loads charts correctly
- [ ] Map view renders with Leaflet markers
- [ ] Mobile responsive layout verified
- [ ] Environment variables set in Vercel dashboard
- [ ] Custom domain configured (optional)

---

## 7️⃣ Firestore Index Notes

The `firestore.indexes.json` file pre-defines composite indexes.
If you see **"The query requires an index"** errors in dev, run:
```bash
firebase deploy --only firestore:indexes
```

---

## 8️⃣ Performance Optimizations

- Images are compressed before upload (browser-image-compression)
- Leaflet map is lazy-loaded with `next/dynamic`
- Zustand store persists auth state to localStorage
- API routes use in-memory rate limiting
- Firestore queries use pagination (50 per page)
- Next.js Image component with Firebase Storage domain

---

## 9️⃣ Scaling Recommendations

| Feature              | Current              | At Scale                    |
|----------------------|----------------------|-----------------------------|
| Rate Limiting        | In-memory            | Upstash Redis               |
| Full-Text Search     | Client-side filter   | Algolia / Typesense          |
| Image Storage        | Firebase Storage     | Cloudflare R2               |
| Analytics            | Runtime aggregation  | BigQuery / pre-computed      |
| Notifications        | Real-time Firestore  | FCM Push Notifications       |