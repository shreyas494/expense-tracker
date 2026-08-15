import React, { useEffect } from 'react'
import { navbarStyles } from '../assets/dummyStyles'
import img1 from '../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import { ChevronDown, Sun, Moon, Camera, Upload } from 'lucide-react';
import { User } from 'lucide-react';
import { LogOut } from 'lucide-react';
import axios from 'axios';


import { motion, AnimatePresence } from 'framer-motion'
import { scanReceiptWithOCR, compressImageForMobile } from '../utils/ocrParser';

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const Navbar = ({user: propUser, onLogout, theme, toggleTheme}) => {
    const navigate = useNavigate();
    const menuRef = useRef();
    const fileInputRef = useRef();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStatusText, setScanStatusText] = useState("Reading receipt image file...");

    const handleReceiptUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setScanProgress(15);
      setScanStatusText("Reading receipt image file...");

      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        setScanProgress(40);
        setScanStatusText("Compressing & optimizing photo resolution...");
        const compressedBase64 = await compressImageForMobile(file);

        if (compressedBase64) {
          setScanProgress(70);
          setScanStatusText("AI scanning receipt text & amount...");
          try {
            const res = await axios.post(
              `${BASE_URL}/expense/scan-receipt`,
              { imageBase64: compressedBase64, mimeType: 'image/jpeg' },
              { headers }
            );

            setScanProgress(90);
            setScanStatusText("Parsing amount, merchant & reference details...");

            if (!res.data.success || !res.data.data?.amount) {
              setScanProgress(95);
              setScanStatusText("Running AI vision OCR fallback...");
              const ocrResult = await scanReceiptWithOCR(file);
              if (ocrResult.amount > 0 || (ocrResult.description && ocrResult.description !== "Payment Transaction")) {
                await axios.post(
                  `${BASE_URL}/expense/sms-webhook`,
                  { text: ocrResult.rawText?.trim() || `Paid to ${ocrResult.description} ₹${ocrResult.amount}` },
                  { headers }
                );
              }
            }
          } catch (bErr) {
            console.error("Backend scan-receipt error:", bErr);
          }
        }

        setScanProgress(100);
        setScanStatusText("Scan complete! Loading summary...");
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error("Receipt upload error:", err);
      } finally {
        setIsUploading(false);
        setScanProgress(0);
        window.location.reload();
      }
    };

 
    const [user, setUser] = useState(propUser || {
        name: "",
        email: "",
    });

    useEffect(() => {
        if (propUser) {
            setUser(propUser);
        }
    }, [propUser]);

    //to fetch the user data from server
    useEffect(() =>{
        const fetchUserData = async () => {
            try{
                    const token = localStorage.getItem("token");
                    if(!token) return;

                    const response = await axios.get(`${BASE_URL}/user/me`,{
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    const userData = response.data.user || response.data;
                    setUser(userData);
            }catch(error)
            {
                console.error("failed to load profile",error);
            }
        };
        if(!propUser){
            fetchUserData();
        }
    }, [propUser]);

    const toggleMenu = () => {
        setMenuOpen((prev) => !prev);
    }

    const handleLogout = () => {
        setMenuOpen(false);
        localStorage.removeItem("token");
        onLogout?.();
        navigate("/login");
    };


    // closes menu if clicked outside the box 
     useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <header className={navbarStyles.header}>
        <div className={navbarStyles.container}>
            {/* logo */}
            <div onClick={() => navigate("/")} className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoImage}>
                    <img src={img1} alt="Expense Tracker Logo" className={navbarStyles.logo}/>
                </div>
                <span className={navbarStyles.logoText}>Expense Tracker</span>
            </div>

            {/* if the user is present */}
            {user && (
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3.5 py-2 text-xs font-extrabold rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-all cursor-pointer flex items-center gap-1.5 border border-teal-500/20 shadow-xs"
                    title="Upload & Scan Receipt Screenshot"
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">{isUploading ? 'Scanning...' : 'Scan Receipt'}</span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
                  </button>

                  <div className={navbarStyles.userContainer} ref={menuRef}>
                <button onClick={toggleMenu} className={navbarStyles.userButton}>
                <div className="flex items-center gap-3">
                  <div className="relative"> 
                        <div className={navbarStyles.userAvatar}>
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className={navbarStyles.statusIndicator}>
                        </div>
                  </div>

                  <div className={navbarStyles.userTextContainer}>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[130px]">{user?.name || "User"}</p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-300 truncate max-w-[130px]">{user?.email || "user@expensetracker.com"}</p>
                  </div>
                </div>

                <ChevronDown className={navbarStyles.chevronIcon(menuOpen)}/>
                </button>
                {/* dropdown menu */}
                {menuOpen && (
                    <div className={navbarStyles.dropdownMenu}>
                        <div className={navbarStyles.dropdownHeader}>
                                <div className="flex items-center gap-3">
                                        <div className={navbarStyles.dropdownAvatar}>
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>

                                        <div>
                                            <div className={navbarStyles.dropdownName}>
                                                {user?.name || "User"}

                                            </div>
                                            <div className={navbarStyles.dropdownEmail}>
                                                {user?.email || "user@expensetracker.com"}
                                            </div>
                                        </div>
    
                                </div>
                        </div>
                        <div className={navbarStyles.menuItemContainer}>
                            <button onClick={() => {
                                setMenuOpen(false);
                                navigate("/profile");
                            }} className={navbarStyles.menuItem}>
                                <User className=" w-4 h-4"/>
                                <span>my profile</span>
                            </button>

                        </div>
                        <div className={navbarStyles.menuItemBorder}>
                          <button onClick={handleLogout} className={navbarStyles.logoutButton}>
                            <LogOut className=' w-4 h-4'/>
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            )}
        </div>

      {/* Upload & Scanning Progress Modal Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-full shadow-2xl text-center space-y-5 relative overflow-hidden"
            >
              {/* Top ambient glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Animated Camera Scanner Graphic */}
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-teal-500/20 animate-ping opacity-75" />
                <div className="relative w-20 h-20 bg-teal-500/10 text-teal-500 border border-teal-500/30 rounded-2xl flex items-center justify-center shadow-lg">
                  <Camera className="w-9 h-9 animate-pulse" />
                </div>
              </div>

              {/* Text Header */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Scanning Payment Receipt...
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 min-h-[32px] flex items-center justify-center px-2">
                  {scanStatusText}
                </p>
              </div>

              {/* Progress Bar & Percentage Counter */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs font-extrabold">
                  <span className="text-teal-600 dark:text-teal-400 uppercase tracking-wider text-[10px]">Processing OCR</span>
                  <span className="text-slate-900 dark:text-white font-mono text-sm">{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
                  <motion.div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 italic pt-1">
                Extracting merchant, amount, category & reference details...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar