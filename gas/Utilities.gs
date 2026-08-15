/**
 * GeoTrack HRMS - Utility Functions & Sheet Micro-ORM (GAS V8)
 * 
 * Provides sheet micro-ORM abstractions, Haversine formula calculation for geofencing,
 * timestamp utilities, and unique ID generators.
 */

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine algorithm.
 * 
 * @param {number} lat1 Latitude of point 1 (degrees)
 * @param {number} lon1 Longitude of point 1 (degrees)
 * @param {number} lat2 Latitude of point 2 (degrees)
 * @param {number} lon2 Longitude of point 2 (degrees)
 * @return {number} Distance in meters
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Infinity;
  }
  
  var R = 6371000; // Earth's mean radius in meters
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var rLat1 = toRad(lat1);
  var rLat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Converts a Google Sheet tab into an array of JavaScript objects.
 * First row is treated as key header.
 * 
 * @param {string} tabName Name of the sheet tab
 * @return {Array<Object>} Array of record objects
 */
function sheetToObjects(tabName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only header or empty

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    var isEmpty = true;

    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val !== "" && val !== null && val !== undefined) {
        isEmpty = false;
      }
      obj[headers[j]] = val;
    }

    if (!isEmpty) {
      result.push(obj);
    }
  }

  return result;
}

/**
 * Appends a new object as a row to the specified sheet tab.
 * 
 * @param {string} tabName Name of the target sheet tab
 * @param {Object} record Object with keys corresponding to column headers
 * @return {Object} The inserted record with assigned ID and timestamp
 */
function appendObjectToSheet(tabName, record) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error("Sheet tab not found: " + tabName);

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });
  
  if (!record.id) {
    record.id = generateUUID();
  }
  if (!record.created_at) {
    record.created_at = new Date().toISOString();
  }

  var row = headers.map(function(header) {
    return record[header] !== undefined ? record[header] : "";
  });

  sheet.appendRow(row);
  return record;
}

/**
 * Updates a record in a sheet tab matching primary key field.
 * 
 * @param {string} tabName Name of sheet tab
 * @param {string} idKey Name of ID column (e.g. "id" or "employee_id")
 * @param {string|number} idValue Value to match
 * @param {Object} updateObj Key-value pairs to update
 * @return {Object|null} Updated object or null if not found
 */
function updateObjectInSheet(tabName, idKey, idValue, updateObj) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var idColIdx = headers.indexOf(idKey);
  if (idColIdx === -1) return null;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(idValue)) {
      for (var key in updateObj) {
        var colIdx = headers.indexOf(key);
        if (colIdx !== -1) {
          sheet.getRange(i + 1, colIdx + 1).setValue(updateObj[key]);
        }
      }
      return updateObj;
    }
  }

  return null;
}

/**
 * Deletes a row matching key and value.
 * 
 * @param {string} tabName Name of sheet tab
 * @param {string} idKey Column header name
 * @param {string|number} idValue Value to match
 * @return {boolean} Success status
 */
function deleteObjectInSheet(tabName, idKey, idValue) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var idColIdx = headers.indexOf(idKey);
  if (idColIdx === -1) return false;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(idValue)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }

  return false;
}

/**
 * Generates a unique UUID string v4
 */
function generateUUID() {
  return 'idx_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

/**
 * Helper to log events to AuditLogs sheet tab
 */
function logAudit(userEmail, action, details) {
  try {
    appendObjectToSheet(CONFIG.TABS.AUDIT_LOGS, {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      user_email: userEmail || "SYSTEM",
      action: action,
      details: typeof details === "object" ? JSON.stringify(details) : String(details),
      ip_address: "GAS_SERVER"
    });
  } catch (err) {
    Logger.log("Audit log failed: " + err.toString());
  }
}
