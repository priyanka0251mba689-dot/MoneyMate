# MoneyMate — Student Safe-to-Spend Companion

> **Make your allowance last the whole month.**

MoneyMate is an installable Android-first mobile web app (PWA) for 1st- and 2nd-year hostel & PG students in India living on a fixed monthly allowance or stipend.

## Core Features
1. **Under-2-Minute Setup & Mid-Month Editing**: Enter your monthly allowance (₹), next allowance date, and fixed costs (rent share, recharge, subscriptions). Update anytime if extra money arrives from home.
2. **Sub-5-Second Expense Entry**: One-tap `+` button with a thumb-first numeric keypad, category chips (`Food & delivery`, `Travel`, `Subscriptions`, `Shopping`, `Social outings`, `Academics`, `Other`), payment mode (`UPI`, `Cash`, `Card`), and 1-tap recent-category shortcuts.
3. **Safe-to-Spend Hero Screen**: Shows `"You can safely spend ₹X today"`, remaining monthly balance, days until next allowance, green/amber/red pace bar, today's spend vs. daily safe limit, and automatic daily recalculation when you overspend.
4. **Friendly Overspend Alerts & Daily Reminder**: Gentle in-app and optional browser push alerts at 80% budget used, daily overspend, or early depletion pace, plus customizable daily log reminders.
5. **Weekly Check-In & Pilot Research**: Rolling 7-day summary (`Total spent`, `Top category`, `Days on track`), the weekly pilot question (*"Did the safe-to-spend number change a spending choice this week?"*), early-access waitlist form, optional ₹49/month pre-commitment survey, and CSV export.

## Running Locally
```bash
npm install
npm run dev
```
The app starts on `http://localhost:3000` seeded with a realistic **₹8,000 demo allowance** so you can test every feature immediately.

## Running Tests
Calculation logic (`spendableMoney`, `dailySafeAmount`, `paceState`, `projectedDaysEarly`, and `calculateWeeklySummary`) is isolated in `src/utils/budgetMath.ts`:
```bash
npm test
```

## Exporting Pilot Data
1. Open the **Settings** tab in MoneyMate.
2. Tap **Pilot Metrics & CSV Export** (or sign in with the pilot admin Google account for live Firestore cohort records).
3. Tap **Download Pilot CSV** to export `moneymate-pilot-export-YYYY-MM-DD.csv` containing:
   - Pilot users & campus/stay details
   - Week 4 active status (`>= 3` opens/logs per week)
   - Weekly check-in answers (`Yes` / `No` / `Not sure`)
   - Waitlist entries & `₹49/month` pre-commitment responses + objections

## Privacy
MoneyMate stores only what the user manually enters. **We never read SMS or bank accounts.** Users can delete all their data anytime from Settings.
