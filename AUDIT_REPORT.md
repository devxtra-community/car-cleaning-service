# Comprehensive Codebase Audit Report

## 1. REAL vs DUMMY DATA CHECK

**Web App (`apps/web/src/components/admin/AdminDashboard.tsx`)**

- **Issue:** The main dashboard relies heavily on static, mock data for its data visualization, despite the real data logic existing in the backend.
- **Line ~160:** `revenueChartData` is a hardcoded array using `Math.sin()` to generate fake revenue trends. **Replacement:** Use the existing `/salary` or `/analytics` endpoints to compute actual revenue over time.
- **Line ~170:** `taskChartData` is a hardcoded array (e.g., `[ { day: 'Mon', completed: 28, pending: 4 }, ...]`). **Replacement:** Map this to the real `/analytics/daily` endpoint used in `OperationalReports.tsx`.
- **Line ~180:** `ratingData` is a hardcoded array. **Replacement:** Wire this to the `/api/analytics/rating-summary` endpoint (which is already built in `allAPI.ts`).
- **Line ~190:** `topCleaners` is a hardcoded array. **Replacement:** Map to the existing `/api/analytics/cleaner-performance` endpoint.
- **Building Performance Cards:** Scores are hardcoded via `score = [82, 90, 45, 75, 68][i % 5]`. **Replacement:** Compute genuine scores based on task completion and ratings per building.
- **Worker/Supervisor Attendance metrics:** Hardcoded static numbers like `342/350` and `42/45`. **Replacement:** Create/use a unified attendance summary endpoint.

**Supervisor App (`apps/mobile/supervisor-mobile/app/(tabs)/index.tsx` & `analytics.tsx`)**

- **Issue:** Hardcoded comparative metrics.
- **Lines ~210 in `index.tsx`:** Contains `// Percentage is still dummy since we don't have historical comparison yet`.
- **UI Elements in `analytics.tsx`:** Hardcoded string literals for growth metrics like `"+12.5% VS LAST WEEK"`. **Replacement:** Compute actual percentage shifts dynamically from the backend analytics endpoint.

## 2. FUNCTIONALITY CHECK — Supervisor App

- **Dashboard (`index.tsx`):** ✅ Working (Successfully fetches pending tasks and summaries via real backend routes).
- **Profile (`profile.tsx`):** ✅ Working (Fetches and updates via `/api/supervisor/profile`).
- **Floor Overview (`floor-overview.tsx`):** ✅ Working (Fetches live data via `/buildings/supervisor/floors`).
- **Attendance (`attendance.tsx`):** ✅ Working (Fetches the supervisor's self-attendance calendar).
- **Push Notifications:** ✅ Working (Integrated for automated alerts from workers).
- **Collections (`collections.tsx`):** ❌ Broken/Dummy (There is a confirmed data structure mismatch between the frontend interface `CleanerCollection` and the returned payload from `/tasks/collections/supervisor`, resulting in empty/broken views).
- **Analytics (`analytics.tsx`):** ⚠️ Partial (Top-line numbers are fetched, but comparative metrics are hardcoded).

## 3. FUNCTIONALITY CHECK — Worker App

- **Login/Auth (`index.tsx`):** ✅ Working (Uses live JWT auth and `SecureStore`).
- **Pending Tasks List (`Home`):** ✅ Working (Fetches live assigned tasks).
- **Task Details & Completion (`JobLogs`, `AfterWash`):** ✅ Working (Fully handles QR scanning, vehicle tracking, and job completion. Earlier data mapping bugs regarding `car_type` have been resolved).
- **Push Notifications:** ⚠️ Partial (Receives alerts correctly, but backend token registration is incomplete—see Section 5).

## 4. FUNCTIONALITY CHECK — Web App

- **Authentication Flow (`SignInContainer.tsx`):** ✅ Working (Securely logs in via `/api/auth/login`).
- **Worker Management (`Cleaners.tsx`):** ✅ Working (Full dynamic CRUD via `/api/auth/cleaners`).
- **Building Management (`BuildingsManagement.tsx`):** ✅ Working (Fully integrated with `/api/buildings`).
- **Vehicle Management (`Vehicle_Management.tsx`):** ✅ Working (Prices and types driven dynamically by `/api/vehicle`).
- **Operational Reports (`OperationalReports.tsx`):** ✅ Working (Exports actual backend `/analytics/` data successfully).
- **Performance Insights (`PerformanceInsights.tsx`):** ✅ Working (Effectively surfaces live arrays for top/low performers).
- **Admin Dashboard (`AdminDashboard.tsx`):** ⚠️ Partial (The top-level summary counters are fetched live via `Promise.allSettled`, but all subsequent charts, ratings, and leaderboards are completely mocked).

## 5. PENDING / INCOMPLETE FEATURES

- **Worker App - Push Notification Token Storage:**
  - `apps/mobile/Worker_App/src/hooks/usePushNotifications.ts`
  - **Line 94:** Contains `// TODO: Call sendTokenToBackend(token, userAuthToken) here`. Without securely passing the user's Expo push token back to the backend table, notifications will fail to target specific devices on new logins.
- **Supervisor App - Collections:**
  - `apps/mobile/supervisor-mobile/app/(tabs)/collections.tsx`
  - The map function expects nested properties that backend route `/tasks/collections/supervisor` does not return, making the screen essentially broken until patched.

## 6. BACKEND ROUTES CHECK

- **Verification:** All identified API calls from the Web, Supervisor, and Worker apps have matching, existing controllers inside `backend/src/modules/`.
- **Data Authenticity:** 100% of the backend controllers (e.g., `tasks_controller`, `supervisor_controller`, `buildings_controller`) return genuinely retrieved Postgres database data. No mocked arrays or hardcoded mock JSON responses are being served from the Express server. The dummy data issues are isolated purely to the frontend React/React Native components.

## 7. FINAL SUMMARY TABLE

| Feature                            | App                | Status     | Issue                                                                                      |
| :--------------------------------- | :----------------- | :--------- | :----------------------------------------------------------------------------------------- |
| **Login / Auth**                   | All Apps           | ✅ Working | -                                                                                          |
| **Worker Assigned Tasks**          | Worker             | ✅ Working | -                                                                                          |
| **Task Scanning / Completion**     | Worker             | ✅ Working | -                                                                                          |
| **Supervisor Dashboard Views**     | Supervisor         | ✅ Working | -                                                                                          |
| **Floor / Building Management**    | Supervisor, Web    | ✅ Working | -                                                                                          |
| **Cleaner/Worker Management**      | Web                | ✅ Working | -                                                                                          |
| **Vehicle / Rates Configuration**  | Web                | ✅ Working | -                                                                                          |
| **Analytical Reporting Views**     | Web                | ✅ Working | Functional in the standalone report pages                                                  |
| **Push Notifications**             | Worker, Supervisor | ⚠️ Partial | `usePushNotifications` explicitly has a TODO missing the API call to save the user's token |
| **Analytics (VS Last Year/Week)**  | Supervisor         | ⚠️ Partial | Growth percentages are hardcoded string literals                                           |
| **Admin Dashboard Visualizations** | Web                | ⚠️ Partial | Massive use of fake data for charts (`revenueChartData`, `ratingData`, `topCleaners`)      |
| **Task Collections Status**        | Supervisor         | ❌ Broken  | Data structure mismatch between frontend interface and backend SQL query                   |
