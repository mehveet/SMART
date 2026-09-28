# SMART (Surplus Management And Redistribution Technology)
**Smart India Hackathon (SIH 2026) · Problem Statement 26234**
*Domain: Sustainable Food Systems, Institutional Resource Optimization & Zero-Hunger ESG Compliance*

---

## 1. Executive Summary

**SMART (Surplus Management And Redistribution Technology)** is an institutional-grade, closed-loop food waste prevention, tracking, and internal redistribution operating system built specifically for large-scale institutional kitchens (university dining halls, hospital cafeterias, corporate campuses, and military mess facilities) and food processing units.

Unlike consumer food-sharing apps or ad-hoc donation marketplaces, SMART addresses the core failure points of institutional food operations:
- **Pre-Production Waste**: Overproduction caused by rigid meal scheduling disconnected from real-time attendance, weather changes, and campus calendar variances.
- **In-Transit Spoilage & Cold-Chain Violations**: Inability to verify HACCP temperature compliance during staging, holding, and transport.
- **Redistribution Friction**: Lack of authorized chain-of-custody transfer manifests, leading to liability concerns and duplicate or unverified delivery claims.
- **Post-Consumer Plate Waste**: Absence of station-level attribution to distinguish prep trim, overproduction scrap, and plate waste residue.

---

## 2. Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Strict type checking, component modularity, high-density dashboard layouts |
| **Styling & Design System** | Tailwind CSS v4 | Carbon-aware dark green emerald palette (`#0b2b20`), accessible WCAG contrast |
| **Backend & Routing** | Express.js on Node.js (via `server.ts`) | Server-side Gemini API proxy, health check endpoints, static asset serving |
| **Authentication** | Firebase Authentication | Google OAuth pop-up login, institutional supervisor and chef role profiles |
| **Cloud Database** | Google Cloud Firestore | 12 collections, zero-trust security rules, multi-document atomic transactions |
| **Machine Learning / AI** | Multiple Linear Regression (OLS Ridge) + Gemini 2.5 Flash | Real-time demand modeling (MAE, RMSE, R² validation) & HACCP visual inspection |
| **Environmental Standards** | FAO / UNEP / WRI / Water Footprint Network | Defensible baseline methodology, cited conversion factors for CO₂e and blue water |

---

## 3. Installation & Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Step-by-Step Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd foodwise-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to configure your API keys:
   ```env
   # GEMINI_API_KEY: Required for server-side AI explanations & visual quality audits
   GEMINI_API_KEY="your-gemini-api-key"

   # APP_URL: URL where the applet runs (auto-injected in production)
   APP_URL="http://localhost:3000"
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The platform will be available at `http://localhost:3000`.

5. **Lint and Compile Checks**:
   ```bash
   # Run TypeScript compilation check
   npm run lint

   # Build production bundle
   npm run build
   ```

---

## 4. Firebase Configuration & Cloud Firestore Architecture

The application is provisioned with Firebase Authentication and Cloud Firestore on project `ordinal-parity-7szp9` (database `ai-studio-foodwiseai-0c82c680-f150-47f2-82a4-0c2ae6e52b52`).

### 12 Persistent Collections Schema

1. `/users/{uid}`: Staff accounts, institutional roles (`Kitchen Supervisor`, `Culinary Operations Lead`, `HACCP Safety Officer`).
2. `/meal_history/{recordId}`: Historical meal logs (attendance, meals prepared, meals served, surplus portions, weather parameters).
3. `/forecasts/{forecastId}`: Saved regression model outputs, 7-day predicted demand points, confidence bounds, and actionable recommendations.
4. `/inventory/{itemId}`: FEFO perishable store items, batch lot codes, cold storage zones, expiry countdowns.
5. `/waste_entries/{entryId}`: Scale-measured waste logs (Pre-consumer Prep, Post-consumer Plate Waste, Spoilage, Overproduction).
6. `/food_listings/{batchId}`: Safe surplus batches, portion estimates, storage conditions, collection deadlines, HACCP thermal clearance.
7. `/recipients/{recipientId}`: Enrolled internal beneficiaries and verified partner pantries (capacity, location, vehicle specs).
8. `/redistribution_records/{manifestId}`: Transfer manifests, dispatch codes, departure/arrival timestamps, digital signatures.
9. `/quality_checks/{inspectionId}`: Visual inspection observations, AI confidence scores, microbiological safety disclaimers, human review status.
10. `/sensor_readings/{sensorId}`: Walk-in chiller, deep freezer, and hot holding telemetry (min/max safe thresholds, last ping).
11. `/processing_logs/{lossId}`: Food processing raw material yield losses and machine OEE metrics.
12. `/impact_metrics/{metricId}`: Institutional ESG audits, avoided CO₂e, saved water, and landfill diversion rates.

### Zero-Trust Firestore Security Rules

Deployed in `firestore.rules`:
- Unauthenticated public reads and writes are blocked by default.
- Authenticated staff members have access to institutional inventory, logs, and surplus records.
- Critical operations (batch allocation, manifest dispatch, and delivery confirmation) require atomic transactions (`runTransaction`) to guarantee that surplus quantities cannot be double-allocated or claimed more than once.

---

## 5. End-to-End SIH Demo Walkthrough

Follow this scripted 11-step walkthrough to demonstrate the full lifecycle of the platform:

| Step | Action | Module | Expected Result |
|---|---|---|---|
| **1** | Enter Historical Meal Data | **Demand Forecasting** | Click **"+ Add Record"** to enter a completed shift (e.g., 2,520 prepared, 2,410 served). The record is appended to the 60-day dataset. |
| **2** | Generate Demand Forecast | **Demand Forecasting** | Click **"Run Forecast Computation"**. The Multiple Linear Regression engine trains instantly and returns 7-day targets, confidence intervals, and MAE/R² scores. |
| **3** | Commit to Kitchen Schedule | **Demand Forecasting** | Click **"Commit to Kitchen Schedule"**. Targets automatically populate the central kitchen displays and synchronize with the Overview dashboard. |
| **4** | Record Food Waste | **Waste Tracking** | Click **"Log Waste Entry"** from Top Navbar or Waste page. Log 12.5 kg of pre-consumer trim waste with station attribution. Charts and KPI loss figures update dynamically. |
| **5** | Adjust Inventory Stock | **Inventory & FIFO** | Open Inventory page. View priority FEFO items. Click **"+ Add Item"** to stage a new lot or adjust stock on a near-expiry item. |
| **6** | Register Available Surplus | **Surplus & Redistribution** | Click **"+ Register Surplus Batch"**. Enter 28.5 kg Veg Dum Biryani, log core temperature (68.4°C), and pass HACCP clearance. Batch appears as **Available / Staged**. |
| **7** | Run Recipient Matching | **Surplus & Redistribution** | Click **"Run Recipient Matching"** on the newly staged batch. The algorithm scores partners based on capacity, dietary acceptance, and distance. |
| **8** | Review Recommended Recipient | **Surplus & Redistribution** | Review top-matched partner (e.g., Campus Annex Student Pantry, 98% compatibility). |
| **9** | Approve Internal Assignment | **Surplus & Redistribution** | Click **"Allocate Surplus"**. Batch status transitions to **Matched / Allocated**. The recipient's daily allocated quota updates atomically. |
| **10** | Schedule Pickup & Dispatch | **Surplus & Redistribution** | Click **"Schedule Pickup"**, select vehicle and driver, then **"Mark Collected"** with departure temperature verification. A digital manifest slip is created. |
| **11** | Confirm Delivery & Verify Audit | **Surplus & Redistribution** → **Dashboard** | Click **"Confirm Delivery"**, enter recipient sign-off code and received kg. Status transitions to **Delivered**. Switch to **Overview** and **Sustainability Reports**: **Food Recovered (kg)**, **Avoided CO₂e**, and **Landfill Diversion Rate** increment immediately. |

---

## 6. Functional, External, and Simulated Scope Matrix

To maintain scientific rigor and avoid false claims during SIH evaluations, FoodWise AI clearly distinguishes between operational code, external dependencies, and prototype simulations:

| Capability | Status | Implementation Details |
|---|---|---|
| **Multiple Linear Regression (OLS Ridge)** | **Fully Functional** | Real mathematical OLS regression with L2 regularization running in TypeScript. Chronological train/test split, calculating real MAE, RMSE, MAPE, and R² validation scores. |
| **Dynamic KPI & Date Range Engine** | **Fully Functional** | Reactive calculations for Today, 7D, 30D, and 90D windows reflecting underlying database records without hardcoded values. |
| **Firestore Cloud Persistence** | **Fully Functional** | 12 collections with real-time snapshot listeners, offline caching fallback, and atomic transaction locks. |
| **Chain-of-Custody Redistribution** | **Fully Functional** | State machine (`Available` → `Matched` → `Pickup Scheduled` → `In-Transit` → `Delivered`) with thermal logging and verification codes. |
| **Defensible ESG Calculations** | **Fully Functional** | Calculates CO₂e avoidance and water conservation using published FAO (2.50 kg CO₂e/kg) and Water Footprint Network (140 L/kg) coefficients. Requires a minimum 3-day baseline window before asserting prevented waste volume. |
| **Google Authentication** | **Requires External Setup** | Uses standard Google OAuth pop-up flow. When testing without Google sign-in credentials, a local supervisor profile is automatically activated. |
| **Gemini AI Visual Quality & Explanations** | **Requires External Setup** | Powered by Google Gemini 2.5 Flash via `/api/gemini/explain-forecast` and visual inspection analysis. Requires valid `GEMINI_API_KEY` in environment; graceful heuristic fallback provided when key is absent. |
| **IoT Sensor Mesh Telemetry** | **Simulated** | Demonstrates real-time cold-chain monitoring with manual sensor calibration, simulated threshold trips (door ajar, power loss), and automated HACCP alert triggers. No physical hardware connection required for demo. |
| **Public NGO / Charity Marketplace** | **Intentionally Omitted** | SIH Problem Statement 26234 specifies internal institutional kitchens and processing units. Public marketplaces create food safety liability and cold-chain breakdown; redistribution is strictly restricted to verified institutional beneficiaries. |

---

## 7. Build & Deployment Instructions

### Production Build
```bash
npm run build
```
This generates a production-optimized Vite bundle in `dist/`.

### Run Full-Stack Production Server
```bash
npm run start
```
Starts Express.js on port 3000, serving the compiled static assets and handling `/api/*` endpoints.

### Cloud Run / Container Deployment
The application is pre-configured for Docker and Google Cloud Run with single-command deployment:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 8. Team & Compliance Declaration

- **SIH 2026 Problem Statement**: 26234
- **Regulatory Frameworks Supported**: Food Safety and Standards Authority of India (FSSAI) Safe Food Share Food Guidelines, HACCP Codex Alimentarius, UN SDG 12.3 (Target: Halve per capita food waste by 2030).
