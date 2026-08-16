import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../services/api';

const AuthContext = createContext(null);

// 12-Hour Session Expiry (in milliseconds)
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const SESSION_EXPIRY_KEY = 'geotrack_session_expiry';

/**
 * Checks if saved session is unexpired
 */
const getValidSavedUser = () => {
  try {
    const savedUser = localStorage.getItem('geotrack_user');
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);

    if (!savedUser) return null;

    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10);
      if (Date.now() > expiry) {
        console.warn('[Session Security] Session expired after 12 hours. Clearing session.');
        localStorage.removeItem('geotrack_user');
        localStorage.removeItem('geotrack_token');
        localStorage.removeItem(SESSION_EXPIRY_KEY);
        return null;
      }
    }
    const parsed = JSON.parse(savedUser);
    const savedAvatar = localStorage.getItem('hafa_admin_avatar');
    if (savedAvatar) {
      parsed.photo = savedAvatar;
    } else if (!parsed.photo || parsed.photo.includes('unsplash')) {
      parsed.photo = '/logo.png';
    }
    return parsed;
  } catch (err) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getValidSavedUser);

  const [token, setToken] = useState(() => {
    return localStorage.getItem('geotrack_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Periodic Stale Session Purge Check (Every 5 Minutes)
  useEffect(() => {
    const sessionChecker = setInterval(() => {
      const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
      if (user && expiryStr) {
        const expiry = parseInt(expiryStr, 10);
        if (Date.now() > expiry) {
          console.warn('[Session Security] Active session timed out (12h TTL limit). Logging out.');
          logout();
        }
      }
    }, 300000);

    return () => clearInterval(sessionChecker);
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    try {
      let userObj = null;

      // 1. Direct Admin Credential Validation (hafadigital75@gmail.com / Aaliya2009)
      if (cleanEmail === 'hafadigital75@gmail.com' && cleanPassword === 'Aaliya2009') {
        const savedAvatar = localStorage.getItem('hafa_admin_avatar');
        userObj = {
          id: 'emp_admin_001',
          employee_id: 'EMP-2026-001',
          full_name: 'HafA Digital Admin',
          email: 'hafadigital75@gmail.com',
          phone: '+91 7338747220',
          role: 'ADMIN',
          department: 'Executive Management',
          designation: 'Chief HR Officer',
          status: 'ACTIVE',
          photo: savedAvatar || '/logo.png'
        };
      }
      // 2. Direct Employee Credential Validation (harivasan@geotrack.com / demo1234 or Employee@123)
      else if (
        cleanEmail === 'harivasan@geotrack.com' && 
        (cleanPassword === 'demo1234' || cleanPassword === 'Employee@123')
      ) {
        const savedAvatar = localStorage.getItem('hafa_admin_avatar');
        userObj = {
          id: 'emp_hari_836',
          employee_id: 'EMP836121',
          full_name: 'Harivasan V',
          email: 'harivasan@geotrack.com',
          phone: '+91 98765 43210',
          role: 'EMPLOYEE',
          department: 'Field Operations',
          designation: 'Senior Field Technician',
          status: 'ACTIVE',
          photo: savedAvatar || '/logo.png'
        };
      }
      // 3. Fallback / Live Backend API Call for other registered accounts
      else {
        const res = await apiCall('login', { email: cleanEmail, password: cleanPassword });
        if (res.success && res.user) {
          const savedAvatar = localStorage.getItem('hafa_admin_avatar');
          userObj = {
            ...res.user,
            photo: savedAvatar || (res.user.photo && !res.user.photo.includes('unsplash') ? res.user.photo : '/logo.png')
          };
        } else {
          const errMsg = res.message || 'Invalid email or password.';
          setError(errMsg);
          return { success: false, message: errMsg };
        }
      }

      // Persist session to localStorage upon successful authentication
      const expiryTime = Date.now() + SESSION_TTL_MS;
      setUser(userObj);
      setToken('token_' + Date.now());

      localStorage.setItem('geotrack_user', JSON.stringify(userObj));
      localStorage.setItem('geotrack_token', 'token_' + Date.now());
      localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());

      return { success: true, user: userObj };
    } catch (err) {
      const msg = err.message || 'Authentication failed. Please check credentials.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (regData) => {
    setLoading(true);
    setError(null);
    try {
      const nextEmpId = regData.employee_id || `EMP2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        action: 'createEmployee',
        full_name: regData.full_name,
        email: regData.email,
        phone: regData.phone || '',
        department: regData.department || 'Field Operations',
        password: regData.password,
        employee_id: nextEmpId,
        role: 'EMPLOYEE',
        status: 'ACTIVE'
      };

      const res = await apiCall('createEmployee', payload);
      if (res.success) {
        return { success: true, message: `Account registered successfully! Employee ID: ${nextEmpId}` };
      } else {
        return { success: false, message: res.message || 'Registration failed.' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Registration error.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('geotrack_user');
    localStorage.removeItem('geotrack_token');
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  };

  const updateUser = (updatedFields) => {
    if (updatedFields.photo) {
      localStorage.setItem('hafa_admin_avatar', updatedFields.photo);
    }
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('geotrack_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
