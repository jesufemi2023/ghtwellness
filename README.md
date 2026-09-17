# GHT Wellness — Enterprise E-Commerce & Health Management Platform

[![Author](https://img.shields.io/badge/Author-Jesufemi%20Temitope%20Solomon-emerald?style=for-the-badge)](https://www.linkedin.com/in/temitope-solomon-jesufemi-2620ab275/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/temitope-solomon-jesufemi-2620ab275/)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20TypeScript%20%7C%20Node.js%20%7C%20Supabase-slate?style=for-the-badge)](https://github.com)

A production-grade, full-stack pharmaceutical and wellness e-commerce application engineered by **Jesufemi Temitope Solomon** for **SD GHT HEALTH CARE NIG LTD**. 

Designed to deliver a high-converting customer purchasing journey, automated order dispatch pipelines, and a full administrative operations dashboard with resilient multi-tier data persistence.

---

## 🌟 Executive Summary & Developer Attribution

- **Lead Engineer & System Architect:** **Jesufemi Temitope Solomon**
- **Professional Profile:** [LinkedIn: Temitope Solomon Jesufemi](https://www.linkedin.com/in/temitope-solomon-jesufemi-2620ab275/)
- **Contact:** [ogungbetemitope@gmail.com](mailto:ogungbetemitope@gmail.com)
- **Role:** Full-Stack Software Engineer (TypeScript, React, Node.js, Cloud Databases)

---

## 🏗️ System Architecture & Engineering Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React 19 + Vite)                 │
│  - Responsive Storefront (Tailwind CSS v4 + Motion)         │
│  - Multi-Step Slide-Over Checkout Engine                    │
│  - Dynamic Variation & Bottle Pricing Calculator            │
│  - Real-Time WhatsApp Direct Merchant Dispatch Link         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON API
┌──────────────────────────────▼──────────────────────────────┐
│                  Server (Node.js + Express)                 │
│  - Secure API Proxy (`/api/*`)                              │
│  - Multi-tier `OptionsStorage` Persistence Engine           │
│  - Cloudinary CDN Media Management                          │
│  - Omnichannel Notification Dispatcher (Telegram + Nodemailer)│
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼─────────────┐   ┌─────────────▼──────────────┐
│    PostgreSQL (Supabase)   │   │  Omnichannel Dispatch      │
│  - Products & Packages     │   │  - Telegram Bot API        │
│  - Orders & Order Items    │   │  - Nodemailer (SMTP/Gmail) │
│  - Consultations & Settings│   │  - WhatsApp Deep Links     │
└────────────────────────────┘   └────────────────────────────┘
```

### 1. Resilient Multi-Tier Persistence Engine (`OptionsStorage`)
* To support custom bottle variations (e.g., 1 Bottle, 2 Bottles, 3 Bottles with distinct pricing and discount percentages) across products and combo packages, a hybrid triple-tier storage model was implemented:
  1. **Primary Database Tier:** Attempts direct writes to the `options` JSONB column in PostgreSQL (`products` and `recommended_packages`).
  2. **Automated Cloud Backup:** If the remote table schema does not yet have the JSON column, the engine automatically catches the error and persists the variations in the `settings` key-value table.
  3. **Local Disk Snapshot:** Options are synchronized to `./data/options_storage.json` to guarantee zero loss across cold boots, hot reloads, or transient network partitions.

### 2. Standardized SKU & Bottle Quantity Pipeline
* Implemented standardized SKU formatting across the entire transaction lifecycle:
  * Automatically calculates and formats line items as `1x Product Name(bottle count)` (e.g., `1x Reodoe(3)`).
  * Consistent display across the Slide-over checkout drawer, WhatsApp merchant messages, customer receipts, Thank-You confirmation pages, and Telegram notifications.

### 3. Automated Order Notification Pipeline
* **Telegram Bot Service:** Uses Telegraf to dispatch structured, markdown-formatted order tickets directly to fulfillment operations chatrooms upon order placement.
* **Email Dispatcher:** Uses Nodemailer to send branded, itemized transaction summaries to administrators and store staff.
* **WhatsApp Deep Link Integration:** Generates one-click pre-filled WhatsApp messages for Nigerian and international customer communication.

### 4. Enterprise Administrative Dashboard
* Secure admin authentication to manage:
  * Products, categories, prices, images, and NAFDAC registration details.
  * Recommended combo treatments and bundled discounts.
  * Real-time order status tracking (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).
  * Tele-consultation bookings and patient inquiries.
  * Dynamic bank account details configuration for direct wire transfers.

---

## 💻 Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (Framer Motion) |
| **Icons & UI** | Lucide React |
| **Backend & Runtime** | Node.js, Express 4, TSX, ESBuild |
| **Database & Auth** | Supabase (PostgreSQL), Custom Admin Session Engine |
| **Media & CDN** | Cloudinary Image API (Dynamic Auto-Format & Resizing) |
| **Integrations** | Telegram Bot API (`telegraf`), Nodemailer (SMTP), Google Analytics (GA4) |

---

## 📂 Project Structure

```
├── server.ts                       # Full-stack Express server with Vite middleware
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx       # Operations, inventory & schema management
│   │   ├── OrdersAdminView.tsx      # Order management and status updates
│   │   ├── OrderDrawer.tsx          # Multi-step high-converting checkout drawer
│   │   ├── ComboCard.tsx            # Multi-product package cards
│   │   ├── PackageQuickView.tsx     # Rich modal with bottle options & savings
│   │   ├── DeveloperCaseStudyModal.tsx # Developer profile & engineering showcase
│   │   └── ...
│   ├── services/
│   │   ├── optionsStorage.ts        # Triple-tier bottle variations persistence
│   │   ├── notificationService.ts  # Telegram & Gmail automated dispatch
│   │   └── cloudinary/              # Cloudinary media optimization
│   ├── utils/
│   │   ├── bottleFormatter.ts       # Unified bottle & SKU quantity formatter
│   │   ├── whatsapp.ts              # WhatsApp URL and message encoder
│   │   └── ...
│   ├── config.ts                   # Centralized application configuration
│   ├── types.ts                    # Global TypeScript interfaces
│   └── App.tsx                     # Primary routing and layout shell
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/ogungbetemitope/ght-wellness.git

# Navigate to project directory
cd ght-wellness

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the project root:
```env
# Server Port (Defaults to 3000)
PORT=3000

# Supabase Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Telegram Notifications (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Email Notifications (Optional)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_specific_password

# Cloudinary Media (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Running Locally
```bash
# Start development server (Node.js + Vite)
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
```

---

## 👨‍💻 Author & Engineering Attribution

This application was engineered by **Jesufemi Temitope Solomon**:
- **LinkedIn:** [https://www.linkedin.com/in/temitope-solomon-jesufemi-2620ab275/](https://www.linkedin.com/in/temitope-solomon-jesufemi-2620ab275/)
- **Email:** [ogungbetemitope@gmail.com](mailto:ogungbetemitope@gmail.com)

Feel free to reach out for full-stack engineering roles, software development opportunities, or technical inquiries.
