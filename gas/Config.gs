/**
 * GeoTrack HRMS - Global Configuration (GAS V8)
 * 
 * Central configuration file for Spreadsheet ID, tab names, Google Drive folders,
 * geofence default parameters, and role definitions.
 */

var CONFIG = {
  // Spreadsheet Configuration
  // Note: Leave empty to automatically use the Active Spreadsheet when bound, 
  // or set your Google Spreadsheet ID here (e.g. "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms")
  SPREADSHEET_ID: "1E9W2BAm34XLq9iWmoaWps_FPMobdHk1Tg1KlMyEJo7M", 

  // Sheet Tab Names (Relational Tables)
  TABS: {
    EMPLOYEES: "Employees",
    ATTENDANCE: "Attendance",
    COMPANY_SETTINGS: "CompanySettings",
    WORK_PROOFS: "WorkProofs",
    AUDIT_LOGS: "AuditLogs",
    ADMINS: "Admins",
    DEPARTMENTS: "Departments",
    LEAVES: "Leaves",
    PAYROLL: "Payroll",
    SETTINGS: "Settings",
    PRODUCTION_WORKFLOW: "ProductionWorkflow"
  },

  // Google Drive Media Hierarchy
  DRIVE: {
    ROOT_FOLDER_NAME: "GeoTrack_HRMS_Media",
    SUBFOLDERS: {
      SELFIES: "Selfies",
      WORK_PROOFS: "WorkProofs",
      LOGOS: "Logos"
    }
  },

  // Default Office Location & Geofencing Settings (Bangalore Tech Hub default fallback)
  DEFAULT_OFFICE: {
    COMPANY_NAME: "GeoTrack Innovations Corp",
    LATITUDE: 12.971598,
    LONGITUDE: 77.594566,
    GEOFENCE_RADIUS_METERS: 200, // Default 200m radius
    THEME_COLOR: "#4F46E5"
  },

  // User Roles
  ROLES: {
    ADMIN: "ADMIN",
    MANAGER: "MANAGER",
    EMPLOYEE: "EMPLOYEE"
  },

  // Attendance Statuses
  ATTENDANCE_STATUS: {
    PRESENT: "Present",
    PENDING: "Pending",
    REJECTED: "Rejected",
    ABSENT: "Absent"
  }
};

/**
 * Returns the active Spreadsheet object
 */
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}
