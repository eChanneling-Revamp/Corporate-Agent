import React, { useState } from 'react'
import { X, Download, FileText, FileSpreadsheet, FileImage, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  reportType: string
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, reportType }) => {
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeRawData, setIncludeRawData] = useState(false)
  const [dateRange, setDateRange] = useState('current')

  if (!isOpen) return null

  const formats = [
    { id: 'pdf', name: 'PDF Document', icon: <FileText size={20} />, description: 'Best for printing and sharing' },
    { id: 'excel', name: 'Excel Spreadsheet', icon: <FileSpreadsheet size={20} />, description: 'Best for data analysis' },
    { id: 'csv', name: 'CSV File', icon: <FileSpreadsheet size={20} />, description: 'Best for importing to other tools' },
    { id: 'png', name: 'PNG Image', icon: <FileImage size={20} />, description: 'Best for presentations' }
  ]

  const handleExport = () => {
    toast.success(`Exporting ${reportType} report as ${selectedFormat.toUpperCase()}...`)
    // Simulate export
    setTimeout(() => {
      toast.success('Report exported successfully!')
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Download size={20} className="text-blue-600" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Export Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${selectedFormat === format.id ? 'text-blue-600' : 'text-gray-400'}`}>
                        {format.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{format.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{format.description}</p>
                      </div>
                    </div>
                    {selectedFormat === format.id && (
                      <Check size={20} className="text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="current">Current Period</option>
              <option value="last-week">Last Week</option>
              <option value="last-month">Last Month</option>
              <option value="last-quarter">Last Quarter</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Export Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Options
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Include Charts & Graphs</p>
                  <p className="text-xs text-gray-500">Visual representations of data</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRawData}
                  onChange={(e) => setIncludeRawData(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Include Raw Data</p>
                  <p className="text-xs text-gray-500">Detailed data tables and records</p>
                </div>
              </label>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> Your report will be exported as a {selectedFormat.toUpperCase()} file
              {includeCharts && ' with charts'}
              {includeRawData && ' and raw data tables'}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
