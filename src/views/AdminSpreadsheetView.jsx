import React, { useState } from 'react';
import { FileSpreadsheet, ExternalLink, RefreshCw, Database, Download, FileText, Table } from 'lucide-react';

const SPREADSHEET_ID = "1S9zlXs6piahSsaTbKEFui1AwKuEGPLEEcb83opRwGA8";
const EXCEL_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
const CSV_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;
const PDF_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=pdf`;
const LIVE_SHEET_EDIT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
const PUBLISHED_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTJieiTyHLD4AITlgJ9Tv8iKitcrHd1HKorFBIyha8Nro2CJDvIzT7KYmEvcu43wNjrNU03FAkEolYe/pubhtml";

export const AdminSpreadsheetView = () => {
  const [iframeKey, setIframeKey] = useState(Date.now());

  const handleRefreshFrame = () => {
    setIframeKey(Date.now());
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Export Toolbar */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-orange-600 font-semibold text-xs tracking-wider uppercase">
            <Database className="w-4 h-4 text-orange-500" />
            <span>Google Workspace Relational Database</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-0.5">Live Database Spreadsheet View</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synchronization with Google Sheets backend ID: <code className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{SPREADSHEET_ID}</code>
          </p>
        </div>

        {/* ONE-CLICK EXPORT TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={EXCEL_EXPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors flex items-center space-x-2 shadow-2xs"
            title="Download full database as Microsoft Excel file (.xlsx)"
          >
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </a>

          <a
            href={CSV_EXPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs border border-blue-200 transition-colors flex items-center space-x-2 shadow-2xs"
            title="Download active sheet as CSV file (.csv)"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Export CSV</span>
          </a>

          <a
            href={PDF_EXPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 transition-colors flex items-center space-x-2 shadow-2xs"
            title="Export database report as PDF document (.pdf)"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Export PDF</span>
          </a>

          <button
            onClick={handleRefreshFrame}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-colors flex items-center space-x-2"
            title="Reload embedded view"
          >
            <RefreshCw className="w-4 h-4 text-orange-500" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <a
            href={LIVE_SHEET_EDIT_URL}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl font-extrabold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-md flex items-center space-x-2 transition-all transform hover:scale-105"
          >
            <FileSpreadsheet className="w-4 h-4 text-orange-400" />
            <span>Open in Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded 80vh Height Iframe Container */}
      <div className="rounded-3xl overflow-hidden border border-slate-300 bg-white shadow-md h-[80vh] relative">
        <iframe
          key={iframeKey}
          title="Published Google Sheets Database"
          src={PUBLISHED_SHEET_URL}
          className="w-full h-full border-0"
          allow="geolocation"
        />
      </div>
    </div>
  );
};
