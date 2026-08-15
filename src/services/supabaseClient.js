/**
 * HafA DIGITAL - Optional Supabase / PostgreSQL Client Service
 * 
 * Drop-in cloud migration client matching the exact function signatures of `apiCall(action, data)`.
 * Switch from Google Apps Script backend to Supabase with zero UI component changes.
 */

import { calculateHaversine } from './api';

// Optional Supabase Credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks if Supabase client is configured in environment variables
 */
export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

/**
 * Low-level HTTP REST query handler for Supabase PostgREST API
 */
const supabaseFetch = async (endpoint, method = 'GET', body = null, headers = {}) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.');
  }

  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const defaultHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...headers
  };

  const options = {
    method: method,
    headers: defaultHeaders,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
};

/**
 * Universal Supabase Action Dispatcher matching `apiCall(action, data)`
 *
 * @param {string} action - Action name (e.g., 'clockIn', 'getEmployees', 'updateTaskStatus')
 * @param {object} data - Payload parameters
 * @returns {Promise<object>} Standardized result payload { success: true/false, ... }
 */
export const supabaseCall = async (action, data = {}) => {
  try {
    switch (action) {
      case 'ping':
        return {
          success: true,
          message: 'Supabase PostgreSQL Cloud Backend is operational!',
          timestamp: new Date().toISOString()
        };

      case 'login': {
        const rows = await supabaseFetch(`employees?email=eq.${encodeURIComponent(data.email)}&select=*`);
        if (!rows || rows.length === 0) {
          return { success: false, message: 'Invalid employee email or credentials.' };
        }
        const emp = rows[0];
        delete emp.password_hash;
        return {
          success: true,
          message: 'Authentication successful.',
          user: emp
        };
      }

      case 'getEmployees': {
        const rows = await supabaseFetch('employees?select=*&order=created_at.desc');
        const sanitized = rows.map(r => {
          const copy = { ...r };
          delete copy.password_hash;
          return copy;
        });
        return {
          success: true,
          count: sanitized.length,
          employees: sanitized
        };
      }

      case 'createEmployee': {
        const payload = {
          employee_id: data.employee_id || `EMP-${Date.now()}`,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || '',
          department: data.department || 'General',
          designation: data.designation || 'Employee',
          role: data.role || 'EMPLOYEE',
          photo_url: data.photo || data.photo_url || ''
        };
        const rows = await supabaseFetch('employees', 'POST', payload);
        return {
          success: true,
          message: 'Employee registered successfully in Supabase.',
          employee: rows[0]
        };
      }

      case 'updateEmployee':
      case 'updateProfile': {
        const idVal = data.id || data.employee_id;
        const payload = { ...data };
        delete payload.action;
        delete payload.id;

        const rows = await supabaseFetch(`employees?employee_id=eq.${encodeURIComponent(idVal)}`, 'PATCH', payload);
        return {
          success: true,
          message: 'Employee updated successfully.',
          employee: rows[0]
        };
      }

      case 'deleteEmployee': {
        const idVal = data.id || data.employee_id;
        await supabaseFetch(`employees?employee_id=eq.${encodeURIComponent(idVal)}`, 'DELETE');
        return {
          success: true,
          message: 'Employee record deleted.'
        };
      }

      case 'clockIn': {
        const officeLat = 13.0853;
        const officeLng = 80.0179;
        const radius = 200;
        const dist = calculateHaversine(data.latitude, data.longitude, officeLat, officeLng);
        const isInside = dist <= radius;

        const payload = {
          employee_id: data.employee_id,
          check_in: new Date().toISOString(),
          latitude: data.latitude,
          longitude: data.longitude,
          location_name: data.location_name || (isInside ? 'Main Office HQ' : 'Field Site Location'),
          address: data.address || `Lat: ${data.latitude}, Lng: ${data.longitude}`,
          photo_url: data.photo_base64 || data.photo_url || '',
          proof_url: data.proof_base64 || data.proof_url || '',
          status: isInside ? 'Present' : 'Pending',
          is_inside_geofence: isInside,
          remarks: data.remarks || 'Field Site Dispatch Logged',
          approved_by: isInside ? 'SYSTEM_GEOFENCE' : 'PENDING_APPROVAL'
        };

        const rows = await supabaseFetch('attendance', 'POST', payload);
        return {
          success: true,
          message: 'Field site location & proof logged to Supabase.',
          record: rows[0]
        };
      }

      case 'getAttendance': {
        let endpoint = 'attendance?select=*,employees(full_name,email,department)&order=check_in.desc';
        if (data.employee_id) {
          endpoint = `attendance?employee_id=eq.${encodeURIComponent(data.employee_id)}&select=*,employees(full_name,email,department)&order=check_in.desc`;
        }
        const rows = await supabaseFetch(endpoint);
        const formatted = rows.map(r => ({
          ...r,
          employee_name: r.employees?.full_name || r.employee_id,
          employee_email: r.employees?.email || '',
          department: r.employees?.department || 'Field Operations'
        }));
        return {
          success: true,
          count: formatted.length,
          records: formatted
        };
      }

      case 'updateAttendanceStatus':
      case 'verifyAttendance': {
        const targetId = data.id || data.record_id;
        const rows = await supabaseFetch(`attendance?id=eq.${encodeURIComponent(targetId)}`, 'PATCH', {
          status: data.status,
          approved_by: data.approved_by || 'HR_ADMIN'
        });
        return {
          success: true,
          message: `Attendance status updated to '${data.status}'.`,
          record: rows[0]
        };
      }

      case 'getProductionTasks': {
        const rows = await supabaseFetch('production_workflow?select=*&order=created_at.desc');
        return {
          success: true,
          count: rows.length,
          tasks: rows
        };
      }

      case 'saveProductionTask': {
        const taskId = data.id || `idx_prod_${Date.now()}`;
        const payload = {
          id: taskId,
          item_name: data.item_name,
          cameraman: data.cameraman || 'Unassigned',
          shoot_date: data.shoot_date || null,
          editor: data.editor || 'Unassigned',
          edit_date: data.edit_date || null,
          delivery_date: data.delivery_date || null,
          upload_date: data.upload_date || null,
          status: data.status || 'Pending',
          remarks: data.remarks || ''
        };

        const rows = await supabaseFetch('production_workflow', 'POST', payload, {
          'Prefer': 'resolution=merge-duplicates'
        });
        return {
          success: true,
          message: 'Production task saved.',
          task: rows[0]
        };
      }

      case 'updateTaskStatus': {
        const taskId = data.taskId || data.id;
        const rows = await supabaseFetch(`production_workflow?id=eq.${encodeURIComponent(taskId)}`, 'PATCH', {
          status: data.status
        });
        return {
          success: true,
          message: `Task status updated to '${data.status}'.`,
          task: rows[0]
        };
      }

      case 'batchAttendanceSync': {
        const records = Array.isArray(data.records) ? data.records : [data.records];
        const results = [];
        for (const item of records) {
          const res = await supabaseCall(item.action || 'clockIn', item.data || item);
          results.push(res);
        }
        return {
          success: true,
          message: `Synced ${results.length} items to Supabase.`,
          results: results
        };
      }

      case 'getSettings': {
        const rows = await supabaseFetch('company_settings?select=*&limit=1');
        return {
          success: true,
          settings: rows[0] || {
            company_name: 'HafA DIGITAL',
            office_latitude: 13.0853,
            office_longitude: 80.0179,
            geofence_radius_meters: 200
          }
        };
      }

      case 'updateCompanySettings':
      case 'updateSettings': {
        const rows = await supabaseFetch('company_settings', 'POST', data, {
          'Prefer': 'resolution=merge-duplicates'
        });
        return {
          success: true,
          message: 'Settings saved.',
          settings: rows[0]
        };
      }

      default:
        return {
          success: false,
          error: `Unsupported Supabase action: ${action}`
        };
    }
  } catch (err) {
    console.error(`[Supabase Error] '${action}' failed:`, err);
    return {
      success: false,
      message: err.message || 'Supabase request error',
      error: err.message
    };
  }
};
