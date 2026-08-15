/**
 * GeoTrack HRMS - Production Workflow & Employee Performance (GAS V8)
 * 
 * Manages the ProductionWorkflow sheet tab matching the Excel pipeline structure:
 * id | item_name | cameraman | shoot_date | editor | edit_date | delivery_date | upload_date | status | remarks
 */

/**
 * Ensures the ProductionWorkflow sheet tab exists with standard headers
 */
function ensureProductionWorkflowSheet() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.TABS.PRODUCTION_WORKFLOW || "ProductionWorkflow");
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TABS.PRODUCTION_WORKFLOW || "ProductionWorkflow");
    var headers = [
      "id", "item_name", "cameraman", "shoot_date", "editor", 
      "edit_date", "delivery_date", "upload_date", "status", "remarks", "created_at"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#F3F4F6");

    var initialTasks = [
      ["idx_prod_101", "Client Promo Reel - Hafa Digital", "basith", "2026-08-01", "aslam", "2026-08-03", "2026-08-04", "2026-08-05", "Delivered", "Client approved v2 edit", new Date().toISOString()],
      ["idx_prod_102", "Product Launch Teaser", "Harivasan", "2026-08-05", "basith", "2026-08-07", "2026-08-08", "2026-08-09", "Uploaded", "Uploaded to YouTube & Insta", new Date().toISOString()],
      ["idx_prod_103", "Corporate Office Tour Video", "aslam", "2026-08-10", "Harivasan", "2026-08-12", "2026-08-14", "", "Editing Completed", "Pending final upload date", new Date().toISOString()],
      ["idx_prod_104", "HR Training Video Series #2", "basith", "2026-08-13", "aslam", "", "", "", "In Progress", "B-roll shoot done", new Date().toISOString()],
      ["idx_prod_105", "Customer Testimonial - Tech Corp", "Harivasan", "", "Harivasan", "", "", "", "Pending", "Awaiting client schedule confirmation", new Date().toISOString()]
    ];

    for (var i = 0; i < initialTasks.length; i++) {
      sheet.appendRow(initialTasks[i]);
    }
  }

  return sheet;
}

/**
 * Fetches all production workflow tasks (Alias handleGetProductionTasks)
 */
function handleGetProductionTasks(params) {
  return getProductionTasks(params);
}

function getProductionTasks(params) {
  ensureProductionWorkflowSheet();
  var tasks = sheetToObjects(CONFIG.TABS.PRODUCTION_WORKFLOW || "ProductionWorkflow");

  return {
    success: true,
    count: tasks.length,
    tasks: tasks
  };
}

/**
 * Saves (adds or updates) a production workflow item (Alias handleSaveProductionTask)
 */
function handleSaveProductionTask(data) {
  return saveProductionTask(data);
}

function saveProductionTask(data) {
  ensureProductionWorkflowSheet();
  var tabName = CONFIG.TABS.PRODUCTION_WORKFLOW || "ProductionWorkflow";

  if (!data.item_name) {
    return { success: false, message: "Item/Project Name is required." };
  }

  var taskObj = {
    id: data.id || generateUUID(),
    item_name: data.item_name,
    cameraman: data.cameraman || "Unassigned",
    shoot_date: data.shoot_date || "",
    editor: data.editor || "Unassigned",
    edit_date: data.edit_date || "",
    delivery_date: data.delivery_date || "",
    upload_date: data.upload_date || "",
    status: data.status || "Pending",
    remarks: data.remarks || "",
    updated_at: new Date().toISOString()
  };

  var existing = null;
  if (data.id) {
    existing = updateObjectInSheet(tabName, "id", data.id, taskObj);
  }

  if (!existing) {
    taskObj.created_at = new Date().toISOString();
    appendObjectToSheet(tabName, taskObj);
  }

  logAudit(data.user_email || "ADMIN", "SAVE_PRODUCTION_TASK", { id: taskObj.id, item: taskObj.item_name });

  return {
    success: true,
    message: data.id ? "Production task updated successfully." : "Production task created successfully.",
    task: taskObj
  };
}

/**
 * Aggregates employee performance summary and completion metrics
 */
function getEmployeePerformanceSummary(params) {
  ensureProductionWorkflowSheet();
  var tasks = sheetToObjects(CONFIG.TABS.PRODUCTION_WORKFLOW || "ProductionWorkflow");
  var employees = sheetToObjects(CONFIG.TABS.EMPLOYEES || "Employees");

  var perfMap = {};

  employees.forEach(function(emp) {
    var nameKey = (emp.full_name || emp.email || "Employee").toLowerCase().trim();
    perfMap[nameKey] = {
      employee_id: emp.employee_id || "",
      full_name: emp.full_name || "Employee",
      email: emp.email || "",
      role: emp.designation || emp.department || "Staff",
      shoots_assigned: 0,
      shoots_completed: 0,
      edits_assigned: 0,
      edits_completed: 0,
      total_completed: 0,
      pending_tasks: 0,
      turnaround_days_sum: 0,
      turnaround_count: 0
    };
  });

  tasks.forEach(function(task) {
    var statusLower = String(task.status || "").toLowerCase();
    var isCompleted = statusLower === "delivered" || statusLower === "uploaded" || statusLower === "completed";

    if (task.cameraman && task.cameraman !== "Unassigned") {
      var camKey = String(task.cameraman).toLowerCase().trim();
      if (!perfMap[camKey]) {
        perfMap[camKey] = {
          employee_id: "EMP-" + camKey,
          full_name: task.cameraman,
          email: camKey + "@hafa.com",
          role: "Cameraman",
          shoots_assigned: 0, shoots_completed: 0,
          edits_assigned: 0, edits_completed: 0,
          total_completed: 0, pending_tasks: 0,
          turnaround_days_sum: 0, turnaround_count: 0
        };
      }
      perfMap[camKey].shoots_assigned++;
      if (task.shoot_date || isCompleted) perfMap[camKey].shoots_completed++;
      if (isCompleted) perfMap[camKey].total_completed++;
      else perfMap[camKey].pending_tasks++;
    }

    if (task.editor && task.editor !== "Unassigned") {
      var edKey = String(task.editor).toLowerCase().trim();
      if (!perfMap[edKey]) {
        perfMap[edKey] = {
          employee_id: "EMP-" + edKey,
          full_name: task.editor,
          email: edKey + "@hafa.com",
          role: "Editor",
          shoots_assigned: 0, shoots_completed: 0,
          edits_assigned: 0, edits_completed: 0,
          total_completed: 0, pending_tasks: 0,
          turnaround_days_sum: 0, turnaround_count: 0
        };
      }
      perfMap[edKey].edits_assigned++;
      if (task.edit_date || isCompleted) perfMap[edKey].edits_completed++;
      if (isCompleted) perfMap[edKey].total_completed++;
      else perfMap[edKey].pending_tasks++;

      if (task.shoot_date && task.delivery_date) {
        var sDate = new Date(task.shoot_date);
        var dDate = new Date(task.delivery_date);
        var diffDays = Math.max(0, (dDate - sDate) / (1000 * 60 * 60 * 24));
        perfMap[edKey].turnaround_days_sum += diffDays;
        perfMap[edKey].turnaround_count++;
      }
    }
  });

  var summaryList = Object.keys(perfMap).map(function(k) {
    var item = perfMap[k];
    item.avg_turnaround_days = item.turnaround_count > 0 
      ? Math.round((item.turnaround_days_sum / item.turnaround_count) * 10) / 10 
      : 0;
    return item;
  });

  return {
    success: true,
    count: summaryList.length,
    summary: summaryList
  };
}

/**
 * Instantly updates task status in ProductionWorkflow sheet tab by taskId (Module 5)
 * 
 * @param {Object} data - Payload containing { taskId, status }
 * @return {Object} Response result
 */
function handleUpdateTaskStatus(data) {
  ensureProductionWorkflowSheet();
  var taskId = data.taskId || data.id || data.task_id;
  var newStatus = data.status;

  if (!taskId || !newStatus) {
    return { success: false, message: "Missing taskId or status parameter." };
  }

  var tabName = CONFIG.TABS.PRODUCTION_WORKFLOW || "ProductionWorkflow";
  var updated = updateObjectInSheet(tabName, "id", taskId, {
    status: newStatus,
    updated_at: new Date().toISOString()
  });

  if (!updated) {
    return { success: false, message: "Task ID '" + taskId + "' not found." };
  }

  logAudit(data.user_email || "ADMIN", "UPDATE_TASK_STATUS", { taskId: taskId, status: newStatus });

  return {
    success: true,
    message: "Task status updated to '" + newStatus + "' successfully.",
    task: updated
  };
}

