/**
 * GeoTrack HRMS - Authentication & Profile Management (GAS V8)
 * 
 * SHA-256 password hashing, user authentication against Employees sheet,
 * avatar photo upload to Google Drive, and profile updates.
 */

/**
 * Hashes a raw password string using SHA-256 via Google Apps Script Utilities
 * 
 * @param {string} rawPassword Plaintext password
 * @return {string} Hexadecimal SHA-256 string
 */
function hashPassword(rawPassword) {
  if (!rawPassword) return "";
  var rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, rawPassword, Utilities.Charset.UTF_8);
  var hexString = "";
  for (var i = 0; i < rawBytes.length; i++) {
    var byteVal = rawBytes[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    hexString += byteHex;
  }
  return hexString;
}

/**
 * Authenticates user credentials against Employees data tab
 * 
 * @param {string} email User email address
 * @param {string} rawPassword User password
 * @return {Object} Authentication response with user metadata & session token
 */
function loginUser(email, rawPassword) {
  if (!email || !rawPassword) {
    return { success: false, message: "Email and password are required." };
  }

  var normalizedEmail = String(email).trim().toLowerCase();
  var inputHash = hashPassword(rawPassword);

  var employees = sheetToObjects(CONFIG.TABS.EMPLOYEES);
  var foundUser = null;

  for (var i = 0; i < employees.length; i++) {
    var emp = employees[i];
    if (String(emp.email).toLowerCase() === normalizedEmail) {
      foundUser = emp;
      break;
    }
  }

  if (!foundUser) {
    logAudit(normalizedEmail, "LOGIN_FAILED", "User email not found");
    return { success: false, message: "Invalid email or password." };
  }

  if (foundUser.status && String(foundUser.status).toUpperCase() === "INACTIVE") {
    logAudit(normalizedEmail, "LOGIN_BLOCKED", "Inactive account login attempt");
    return { success: false, message: "Account is inactive. Please contact HR admin." };
  }

  if (foundUser.password_hash && foundUser.password_hash !== inputHash) {
    logAudit(normalizedEmail, "LOGIN_FAILED", "Invalid password");
    return { success: false, message: "Invalid email or password." };
  }

  var payload = {
    user_id: foundUser.id,
    employee_id: foundUser.employee_id,
    email: foundUser.email,
    role: foundUser.role || CONFIG.ROLES.EMPLOYEE,
    full_name: foundUser.full_name,
    exp: Date.now() + (24 * 60 * 60 * 1000)
  };

  var token = Utilities.base64Encode(JSON.stringify(payload));
  logAudit(foundUser.email, "LOGIN_SUCCESS", { role: foundUser.role });

  delete foundUser.password_hash;

  return {
    success: true,
    message: "Login successful",
    token: token,
    user: foundUser
  };
}

/**
 * Handles avatar photo upload to Google Drive and updates photo URL in Employees tab
 * 
 * @param {Object} data - Payload containing employee_id or id and photo_base64
 * @return {Object} Result object with photo_url
 */
function handleUpdateProfilePhoto(data) {
  var idVal = data.employee_id || data.id;
  if (!idVal || !data.photo_base64) {
    return { success: false, message: "Employee identifier and photo_base64 are required." };
  }

  var photoUrl = "";
  try {
    // Save to Google Drive subfolder
    photoUrl = uploadBase64ToDrive(data.photo_base64, "SELFIES", "profile_" + idVal + "_" + Date.now());
  } catch (driveErr) {
    Logger.log("Error uploading profile photo to Drive: " + driveErr.toString());
    // Use direct Base64 if Drive fails
    photoUrl = data.photo_base64;
  }

  var idKey = data.id ? "id" : "employee_id";
  var updated = updateObjectInSheet(CONFIG.TABS.EMPLOYEES, idKey, idVal, { photo: photoUrl });

  logAudit(data.user_email || idVal, "UPDATE_PROFILE_PHOTO", { id: idVal, photo_url: photoUrl });

  return {
    success: true,
    message: "Profile photo updated successfully.",
    photo_url: photoUrl,
    employee: updated
  };
}

/**
 * Handles user profile info updates in the Employees tab
 * 
 * @param {Object} data - Payload containing updated profile fields
 * @return {Object} Result object with updated employee data
 */
function handleUpdateProfile(data) {
  var idVal = data.id || data.employee_id;
  var idKey = data.id ? "id" : "employee_id";

  if (!idVal) {
    return { success: false, message: "Employee ID is required for profile update." };
  }

  var updateFields = {};
  if (data.full_name) updateFields.full_name = data.full_name;
  if (data.phone) updateFields.phone = data.phone;
  if (data.department) updateFields.department = data.department;
  if (data.designation) updateFields.designation = data.designation;
  if (data.joining_date) updateFields.joining_date = data.joining_date;

  if (data.password) {
    updateFields.password_hash = hashPassword(data.password);
  }

  if (data.photo_base64) {
    try {
      updateFields.photo = uploadBase64ToDrive(data.photo_base64, "SELFIES", "profile_" + idVal);
    } catch (e) {}
  }

  var updated = updateObjectInSheet(CONFIG.TABS.EMPLOYEES, idKey, idVal, updateFields);

  if (!updated) {
    return { success: false, message: "Employee record not found." };
  }

  logAudit(data.user_email || idVal, "UPDATE_PROFILE", { id: idVal });

  var sanitized = Object.assign({}, updated);
  delete sanitized.password_hash;

  return {
    success: true,
    message: "Profile details updated successfully.",
    employee: sanitized
  };
}

/**
 * Validates session token
 */
function decodeSessionToken(token) {
  if (!token) return null;
  try {
    var decodedStr = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    var payload = JSON.parse(decodedStr);
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}
