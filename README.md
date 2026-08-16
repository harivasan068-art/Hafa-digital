# GeoTrack HRMS - Zero-Infrastructure Geofenced HR System

GeoTrack HRMS is a production-grade, zero-infrastructure cost Human Resource Management System powered by **Google Workspace (Google Sheets & Google Drive)** on the backend and **React 18 + Vite 6 + Tailwind CSS** on the frontend.

---

## 🌟 Key Features

1. **Zero-Infrastructure Backend**:
   - Built on Google Apps Script (GAS V8 Engine).
   - Serves REST-like JSON API via `doGet(e)` and `doPost(e)`.
   - Relational Google Sheet DB with 10 structured tab schemas (`Employees`, `Attendance`, `CompanySettings`, `WorkProofs`, `AuditLogs`, `Admins`, `Departments`, `Leaves`, `Payroll`, `Settings`).
   - Media storage in structured Google Drive folders (`GeoTrack_HRMS_Media/Selfies`, etc.) returning direct CDN URLs (`https://lh3.googleusercontent.com/d/{fileId}`).

2. **Haversine Geofencing Protocol**:
   - Calculates distance in meters between clock-in GPS coordinates and office HQ coordinates.
   - Automatically sets attendance status to `Present` if within configured office radius (e.g., 200m).
   - Automatically flags attendance as `Pending` if outside geofence boundary for HR Admin manual verification.

3. **WebRTC Live Camera Snapshot**:
   - WebRTC webcam selfie capture with HTML5 canvas watermarking (GPS coordinates + timestamp).
   - Converts image to Base64 data strings for upload to Google Drive.

4. **Self-Healing Offline Engine**:
   - Frontend includes a built-in mock fallback engine so you can immediately preview and test the complete system offline without configuring Google Script first.

5. **HR Admin Dashboards**:
   - Interactive Geotag Verification Sheet with coordinate checks, map links, selfie lightbox viewer, and instant Approve/Reject controls.
   - Staff Management CRUD with auto-generated Employee IDs (`EMP-2026-xxx`).

---

## 🚀 One-Click Google Apps Script Setup Instructions

1. **Open Google Sheets**:
   - Create a new blank Google Sheet at [sheets.new](https://sheets.new).

2. **Open Apps Script Editor**:
   - In Google Sheets, click **Extensions** → **Apps Script**.

3. **Copy Backend Files**:
   - Paste the code from the `gas/` directory into your Apps Script project:
     - `Config.gs`
     - `SetupAndDeploy.gs`
     - `Utilities.gs`
     - `Auth.gs`
     - `Attendance.gs`
     - `DriveUploads.gs`
     - `Code.gs`

4. **Run One-Click Database Setup**:
   - Select function `setupDatabaseAndDrive` from the toolbar and click **Run**.
   - Grant Google Workspace permissions when prompted.
   - This automatically creates all 10 tab headers, seeds default Admin & Employee credentials, and builds Google Drive folders!

5. **Deploy as Web App**:
   - Click **Deploy** → **New Deployment**.
   - Select type: **Web App**.
   - **Execute as**: *Me (your email)*.
   - **Who has access**: *Anyone*.
   - Click **Deploy** and copy the **Web App URL** (`https://script.google.com/macros/s/.../exec`).

6. **Connect Frontend**:
   - Open GeoTrack HRMS Frontend, click **Google Apps Script Connected** in the top navigation bar, paste your Web App URL, and save!

---

## 👤 Default Seed Credentials

- **Admin Account**:
  - Email: `hafadigital75@gmail.com`
  - Password: `Aaliya2009`
- **Employee Account**:
  - Email: `john.doe@geotrack.com`
  - Password: `Employee@123`
