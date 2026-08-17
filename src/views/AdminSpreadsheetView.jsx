import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/api';
import { 
  FileSpreadsheet, ExternalLink, RefreshCw, Database, Download, 
  FileText, Table, Search, MapPin, Eye, Filter, Calendar 
} from 'lucide-react';

const SPREADSHEET_ID = "1S9zlXs6piahSsaTbKEFui1AwKuEGPLEEcb83opRwGA8";
const EXCEL_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;
const PDF_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=pdf`;
const LIVE_SHEET_EDIT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
const PUBLISHED_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJieiTyHLD4AITlgJ9Tv8iKitcrHd1HKorFBIyha8Nro2CJDvIzT7KYmEvcu43wNjrNU03FAkEolYe/pubhtml";

export const AdminSpreadsheetView = () => {
  const [activeTab, setActiveTab] = useState('LEDGER'); // LEDGER | GOOGLE_SHEET
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [iframeKey, setIframeKey] = useState(Date.now());

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const res = await apiCall('getAttendance');
      let items = [];
      if (Array.isArray(res)) items = res;
      else if (res?.records && Array.isArray(res.records)) items = res.records;

      // Also pull production tasks if available
      try {
        const prodRes = await apiCall('getProductionTasks');
        if (prodRes?.tasks && Array.isArray(prodRes.tasks)) {
          const prodMapped = prodRes.tasks.map(t => ({
            id: t.id,
            shop_name: t.shop_name || t.client_name || 'HafA Client',
            product_model: t.product_model || t.shoot_item || t.item_name || 'Production Item',
            cameraman: t.cameraman || 'Basith',
            shoot_date: t.shoot_date || new Date().toISOString().split('T')[0],
            editor: t.editor || 'Basith',
            edit_date: t.edit_date || '',
            delivery_date: t.delivery_date || '',
            upload_date: t.upload_date || '',
            status: t.status || 'Shoot Done',
            proof_url: t.proof_url || t.photo_url || ''
          }));

          items = [...items, ...prodMapped];
        }
      } catch (prodErr) {
        console.warn("[Master Sheet] Production tasks fetch note:", prodErr);
      }

      setRecords(items);
    } catch (err) {
      console.error("[Master Sheet] Data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered dataset for table display & export
  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (r.shop_name || r.location_name || '').toLowerCase().includes(q) ||
      (r.product_model || r.remarks || '').toLowerCase().includes(q) ||
      (r.cameraman || r.employee_name || '').toLowerCase().includes(q) ||
      (r.editor || '').toLowerCase().includes(q)
    );
  });

  /**
   * Export Production CSV matching columns:
   * A: SHOP NAME | B: PRODUCT MODEL | C: CAMERA MAN | D: SHOOT DATE | E: EDITOR | F: EDIT DATE | G: DELIVERY DATE | H: UPLOAD DATE
   */
  const handleExportProductionCSV = () => {
    const dataset = filteredRecords.length > 0 ? filteredRecords : records;
    if (dataset.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "SHOP NAME",
      "PRODUCT MODEL",
      "CAMERA MAN",
      "SHOOT DATE",
      "EDITOR",
      "EDIT DATE",
      "DELIVERY DATE",
      "UPLOAD DATE"
    ];

    const rows = dataset.map(r => {
      const shop = r.shop_name || r.client_name || r.location_name || 'HafA Client';
      const model = r.product_model || r.shoot_item || r.remarks || 'Production Item';
      const cam = r.cameraman || r.employee_name || 'Basith';
      const shootDt = r.shoot_date || r.date || new Date().toISOString().split('T')[0];
      const ed = r.editor || 'Basith';
      const editDt = r.edit_date || '';
      const delDt = r.delivery_date || '';
      const upDt = r.upload_date || '';

      return [
        `"${String(shop).replace(/"/g, '""')}"`,
        `"${String(model).replace(/"/g, '""')}"`,
        `"${String(cam).replace(/"/g, '""')}"`,
        `"${String(shootDt).replace(/"/g, '""')}"`,
        `"${String(ed).replace(/"/g, '""')}"`,
        `"${String(editDt).replace(/"/g, '""')}"`,
        `"${String(delDt).replace(/"/g, '""')}"`,
        `"${String(upDt).replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hafa_master_production_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefreshFrame = () => {
    setIframeKey(Date.now());
    loadMasterData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 transition-colors duration-300">
      
      {/* Top Header & Export Toolbar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400 font-bold text-xs tracking-wider uppercase">
            <Database className="w-4 h-4 text-orange-500" />
            <span>Google Workspace Relational Database</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Admin Live Master Sheet & Production Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Real-time synchronization with Google Sheets backend ID: <code className="font-mono bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 px-1.5 py-0.5 rounded">{SPREADSHEET_ID}</code>
          </p>
        </div>

        {/* ONE-CLICK EXPORT TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportProductionCSV}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            title="Export Production CSV matching A: SHOP NAME to H: UPLOAD DATE"
          >
            <FileText className="w-4 h-4" />
            <span>Export Production CSV</span>
          </button>

          <a
            href={EXCEL_EXPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-500/30 transition-colors flex items-center space-x-2 cursor-pointer"
            title="Download full database as Microsoft Excel file (.xlsx)"
          >
            <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Export Excel</span>
          </a>

          <a
            href={PDF_EXPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-500/30 transition-colors flex items-center space-x-2 cursor-pointer"
            title="Export database report as PDF document (.pdf)"
          >
            <Download className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">PDF</span>
          </a>

          <button
            onClick={handleRefreshFrame}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs border border-slate-300 dark:border-zinc-700 transition-colors flex items-center space-x-2 cursor-pointer"
            title="Reload data and view"
          >
            <RefreshCw className={`w-4 h-4 text-orange-500 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href={LIVE_SHEET_EDIT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl font-extrabold text-xs text-white bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 shadow-md flex items-center space-x-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-orange-400" />
            <span>Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'LEDGER'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Master Production Ledger
          </button>
          <button
            onClick={() => setActiveTab('GOOGLE_SHEET')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'GOOGLE_SHEET'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Live Google Sheets Iframe
          </button>
        </div>

        {activeTab === 'LEDGER' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search shop, product model, cameraman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'LEDGER' ? (
        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-orange-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Live Master Production Ledger ({filteredRecords.length} Rows)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Columns A-H Production Format
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-zinc-400 text-xs font-bold space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
              <p>Loading master spreadsheet data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">A: SHOP NAME</th>
                    <th className="py-3.5 px-4">B: PRODUCT MODEL</th>
                    <th className="py-3.5 px-4">C: CAMERA MAN</th>
                    <th className="py-3.5 px-4">D: SHOOT DATE</th>
                    <th className="py-3.5 px-4">E: EDITOR</th>
                    <th className="py-3.5 px-4">F: EDIT DATE</th>
                    <th className="py-3.5 px-4">G: DELIVERY DATE</th>
                    <th className="py-3.5 px-4">H: UPLOAD DATE</th>
                    <th className="py-3.5 px-4 text-center">GPS / PROOF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-400 dark:text-zinc-500 font-semibold">
                        No records match the current search.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r, idx) => {
                      const shop = r.shop_name || r.client_name || r.location_name || 'HafA Client';
                      const model = r.product_model || r.shoot_item || r.remarks || 'Production Item';
                      const cam = r.cameraman || r.employee_name || 'Basith';
                      const shootDt = r.shoot_date || r.date || new Date().toISOString().split('T')[0];
                      const ed = r.editor || 'Basith';
                      const editDt = r.edit_date || '—';
                      const delDt = r.delivery_date || '—';
                      const upDt = r.upload_date || '—';
                      const proof = r.proof_url || r.photo_url || '';

                      return (
                        <tr key={r.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                          {/* Column A: SHOP NAME */}
                          <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {shop}
                          </td>

                          {/* Column B: PRODUCT MODEL */}
                          <td className="py-3.5 px-4 font-semibold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                            {model}
                          </td>

                          {/* Column C: CAMERA MAN */}
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-zinc-300 capitalize whitespace-nowrap">
                            {cam}
                          </td>

                          {/* Column D: SHOOT DATE */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                            {shootDt}
                          </td>

                          {/* Column E: EDITOR */}
                          <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-zinc-300 capitalize whitespace-nowrap">
                            {ed}
                          </td>

                          {/* Column F: EDIT DATE */}
                          <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                            {editDt}
                          </td>

                          {/* Column G: DELIVERY DATE */}
                          <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                            {delDt}
                          </td>

                          {/* Column H: UPLOAD DATE */}
                          <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                            {upDt}
                          </td>

                          {/* GPS / Proof */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {proof ? (
                              <a
                                href={proof}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/30 hover:underline"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Proof</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No Proof</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Embedded 80vh Height Google Sheets Iframe Container */
        <div className="rounded-3xl overflow-hidden border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md h-[80vh] relative">
          <iframe
            key={iframeKey}
            title="Published Google Sheets Database"
            src={PUBLISHED_SHEET_URL}
            className="w-full h-full border-0"
            allow="geolocation"
          />
        </div>
      )}
    </div>
  );
};
