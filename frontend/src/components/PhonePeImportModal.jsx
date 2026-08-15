import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Check, AlertCircle, Camera, CheckSquare, Square, Trash2, ArrowRight, IndianRupee, Layers } from 'lucide-react'
import axios from 'axios'
import { scanReceiptWithOCR, compressImageForMobile } from '../utils/ocrParser'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const CATEGORIES = ['Food', 'Housing', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Other']

const PhonePeImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const fileInputRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const videoRef = useRef(null)

  const [selectedFiles, setSelectedFiles] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanIndex, setScanIndex] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [parsedItems, setParsedItems] = useState([])
  const [isImporting, setIsImporting] = useState(false)
  const [capturedFrames, setCapturedFrames] = useState([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [pipWindow, setPipWindow] = useState(null)

  const processFiles = async (files) => {
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

      let itemData = null

      try {
        const compressedBase64 = await compressImageForMobile(file)
        if (compressedBase64) {
          try {
            const res = await axios.post(
              `${API_BASE}/expense/scan-receipt`,
              { imageBase64: compressedBase64, mimeType: 'image/jpeg' },
              { headers }
            )

            if (res.data && res.data.success && res.data.data) {
              itemData = {
                id: `phonepe_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
                selected: true,
                description: res.data.data.description || `PhonePe Transaction ${i + 1}`,
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
            id: `phonepe_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            selected: true,
            description: ocrResult.description || `PhonePe Transaction ${i + 1}`,
            amount: ocrResult.amount || 0,
            category: ocrResult.category || 'Food',
            type: ocrResult.type || 'expense',
            date: new Date().toISOString().split('T')[0],
            previewUrl: URL.createObjectURL(file)
          }
        }
      } catch (fileErr) {
        console.error("Error parsing screenshot", i, fileErr)
        itemData = {
          id: `phonepe_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          selected: true,
          description: `PhonePe Transaction ${i + 1}`,
          amount: 0,
          category: 'Food',
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
          previewUrl: URL.createObjectURL(file)
        }
      }

      if (!itemData) {
        itemData = {
          id: `phonepe_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          selected: true,
          description: `PhonePe Transaction ${i + 1}`,
          amount: 0,
          category: 'Food',
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
          previewUrl: URL.createObjectURL(file)
        }
      }

      if (itemData) {
        results.push(itemData)
      }
    }

    setScanProgress(100)
    setStatusText("Scan complete!")
    setParsedItems(results)
    setIsScanning(false)
  }

  React.useEffect(() => {
    if (isOpen && capturedFrames && capturedFrames.length > 0) {
      processFiles(capturedFrames)
    }
  }, [isOpen, capturedFrames])

  React.useEffect(() => {
    const handleProcessSnaps = async (e) => {
      // Auto trigger file picker to select real PhonePe screenshots
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };
    window.addEventListener('phonepe_process_snaps', handleProcessSnaps);
    return () => window.removeEventListener('phonepe_process_snaps', handleProcessSnaps);
  }, []);

  if (!isOpen) return null

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const handlePasteFromRAM = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert("Clipboard RAM reading is not supported on this browser version.")
        return
      }
      const items = await navigator.clipboard.read()
      const ramFiles = []
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            ramFiles.push(new File([blob], `ram_screenshot_${Date.now()}.png`, { type }))
          }
        }
      }
      if (ramFiles.length > 0) {
        processFiles(ramFiles)
      } else {
        alert("No screenshot image found in RAM memory/clipboard. Copy or take a screenshot first!")
      }
    } catch (err) {
      console.warn("RAM clipboard read error:", err)
      alert("Please allow clipboard permission to read RAM screenshots!")
    }
  }

  const openFloatingPiPDialog = async () => {
    try {
      // Start background screen stream first
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.warn("Video play error:", e))
        }
      }

      setIsCapturing(true)
      setCapturedFrames([])

      if ('documentPictureInPicture' in window) {
        const pipWin = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 220,
        })
        
        const pipDoc = pipWin.document
        pipDoc.body.style.margin = '0'
        pipDoc.body.style.fontFamily = 'system-ui, sans-serif'
        pipDoc.body.style.background = '#0f172a'
        pipDoc.body.style.color = '#ffffff'
        pipDoc.body.style.display = 'flex'
        pipDoc.body.style.flexDirection = 'column'
        pipDoc.body.style.alignItems = 'center'
        pipDoc.body.style.justifyContent = 'center'
        pipDoc.body.style.padding = '16px'
        pipDoc.body.style.textAlign = 'center'

        pipDoc.body.innerHTML = `
          <div style="font-weight: 800; font-size: 13px; margin-bottom: 6px; color: #c084fc;">🟣 PhonePe In-App Scanner</div>
          <p style="font-size: 11px; color: #94a3b8; margin: 0 0 12px 0;">Floating over PhonePe app</p>
          <button id="pipSnapBtn" style="background: #9333ea; color: white; border: none; padding: 10px 14px; border-radius: 12px; font-weight: 800; font-size: 12px; cursor: pointer; width: 100%; margin-bottom: 8px;">📸 Snap Screenshot (0)</button>
          <button id="pipScanBtn" style="background: #0d9488; color: white; border: none; padding: 8px 14px; border-radius: 12px; font-weight: 800; font-size: 11px; cursor: pointer; width: 100%;">⚡ Scan All & Import ➔</button>
        `

        let count = 0
        pipDoc.getElementById('pipSnapBtn').onclick = async () => {
          await snapScreenFrame()
          count++
          const btn = pipDoc.getElementById('pipSnapBtn')
          if (btn) btn.innerText = `📸 Snap Screenshot (${count})`
        }

        pipDoc.getElementById('pipScanBtn').onclick = () => {
          pipWin.close()
          stopCaptureAndProcess()
        }

        setPipWindow(pipWin)
      }

      // Launch PhonePe App
      window.location.href = "phonepe://home"
    } catch (err) {
      console.warn("Floating PiP dialog launch error:", err)
      // Fallback
      window.location.href = "phonepe://home"
    }
  }

  const startScreenCaptureOverlay = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })

        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.warn("Video play error:", e))
        }

        setIsCapturing(true)
        setCapturedFrames([])
      }

      // Launch PhonePe App silently
      window.location.href = "phonepe://home"
    } catch (err) {
      console.warn("Screen capture error:", err)
      window.location.href = "phonepe://home"
    }
  }

  const snapScreenFrame = async () => {
    try {
      const video = videoRef.current
      if (video && video.videoWidth > 0) {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `snap_${Date.now()}.png`, { type: 'image/png' })
            setCapturedFrames(prev => [...prev, file])
          }
        }, 'image/png')
        return
      }

      if (mediaStreamRef.current) {
        const videoTrack = mediaStreamRef.current.getVideoTracks()[0]
        if (videoTrack && 'ImageCapture' in window) {
          const imageCapture = new ImageCapture(videoTrack)
          const bitmap = await imageCapture.grabFrame()
          const canvas = document.createElement('canvas')
          canvas.width = bitmap.width
          canvas.height = bitmap.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(bitmap, 0, 0)
          canvas.toBlob(blob => {
            if (blob) {
              const file = new File([blob], `snap_${Date.now()}.png`, { type: 'image/png' })
              setCapturedFrames(prev => [...prev, file])
            }
          }, 'image/png')
        }
      }
    } catch (err) {
      console.error("Frame snap failed:", err)
    }
  }

  const stopCaptureAndProcess = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    setIsCapturing(false)
    if (capturedFrames.length > 0) {
      processFiles(capturedFrames)
    } else {
      alert("No screen snapshots captured yet. Tap 'Snap Screen' while viewing PhonePe History!")
    }
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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl space-y-5 my-auto relative overflow-y-auto max-h-[92vh]"
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

        {/* Guided 2-Step Assistant Box */}
        {parsedItems.length === 0 && !isScanning && (
          <div className="space-y-4">
            <input
              type="file"
              id="phonepeFileInput"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Step 1: Open PhonePe & Floating Snapper */}
              <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Open PhonePe & Snap Tool</h4>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Launch PhonePe with floating screen snapper widget.
                  </p>
                </div>
                <div className="space-y-2 mt-3">
                  <button
                    type="button"
                    onClick={startScreenCaptureOverlay}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📸 Start Floating Screenshot Snapper</span>
                  </button>
                  <a
                    href="phonepe://home"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                    title="Launch PhonePe App directly on your phone"
                  >
                    <span>Open PhonePe App Only ↗</span>
                  </a>
                </div>
              </div>

              {/* Step 2: Pick Multiple Screenshots */}
              <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-3 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Select Screenshots</h4>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Long-press in your phone gallery to select 2, 5, or 10 screenshots at once.
                  </p>
                </div>
                <div className="space-y-2 mt-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select Screenshots & Scan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePasteFromRAM}
                    className="w-full py-2 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Read screenshot image directly from RAM clipboard without storing in gallery"
                  >
                    <span>📋 Paste Screenshot from RAM</span>
                  </button>
                </div>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500/50 rounded-2xl p-4 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30"
            >
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                📁 Or drag & drop multiple screenshot image files anywhere here to process
              </p>
            </div>
          </div>
        )}

        {/* Scanning Queue */}
        {isScanning && (
          <div className="space-y-5 text-center py-6 px-4 bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 rounded-3xl">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-purple-500/20 animate-ping opacity-75" />
              <div className="relative w-20 h-20 bg-purple-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/30">
                <Camera className="w-10 h-10 animate-pulse" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                ⚡ AI Scanning PhonePe Receipts...
              </h4>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1 animate-pulse">
                {statusText || "Extracting merchant names, UPI amounts, and dates..."}
              </p>
            </div>
            <div className="max-w-sm mx-auto space-y-2">
              <div className="flex justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                <span>AI OCR Scan Progress</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 text-sm font-black">{scanProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 p-0.5 shadow-inner">
                <div
                  className="bg-gradient-to-r from-purple-600 via-indigo-500 to-teal-400 h-full rounded-full transition-all duration-300 shadow-md"
                  style={{ width: `${Math.max(scanProgress, 8)}%` }}
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

      {/* Floating Control Bar Overlay when Screen Capture is active */}
      {isCapturing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-slate-900/95 backdrop-blur-md text-white border border-purple-500/40 rounded-full px-5 py-2.5 shadow-2xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-extrabold tracking-wider uppercase text-purple-300">Live RAM Snapper ({capturedFrames.length})</span>
          </div>

          <button
            type="button"
            onClick={snapScreenFrame}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-full text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap Screen</span>
          </button>

          <button
            type="button"
            onClick={stopCaptureAndProcess}
            className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-full text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <span>Process All ({capturedFrames.length}) ➔</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default PhonePeImportModal
