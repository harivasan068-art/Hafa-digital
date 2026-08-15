/**
 * HafA DIGITAL - Google Apps Script Sheet Maintenance & Archiver
 * 
 * Monthly automated task archiving attendance logs older than 60 days 
 * from 'Attendance' tab into 'Attendance_Archive' tab to keep master lookups fast.
 */

/**
 * Monthly Archiver Task: Moves rows older than 60 days to Attendance_Archive tab
 */
function archiveOldAttendanceRecords() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName(CONFIG.TABS.ATTENDANCE);
  if (!sourceSheet) return { success: false, message: "Attendance sheet tab not found." };

  var archiveSheet = ss.getSheetByName("Attendance_Archive");
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet("Attendance_Archive");
    // Copy headers from Attendance sheet
    var headers = sourceSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).getValues();
    archiveSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).setValues(headers);
    archiveSheet.getRange(1, 1, 1, sourceSheet.getLastColumn()).setFontWeight("bold").setBackground("#334155").setFontColor("#FFFFFF");
  }

  var data = sourceSheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, count: 0, message: "No attendance records to archive." };

  var headers = data[0];
  var dateColIdx = headers.indexOf("date");
  if (dateColIdx === -1) dateColIdx = headers.indexOf("timestamp");
  if (dateColIdx === -1) dateColIdx = 1; // Default fallback to column 2

  var thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 60);

  var rowsToMove = [];
  var rowIndicesToDelete = [];

  for (var i = 1; i < data.length; i++) {
    var rowDateVal = data[i][dateColIdx];
    var rowDate = rowDateVal ? new Date(rowDateVal) : null;

    if (rowDate && !isNaN(rowDate.getTime()) && rowDate < thresholdDate) {
      rowsToMove.push(data[i]);
      rowIndicesToDelete.push(i + 1); // 1-based row index in sheet
    }
  }

  if (rowsToMove.length === 0) {
    Logger.log("No attendance records older than 60 days found.");
    return { success: true, count: 0, message: "No records older than 60 days." };
  }

  // 1. Append rows to Attendance_Archive sheet
  archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, rowsToMove.length, rowsToMove[0].length).setValues(rowsToMove);

  // 2. Delete archived rows from source Attendance sheet (in reverse order)
  for (var k = rowIndicesToDelete.length - 1; k >= 0; k--) {
    sourceSheet.deleteRow(rowIndicesToDelete[k]);
  }

  Logger.log("Archived " + rowsToMove.length + " old attendance records to Attendance_Archive sheet.");
  return {
    success: true,
    count: rowsToMove.length,
    message: "Successfully archived " + rowsToMove.length + " records older than 60 days."
  };
}

/**
 * Creates a Monthly Time-Driven Trigger for archiveOldAttendanceRecords()
 * Runs automatically on the 1st of every month at 2:00 AM.
 */
function setupMonthlyArchiverTrigger() {
  // Clear existing archive triggers to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "archiveOldAttendanceRecords") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Create new monthly trigger
  ScriptApp.newTrigger("archiveOldAttendanceRecords")
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();

  Logger.log("Monthly Attendance Archiver trigger installed successfully.");
  return { success: true, message: "Monthly Archiver trigger created for 1st of every month at 2:00 AM." };
}
