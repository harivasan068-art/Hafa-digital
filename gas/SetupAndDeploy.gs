/**
 * GeoTrack HRMS - One-Click Database & Google Drive Setup (GAS V8)
 * 
 * Run `setupDatabaseAndDrive()` once to automatically initialize:
 * - 10 Google Sheet tabs with relational database schemas & column headers.
 * - Root Google Drive folder "GeoTrack_HRMS_Media" with subfolders (Selfies, WorkProofs, Logos).
 * - Default Admin & Employee seed credentials.
 * - Initial company location & geofence parameters.
 */

function setupDatabaseAndDrive() {
  var ss = getSpreadsheet();
  var logMessages = [];

  logMessages.push("Initializing GeoTrack HRMS Database & Storage...");

  // Define tab headers schema
  var schemas = {
    Employees: [
      "id", "employee_id", "full_name", "email", "password_hash", 
      "phone", "department", "designation", "role", "status", 
      "photo", "joining_date", "created_at"
    ],
    Attendance: [
      "id", "employee_id", "check_in", "check_out", 
      "shop_name", "product_model", "camera_man", "editor", 
      "location_name", "address", "photo_url", "status", 
      "is_inside_geofence", "remarks", "approved_by", "date"
    ],
    CompanySettings: [
      "company_name", "theme_color", "office_latitude", 
      "office_longitude", "geofence_radius_meters", "company_logo"
    ],
    WorkProofs: [
      "id", "employee_id", "date", "title", 
      "description", "proof_url", "status", "submitted_at"
    ],
    AuditLogs: [
      "id", "timestamp", "user_email", "action", "details", "ip_address"
    ],
    Admins: [
      "id", "full_name", "email", "password_hash", "role", "status", "created_at"
    ],
    Departments: [
      "id", "name", "code", "manager", "created_at"
    ],
    Leaves: [
      "id", "employee_id", "leave_type", "start_date", "end_date", 
      "reason", "status", "applied_at", "approved_by"
    ],
    Payroll: [
      "id", "employee_id", "month_year", "basic_salary", "allowances", 
      "deductions", "net_salary", "payment_status", "processed_at"
    ],
    Settings: [
      "key", "value", "description", "updated_at"
    ]
  };

  // 1. Initialize Sheet Tabs
  for (var tabName in schemas) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      logMessages.push("Created tab: " + tabName);
    } else {
      logMessages.push("Existing tab verified: " + tabName);
    }

    // Set headers if missing or empty
    if (sheet.getLastRow() === 0) {
      var headerRow = schemas[tabName];
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      sheet.getRange(1, 1, 1, headerRow.length).setFontWeight("bold").setBackground("#EEF2FF");
      sheet.setFrozenRows(1);
    }
  }

  // Remove default "Sheet1" if present and unused
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
  }

  // 2. Initialize Seed Accounts if Employees tab is empty (except header)
  var empSheet = ss.getSheetByName(CONFIG.TABS.EMPLOYEES);
  if (empSheet && empSheet.getLastRow() <= 1) {
    var adminPasswordHash = hashPassword("Aaliya2009");

    // Add Admin user
    appendObjectToSheet(CONFIG.TABS.EMPLOYEES, {
      id: "emp_admin_001",
      employee_id: "EMP-2026-001",
      full_name: "HafA Digital Admin",
      email: "hafadigital75@gmail.com",
      password_hash: adminPasswordHash,
      phone: "+91 7338747220",
      department: "Executive Management",
      designation: "Chief HR Officer",
      role: CONFIG.ROLES.ADMIN,
      status: "ACTIVE",
      photo: "/logo.png",
      joining_date: "2024-01-01",
      created_at: new Date().toISOString()
    });

    logMessages.push("Seeded single Admin account (hafadigital75@gmail.com)");
  }

  // 3. Initialize Company Settings if empty
  var companySheet = ss.getSheetByName(CONFIG.TABS.COMPANY_SETTINGS);
  if (companySheet && companySheet.getLastRow() <= 1) {
    appendObjectToSheet(CONFIG.TABS.COMPANY_SETTINGS, {
      company_name: CONFIG.DEFAULT_OFFICE.COMPANY_NAME,
      theme_color: CONFIG.DEFAULT_OFFICE.THEME_COLOR,
      office_latitude: CONFIG.DEFAULT_OFFICE.LATITUDE,
      office_longitude: CONFIG.DEFAULT_OFFICE.LONGITUDE,
      geofence_radius_meters: CONFIG.DEFAULT_OFFICE.GEOFENCE_RADIUS_METERS,
      company_logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80"
    });
    logMessages.push("Seeded initial CompanySettings & Geofence bounds.");
  }

  // 4. Initialize Google Drive Folders
  try {
    getOrCreateDriveFolders();
    logMessages.push("Verified Google Drive media folders (GeoTrack_HRMS_Media -> Selfies, WorkProofs, Logos)");
  } catch (driveErr) {
    logMessages.push("Drive Folder Setup Warning: " + driveErr.toString());
  }

  logMessages.push("Database & Storage setup completed successfully!");
  Logger.log(logMessages.join("\n"));
  
  return {
    success: true,
    messages: logMessages
  };
}

/**
 * Creates/retrieves root and subfolders in Google Drive
 */
function getOrCreateDriveFolders() {
  var rootName = CONFIG.DRIVE.ROOT_FOLDER_NAME;
  var folders = DriveApp.getFoldersByName(rootName);
  var rootFolder;

  if (folders.hasNext()) {
    rootFolder = folders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootName);
    rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  var subfolderIds = {};
  for (var key in CONFIG.DRIVE.SUBFOLDERS) {
    var subName = CONFIG.DRIVE.SUBFOLDERS[key];
    var subFolders = rootFolder.getFoldersByName(subName);
    var subFolder;

    if (subFolders.hasNext()) {
      subFolder = subFolders.next();
    } else {
      subFolder = rootFolder.createFolder(subName);
      subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    subfolderIds[key] = subFolder.getId();
  }

  return {
    rootId: rootFolder.getId(),
    subfolderIds: subfolderIds
  };
}
