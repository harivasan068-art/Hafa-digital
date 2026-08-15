import React, { useState, useEffect } from 'react';
import { apiCall, getGasUrl, setGasUrl } from '../services/api';
import { Settings, MapPin, Server, Save, CheckCircle2, Shield, HelpCircle, Code2 } from 'lucide-react';

export const SettingsView = () => {
  const [settings, setSettings] = useState({
    company_name: 'GeoTrack Innovations Corp',
    office_latitude: 12.971598,
    office_longitude: 77.594566,
    geofence_radius_meters: 200,
    theme_color: '#4F46E5',
    company_logo: ''
  });

  const [gasUrlInput, setGasUrlInput] = useState(() => getGasUrl());
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const res = await apiCall('getSettings');
    if (res.success && res.settings) {
      setSettings({
        company_name: res.settings.company_name || 'GeoTrack Innovations Corp',
        office_latitude: res.settings.office_latitude || 12.971598,
        office_longitude: res.settings.office_longitude || 77.594566,
        geofence_radius_meters: res.settings.geofence_radius_meters || 200,
        theme_color: res.settings.theme_color || '#4F46E5',
        company_logo: res.settings.company_logo || ''
      });
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    // Save GAS URL to local storage
    setGasUrl(gasUrlInput);

    // Update settings in database/mock engine
    const res = await apiCall('updateSettings', settings);

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'System parameters and Geofence settings saved successfully!' });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to save settings.' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-xl">
        <div className="flex items-center space-x-2 text-brand-400 font-semibold text-xs tracking-wider uppercase">
          <Settings className="w-4 h-4" />
          <span>System Administration</span>
        </div>
        <h2 className="text-2xl font-bold text-white mt-1">Geofence & Google Workspace Config</h2>
        <p className="text-xs text-slate-400">
          Configure office location coordinates, geofence boundary radius, and backend Google Apps Script Web App endpoints.
        </p>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs border font-medium flex items-center space-x-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Geofence Boundary Parameters */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-xl space-y-4">
          <h3 className="font-semibold text-white text-base flex items-center space-x-2 border-b border-slate-800 pb-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <span>Office Headquarters Location & Radius</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Office Latitude (Degrees)</label>
              <input
                type="number"
                step="any"
                required
                value={settings.office_latitude}
                onChange={(e) => setSettings({ ...settings, office_latitude: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">e.g. 12.971598 (Bangalore Tech Hub)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Office Longitude (Degrees)</label>
              <input
                type="number"
                step="any"
                required
                value={settings.office_longitude}
                onChange={(e) => setSettings({ ...settings, office_longitude: parseFloat(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">e.g. 77.594566</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Allowed Geofence Radius (Meters)</label>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                min="50"
                max="5000"
                required
                value={settings.geofence_radius_meters}
                onChange={(e) => setSettings({ ...settings, geofence_radius_meters: parseInt(e.target.value) })}
                className="w-full max-w-xs px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
              <span className="text-xs text-slate-400">
                Current Radius: <strong className="text-white">{settings.geofence_radius_meters} meters</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Employees checking in within this distance are automatically verified as <strong className="text-emerald-400">Present</strong> via Haversine calculation.
            </p>
          </div>
        </div>

        {/* Google Apps Script Endpoint Config */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-700/80 shadow-xl space-y-4">
          <h3 className="font-semibold text-white text-base flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Server className="w-5 h-5 text-brand-400" />
            <span>Deployed Backend Web App URL</span>
          </h3>

          <div className="text-xs space-y-2">
            <label className="block font-semibold text-slate-300">Google Apps Script Executable URL</label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={gasUrlInput}
              onChange={(e) => setGasUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Copy from Google Apps Script Editor → Deploy → New Deployment → Web App (Execute as Me, Access: Anyone).
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 shadow-glow transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Parameters...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
