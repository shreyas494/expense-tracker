import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Check, AlertCircle, Camera, CheckSquare, Square, Trash2, ArrowRight, IndianRupee, Layers } from 'lucide-react'
import axios from 'axios'
import { scanReceiptWithOCR, compressImageForMobile } from '../utils/ocrParser'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const CATEGORIES = ['Food', 'Housing', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Other']

const PhonePeImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const fileInputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanIndex, setScanIndex] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [parsedItems, setParsedItems] = useState([])
  const [isImporting, setIsImporting] = useState(false)

  if (!isOpen) return null

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setSelectedFiles(files)
    setIsScanning(true)
    setParsedItems([])
    const results = []

    const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setScanIndex(i + 1)
      const currentPct = Math.round(((i + 1) / files.length) * 100)
      setScanProgress(currentPct)
      setStatusText(`Scanning PhonePe screenshot ${i + 1} of ${files.length}...`)

      try {
        const compressedBase64 = await compressImageForMobile(file)
        let itemData = null

        if (compressedBase64) {
          try {
            const res = await axios.post(
              `${API_BASE}/expense/scan-receipt`,
              { imageBase64: compressedBase64, mimeType: 'image/jpeg' },
              { headers }
            )

            if (res.data.success && res.data.data?.amount > 0) {
              itemData = {
                id: `phonepe_${Date.now()}_${i}`,
                selected: true,
                description: res.data.data.description || `PhonePe Payment ${i + 1}`,
                amount: res.data.data.amount || 0,
                category: res.data.data.category || 'Food',
                type: res.data.data.type || 'expense',
                date: new Date().toISOString().split('T')[0],
                previewUrl: URL.createObjectURL(file)
              }
            }
          } catch (bErr) {
            console.warn("Backend scan failed for item", i, bErr)
          }
        }

        if (!itemData) {
          const ocrResult = await scanReceiptWithOCR(file)
          itemData = {
            id: `phonepe_${Date.now()}_${i}`,
            selected: ocrResult.amount > 0,
            description: ocrResult.description || `PhonePe Payment ${i + 1}`,
            amount: ocrResult.amount || 0,
            category: ocrResult.category || 'Other',
            type: ocrResult.type || 'expense',
            date: new Date().toISOString().split('T')[0],
            previewUrl: URL.createObjectURL(file)
          }
        }

        results.push(itemData)
      } catch (err) {
        console.error("Failed to parse file", file.name, err)
      }
    }

    setParsedItems(results)
    setIsScanning(false)
  }

  const toggleItemSelection = (id) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item))
  }

  const updateItem = (id, field, value) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeItem = (id) => {
    setParsedItems(prev => prev.filter(item => item.id !== id))
  }

  const handleBulkImport = async () => {
    const selectedItems = parsedItems.filter(item => item.selected && Number(item.amount) > 0)
    if (!selectedItems.length) {
      alert("Please select at least one transaction with an amount greater than ₹0.")
      return
    }

    setIsImporting(true)
    const token = localStorage.getItem("token") || sessionStorage.getItem("token")
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    try {
      for (const item of selectedItems) {
        if (item.type === 'income') {
          await axios.post(`${API_BASE}/income/add`, {
            description: item.description,
            amount: Number(item.amount),
            category: item.category === 'Food' ? 'Salary' : item.category,
            date: new Date(item.date).toISOString()
          }, { headers })
        } else {
          await axios.post(`${API_BASE}/expense/add`, {
            description: item.description,
            amount: Number(item.amount),
            category: item.category,
            date: new Date(item.date).toISOString()
          }, { headers })
        }
      }

      onImportComplete?.()
      onClose()
    } catch (err) {
      console.error("Bulk import failed:", err)
      alert("Failed to import some transactions. Please try again.")
    } finally {
      setIsImporting(false)
    }
  }

  const selectedCount = parsedItems.filter(i => i.selected).length
  const totalSelectedAmount = parsedItems
    .filter(i => i.selected)
    .reduce((sum, i) => sum + Number(i.amount || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-6 my-8 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Batch Import PhonePe / UPI Screenshots
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Select multiple transaction screenshots to auto-extract & bulk import
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Dropzone */}
        {parsedItems.length === 0 && !isScanning && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 dark:border-indigo-500/20 dark:hover:border-indigo-500/50 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Tap or Drag & Drop Multiple PhonePe Screenshots
              </h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Select 2, 5, or 10 receipt photos at once from your gallery
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <a
                href="intent://#Intent;package=com.phonepe.app;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;"
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 text-xs font-extrabold rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Launch PhonePe App directly on your phone"
              >
                Open PhonePe App ↗
              </a>
              <button className="px-4 py-2 text-xs font-extrabold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md">
                Browse Gallery / Files
              </button>
            </div>
          </div>
        )}

        {/* Scanning Queue */}
        {isScanning && (
          <div className="space-y-4 text-center py-8">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 animate-ping opacity-75" />
              <div className="relative w-16 h-16 bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                Batch Scanning PhonePe Screenshots...
              </h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                {statusText}
              </p>
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <div className="flex justify-between text-xs font-extrabold text-slate-600 dark:text-slate-400">
                <span>Progress</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{scanProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Batch Review List */}
        {parsedItems.length > 0 && !isScanning && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
              <span>Found {parsedItems.length} PhonePe Transactions</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                + Add More Screenshots
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {parsedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
                    item.selected
                      ? 'border-indigo-500/40 bg-indigo-500/5 dark:bg-indigo-500/10'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <button
                    onClick={() => toggleItemSelection(item.id)}
                    className="p-1 text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  >
                    {item.selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                  </button>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-extrabold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      placeholder="Description"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 text-xs font-extrabold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        placeholder="Amount"
                      />
                    </div>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                Selected: <span className="text-slate-900 dark:text-white">{selectedCount} items</span> (Total: <span className="text-indigo-600 dark:text-indigo-400">₹{totalSelectedAmount.toLocaleString('en-IN')}</span>)
              </div>
              <button
                onClick={handleBulkImport}
                disabled={isImporting || selectedCount === 0}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isImporting ? 'Importing Transactions...' : `Import ${selectedCount} Transactions`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PhonePeImportModal
