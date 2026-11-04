@AGENTS.md

## Quick Reference for Claude / AI Assistants

- **Architecture**: Feature-First modular structure under `src/features/` (`auth`, `home`, `split-bill`, `bill-summary`), atomic UI in `src/components/ui/`, skeletons in `src/components/skeletons/`, relational types in `src/types/index.ts`, and async service layer in `src/services/`.
- **Color Tokens**:
  - `TEXT PRIM`: `#054131`
  - `PRIM COLOR`: `#A6BB18`
  - `SEC-BG-PRIM`: `#F2F3E6`
  - `SEC TEXT`: `#8E8E8E`
  - `PURE WHITE / SURFACE BG`: `#FFFFFF`
  - `BORDER`: `#ECECEC`
  - `BORDER DASHED`: `#DEDEDE`
- **Strict Rules**:
  - Maintain 100% pixel-perfect visual fidelity with the Figma Make design.
  - Keep single-page primary navigation without a bottom navigation bar.
  - Route all data fetching/mutations through `src/services/auth.service.ts` and `src/services/bill.service.ts`.
