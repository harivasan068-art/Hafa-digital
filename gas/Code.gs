/**
 * GeoTrack HRMS - Main Web App Endpoint Router (GAS V8)
 * 
 * Serverless backend serving REST-like JSON responses via `doGet(e)` and `doPost(e)`.
 * Dispatches request actions to modular handlers with CORS response headers.
 */

/**
 * Handles HTTP GET Requests
 */
function doGet(e) {
  return handleRequest(e, "GET");
}

/**
 * Handles HTTP POST Requests
 * Primary Web App entry point for POST requests from React web application.
 * Safely parses e.postData.contents sent with Content-Type 'text/plain;charset=utf-8'.
 */
function doPost(e) {
  return handleRequest(e, "POST");
}

/**
 * Central Request Handler & Action Dispatcher
 * Features LockService concurrency protection (10-second wait window) for atomic writes.
 */
function handleRequest(e, method) {
  var lock = LockService.getScriptLock();
  var response;

  try {
    // Acquire script lock with 10s wait window to eliminate concurrent write collisions
    lock.waitLock(10000);
  } catch (lockErr) {
    Logger.log("Lock acquisition timeout: " + lockErr.toString());
    return formatJsonResponse({
      success: false,
      error: "Server busy handling high volume traffic. Please retry in a few seconds."
    });
  }

  try {
    var params = e ? (e.parameter || {}) : {};
    var postData = {};

    // Parse JSON body if POST request with postData
    if (method === "POST" && e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        Logger.log("Warning parsing JSON postData: " + jsonErr.toString());
        // Fallback to parameter decoding if payload is x-www-form-urlencoded
        postData = params;
      }
    }

    // Merge parameters (POST body takes precedence over query params)
    var payload = Object.assign({}, params, postData);
    var action = payload.action || params.action || "ping";

    Logger.log("Incoming request: Method=" + method + ", Action=" + action);

    // Route actions
    switch (action) {
      case "ping":
        response = {
          success: true,
          message: "GeoTrack HRMS Web App API is running!",
          timestamp: new Date().toISOString(),
          version: "1.0.0"
        };
        break;

      case "setupDatabase":
        response = setupDatabaseAndDrive();
        break;

      case "login":
        response = loginUser(payload.email, payload.password);
        break;

      case "clockIn":
        response = handleClockIn(payload);
        break;

      case "updateLocation":
        response = handleUpdateLocation(payload);
        break;

      case "clockOut":
        response = handleClockOut(payload);
        break;

      case "getAttendance":
        response = getAttendanceRecords(payload);
        break;

      case "verifyAttendance":
        response = verifyAttendanceRecord(payload.record_id, payload.status, payload.approved_by);
        break;

      case "getEmployees":
        response = handleGetEmployees(payload);
        break;

      case "createEmployee":
        response = handleCreateEmployee(payload);
        break;

      case "updateProfilePhoto":
        response = handleUpdateProfilePhoto(payload);
        break;

      case "updateProfile":
      case "updateEmployee":
        response = handleUpdateProfile(payload);
        break;

      case "deleteEmployee":
        response = handleDeleteEmployee(payload);
        break;

      case "getSettings":
        response = handleGetSettings();
        break;

      case "updateCompanySettings":
      case "updateSettings":
        response = handleUpdateSettings(payload);
        break;

      case "submitWorkProof":
        response = handleSubmitWorkProof(payload);
        break;

      case "getWorkProofs":
        response = handleGetWorkProofs(payload);
        break;

      case "getProductionTasks":
        response = getProductionTasks(payload);
        break;

      case "saveProductionTask":
        response = saveProductionTask(payload);
        break;

      case "updateTaskStatus":
        response = handleUpdateTaskStatus(payload);
        break;

      case "batchAttendanceSync":
        response = handleBatchAttendanceSync(payload);
        break;

      case "updateAttendanceStatus":
        response = verifyAttendanceRecord(payload.id || payload.record_id, payload.status, payload.approved_by);
        break;

      case "getEmployeePerformanceSummary":
        response = getEmployeePerformanceSummary(payload);
        break;

      default:
        response = {
          success: false,
          error: "Unknown or missing action parameter: " + action
        };
        break;
    }

  } catch (error) {
    Logger.log("Critical Handler Exception: " + error.toString());
    response = {
      success: false,
      error: error.message || error.toString(),
      stack: error.stack || ""
    };
  } finally {
    // Always release lock to prevent deadlocks
    try {
      lock.releaseLock();
    } catch (relErr) {}
  }

  return formatJsonResponse(response);
}

/**
 * Wraps object payload in Google Apps Script ContentService JSON output
 */
function formatJsonResponse(payload) {
  var output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Employee Management Handlers
 */
function handleGetEmployees(params) {
  var employees = sheetToObjects(CONFIG.TABS.EMPLOYEES);
  // Strip password_hash for security
  var sanitized = employees.map(function(emp) {
    var copy = Object.assign({}, emp);
    delete copy.password_hash;
    return copy;
  });

  return {
    success: true,
    count: sanitized.length,
    employees: sanitized
  };
}

function handleCreateEmployee(data) {
  if (!data.full_name || !data.email) {
    return { success: false, message: "Name and Email are required." };
  }

  // Generate unique employee ID if not provided (EMP-2026-xxx)
  var employees = sheetToObjects(CONFIG.TABS.EMPLOYEES);
  var nextSeq = employees.length + 1;
  var empCode = data.employee_id || ("EMP-2026-" + ("000" + nextSeq).slice(-3));

  var defaultPasswordHash = hashPassword(data.password || "GeoTrack@123");

  var photoUrl = data.photo || "";
  if (data.photo_base64) {
    try {
      photoUrl = uploadBase64ToDrive(data.photo_base64, "SELFIES", "profile_" + empCode);
    } catch (e) {}
  }

  var newEmp = {
    id: generateUUID(),
    employee_id: empCode,
    full_name: data.full_name,
    email: data.email.trim().toLowerCase(),
    password_hash: defaultPasswordHash,
    phone: data.phone || "",
    department: data.department || "General",
    designation: data.designation || "Employee",
    role: data.role || CONFIG.ROLES.EMPLOYEE,
    status: data.status || "ACTIVE",
    photo: photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
    joining_date: data.joining_date || new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString()
  };

  appendObjectToSheet(CONFIG.TABS.EMPLOYEES, newEmp);

  var returnObj = Object.assign({}, newEmp);
  delete returnObj.password_hash;

  return {
    success: true,
    message: "Employee created successfully.",
    employee: returnObj
  };
}

function handleUpdateEmployee(data) {
  if (!data.id && !data.employee_id) {
    return { success: false, message: "Employee ID is required for update." };
  }

  var idKey = data.id ? "id" : "employee_id";
  var idVal = data.id || data.employee_id;

  var updateData = Object.assign({}, data);
  delete updateData.action;

  if (updateData.password) {
    updateData.password_hash = hashPassword(updateData.password);
    delete updateData.password;
  }

  if (updateData.photo_base64) {
    try {
      updateData.photo = uploadBase64ToDrive(updateData.photo_base64, "SELFIES", "profile_" + idVal);
      delete updateData.photo_base64;
    } catch (e) {}
  }

  var updated = updateObjectInSheet(CONFIG.TABS.EMPLOYEES, idKey, idVal, updateData);

  if (!updated) {
    return { success: false, message: "Employee record not found." };
  }

  return {
    success: true,
    message: "Employee details updated successfully.",
    employee: updated
  };
}

function handleDeleteEmployee(data) {
  var idVal = data.id || data.employee_id;
  var idKey = data.id ? "id" : "employee_id";

  if (!idVal) {
    return { success: false, message: "Employee identifier required." };
  }

  var deleted = deleteObjectInSheet(CONFIG.TABS.EMPLOYEES, idKey, idVal);

  return {
    success: deleted,
    message: deleted ? "Employee deleted successfully." : "Employee record not found."
  };
}

/**
 * Settings Handlers
 */
function handleGetSettings() {
  var settingsList = sheetToObjects(CONFIG.TABS.COMPANY_SETTINGS);
  var companySettings = settingsList.length > 0 ? settingsList[0] : CONFIG.DEFAULT_OFFICE;

  return {
    success: true,
    settings: companySettings
  };
}

function handleUpdateSettings(data) {
  var companySheet = getSpreadsheet().getSheetByName(CONFIG.TABS.COMPANY_SETTINGS);
  if (!companySheet) {
    setupDatabaseAndDrive();
    companySheet = getSpreadsheet().getSheetByName(CONFIG.TABS.COMPANY_SETTINGS);
  }

  var updateData = {
    company_name: data.company_name || CONFIG.DEFAULT_OFFICE.COMPANY_NAME,
    theme_color: data.theme_color || CONFIG.DEFAULT_OFFICE.THEME_COLOR,
    office_latitude: parseFloat(data.office_latitude || CONFIG.DEFAULT_OFFICE.LATITUDE),
    office_longitude: parseFloat(data.office_longitude || CONFIG.DEFAULT_OFFICE.LONGITUDE),
    geofence_radius_meters: parseFloat(data.geofence_radius_meters || CONFIG.DEFAULT_OFFICE.GEOFENCE_RADIUS_METERS),
    company_logo: data.company_logo || "",
    default_checkin_time: data.default_checkin_time || "09:00 AM",
    shift_rules: data.shift_rules || "9:00 AM - 6:00 PM (Mon-Fri)"
  };

  if (companySheet.getLastRow() <= 1) {
    appendObjectToSheet(CONFIG.TABS.COMPANY_SETTINGS, updateData);
  } else {
    // Update first settings row
    var headers = companySheet.getRange(1, 1, 1, companySheet.getLastColumn()).getValues()[0];
    for (var k in updateData) {
      var colIdx = headers.indexOf(k);
      if (colIdx !== -1) {
        companySheet.getRange(2, colIdx + 1).setValue(updateData[k]);
      }
    }
  }

  return {
    success: true,
    message: "Company and Geofence settings saved.",
    settings: updateData
  };
}

/**
 * Work Proof Handlers
 */
function handleSubmitWorkProof(data) {
  if (!data.employee_id || !data.title) {
    return { success: false, message: "Employee ID and Title are required." };
  }

  var proofUrl = data.proof_url || "";
  if (data.proof_base64) {
    try {
      proofUrl = uploadBase64ToDrive(data.proof_base64, "WORK_PROOFS", "proof_" + data.employee_id + "_" + Date.now());
    } catch (e) {}
  }

  var record = {
    id: generateUUID(),
    employee_id: data.employee_id,
    date: data.date || new Date().toISOString().split("T")[0],
    title: data.title,
    description: data.description || "",
    proof_url: proofUrl,
    status: "SUBMITTED",
    submitted_at: new Date().toISOString()
  };

  appendObjectToSheet(CONFIG.TABS.WORK_PROOFS, record);

  return {
    success: true,
    message: "Work proof submitted successfully.",
    proof: record
  };
}

function handleGetWorkProofs(data) {
  var proofs = sheetToObjects(CONFIG.TABS.WORK_PROOFS);
  if (data && data.employee_id) {
    proofs = proofs.filter(function(p) { return String(p.employee_id) === String(data.employee_id); });
  }

  return {
    success: true,
    count: proofs.length,
    proofs: proofs
  };
}
