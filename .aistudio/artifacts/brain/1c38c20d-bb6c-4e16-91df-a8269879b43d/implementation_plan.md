# Google Ads High-Conversion Landing Page (`/ad`)

Redesign and re-architect the `/ad` landing funnel into a fast, Google Ads policy-compliant, clinical-grade conversion engine engineered specifically to turn paid search clicks into completed Pay-on-Delivery (POD) supplement package orders and qualified WhatsApp consultations.

## User Review & Critical Decisions

> [!IMPORTANT]
> Please review the confirmed architectural and design decisions below. Click **Proceed** to begin implementation, or share any adjustments you would like made to the layout, copy strategy, or checkout fields.

- **Confirmed Visual Theme**: Clean clinical white and emerald medical authority theme (`#FFFFFF` / `#F8FAFC` surfaces, high-contrast `#0F172A` typography, disciplined `#059669` emerald CTAs) optimized for legibility and trust among adult and senior buyers (ages 45–75+).
- **Confirmed Campaign Structure**: Dynamic URL symptom/keyword matching (adapting the hero headline and spotlighted treatment when URL parameters like `?condition=prostate` or `?utm_term=...` are present) paired with instant interactive symptom filter tabs for general `/ad` visitors.
- **Confirmed Checkout Workflow**: Dual 1-step Express Pay-on-Delivery (POD) checkout — an instant single-screen modal triggered from any package card **plus** an embedded inline Express Order Form near the bottom of the page.
- **Confirmed Page Chrome & Policy Posture**: Distraction-free dedicated ad header and policy-compliant footer (hiding the main website navigation menu, search bar, blog links, and developer portfolio badges on `/ad` to eliminate paid-click exit leaks).

> [!NOTE]
> **Google Ads Healthcare Copy Compliance**: To protect your ad account from "Unapproved Pharmaceuticals / Miracle Cure" disapprovals and maximize Landing Page Experience Quality Score, `/ad` will replace absolute cure/healed claims with authoritative, NAFDAC-backed clinical support phrasing and include mandatory supplement disclaimers, return policy access, and corporate contact details in the footer.

---

## 1. Overview & Core Concept

- **What It Does**: Serves as a dedicated, zero-distraction direct-response storefront at `/ad` that dynamically aligns its headline and featured packages with the visitor's Google Search intent, clearly breaks down multi-bottle treatment courses and their exact included herbal formulas, removes risk via Nationwide Pay-on-Delivery, and captures orders in a single frictionless step.
- **Target Audience / Persona**: Nigerian adults, seniors (45–75+), and family caregivers actively searching on Google for natural, NAFDAC-registered herbal support for chronic wellness concerns (prostate health, joint/arthritis mobility, men's vitality, blood sugar balance, blood pressure, and organ detox) primarily on mobile devices.
- **Key Value**:
  - **Higher Google Ads Quality Score & Lower CPC**: Tight message match between search ad keywords and the landing page hero, fast above-the-fold rendering, and transparent supplement disclosures.
  - **Higher Conversion Rate**: Eliminates multi-page browsing distractions and collapses a 3-step drawer into a single-screen Express POD form with large, senior-friendly inputs.
  - **End-to-End Attribution**: Captures `gclid` and `utm_*` parameters and fires exact Google Ads conversion events (`view_item_list`, `begin_checkout`, `purchase`, and `contact`).

---

## 2. User Experience & Visual Design

### Key User Flows (Proposition → Mechanism → Proof → Conversion)

1. **Arrival & Dynamic Intent Alignment (0–3 Seconds)**:
   - Visitor lands on `/ad` (or `/ad?condition=prostate`, `/ad?pkg=P001`, `/ad?utm_term=arthritis`).
   - Sees a clean, single-row **Distraction-Free Clinic Header**: Brand Wordmark (`SD GHT Health Care`) · 4 smooth-scroll section anchors (`Treatments`, `How Delivery Works`, `Patient Stories`, `Quick Order`) · 1 direct action button (`WhatsApp Advisor`).
   - **Dynamic Split Hero**: Displays a tailored headline matching the URL symptom (or the flagship multi-condition wellness proposition when no parameter is passed), NAFDAC registration trust proof, Free 24–48hr Nationwide Pay-on-Delivery assurance, and a single dominant primary CTA (`Select Your Treatment Plan`) alongside a spotlight preview of the top-matched package.
2. **Symptom Filtering & Package Course Selection**:
   - Directly below the hero, an interactive **Symptom Filter Bar** (`All Packages`, `Prostate Care`, `Arthritis & Joints`, `Men's Vitality`, `Blood Sugar`, `Cardio & BP`) filters treatment packages without page reloads.
   - Each **Clinical Package Card** presents:
     - High-clarity product kit visual on a clean neutral backdrop (with resilient CSS/SVG clinical fallback if an image is slow on mobile data).
     - Clear condition title, concise clinical summary, and top 3 targeted symptoms/benefits.
     - **Interactive Bottle Course Selector** (e.g., `2 Bottles`, `3 Bottles · Recommended`, `4+ Bottles`) that accurately calculates option-level discounts (`opt.discount`), displays tabular Naira pricing (`₦`), and lists the **exact included product names** (e.g., `Prostbeta · Longzit · Ganoderma`) cleanly with zero `1x (3)` clutter.
     - Primary CTA: **`Order Now — Pay on Delivery`** (opens the 1-Step Express POD Modal pre-filled with that exact package and bottle course) + secondary quiet action (`View Full Clinical Breakdown` modal or `Ask on WhatsApp`).
3. **Proof & Risk Reversal**:
   - **3-Step Pay-on-Delivery Assurance Strip**: `01. Place Order Online (₦0 Upfront)` → `02. Fast 24–48hr Doorstep Dispatch Nationwide` → `03. Inspect Package Before Paying Cash or Transfer`.
   - **Verified Patient Outcomes & Senior FAQ**: Attributable Nigerian patient stories paired adjacent to treatment claims, followed by clear accordion answers on NAFDAC safety, dosage guidance inside every box, and POD inspection rights.
4. **1-Step Express POD Conversion (Modal + Inline Bottom Form)**:
   - Whether triggered via a card's **Order Now** button (Express Modal) or scrolled to directly at the bottom of the page (**Inline Express Order Form**), the buyer completes everything on one clean screen:
     - Selected Package & Bottle Course switcher + Quantity stepper + Live Total Due on Delivery (`₦0` shipping).
     - `Full Name`, `Active Phone / WhatsApp Number` (validated for Nigerian mobile format), `Full Delivery Street Address & State`, `Nearest Landmark (Optional)`, `Delivery Day` (`Today`, `Tomorrow`, `Choose Date`), and `Payment Method` (`Pay on Delivery` default, or `Bank Transfer` with instant account copy & optional receipt upload).
   - Submitting posts directly to the backend order pipeline, dispatches instant Telegram + Email alerts (including Google Ads campaign/keyword source if present), fires the Google Ads `purchase` conversion event with exact NGN value, and transitions to the Order Confirmation / Thank-You view with 1-tap WhatsApp priority confirmation.

### Visual Identity & Theme

- **Aesthetic Direction**: *Clinical Pharmacy & Trusted Herbal Authority* — calm, structured, high-trust medical clarity designed for effortless reading on bright mobile screens.
- **Color Palette & 60-30-10 Distribution**:
  - **60% Dominant Neutral Canvas**: Crisp White (`#FFFFFF`) and Clinical Off-White (`#F8FAFC`) section alternation.
  - **30% Structural Surfaces & Ink**: Deep Slate (`#0F172A`) for headlines and prices, Muted Slate (`#475569`) for body copy, and Hairline Slate (`#E2E8F0`) for single-elevation card borders.
  - **10% High-Intent Accent**: Clinical Emerald (`#059669` default, `#047857` hover, `#ECFDF5` subtle selected tint) strictly reserved for primary Order CTAs, selected bottle tabs, and verified NAFDAC/POD trust indicators. Warm Amber (`#B45309` on `#FFFBEB`) used sparingly only for savings/rebate callouts.
- **Typography & Hierarchy**:
  - **Display Headlines**: `Plus Jakarta Sans` (`600`/`700`, tight tracking, `clamp(2rem, 3.8vw, 3.25rem)`, `text-wrap: balance`).
  - **Body & Form Inputs**: `DM Sans` (`400`/`600`, minimum `16px` on inputs to prevent iOS auto-zoom and aid senior legibility, `1.6` line-height).
  - **Prices & Bottle Counts**: `tabular-nums` alignment on all Naira figures (`₦59,500`) and rebates.
- **Overlay & Mobile Sticky Discipline**:
  - Total sticky height on mobile stays strictly **under 15% of viewport height**: a compact `56px` top bar and a clean `60px` mobile sticky bottom bar (appearing only after scrolling past the hero, showing the selected/featured price + `Quick Order (POD)` jump button). Zero entry popups.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Single-Screen 1-Step Express POD Checkout vs. Multi-Step Wizard**
  - *Chosen Approach*: Consolidate package/option selection, customer contact, delivery address, and POD confirmation into a single scannable 1-step form (available both as an instant modal when clicking any package and inline at the bottom of `/ad`).
  - *Why*: Paid search mobile traffic drops off 25–40% per extra wizard step. Keeping Pay-on-Delivery selected by default lets a buyer complete an order in under 35 seconds.
  - *Alternatives Considered*: Keeping the 3-step drawer — rejected for `/ad` because hidden steps create uncertainty about upfront payment requirements.
- **Decision 2: Dynamic URL Intent Matching + Client-Side Symptom Tabs**
  - *Chosen Approach*: Read URL query parameters (`condition`, `symptom`, `pkg`, `utm_term`, `kw`) on load to dynamically customize the hero headline and pin matching packages first, while keeping all other packages accessible via 1-tap symptom filter tabs.
  - *Why*: Allows running multiple tightly targeted Google Ads ad groups (e.g., Prostate Ad Group → `/ad?condition=prostate`, Arthritis Ad Group → `/ad?condition=arthritis`) against one unified `/ad` URL structure without maintaining 10 separate pages.
  - *Alternatives Considered*: Separate static routes per illness — harder to maintain and prevents cross-selling to patients with multiple age-related concerns (e.g., blood sugar + joint stiffness).
- **Decision 3: Google Ads Healthcare Policy Safe-Framing & Dedicated Chrome**
  - *Chosen Approach*: Hide global site navigation and developer showcase widgets when `/ad` is active, use NAFDAC-compliant wellness support language, and include inline modal/drawer access to Return Policy & Supplement Disclaimers so visitors can verify policies without leaving `/ad`.
  - *Why*: Prevents both ad disapprovals by Google's automated healthcare policy reviewers and paid-click leakage into non-converting pages.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Google Ads Visitor  (/ad?condition=...&gclid=...)        │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Root App Shell  (Ad Funnel Isolation Mode)                  │
│  • Suppresses global site nav, global footer, and floating portfolio badge   │
│  • Captures & persists gclid / utm_* attribution in session storage          │
│  • Syncs dynamic document <title> & meta description to matched symptom      │
└───────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                       Dedicated Ad Landing Funnel View                       │
├───────────────────────┬───────────────────────────┬──────────────────────────┤
│  1. Ad Top Bar &      │  2. Symptom Filter &      │  3. Proof,POD Steps,     │
│     Dynamic Split     │     Clinical Package      │     FAQ & Policy         │
│     Hero              │     Grid                  │     Compliance Footer    │
│  • Intent-matched H1  │  • Segmented symptom tabs │  • 3-step POD timeline   │
│  • NAFDAC + POD proof │  • Accurate opt.discount  │  • Attributable reviews  │
│  • Spotlight package  │  • Clean included items   │  • Inline policy viewer  │
└───────────┬───────────┴─────────────┬─────────────┴────────────┬─────────────┘
            │                         │                          │
            └─────────────────────────┼──────────────────────────┘
                                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│           Unified 1-Step Express POD Checkout Engine (Modal + Inline)        │
│  • Package & Bottle Course selector + Quantity stepper + Tabular NGN total   │
│  • Validated fields: Name, NG Phone, Address/State, Delivery Day, POD/Bank   │
└───────────────────┬────────────────────────────────────┬─────────────────────┘
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────────┐
│   Backend Order & Dispatch Pipeline   │  │   Google Tag & Conversion Layer   │
│  • POST /api/orders (Supabase + RLS)  │  │  • view_item_list / select_item   │
│  • Clean SKU & included product list  │  │  • begin_checkout (with value)    │
│  • Telegram & SMTP instant alerts     │  │  • purchase (NGN value + tx ID)   │
│    with UTM/GCLID campaign metadata   │  │  • contact (WhatsApp lead click)  │
└───────────────────────────────────────┘  └───────────────────────────────────┘
```

### Data Model & State

- **Ad Attribution Store (`sessionStorage`)**: Captures `gclid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `condition` on initial landing so attribution persists even if the user scrolls, filters tabs, or switches options before ordering.
- **Dynamic Intent Matcher**: Maps URL keywords (`prostate`, `arthritis`, `joint`, `diabetes`, `sugar`, `erection`, `vitality`, `fertility`, `fibroid`, `bp`, `hypertension`, or specific `package_code` like `P001`) to curated, Google-compliant hero copy and auto-selects the matching symptom filter tab.
- **Selected Checkout State**: Tracks `{ selectedPackage, selectedOptionIndex, quantity, checkoutMode: 'modal' | 'inline', customerForm, validationErrors, submissionStatus }`, computing effective unit and total prices accurately from `option.price * (1 - (option.discount || 0) / 100)` or fallback `package.price * (1 - (package.discount || 0) / 100)`.

### Interactive Component & State Mapping

- **Symptom Filter Tabs**: Clicking a tab updates `activeCategory`, filtering combined packages and combos in real time with a zero-empty-state fallback (if a niche tab has no exact match, displays all recommended packages with a clear notice).
- **Package Course Option Buttons**: Clicking `2 Bottles`, `3 Bottles`, or `4+ Bottles` on any card updates that card's selected option index, recalculates the displayed Naira price and savings percentage, updates the clean included-products list, and passes that exact index into the Express POD Checkout when `Order Now` is clicked.
- **Express 1-Step Checkout Validation & Submission**:
  - Validates non-empty customer name, valid 10–14 digit phone number, and street/state delivery address with inline field-level error messages (never silent failures or browser `window.alert`).
  - Supports both `Pay on Delivery` (default, 1-click submit) and `Bank Transfer` (reveals copyable corporate account number + optional receipt upload via `/api/upload-receipt`).
  - On success: fires `trackOrderComplete` with exact NGN value and order reference, then redirects cleanly to `/thank-you` (or renders an instant confirmation receipt with 1-tap WhatsApp order confirmation).
- **Inline Policy Modal**: Clicking `Return & Refund Policy` or `Medical Disclaimer` in the `/ad` footer opens a clean overlay modal so visitors (and Google Ads reviewers) can inspect full policies without navigating away from `/ad`.
