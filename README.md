# VerdeScope Platform — Investor Demo Prototype

**Nigeria's National Upstream GHG Compliance Infrastructure**

> *Emissions · Compliance · Carbon*

---

## Overview

This repository contains the frontend investor demonstration prototype for the **VerdeScope platform** — Nigeria's first dedicated GHG compliance, LDAR management, and carbon market SaaS built for the Nigerian upstream petroleum sector under a **50:50 net profit concession with the Nigerian Upstream Petroleum Regulatory Commission (NUPRC)**.

The prototype is a complete, fully interactive browser-based application built with **vanilla HTML, Tailwind CSS, Chart.js, and Lucide Icons** — zero build step, no package manager required. Every page opens directly in a browser.

All data is illustrative and references **OML 18 (NNPC Ltd / Eroton E&P Ltd JVC)** as the active demo licence, consistent with the NUPRC Concession Situation Report dated 1 March 2026.

---

## The Business Context

VerdeScope builds, funds, and operates Nigeria's national upstream GHG compliance infrastructure on behalf of NUPRC under a **public-private concession agreement**. The platform collects mandatory per-licence compliance fees from all **258 NUPRC-registered upstream licences** and shares net operating profit 50:50 with NUPRC.

| Metric | Value |
|---|---|
| NUPRC-licensed upstream operators | 258 licences |
| Year 1 combined revenue | USD 191.8 million |
| VerdeScope Year 1 retained profit | USD 88.9 million (46.4% net margin) |
| Seed investment sought | USD 10 million (Pre-Series A) |
| Anchor investor | Twenty First Capital, Paris (AMF-regulated, EUR 3.4B AUM) |
| NUPRC profit share | 50:50 net operating profit |

**Regulatory mandate:** Every NUPRC-licensed operator must comply with the Upstream Petroleum Decarbonisation Template (UPDT, January 2025) embedded in all licence, permit, and FDP applications under PIA 2021 §96–97. Non-compliance equals licence revocation.

---

## Repository Structure

```
verdescope/
│
├── README.md                     ← This file
│
├── app/
│   ├── dashboard.html            ← Main operator compliance dashboard
│   ├── emissions.html            ← GHG Emissions Calculation Engine (9 source tabs)
│   ├── ldar.html                 ← LDAR Programme Manager
│   ├── equipment.html            ← Equipment Compliance Tracker
│   ├── updt.html                 ← UPDT Compliance Workflow Engine
│   ├── carbon-market.html        ← Carbon Market Services
│   ├── reports.html              ← Reports & NUPRC Submissions
│   ├── verde-intel.html          ← Verde Intel ML Intelligence
│   └── settings.html             ← Account, Users, Billing, Security
│
└── assets/
    ├── js/
    │   └── calculations.js       ← Shared GHG calculation engine (IPCC 2006+2019)
    │
    └── data/
        ├── emission-factors.json ← Locked IPCC AR6 / API Compendium factor library
        ├── operators.json        ← 258-licence NUPRC operator registry
        ├── facilities.json       ← Representative facility dataset (8 facilities)
        ├── emissions.json        ← OML 18 CY2025 GHG inventory
        ├── ldar.json             ← LDAR inspection records and leak dataset
        ├── equipment.json        ← Equipment compliance registry
        └── licences.json         ← Licence, UPDT, and carbon project records
```

---

## Getting Started

No installation, no build step, no server required.

**Option 1 — Open directly in browser:**
```
open app/dashboard.html
```

**Option 2 — Local HTTP server (recommended to avoid CORS on JSON fetch):**
```bash
# Python 3
python3 -m http.server 8080
# then open: http://localhost:8080/app/dashboard.html

# Node.js (npx)
npx serve .
# then open: http://localhost:3000/app/dashboard.html
```

Navigate between all pages using the collapsible left sidebar. The sidebar toggle (☰) in the top-left collapses it to icon-only mode.

---

## Page Reference

### `app/dashboard.html` — Operator Compliance Dashboard

The command centre for a single-licence operator view. Displays:

- **KPI row:** Total Scope 1 tCO₂e, Energy Intensity (vs. NUPRC 2.5%/yr target), Active LDAR leaks, UPDT Compliance Score
- **Emissions trend:** 12-month Scope 1/2/3 bar chart with source breakdown
- **UPDT ring:** Circular compliance score indicator for all 5 obligations
- **LDAR summary:** Open leak count, overdue repairs, next survey date
- **Carbon pipeline:** Verified credits and pipeline revenue estimate
- **Activity feed:** Recent platform events, anomaly flags, submission confirmations

---

### `app/emissions.html` — GHG Emissions Calculation Engine

Implements the full **IPCC 2006 + 2019 Refinement Tier 1/2/3** methodology as mandated by NUPRC Guide 0024-2022 §4.0. Nine emission source category tabs:

| Tab | Source | NUPRC Basis |
|---|---|---|
| Gas Flaring | CO₂/CH₄/N₂O from combustion | Guide 0024-2022 §3.3.2; IPCC 2006 Vol 2 Ch4.2 |
| Fugitive / LDAR | Equipment leaks — ppmv to tCO₂e | Guide 0024-2022 §3.2; API Compendium 3rd Ed. |
| Stationary Combustion | Turbines, generators, heaters | IPCC 2006 Vol 2 Ch2 |
| Venting | Cold vent and process vent | Guide 0024-2022 §3.3.1 |
| Pneumatic Controllers | Continuous bleed CH₄ | Guide 0024-2022 §3.4.1 |
| Compressor Seals | Wet seal / rod packing | Guide 0024-2022 §3.4.3–3.4.4 |
| Storage Tanks | Flash gas, working, breathing | Guide 0024-2022 §3.4.6 |
| Glycol Dehydrators | Still vent and flash separator | Guide 0024-2022 §3.4.5 |
| Scope 2 Electricity | Grid consumption | GHG Protocol Scope 2; Nigeria EF 0.431 kgCO₂/kWh |

Live Tier 1 calculator on each tab — enter activity data and see tCO₂e computed in real time using the locked emission factors in `assets/js/calculations.js`.

---

### `app/ldar.html` — LDAR Programme Manager

Full implementation of the NUPRC Guide 0024-2022 §3.2 LDAR programme requirements:

- **Survey Schedule:** Quarterly calendar for all facilities — Year 1/2/3+ frequency schedule with overdue highlighting
- **Leak Register:** 14-record data model capturing: component type, ppmv concentration, leak class (large ≥50,000 / small ≥5,000), repair deadline (5 days / 14 days), repair status, resurvey deadline (+15 days), Hi-Flow scm/hr rate
- **Repair Kanban:** Visual board tracking leaks through Detected → Scheduled → In Progress → Repaired
- **Analytics:** Inspection completion rates, component-type breakdown, repair performance vs. prior period
- **NUPRC Report Builder:** Auto-assembled Appendix A annual report preview

---

### `app/equipment.html` — Equipment Compliance Tracker

Monitors the four equipment categories under NUPRC Guide 0024-2022 §3.4:

**Pneumatic Controllers** — Per-device inventory with bleed rate, phase-in year tracking (25/65/75/85/100% zero-bleed over 5 years), replacement priority ranking, annual emissions calculation.

**Rod Packing** — Per-compressor accumulated hours counter. Warning at **24,000 hours** (NUPRC limit: 26,000 hours or 36 months, whichever first). Automatic replacement trigger and CH₄ leakage calculation.

**Turbines** — Single-cycle vs. combined-cycle status per unit. NUPRC 2030 replacement deadline tracker. Emission reduction potential if upgraded.

**Storage Tanks** — VOC emission rate classification against three phase-in tiers (>12 tpy Year 1; 6–12 tpy Year 2; 2–6 tpy Year 3). Control installation status.

---

### `app/updt.html` — UPDT Compliance Workflow Engine

Manages all **five mandatory UPDT obligations** per NUPRC's Upstream Petroleum Decarbonisation Template (January 2025):

| Obligation | Description | Weight |
|---|---|---|
| 1 | Decarbonisation Strategy integrated into FDP | 25% |
| 2 | Measurable, time-bound GHG reduction goals | 25% |
| 3 | Gas flaring / venting compliance (2030 zero-flaring trajectory) | 20% |
| 4 | Methane Management Programme (LDAR, pneumatics, equipment) | 20% |
| 5 | CCS / nature-based solutions / carbon offset initiatives | 10% |

Produces a **Compliance Readiness Score (0–100)** for NUPRC submission. FDP Decarbonisation Chapter builder auto-generates the UPDT-compliant FDP section. NDC 3.0 trajectory chart shows operator contribution to national targets.

---

### `app/carbon-market.html` — Carbon Market Services

Aligned to the **Nigeria Carbon Market Framework (October 2025)** and Paris Agreement Article 6.4:

- **Carbon Projects:** Three project cards (VCS VM0039 active, pneumatic replacement in registration, flare gas recovery scoping) with progress, VVB badges, ITMO status
- **MRV Data Packages:** ISO 14064-2 compliant package generator with verified reduction bar chart vs. baseline
- **ITMO Tracker:** NCCC authorisation pipeline (5-step workflow), corresponding adjustment status per project
- **Revenue Pipeline:** 3-year bar chart with bear/base/bull price sensitivity ($8 / $12.40 / $20 per tCO₂e)
- **Registry Status:** Verra and Gold Standard credit issuance, retirement, and available balance

---

### `app/reports.html` — Reports & NUPRC Submissions

Four-tab reporting centre covering the full NUPRC submission workflow:

- **Report Library:** All mandatory submissions (NUPRC Annual GHG & LDAR Report, quarterly GHG reports, UPDT package, ISO 14064-1 inventory, IFRS S2 disclosure) with status and download buttons
- **Report Builder:** Type selector, period inputs, output format (PDF/XML/XLSX), signatory field, live mock NUPRC report preview in monospace terminal format
- **Submission Schedule:** Full 2026 NUPRC deadline calendar with days remaining and compliance status
- **VVB Audit Portal:** Bureau Veritas active session, data packages shared with access timestamps, query resolution tracker (3 queries), verification progress bars

---

### `app/verde-intel.html` — Verde Intel ML Intelligence

Four machine learning models operating across the 258-licence portfolio:

| Model | Algorithm | Purpose | Key Metric |
|---|---|---|---|
| ML-1 Anomaly Detection | Isolation Forest | Real-time emission deviation flagging | F1: 0.94 |
| ML-2 Emissions Forecast | Prophet + LSTM ensemble | 24-month forward projection | MAPE: 11.2% |
| ML-3 Compliance Risk | XGBoost classifier | 30/60/90-day deadline breach probability | AUC-ROC: 0.91 |
| ML-4 Pathway Optimiser | NSGA-II multi-objective | Pareto-optimal decarbonisation roadmap | 50+ actions |

Tabs: Anomaly Detection (live flag table + critical flag detail panel), Emissions Forecast (chart with 80% CI bands), Compliance Risk (risk score trend + ML insights), Pathway Optimiser (Pareto scatter + Gantt roadmap), Model Status (per-model performance metrics).

---

### `app/settings.html` — Account, Users, Billing & Security

Eight-section settings panel:

- **Profile:** Company/JVC details, NUPRC operator reference, responsible official, personal account
- **Licence & Tier:** OML-A entitlement list, equity distribution, tier feature access
- **Users & Roles:** User table with roles (Admin / HSE Manager / Operations Engineer / VVB Verifier / Field Technician), permissions matrix per module, invite flow
- **Compliance:** GWP standard, default tier, fiscal year, currency, Scope 2 method, energy intensity base year; 5 NUPRC deadline alert toggles
- **Notifications:** 3 delivery channel toggles + 7 alert-type toggles
- **Integrations & API:** API key management (production + read-only), integration status (AWS, SCADA, NUPRC portal, Verra registry)
- **Billing:** Invoice history (Q1–Q4 2025 + Q1 2026), quarterly amounts, payment status
- **Security & Audit:** MFA config, SSO, session timeout, IP allowlist; SOC 2 / ISO 14064-1 / ISO 27001 certification progress; immutable audit log panel

---

## Calculation Engine — `assets/js/calculations.js`

The shared scientific calculation library implementing **IPCC 2006 + 2019 Refinement** methodology. All emission factors are locked to **IPCC AR6 (2021)** values. No external dependencies.

**Exported namespace: `VS`**

```javascript
// Gas flaring
VS.flaring.co2({ volumeM3: 18180000, drePct: 98.1 })
// → { kgCO2: 48,920,000, kgCH4: 1,280, kgN2O: 4,100, tCO2e: 49,148 }

// Diesel combustion
VS.combustion.diesel({ litres: 2840000 })
// → { kgCO2: 8,822,419, kgCH4: 357, kgN2O: 71, tCO2e: 8,834 }

// Pneumatic controller methane
VS.fugitive.pneumatic({ count: 42, type: 'high', hoursPerYear: 8760 })
// → { kgCH4: 394,842, tCO2e: 11,016 }

// Rod packing compliance check
VS.fugitive.rodPackingStatus({ hoursOperated: 23800 })
// → { status: 'warning', hoursRemaining: 2200 }

// Energy intensity (NUPRC Appendix D — GWP20 for CH4)
VS.energyIntensity.calculate({ tCO2: 113200, tCH4: 1036, oilBbls: 4200000, gasMcf: 8900000 })
// → { ei: 12.4, unit: 'tCO2e/MBOE', mboe: 9645 }

// UPDT compliance score
VS.updt.score({ ob1: 95, ob2: 90, ob3: 82, ob4: 88, ob5: 70 })
// → { score: 87.5, passed: true, label: 'Good' }

// LDAR repair deadline
VS.ldar.repairDeadline({ detectionDate: '2026-04-11', concentrationPpmv: 68400 })
// → { category: 'large', daysAllowed: 5, deadline: '2026-04-16' }

// Carbon revenue sensitivity
VS.carbonMarket.priceSensitivity(31450)
// → { bear: { netRevenue: 238,820 }, base: { netRevenue: 370,922 }, bull: { netRevenue: 597,550 } }
```

**Locked GWP values (IPCC AR6):**
- CO₂: 1
- CH₄ (GWP100): 27.9
- CH₄ (GWP20, fossil — energy intensity only): 82.5
- N₂O: 273

---

## Mock Data Files

All JSON files are valid, schema-consistent, and cross-referenced. `emission-factors.json` is the authoritative source of truth for all constants; `calculations.js` implements them in code.

| File | Size | Contents |
|---|---|---|
| `emission-factors.json` | 14KB | Complete IPCC AR6 / API Compendium / NUPRC factor library with source references, locked GWPs, LDAR thresholds, NDC targets, carbon market methodology references |
| `operators.json` | 15KB | 25 operator records drawn from the NUPRC Concession Situation Report; portfolio statistics (258-licence breakdown by tier, terrain, nationality, compliance status); Q1 2026 billing summary |
| `facilities.json` | 9.6KB | 8 representative facilities (Olo WPF, Asasa GPP, Imo River ET, Bonga FPSO, Makaraba WPF, Forcados ET, and others); component counts, equipment inventory, production data, 2026 LDAR schedules |
| `emissions.json` | 4.5KB | OML 18 CY2025 Scope 1/2/3 inventory; quarterly and monthly breakdown; energy intensity vs. 2020 base year and annual target |
| `ldar.json` | 10KB | 12 inspection records across 3 facilities; 14 individual leak records with ppmv, class, deadline, repair status; 3 upcoming 2026 surveys |
| `equipment.json` | 5KB | Pneumatic controller inventory (186 units, type distribution); rod packing per-compressor hours; turbine upgrade status; storage tank VOC tiers; glycol dehydrator DRE records |
| `licences.json` | 6.4KB | Active OML 18 licence record; UPDT 5-obligation status with evidence docs and scores; 3 carbon projects; compliance score history (H1 2024 → H2 2025); NUPRC submission log |

---

## Design System

All pages share a single consistent design system. No CSS framework configuration file is required — Tailwind is loaded via CDN with an inline config block.

### Colour Palette

| Token | Hex | Usage |
|---|---|---|
| `obsidian` | `#0D1A12` | Page background |
| `forest` | `#1A3D24` | Card backgrounds, section fills |
| `pine` | `#235930` | Borders, hover states |
| `verde` | `#2E7D45` | Primary buttons, accent fills |
| `sage` | `#4CAF6F` | Success states, positive values, active indicators |
| `mist` | `#A8D5B5` | Light accents, subtle text |
| `ivory` | `#FDFCF9` | Primary text, headings |
| `gold` | `#B8962E` | Warnings, demo banner, billing highlights |
| `goldlight` | `#D4AE50` | Gold text, in-progress states |
| `ash` | `#8A9BB0` | Muted text, disabled states |

### Typography

| Role | Font | Weights |
|---|---|---|
| Display / headings | Cormorant Garamond | 300, 400, 500 (italic variants) |
| Body / UI | Outfit | 300, 400, 500, 600, 700 |
| Monospace / data | DM Mono | 300, 400, 500 |

### Layout Constants

- **Sidebar:** 220px expanded / 56px collapsed — toggle via ☰ button in topbar
- **Topbar:** 52px fixed height
- **Content area:** `flex:1; overflow-y:auto; padding:24px`
- **Demo banner:** 32px fixed — gold gradient, identifies investor demo build

### CDN Dependencies

```html
<!-- Tailwind CSS (CDN — production warning is cosmetic, non-blocking) -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Lucide Icons -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

<!-- Chart.js v4.4.0 -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- Google Fonts (Cormorant Garamond + Outfit + DM Mono) -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>
```

---

## Regulatory Framework

The platform operationalises the following Nigerian and international instruments. Every functional requirement traces to at least one binding regulation.

### Nigerian Instruments

| Instrument | Effective | Key Obligations Implemented |
|---|---|---|
| **NUPRC UPDT** (Upstream Petroleum Decarbonisation Template) | January 2025 | 5 mandatory obligations; embedded in all FDP, licence, permit applications; non-compliance = licence revocation |
| **NUPRC Guide 0024-2022** (Fugitive Methane & GHG Guidelines) | November 2022 | LDAR programme (quarterly OGI surveys); equipment phase-in schedules; GHG inventory and reporting; energy intensity target 2.5%/yr |
| **Gas Flaring, Venting & Methane Emissions Regulations 2023** | May 2023 | Zero routine flaring by 2030; 98% DRE; cold venting prohibited; FEMP submission; quarterly gas volume reporting |
| **Petroleum Industry Act 2021 (PIA 2021)** §96–97, 102, 104 | 2021 | Licence suspension/revocation enforcement; decarbonisation embedded in operating conditions |
| **Nigeria Climate Change Act 2021** §24 | 2021 | Private entities ≥50 employees: annual GHG reporting to NCCC; Climate Change Officer designation |
| **Nigeria NDC 3.0** | September 2025 | Zero flaring by 2030; 60% methane reduction by 2035; 32.2% economy-wide reduction by 2035 |
| **Nigeria Carbon Market Framework** | October 2025 | VCM/Article 6.2/6.4 participation; mandatory company reporting from 2028; ETS and carbon tax roadmap |

### International Standards

| Standard | Application |
|---|---|
| IPCC 2006 Guidelines + 2019 Refinement (Vol 2 Energy) | Tier 1/2/3 emission factors and calculation methodologies — mandated by NUPRC |
| GHG Protocol Corporate Standard (WRI/WBCSD) | Scope 1/2/3 boundary-setting and inventory design |
| ISO 14064-1:2018 | Organisational GHG inventory structure; uncertainty assessment; verification-ready design |
| ISO 14064-2:2019 | Project-level carbon accounting for credit origination |
| ISO 14064-3:2019 | Verification workflow; audit trail; VVB portal |
| API Compendium 3rd Edition (ANGA/API) | Equipment-count emission factors — NUPRC-approved Tier 2 methodology |
| IFRS S1/S2 (ISSB 2023) | Climate-related financial disclosure for Enterprise (OML-A) tier |

---

## Known Non-Blocking Issues

| Issue | Severity | Resolution |
|---|---|---|
| Tailwind CDN production warning in console | Cosmetic | CDN warning does not affect functionality. Production deployment would use PostCSS build. |
| AOS animation library not loaded (some pages) | Cosmetic | AOS is referenced in earlier pages (dashboard, emissions) but not required for pages built in later sessions. The `typeof AOS !== 'undefined'` guard prevents errors. |
| JSON data not auto-loaded into pages | Cosmetic | Pages use inline illustrative data for the investor demo. In production, pages would `fetch()` from the data files. |
| No routing / SPA framework | By design | All pages are standalone HTML files navigated via `<a href>` links in the sidebar. Appropriate for an investor demo prototype. |

---

## Platform Architecture (Production)

The production VerdeScope platform is specified in **VS-PRD-001-v2.0** (April 2026) and is built on:

```
Backend:        Python FastAPI (ASGI async)
Database:       PostgreSQL 16 + TimescaleDB (time-series emissions data)
Cache / Queue:  Redis 7 + Celery
Object Storage: AWS S3 (LDAR images, chain-of-custody documents, reports)
Search:         Elasticsearch 8 (VVB audit trail full-text search)
Frontend:       React 18 + TypeScript + Tailwind CSS
ML Stack:       scikit-learn · PyTorch · Prophet · XGBoost · pymoo · MLflow
Infrastructure: Docker + Kubernetes (EKS) on AWS af-south-1 (Lagos)
Auth:           Auth0 — OAuth 2.0/OIDC + MFA + SAML 2.0 SSO
Security:       AWS KMS (AES-256 at rest) · TLS 1.3 · SOC 2 pathway
Standards:      ISO 14064-1 inventory design · ISO 14064-3 verification-ready
```

---

## Document Registry

| Document | Reference | Version |
|---|---|---|
| Business Plan Phase I | VerdeScope Investment Memorandum | v4 — April 2026 |
| Product Requirements Document | VS-PRD-001 | v2.0 — April 2026 |
| Technical & Scientific Reference Manual | VS-TRM-001 | v1.0 — In development |
| 5-Page Executive Summary | VerdeScope Summary | v1.0 |
| Financial Model | VerdeScope Financial Model | v1 (Excel, 8 sheets) |

---

## Contact

**VerdeScope Limited**
Lagos, Nigeria · Paris, France (Liaison Office)
[www.verdescope.ng](https://www.verdescope.ng) · info@verdescope.ng

**Engr. Sani Muazu, PhD**
Founder & Chief Executive Officer

---

*This prototype is strictly confidential and intended solely for investor demonstration and technical due diligence purposes. All financial projections and compliance data are illustrative. VerdeScope Limited, April 2026.*