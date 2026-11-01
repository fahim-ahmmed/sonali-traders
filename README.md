# Sonali Trading — Rod & Cement ব্যবসা ব্যবস্থাপনা সিস্টেম

Next.js (App Router) • React (JSX) • Tailwind CSS • MongoDB (Mongoose) • Better Auth

POS, ইনভেন্টরি, কাস্টমার-বাকি লেজার, Approval, হিসাব ও রিপোর্ট — সবই এক সিস্টেমে।
মাস্টার প্ল্যান (v1.0) অনুযায়ী ১০ ধাপই সম্পন্ন।

## ১. দ্রুত শুরু (লোকাল)

```bash
npm install
cp .env.example .env.local     # ফাইলটি ভরুন (নিচে দেখুন)
npm run seed                   # Admin, সেটিংস, ৯টি Category-Brand, ৮টি প্রোডাক্ট, Subscription
npm run seed:products          # শুধু catalog seed / verify (idempotent)
npm run dev                    # http://localhost:3000
```

লগইন: `.env.local`-এ দেওয়া `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`।

### `.env.local`
| কী | কী দেবেন |
|---|---|
| `MONGODB_URI` | Atlas কানেকশন স্ট্রিং (ডাটাবেস নাম সহ) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` | লোকালে `http://localhost:3000`, প্রোডাকশনে আসল ডোমেইন |
| `SEED_ADMIN_*` | প্রথম Admin-এর ইমেইল/পাসওয়ার্ড/নাম |

### Product ও Category data

- Category/brand-এর একমাত্র উৎস MongoDB `Category`; product-এর একমাত্র উৎস MongoDB `Product`।
- `npm run seed:products` exact catalog-এর category-brand pairs/products `$setOnInsert` দিয়ে যোগ করে, archived product ফের সক্রিয় করে না, এবং expected count/total যাচাই করে।
- Product List, Add/Edit Product এবং Add Category list `GET /api/products` ও `GET /api/categories` ব্যবহার করে।
- POS (`PosScreen`) ও Purchase (`PurchaseForm`) active product lookup-এর জন্য `GET /api/products?q=&categoryId=&active=1` এবং shared `src/components/shared/ProductSelect.jsx` ব্যবহার করে।
- Approval-এর existing sale rows-এ সংরক্ষিত item snapshot ব্যবহার হবে; নতুন product dropdown লাগলে একই lookup/selector ব্যবহার করুন।
- Reports ও Dashboard sales/purchase item-এর category snapshot ব্যবহার করে Cement/Rod quantity গুনবে; lookup API-এর বর্তমান product name দিয়ে পুরনো invoice পুনর্লিখবে না।
- Sidebar শুধু `/products` ও Category পেজে নেভিগেট করে; কোনো catalog data embed করে না।
- Product deletion soft archive (`active=false`); Category/brand ব্যবহৃত product থাকলে delete API প্রত্যাখ্যান করে।

> **গুরুত্বপূর্ণ:** MongoDB-কে **replica set** হতে হবে (Atlas-এ আছে)। লোকাল standalone `mongod`-এ transaction চলে না।
> পাসওয়ার্ড/ক্রেডেনশিয়াল কোডে বা এই ডকুমেন্টে রাখবেন না — শুধু `.env`।

## ২. পুরনো ডাটা ইমপোর্ট

ক্লায়েন্টের পুরনো সিস্টেম থেকে CSV (`name,phone,address,due` — টাকায়) নিন। নমুনা: `data/customers-sample.csv`।

```bash
# ১) ড্রাই-রান — কিছু লেখে না; সারি, মোট Due, ট্যাগ, সতর্কতা দেখায়
npm run import:customers -- data/customers.csv --date=2026-10-27 --expect=30405224

# ২) মোট মিললে আসল ইমপোর্ট
npm run import:customers -- data/customers.csv --date=2026-10-27 --expect=30405224 --commit
```
- প্রতিটি Due → `opening_due` লেজার এন্ট্রি (Sales মোটে গণ্য নয়, Receivable-এ গণ্য)।
- নামের বন্ধনীর ব্র্যান্ড থেকে cement/rod ট্যাগ বসে।
- `--expect` না মিললে ইমপোর্ট নিজেই থেমে যায়। আবার চালালে ডুপ্লিকেট তৈরি হয় না।
- পুরনো ইনভয়েস ইতিহাস (INV-000001…78) আমদানি করা হয়নি — ক্লায়েন্টের সিদ্ধান্ত বাকি।

## ৩. Vercel + Atlas ডিপ্লয়

1. **Atlas:** Cluster তৈরি (Singapore/Mumbai অঞ্চল), Database User, Network Access-এ Vercel-এর জন্য `0.0.0.0/0` (বা Vercel IP), কানেকশন স্ট্রিং নিন।
2. **GitHub-এ push** করুন (`.env*` গিট-ইগনোর করা আছে)।
3. **Vercel:** প্রজেক্ট ইমপোর্ট → Environment Variables-এ `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (= প্রোডাকশন URL), `NEXT_PUBLIC_APP_URL` (= একই URL) দিন। `vercel.json`-এ রিজিয়ন `sin1`।
4. **Deploy** করুন।
5. **একবার সিড:** নিজের মেশিন থেকে প্রোডাকশনের `MONGODB_URI` দিয়ে `npm run seed` চালান (শক্ত `SEED_ADMIN_PASSWORD` দিয়ে)।
6. লগইন করে **Settings → General**-এ কোম্পানির তথ্য ও লোগো দিন; **Staff**-এ স্টাফ তৈরি করুন।
7. ইমপোর্ট (উপরের ধাপ ২) প্রোডাকশন ডাটাবেসে চালান।

লোগো এখন MongoDB-তে (≤2MB) সংরক্ষিত; চাইলে পরে Vercel Blob/Cloudinary-তে সরানো যাবে।

## ৪. রোল ও পারমিশন

| | Admin | Staff |
|---|---|---|
| POS | সরাসরি approved | **pending** (Approval-এর অপেক্ষা) |
| Purchase / Supplier / Product / Customer List / Expenses | ✔ | পারমিশন থাকলে |
| Dashboard, Reports, Accounts, Staff, Settings, Approvals, Subscription | ✔ | ✘ কখনো নয় |

প্রতিটি API রুটে সার্ভার-সাইড পারমিশন চেক আছে; পেজেও গার্ড আছে (`/no-access`)।

## ৫. মূল ডিজাইন সিদ্ধান্ত

- **টাকা = পয়সায় (integer)।** ৳600.01 → 60001। UI-তে বাংলাদেশি কমা (৳3,04,05,224)।
- **লেজার-ভিত্তিক হিসাব।** কাস্টমারের Due/Advance = `Σ debit − Σ credit`; সব লেনদেন `lib/ledger.js`-এর একটি ফাংশন দিয়ে।
- **Pending বিক্রি** লেজার/স্টক/ড্যাশবোর্ডে কিছুই লেখে না। Approve = এক transaction-এ ইনভয়েস নম্বর + cost snapshot + স্টক + লেজার।
- **cost snapshot:** বিক্রির সময়ের ক্রয়দর ধরা থাকে, পরে দাম বদলালেও পুরনো লাভ অপরিবর্তিত।
- **সময়:** 'আজ' = Asia/Dhaka দিন; ডাটাবেসে UTC।
- **ডাবল-সাবমিট সুরক্ষা:** POS-এ `clientRef`; Approve-এ transaction conflict।
- **"Profit Balance" বাতিল** — বদলে *Net Profit* (Profit − Expense) ও আলাদা *Receivable*।

## ৬. অনুমান (ক্লায়েন্টের সাথে নিশ্চিত করুন)

1. রডের একক PCS ধরা (দাম ৳92/ইউনিট) — কেজি/টন হলে ইউনিট ফিল্ড লাগবে।
2. Supplier Due = Purchase-এর `grandTotal − paidAmount`; আলাদা সাপ্লায়ার-লেজার নেই।
3. স্টক ঘাটতিতে বিক্রি আটকায় না, শুধু সতর্কবার্তা।
4. 'Track Number' সম্ভবত 'Truck Number' — বর্তমানে ঐচ্ছিক টেক্সট।
5. Subscription মেয়াদ শেষে শুধু ব্যানার; সিস্টেম লক হয় না।
6. পুরনো ইনভয়েস ইতিহাস ইমপোর্ট হবে কি না।
7. ইনভয়েস/ক্যাশমেমো প্রিন্ট ভিডিওতে ছিল না — বানানো হয়নি।

## ৭. ক্লায়েন্ট-ডেমো চেকলিস্ট

1. Admin লগইন → Dashboard: ৯টি কার্ড, Due Customer, Subscription।
2. Settings → General: লোগো আপলোড → সাইডবারে বদলায়।
3. Supplier যোগ → New Purchase (Holcim ১০০ পিস) → Product Ledger-এ +100।
4. Customer + Old Due → POS-এ বিক্রি (Admin) → লেজার, স্টক, Dashboard একসাথে আপডেট।
5. Staff তৈরি (শুধু POS) → স্টাফ লগইনে POS বিক্রি → Admin-এর Approvals-এ ব্যাজ → Approve → INV নম্বর।
6. কাস্টমার লেজারে Receive Due Payment → Due কমে; Print Ledger।
7. Expense যোগ → Dashboard-এর Today's Expense।
8. Accounts: Profit = Sales − Cost, Net Profit = Profit − Expense; Day/Month/Manual রিপোর্টের মোট মেলে; Print।
9. মোবাইলে POS (স্টিকি বটম বার) ও সাইডবার মেনু।

## ৮. ফোল্ডার কাঠামো (সংক্ষেপ)

```
src/app/(auth)/login        লগইন
src/app/(app)/…             সব অ্যাপ পেজ (সাইডবার লেআউট; প্রতি সেগমেন্টে গার্ড)
src/app/api/…               REST API: সেশন → পারমিশন → Zod → {ok,data|error}
src/components/{ui,layout,forms,pos,reports,dashboard}
src/lib/                    db, auth, ledger, sales(approveSale), report, money, dates, permissions…
src/models/                 Mongoose স্কিমা
scripts/seed.js, import-customers.js
```

## ৯. সমস্যা সমাধান

| সমস্যা | সমাধান |
|---|---|
| Purchase/Payment/POS সেভে "Transaction numbers are only allowed on a replica set" | Atlas ব্যবহার করুন; লোকাল standalone নয় |
| লগইনের পর আবার লগইন পেজে ফেরত | `BETTER_AUTH_URL` ও `NEXT_PUBLIC_APP_URL` আসল ডোমেইনের সাথে মিলছে কি দেখুন |
| সিডে "Admin ইতিমধ্যে আছে" | ঠিক আছে — সিড বারবার চালানো নিরাপদ |
| Staff পাসওয়ার্ড রিসেট/তৈরি কাজ করছে না | `better-auth` সংস্করণ আপডেট করে আবার দেখুন; এরর বার্তা ডেভেলপারকে পাঠান |
