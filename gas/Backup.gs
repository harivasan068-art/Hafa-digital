/**
 * HafA DIGITAL - Google Apps Script Automated Database Backup Engine
 * 
 * Daily cron job duplicating master Google Spreadsheet database into 
 * a secure "HafA_DIGITAL_Backups" Google Drive folder with timestamped filenames.
 */

/**
 * Daily Backup Handler: Copies master spreadsheet to Google Drive Backups folder
 */
function backupSpreadsheetToDrive() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fileId = ss.getId();
    var file = DriveApp.getFileById(fileId);

    // Get or Create "HafA_DIGITAL_Backups" folder in Google Drive
    var folderName = "HafA_DIGITAL_Backups";
    var folderIterator = DriveApp.getFoldersByName(folderName);
    var backupFolder;

    if (folderIterator.hasNext()) {
      backupFolder = folderIterator.next();
    } else {
      backupFolder = DriveApp.createFolder(folderName);
    }

    // Generate timestamped filename (e.g. HafA_DIGITAL_Master_Backup_2026-08-16_01-30)
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");
    var backupName = "HafA_DIGITAL_Backup_" + timestamp;

    // Create duplicate copy in Backups folder
    var backupFile = file.makeCopy(backupName, backupFolder);

    Logger.log("Daily Backup Created: " + backupName + " (ID: " + backupFile.getId() + ")");
    return {
      success: true,
      message: "Daily backup created successfully.",
      backup_file_id: backupFile.getId(),
      backup_url: backupFile.getUrl(),
      timestamp: timestamp
    };
  } catch (error) {
    Logger.log("Backup Failure Exception: " + error.toString());
    return {
      success: false,
      error: error.message || error.toString()
    };
  }
}

/**
 * Creates a Daily Time-Driven Cron Trigger for backupSpreadsheetToDrive()
 * Runs automatically every day at 1:00 AM.
 */
function setupDailyBackupTrigger() {
  // Clear existing backup triggers to prevent duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "backupSpreadsheetToDrive") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Install daily trigger at 1:00 AM
  ScriptApp.newTrigger("backupSpreadsheetToDrive")
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();

  Logger.log("Daily Automated Backup trigger installed successfully.");
  return { success: true, message: "Daily Backup trigger created for 1:00 AM every day." };
}
