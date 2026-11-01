# Sonali Trading — Rod & Cement Management System

## প্রজেক্ট কী
কুষ্টিয়ার একটি রড-সিমেন্ট ব্যবসার POS + ইনভেন্টরি + কাস্টমার-বাকি লেজার + হিসাব সিস্টেম।
১০ ধাপের পরিকল্পনা অনুযায়ী কোড লেখা সম্পন্ন; এখন লক্ষ্য: চালিয়ে টেস্ট, বাগ ফিক্স, ডিপ্লয়।
মূল সত্য-উৎস: docs/Sonali_Trading_Master_Plan.pdf (বাংলায়)। সিদ্ধান্ত নিয়ে দ্বন্দ্ব হলে সেটিই চূড়ান্ত।

## স্ট্যাক (কঠোর)
Next.js 15 App Router • React JavaScript (JSX) — **TypeScript নয়** • Tailwind CSS 3 •
MongoDB + Mongoose (Atlas, replica set; transaction ব্যবহৃত) • Better Auth (email+password; Admin/Staff) • Zod

## স্কোপ নিয়ম
- নতুন ফিচার যোগ করা যাবে না। ভিডিও/মাস্টার প্ল্যানে যা আছে শুধু তা-ই; বিদ্যমান ফিচারকে সুন্দর, দ্রুত, ইউজার-ফ্রেন্ডলি করা যাবে।
- UI-এর লেবেল ইংরেজি (ক্লায়েন্ট অভ্যস্ত); ব্যাখ্যা/কমিট-সারাংশ/আমার সাথে কথা বাংলায়।
- কোড কমেন্ট বাংলা বা ইংরেজি — বিদ্যমান স্টাইল অনুসরণ।

## অপরিবর্তনীয় আর্কিটেকচার সিদ্ধান্ত
1. টাকা সবসময় **পয়সায় (integer)**। ৳600.01 → 60001। দেখানো: lib/money.js formatMoney (৳3,04,05,224)। float নয়।
2. কাস্টমার ব্যালেন্স = Σ debit − Σ credit (LedgerEntry)। সব লেনদেন শুধু lib/ledger.js `postEntry()` দিয়ে। + = Due, − = Advance।
3. Sale: staff → status "pending" (লেজার/স্টক/ড্যাশবোর্ডে কিছুই লেখে না); admin → সরাসরি approved।
   Approve = lib/sales.js `approveSale()` — এক transaction: INV নম্বর + cost snapshot + স্টক + লেজার + ট্যাগ।
4. cost snapshot: sale approve-এর সময় product.buyPrice সংরক্ষিত; পরে দাম বদলালে পুরনো লাভ অপরিবর্তিত।
5. 'আজ' = Asia/Dhaka দিন (lib/dates.js); ডাটাবেসে UTC।
6. লেনদেনযুক্ত রেকর্ডের hard-delete নেই (archive/active=false)। সব মোট সংখ্যা সার্ভারে পুনরায় হিসাব — ক্লায়েন্টের total বিশ্বাস নয়।
7. প্রতিটি API রুট: সেশন → পারমিশন (lib/api.js requireUser/requireAny) → Zod → `{ok,data|error}`।
   পেজে গার্ড: প্রতি সেগমেন্টের layout.js-এ lib/guard.js।
8. "Profit Balance" বাতিল; Net Profit = Profit − Expense; Receivable আলাদা।
9. route.js ফাইল থেকে GET/POST/PUT/DELETE ছাড়া অন্য কিছু export করা যাবে না (Next.js নিয়ম) — শেয়ার্ড কোড lib/-এ।

## রোল
Admin: সব। Staff: শুধু অনুমোদিত (pos, purchase, supplier, product, customer_list, expenses)।
Dashboard/Reports/Accounts/Staff/Settings/Approvals/Subscription শুধু Admin।

## কমান্ড
npm run dev | npm run build | npm run seed | npm run import:customers -- <csv> [--commit]

## কাজের নিয়ম
- বড় পরিবর্তনের আগে প্ল্যান দেখাও, আমার সম্মতি নাও।
- প্রতিটি লজিক্যাল কাজ শেষে `git commit` (বাংলা/ইংরেজি ছোট বার্তা)।
- .env / .env.local পড়বে না, লিখবে না, কোথাও প্রিন্ট করবে না। কোনো ক্রেডেনশিয়াল কোডে রাখবে না।
- বাগ ঠিক করার আগে মূল কারণ খুঁজে বলো; লক্ষণ চাপা দিও না।
- ডিজাইন: নেভি (#0B2239/#12334F) + সোনালি-কমলা (#E8941A) + ব্র্যান্ড নীল (#1769AA); বিদ্যমান Tailwind টোকেন ও components/ui ব্যবহার করো।

## জানা ঝুঁকি (আগে টেস্ট করো)
- Staff তৈরি (lib/auth-admin.js) ও পাসওয়ার্ড রিসেট Better Auth-এর অভ্যন্তরীণ API/কালেকশন (user, account, session) ব্যবহার করে — সংস্করণ-সংবেদনশীল।
- transaction-এর জন্য MongoDB replica set লাগবে।

## ক্লায়েন্টের কাছে অনিশ্চিত (নিজে অনুমান বদলাবে না — আমাকে জিজ্ঞেস করো)
রডের ইউনিট (PCS/কেজি), পুরনো ইনভয়ে ইতিহাস আমদানি, 'Track/Truck Number', Subscription শেষে লক কি না।