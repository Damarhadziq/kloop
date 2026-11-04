# KLOOP (figma-make-app)

Mobile-first Split Bill & Expense Tracking web application built with **React 19 + Vite 8 + TypeScript 5.7 + Tailwind CSS v4** (exported from Figma Make and refactored into a modular Feature-First architecture).

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Feature-First Project Structure (`src/`)

Start with task-relevant files below. Follow the modular Feature-First boundaries when adding or modifying functionality:

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into `#root`
- `src/App.tsx` - Root orchestrator managing top-level stage transitions (`splash` → `auth` → `app`) and global Toast feedback
- `src/index.css` - Global CSS entrypoint, `@font-face` declarations (`Courgette:Regular`, `Outfit:Regular`, `Outfit:Medium`, `Outfit:SemiBold`), Tailwind CSS v4 import, and keyframe animations
- `src/types/index.ts` - Relational data models ready for Supabase integration (`UserProfile`, `Bill`, `BillItem`, `BillParticipant`, `Session`, `TalanganSummary`, `PaymentStatus`, `SplitMethod`)
- `src/lib/supabase.ts` - Supabase client configuration placeholder reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`)
- `src/services/` - Asynchronous data & auth service layer (currently backed by structured mock data + simulated Promise delays, ready to swap with Supabase queries without touching UI components):
  - `src/services/auth.service.ts` - `login`, `registerUser`, `verifyOtp`, `requestPasswordReset`, `resetPassword`, session persistence helpers
  - `src/services/bill.service.ts` - `getActiveBills`, `getCircleFriends`, `getTalanganSummary`, `parseScannedReceipt`, `createBill`, `verifyPayment`, `formatRupiah`, and asset registries
- `src/components/ui/` - Atomic, reusable UI primitives and motion hooks:
  - `Avatar.tsx` (`Avatar`, `Icon`)
  - `Badge.tsx` (`Badge`)
  - `Button.tsx` (`Button`, `PrimaryButton`, `LinkButton`, `RoundIconButton`)
  - `Card.tsx` (`Card`)
  - `Img.tsx` (`Img`, `preloadImage`, `preloadWhenIdle`)
  - `Input.tsx` (`Input`, `Field`)
  - `LogoLoader.tsx` (`LogoLoader`, `KLOOP_LOGO`)
  - `Sheet.tsx` (`Sheet` bottom sheet portal)
  - `Spinner.tsx` (`Spinner`)
  - `Toast.tsx` (`Toast` notification portal)
  - `hooks.ts` (`usePresence`, `useSwitch`, `useToast`, `useScrollLock`, `useCountUp`, `screenClass`, `loadFonts`)
- `src/components/skeletons/` - Pulse skeleton placeholders (`animate-pulse` using `#F2F3E6` and `#ECECEC`):
  - `Skeleton.tsx` (`Skeleton`, `useSimulatedLoading`)
  - `HomeDashboardSkeleton.tsx` - Skeleton for Status Talangan, Hero CTA, Tagihan Berjalan, and Circle Kamu
  - `ScanResultSkeleton.tsx` - Skeleton for receipt item parsing in Split Bill editor
  - `BillSummarySkeleton.tsx` - Skeleton for bill details and participant payment statuses
- `src/features/auth/` - Authentication & onboarding flow:
  - `Onboarding.tsx` (`Splash`, `HeroCollage`)
  - `Login.tsx` (`LoginScreen`)
  - `SignUp.tsx` (`SignUpScreen`)
  - `OtpVerification.tsx` (`OtpVerificationScreen`)
  - `ForgotPassword.tsx` (`ForgotScreen`, `ResetScreen`)
  - `AuthShared.tsx` (`AuthShell`, `AuthHeader`, `Brand`, `Heading`, `SwitchPrompt`, `AUTH_ASSETS`)
  - `AuthFlow.tsx` - Multi-step auth screen state machine
- `src/features/home/` - Main single-page dashboard (no bottom navigation bar):
  - `HomeDashboard.tsx` - Main dashboard view coordinating home sections, sheets, and sub-flows
  - `StatusTalanganCard.tsx` - "Status Talangan" card (`Uang Masuk` vs `Tagihan` tabs + count-up nominal)
  - `HeroActionCard.tsx` - "Ada pengeluaran bareng baru?" CTA (`Input manual` & `Foto Bill`)
  - `ActiveBillCard.tsx` - "Tagihan Berjalan" bill card with participant status grid & reminder triggers
  - `CircleSection.tsx` - "Circle Kamu" 3-column friend grid with `Manage` mode
  - `ProfileMenu.tsx` - Header avatar dropdown menu
- `src/features/split-bill/` - Receipt scanning, manual input, and item-level or equal bill splitting:
  - `JenisSheet.tsx` - Category selection bottom sheet (`Resto & Kafe`, `Jajanan & Kaki Lima`, `Bagi Rata (Flat)`)
  - `ScanScreen.tsx` - Camera viewfinder, torch toggle, and gallery picker
  - `LoadingScreen.tsx` - Animated Kloop logo receipt processing screen
  - `ManualInputSheet.tsx` - Quick manual expense bottom sheet with link to per-menu split
  - `SplitBillScreen.tsx` - Interactive bill split editor (`Per Menu` vs `Bagi Rata` tabs, friend avatar assignment per item, tax/service calculation)
- `src/features/bill-summary/` - Bill breakdown & payment verification:
  - `BillSummaryScreen.tsx` - Detailed bill items, bank account info, and participant payment status list
  - `PaymentConfirmSheet.tsx` - Payment confirmation bottom sheet (Option A: Bank Transfer / QRIS / Cash + proof upload)

## Design Tokens & Strict UI Constraints

1. **Zero Visual Regression**:
   - Preserve exact proportions, padding/margins, border-radius, typography (`Outfit` & `Courgette`), and asset paths (`/assets/*`).
   - Single-page primary navigation concept **without** a bottom navigation bar.
   - Always guard dynamic text (restaurant titles, menu names, friend names) with `truncate` and `min-w-0` so mobile layouts (`360px - 430px`) never overflow or collide with price columns.
2. **Color Palette Tokens**:
   - `TEXT PRIM`: `#054131`
   - `PRIM COLOR`: `#A6BB18` (hover: `#97AB12`)
   - `SEC-BG-PRIM`: `#F2F3E6` (hover: `#E8EAD2`, subtle surface: `#F8F8EC` / `#FEFEF8`)
   - `SEC TEXT`: `#8E8E8E`
   - `PURE WHITE / SURFACE BG`: `#FFFFFF`
   - `BORDER`: `#ECECEC`
   - `BORDER DASHED`: `#DEDEDE`
   - `SETTLED GREEN`: `#2ACB70`
   - `CATEGORY ACCENT`: `#2233F5`
   - `DANGER / ERROR`: `#E5484D` / `#D14343`

## Dependencies & Styling

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with `@tailwindcss/vite` configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`.
- Build tooling: Vite 8, TypeScript 5.7, `@vitejs/plugin-react`
- Formatting: `oxfmt`
