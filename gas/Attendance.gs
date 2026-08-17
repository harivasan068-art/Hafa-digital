/**
 * GeoTrack HRMS - Attendance & Field Site Dispatcher Logic (GAS V8)
 * 
 * Handles geofence boundary validation using the Haversine distance algorithm,
 * live selfie & site work proof image uploads to Google Drive subfolders,
 * field site location submissions, and background real-time GPS tracking.
 */

/**
 * Ensures Row 1 headers in the "Attendance" sheet tab match the exact required column schema:
 * [
 *   "id", "employee_id", "check_in", "check_out", 
 *   "shop_name", "product_model", "camera_man", "editor", 
 *   "location_name", "address", "photo_url", "status", 
 *   "is_inside_geofence", "remarks", "approved_by", "date"
 * ]
 * 
 * Removes legacy 'latitude' and 'longitude' standalone columns.
 * 
 * @return {Sheet} The initialized Attendance sheet
 */
function ensureAttendanceSheetHeaders() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.ATTENDANCE);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TABS.ATTENDANCE);
  }

  var expectedHeaders = [
    "id",
    "employee_id",
    "check_in",
    "check_out",
    "shop_name",
    "product_model",
    "camera_man",
    "editor",
    "location_name",
    "address",
    "photo_url",
    "status",
    "is_inside_geofence",
    "remarks",
    "approved_by",
    "date"
  ];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight("bold").setBackground("#EEF2FF");
    sheet.setFrozenRows(1);
    return sheet;
  }

  var currentHeaders = sheet.getRange(1, 1, 1, Math.max(lastCol, expectedHeaders.length)).getValues()[0];
  var matches = true;

  if (currentHeaders.length < expectedHeaders.length) {
    matches = false;
  } else {
    for (var i = 0; i < expectedHeaders.length; i++) {
      if (String(currentHeaders[i]).trim() !== expectedHeaders[i]) {
        matches = false;
        break;
      }
    }
  }

  if (!matches) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight("bold").setBackground("#EEF2FF");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Handles employee field site check-in / location & proof submission
 * 
 * @param {Object} data Site submission payload { employee_id, latitude, longitude, photo_base64, selfie_image, proof_base64, proof_image, proof_photo, shop_name, product_model, camera_man, editor, remarks, location_name, address }
 * @return {Object} Response object with status, distance, and created record
 */
function handleClockIn(data) {
  if (!data || !data.employee_id) {
    return { success: false, message: "Missing employee ID." };
  }

  // Ensure Attendance sheet headers match the new 16-column schema
  ensureAttendanceSheetHeaders();

  var empId = String(data.employee_id);
  var userLat = parseFloat(data.latitude);
  var userLng = parseFloat(data.longitude);

  // Retrieve company office geofence settings
  var settingsList = sheetToObjects(CONFIG.TABS.COMPANY_SETTINGS);
  var companySettings = settingsList.length > 0 ? settingsList[0] : CONFIG.DEFAULT_OFFICE;

  var officeLat = parseFloat(companySettings.office_latitude || CONFIG.DEFAULT_OFFICE.LATITUDE);
  var officeLng = parseFloat(companySettings.office_longitude || CONFIG.DEFAULT_OFFICE.LONGITUDE);
  var geofenceRadius = parseFloat(companySettings.geofence_radius_meters || CONFIG.DEFAULT_OFFICE.GEOFENCE_RADIUS_METERS);

  // Compute Haversine distance in meters if GPS coordinates provided
  var distanceMeters = Infinity;
  var isInsideGeofence = false;
  if (!isNaN(userLat) && !isNaN(userLng)) {
    distanceMeters = calculateDistanceMeters(userLat, userLng, officeLat, officeLng);
    isInsideGeofence = distanceMeters <= geofenceRadius;
  }

  // Determine status: "Present" if within geofence, "Pending" if outside for admin review
  var attendanceStatus = isInsideGeofence ? CONFIG.ATTENDANCE_STATUS.PRESENT : CONFIG.ATTENDANCE_STATUS.PENDING;

  // 1. Upload selfie image to Drive (Selfies subfolder)
  var selfieData = data.photo_base64 || data.selfie_image || "";
  var photoUrl = "";
  if (selfieData && selfieData.trim() !== "") {
    try {
      photoUrl = uploadAttendancePhoto(selfieData, "SELFIES", "selfie_" + empId + "_" + Date.now());
    } catch (photoErr) {
      Logger.log("Selfie upload failed: " + photoErr.toString());
    }
  } else if (data.photo_url) {
    photoUrl = data.photo_url;
  }

  // 2. Upload optional work proof image to Drive (WorkProofs subfolder)
  var proofData = data.proof_base64 || data.proof_image || data.proof_photo || "";
  var proofUrl = "";
  if (proofData && proofData.trim() !== "") {
    try {
      proofUrl = uploadAttendancePhoto(proofData, "WORK_PROOFS", "proof_" + empId + "_" + Date.now());
    } catch (proofErr) {
      Logger.log("Work proof upload failed: " + proofErr.toString());
    }
  } else if (data.proof_url) {
    proofUrl = data.proof_url;
  }

  var todayDateStr = new Date().toISOString().split("T")[0];
  var nowIso = new Date().toISOString();

  // Combine notes and proof info into remarks
  var notes = data.remarks || data.notes || (isInsideGeofence ? "Field Site Logged (Inside Geofence)" : "Field Site Logged (Outside Geofence)");
  if (proofUrl && !notes.includes(proofUrl)) {
    notes += " | Work Proof Attached: " + proofUrl;
  }

  var addressStr = data.address || (!isNaN(userLat) && !isNaN(userLng) ? ("Lat: " + userLat.toFixed(6) + ", Lng: " + userLng.toFixed(6)) : "");

  // Construct attendance record matching NEW schema (latitude/longitude removed as standalone columns)
  var newRecord = {
    id: generateUUID(),
    employee_id: empId,
    check_in: nowIso,
    check_out: "",
    shop_name: data.shop_name || data.client_name || "",
    product_model: data.product_model || data.shoot_item || "",
    camera_man: data.camera_man || data.cameraman || "",
    editor: data.editor || "",
    location_name: data.location_name || (isInsideGeofence ? "Main Office HQ" : "Field Site Location"),
    address: addressStr,
    photo_url: photoUrl,
    status: attendanceStatus,
    is_inside_geofence: isInsideGeofence ? "TRUE" : "FALSE",
    remarks: notes,
    approved_by: isInsideGeofence ? "SYSTEM_GEOFENCE" : "PENDING_APPROVAL",
    date: todayDateStr
  };

  appendObjectToSheet(CONFIG.TABS.ATTENDANCE, newRecord);

  // Also write to WorkProofs tab if proof image attached
  if (proofUrl || data.title) {
    try {
      appendObjectToSheet(CONFIG.TABS.WORK_PROOFS, {
        id: generateUUID(),
        employee_id: empId,
        date: todayDateStr,
        title: data.title || "Field Site Visit Log",
        description: notes,
        proof_url: proofUrl || photoUrl,
        status: "SUBMITTED",
        submitted_at: nowIso
      });
    } catch (e) {}
  }

  logAudit(empId, "FIELD_SITE_SUBMIT", {
    status: attendanceStatus,
    distance_meters: distanceMeters,
    photo_url: photoUrl,
    proof_url: proofUrl,
    shop_name: newRecord.shop_name,
    product_model: newRecord.product_model,
    camera_man: newRecord.camera_man,
    editor: newRecord.editor
  });

  return {
    success: true,
    message: "Field site location & image proof submitted successfully!",
    record: newRecord,
    proof_url: proofUrl,
    geofence_details: {
      distance_meters: distanceMeters,
      allowed_radius_meters: geofenceRadius,
      is_inside: isInsideGeofence
    }
  };
}

/**
 * Handles explicit Work Proof upload and links it to today's attendance record
 * 
 * @param {Object} data Work proof payload { employee_id, proof_image, proof_photo, proof_base64, shop_name, product_model, camera_man, editor, remarks, description, latitude, longitude }
 * @return {Object} Response formatted JSON payload with proof_url and updated record
 */
function handleSubmitWorkProof(data) {
  if (!data || !data.employee_id) {
    return { success: false, message: "Missing employee ID." };
  }

  ensureAttendanceSheetHeaders();

  var empId = String(data.employee_id);
  var proofData = data.proof_image || data.proof_photo || data.proof_base64 || "";
  var proofUrl = "";

  if (proofData && proofData.trim() !== "") {
    try {
      proofUrl = uploadBase64ToDrive(proofData, "WORK_PROOFS", "work_proof_" + empId + "_" + Date.now());
    } catch (e) {
      Logger.log("Work proof upload failed: " + e.toString());
    }
  } else if (data.proof_url) {
    proofUrl = data.proof_url;
  }

  var todayDateStr = new Date().toISOString().split("T")[0];
  var nowIso = new Date().toISOString();
  var remarksText = data.remarks || data.description || "Onsite work proof submitted";

  // Search active attendance record for today
  var attendanceRecords = sheetToObjects(CONFIG.TABS.ATTENDANCE);
  var activeRecord = null;

  for (var i = 0; i < attendanceRecords.length; i++) {
    var rec = attendanceRecords[i];
    if (String(rec.employee_id) === empId && (!rec.check_out || rec.check_out === "")) {
      activeRecord = rec;
      break;
    }
  }

  if (activeRecord) {
    var updatedRemarks = activeRecord.remarks ? (activeRecord.remarks + " | Work Proof: " + remarksText) : remarksText;
    updateObjectInSheet(CONFIG.TABS.ATTENDANCE, "id", activeRecord.id, {
      proof_url: proofUrl,
      shop_name: data.shop_name || activeRecord.shop_name || "",
      product_model: data.product_model || activeRecord.product_model || "",
      camera_man: data.camera_man || data.cameraman || activeRecord.camera_man || "",
      editor: data.editor || activeRecord.editor || "",
      remarks: updatedRemarks
    });
    activeRecord.proof_url = proofUrl;
    activeRecord.remarks = updatedRemarks;
  } else {
    // Append new attendance row if none active
    activeRecord = {
      id: generateUUID(),
      employee_id: empId,
      check_in: nowIso,
      check_out: "",
      shop_name: data.shop_name || data.client_name || "",
      product_model: data.product_model || data.shoot_item || "",
      camera_man: data.camera_man || data.cameraman || "",
      editor: data.editor || "",
      location_name: "Field Site Work Proof",
      address: data.address || "Lat: " + (data.latitude || 13.0853) + ", Lng: " + (data.longitude || 80.0179),
      photo_url: data.photo_url || "",
      status: CONFIG.ATTENDANCE_STATUS.PENDING,
      is_inside_geofence: "FALSE",
      remarks: remarksText,
      approved_by: "PENDING_APPROVAL",
      date: todayDateStr
    };
    appendObjectToSheet(CONFIG.TABS.ATTENDANCE, activeRecord);
  }

  // Also write to WorkProofs tab
  try {
    appendObjectToSheet(CONFIG.TABS.WORK_PROOFS, {
      id: generateUUID(),
      employee_id: empId,
      date: todayDateStr,
      title: data.title || "Onsite Work Proof",
      description: remarksText,
      proof_url: proofUrl,
      status: "SUBMITTED",
      submitted_at: nowIso
    });
  } catch (err) {}

  logAudit(empId, "SUBMIT_WORK_PROOF", { proof_url: proofUrl });

  return {
    success: true,
    message: "Work proof uploaded successfully!",
    proof_url: proofUrl,
    record: activeRecord
  };
}

/**
 * Handles continuous real-time GPS location updates during traveling shifts
 */
function handleUpdateLocation(data) {
  if (!data || !data.employee_id) {
    return { success: false, message: "Missing employee ID." };
  }

  var empId = String(data.employee_id);
  var userLat = parseFloat(data.latitude);
  var userLng = parseFloat(data.longitude);

  if (isNaN(userLat) || isNaN(userLng)) {
    return { success: false, message: "Invalid or missing GPS location coordinates." };
  }

  var attendanceRecords = sheetToObjects(CONFIG.TABS.ATTENDANCE);
  var activeRecord = null;

  for (var i = 0; i < attendanceRecords.length; i++) {
    var rec = attendanceRecords[i];
    if (String(rec.employee_id) === empId && (!rec.check_out || rec.check_out === "")) {
      activeRecord = rec;
      break;
    }
  }

  var settingsList = sheetToObjects(CONFIG.TABS.COMPANY_SETTINGS);
  var companySettings = settingsList.length > 0 ? settingsList[0] : CONFIG.DEFAULT_OFFICE;

  var officeLat = parseFloat(companySettings.office_latitude || CONFIG.DEFAULT_OFFICE.LATITUDE);
  var officeLng = parseFloat(companySettings.office_longitude || CONFIG.DEFAULT_OFFICE.LONGITUDE);
  var geofenceRadius = parseFloat(companySettings.geofence_radius_meters || CONFIG.DEFAULT_OFFICE.GEOFENCE_RADIUS_METERS);

  var distanceMeters = calculateDistanceMeters(userLat, userLng, officeLat, officeLng);
  var isInsideGeofence = distanceMeters <= geofenceRadius;

  var nowTimeString = new Date().toLocaleTimeString();
  var locationNote = "GPS ping at " + nowTimeString + ": " + userLat.toFixed(6) + ", " + userLng.toFixed(6) + " (" + Math.round(distanceMeters) + "m from HQ)";

  if (activeRecord) {
    var updatedRemarks = activeRecord.remarks ? (activeRecord.remarks + " | " + locationNote) : locationNote;
    var updateData = {
      address: "Lat: " + userLat.toFixed(6) + ", Lng: " + userLng.toFixed(6),
      is_inside_geofence: isInsideGeofence ? "TRUE" : "FALSE",
      remarks: updatedRemarks
    };
    updateObjectInSheet(CONFIG.TABS.ATTENDANCE, "id", activeRecord.id, updateData);
  }

  return {
    success: true,
    message: "GPS location updated successfully.",
    geofence_details: {
      distance_meters: distanceMeters,
      allowed_radius_meters: geofenceRadius,
      is_inside: isInsideGeofence
    }
  };
}

/**
 * Handles employee clock-out request
 */
function handleClockOut(data) {
  if (!data || !data.employee_id) {
    return { success: false, message: "Missing employee ID." };
  }

  var empId = String(data.employee_id);
  var attendanceRecords = sheetToObjects(CONFIG.TABS.ATTENDANCE);
  var activeRecord = null;

  for (var i = 0; i < attendanceRecords.length; i++) {
    var rec = attendanceRecords[i];
    if (String(rec.employee_id) === empId && (!rec.check_out || rec.check_out === "")) {
      activeRecord = rec;
      break;
    }
  }

  if (!activeRecord) {
    return { success: false, message: "No active check-in record found for clock-out." };
  }

  var nowIso = new Date().toISOString();
  var updateData = {
    check_out: nowIso,
    remarks: activeRecord.remarks + (data.remarks ? (" | Shift End: " + data.remarks) : "")
  };

  updateObjectInSheet(CONFIG.TABS.ATTENDANCE, "id", activeRecord.id, updateData);
  activeRecord.check_out = nowIso;

  logAudit(empId, "CLOCK_OUT", { record_id: activeRecord.id });

  return {
    success: true,
    message: "Shift clock-out recorded.",
    record: activeRecord
  };
}

/**
 * Fetches attendance records with optional filtering
 */
function getAttendanceRecords(filters) {
  ensureAttendanceSheetHeaders();

  filters = filters || {};
  var records = sheetToObjects(CONFIG.TABS.ATTENDANCE);
  var employees = sheetToObjects(CONFIG.TABS.EMPLOYEES);

  var empMap = {};
  for (var e = 0; e < employees.length; e++) {
    empMap[employees[e].employee_id] = employees[e];
  }

  var filtered = records.map(function(rec) {
    var emp = empMap[rec.employee_id] || {};
    
    // Extract proof_url if stored in remarks
    var proofUrl = rec.proof_url || rec.proof_photo || "";
    if (!proofUrl && rec.remarks && rec.remarks.indexOf("Work Proof Attached:") !== -1) {
      var parts = rec.remarks.split("Work Proof Attached:");
      if (parts[1]) proofUrl = parts[1].trim();
    }

    return {
      id: rec.id,
      employee_id: rec.employee_id,
      employee_name: emp.full_name || rec.employee_id,
      employee_email: emp.email || "",
      department: emp.department || "N/A",
      check_in: rec.check_in,
      check_out: rec.check_out,
      shop_name: rec.shop_name || "",
      product_model: rec.product_model || "",
      camera_man: rec.camera_man || rec.cameraman || "",
      editor: rec.editor || "",
      location_name: rec.location_name || "",
      address: rec.address || "",
      photo_url: rec.photo_url || "",
      proof_url: proofUrl,
      status: rec.status || "",
      is_inside_geofence: String(rec.is_inside_geofence).toUpperCase() === "TRUE",
      remarks: rec.remarks || "",
      approved_by: rec.approved_by || "",
      date: rec.date || ""
    };
  });

  if (filters.employee_id) {
    filtered = filtered.filter(function(r) { return String(r.employee_id) === String(filters.employee_id); });
  }

  if (filters.status) {
    filtered = filtered.filter(function(r) { return String(r.status).toLowerCase() === String(filters.status).toLowerCase(); });
  }

  if (filters.date) {
    filtered = filtered.filter(function(r) { return String(r.date) === String(filters.date); });
  }

  filtered.sort(function(a, b) {
    return new Date(b.check_in || 0) - new Date(a.check_in || 0);
  });

  return {
    success: true,
    count: filtered.length,
    records: filtered
  };
}

/**
 * Updates attendance record status (HR Admin Approval / Rejection)
 */
function verifyAttendanceRecord(recordId, status, approverEmail) {
  if (!recordId || !status) {
    return { success: false, message: "Record ID and status are required." };
  }

  var updated = updateObjectInSheet(CONFIG.TABS.ATTENDANCE, "id", recordId, {
    status: status,
    approved_by: approverEmail || "HR_ADMIN"
  });

  if (!updated) {
    return { success: false, message: "Attendance record not found." };
  }

  logAudit(approverEmail || "HR_ADMIN", "VERIFY_ATTENDANCE", { recordId: recordId, newStatus: status });

  return {
    success: true,
    message: "Attendance status updated to " + status + "."
  };
}

/**
 * Batch sync endpoint to process multiple queued offline submissions in a single execution
 * 
 * @param {Object} data - Payload containing { records } array or array of payloads
 * @return {Object} Response object with array of processed results
 */
function handleBatchAttendanceSync(data) {
  var recordsArray = data.records || data.items || data;
  if (!Array.isArray(recordsArray)) {
    if (recordsArray && typeof recordsArray === 'object') {
      recordsArray = [recordsArray];
    } else {
      return { success: false, message: "Invalid batch records payload." };
    }
  }

  var results = [];
  var successCount = 0;

  for (var i = 0; i < recordsArray.length; i++) {
    var itemPayload = recordsArray[i];
    try {
      var action = itemPayload.action || "clockIn";
      var itemData = itemPayload.data || itemPayload;
      var res;

      if (action === "clockIn") {
        res = handleClockIn(itemData);
      } else if (action === "submitWorkProof") {
        res = handleSubmitWorkProof(itemData);
      } else {
        res = handleClockIn(itemData);
      }

      if (res && (res.success || res.status === "success" || !res.error)) {
        successCount++;
      }
      results.push({ item_id: itemPayload.id || ("item_" + i), result: res });
    } catch (err) {
      results.push({ item_id: itemPayload.id || ("item_" + i), error: err.toString() });
    }
  }

  return {
    success: true,
    message: "Batch sync complete. Processed " + successCount + " of " + recordsArray.length + " items.",
    synced_count: successCount,
    results: results
  };
}
