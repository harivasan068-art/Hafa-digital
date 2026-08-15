/**
 * GeoTrack HRMS - Google Drive Upload Manager (GAS V8)
 * 
 * Handles base64 image decoding, Google Drive subfolder routing,
 * sharing permission configuration, and direct CDN view URL generation.
 */

/**
 * Uploads a Base64 encoded image to Google Drive and returns a direct LH3 CDN view URL.
 * 
 * @param {string} base64Data Base64 encoded data string (with or without data:image prefix)
 * @param {string} folderType Subfolder key ('SELFIES', 'WORK_PROOFS', 'LOGOS')
 * @param {string} customFileName Optional custom file name
 * @return {string} Direct Google LH3 CDN View URL (https://lh3.googleusercontent.com/d/{fileId})
 */
function uploadBase64ToDrive(base64Data, folderType, customFileName) {
  if (!base64Data || base64Data.trim() === "") {
    return "";
  }

  try {
    // Determine MIME type and strip header
    var mimeType = MimeType.JPEG;
    var base64String = base64Data;

    if (base64Data.indexOf(";base64,") !== -1) {
      var parts = base64Data.split(";base64,");
      var header = parts[0];
      base64String = parts[1];

      if (header.indexOf("png") !== -1) {
        mimeType = MimeType.PNG;
      } else if (header.indexOf("jpeg") !== -1 || header.indexOf("jpg") !== -1) {
        mimeType = MimeType.JPEG;
      } else if (header.indexOf("webp") !== -1) {
        mimeType = MimeType.WEBP;
      }
    }

    var decodedBytes = Utilities.base64Decode(base64String);
    var extension = mimeType === MimeType.PNG ? ".png" : ".jpg";
    var fileName = (customFileName || ("geotrack_" + Date.now())) + extension;

    var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

    // Get Drive subfolder
    var folderStructure = getOrCreateDriveFolders();
    var folderId = folderStructure.subfolderIds[folderType] || folderStructure.rootId;
    var targetFolder = DriveApp.getFolderById(folderId);

    // Create file
    var driveFile = targetFolder.createFile(blob);
    
    // Set public view permissions immediately after creation for zero-friction image rendering
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = driveFile.getId();
    
    // Direct Google LH3 CDN view URL format
    var cdnUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    
    logAudit("SYSTEM", "DRIVE_UPLOAD_SUCCESS", { fileId: fileId, folder: folderType, url: cdnUrl });

    return cdnUrl;
  } catch (err) {
    Logger.log("Drive upload error: " + err.toString());
    logAudit("SYSTEM", "DRIVE_UPLOAD_FAILED", err.toString());
    throw new Error("Failed to upload image asset to Google Drive: " + err.toString());
  }
}

/**
 * Photo upload helper for attendance selfies and work proofs.
 * Sets public sharing permission and returns direct LH3 view URL.
 * 
 * @param {string} base64Data Base64 encoded image data
 * @param {string} folderType Drive folder key ('SELFIES', 'WORK_PROOFS')
 * @param {string} fileName Custom file name
 * @return {string} Direct Google LH3 view URL (https://lh3.googleusercontent.com/d/{fileId})
 */
function uploadAttendancePhoto(base64Data, folderType, fileName) {
  return uploadBase64ToDrive(base64Data, folderType, fileName);
}


