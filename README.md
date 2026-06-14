# Aahar Byte 🍽️✨

A pristine, high-performance, and beautifully crafted full-stack Point of Sale (POS) and Restaurant Operations Management Workspace. Built with a robust **Vite + React (TypeScript)** frontend and powered by a secure **Node.js Express backend** with **Firebase Firestore / Credentials integration**.

---

## 🎨 Design Concept: "Cosmic Slate & Polish"

Aahar Byte is styled with maximum readability, micro-animations, and strict visual boundaries. 
* **Elegant Spacing**: Utilizing high physical contrast, balanced negative space, and smooth layout transitions (powered by `motion`).
* **Visual Rhythm**: Custom custom-scrollbars, clear segmented navigations, and optimized layout ratios designed specifically for direct operator touchscreens.
* **Responsive Control**: Crafted desktop-first with elegant mobile adaptation constraints to prevent layout stretching.

---

## 🚀 Key Modules & Functional Features

### 💻 1. Point of Sale (POS) Slate Terminal
* **Dynamic Cart Management**: Instantly add items, select quantities, customize with diet or status criteria, and view live calculations.
* **Flexible Seating Assignment**: Align active receipts directly to tables and zones with clear status trackers.
* **Promo Engine**: Apply verified code discounts and real-time client-level deduction codes.
* **Multi-Format Receipt Sharing**: Instant generation of digital POS receipts with standard web-share protocols and custom WhatsApp webhook parameters.

### 📋 2. Real-Time Kitchen Operations View
* **Active Progress Monitor**: Visual track lines separating newly arrived, cooking, completed, and dispatched backlogs.
* **Visual Calendar Filter**: Quick date boundaries filtering active queue lists with custom-styled dynamic quick-clear indicators.
* **Direct Ticket Controls**: Seamlessly mark, print preview, or update dispatch status with single-tap visual interactions.

### 📦 3. Sourced Kitchen Inventory Manager
* **Raw Ingredient Tracking**: Track depletion levels, custom units (g, kg, L, pcs), and real-time inventory levels.
* **Intelligent Auto-Depletion**: Auto-adjusts raw physical stock quantities when tickets complete cooking on the kitchen line.
* **Audit Logs**: Full transactional tracking for inventory check-ins and edits.

### 🍽️ 4. Seating Layout & Table Management
* **Configurable Zones**: Custom floor arrangements (Waitstaff, Table configurations, Manager clearances) mapped beautifully with real-time seat numbers and occupancy maps.
* **Segmented Settings Controls**: Manage multi-client organizational onboarding, custom user roster validation states, and roles structure securely.

---

## 🛠️ Architecture & Tech Stack

Aahar Byte leverages a highly modular full-stack configuration:

* **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide icons, Framer Motion
* **Backend Utilities**: Express, Node.js server setup securely proxying server-side operations
* **Data Layer**: Durable Firestore Cloud Integration for client data, orders, menu items, table structures, and inventory logs

---

## 📦 Getting Started Local Installation

Ensure you have **Node.js (v18+)** installed.

### 1. Clone & Set Up Directory
```bash
git clone <your-repository-url>
cd aahar-byte
```

### 2. Install Package Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add your secret credentials:
```env
# Server Runtime
PORT=3000

# Server-Side credentials
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running the Application Workspace

#### Development Server
Launches the full-stack server using `tsx`:
```bash
npm run dev
```

#### Production Build & Compilation
Bundles static assets with Vite and compiles the TypeScript server to CommonJS using `esbuild` for rapid container cold-starts:
```bash
npm run build
```

#### Start Production Daemon
```bash
npm run start
```

---

## ⚙️ Development & Structural Guidelines

* **Full-Stack Isolation**: Never expose private API keys (`GEMINI_API_KEY`, third-party tokens) to the client. Keep them securely locked inside Express `/api/*` proxy routes.
* **Zero Custom Typography Clutter**: Standardize UI layouts with precise CSS typography hierarchies (`font-sans` paired with `font-mono` markers).
* **Deterministic Layouts**: Keep view stages inside single-view bounds. All micro-interactions are responsive-constrained container elements rather than generic full-height pages.

---

*Enjoy a pristine, modern experience managing restaurant floor workflows with Aahar Byte.* 🍽️
