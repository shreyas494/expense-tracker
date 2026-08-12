import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { User, Mail, Lock, CheckCircle, ShieldAlert, Key, Save, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'

const ProfilePage = () => {
  const { user, onUserUpdate } = useOutletContext()

  // Profile Form State
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState("")
  const [profileError, setProfileError] = useState("")

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSuccess("")
    setProfileError("")

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const res = await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/user/profile`, 
        { name, email },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const updatedUser = res.data.user || res.data
      onUserUpdate(updatedUser)
      setProfileSuccess("Profile updated successfully!")
    } catch (err) {
      console.error(err)
      setProfileError(err.response?.data?.message || "Failed to update profile.")
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordSuccess("")
    setPasswordError("")

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.")
      return
    }

    setPasswordLoading(true)

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/user/password`, 
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setPasswordSuccess("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error(err)
      setPasswordError(err.response?.data?.message || "Failed to change password.")
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Profile Details Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Account Profile</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Update your account information</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-sm hover:shadow disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer w-full"
          >
            {profileLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Change Password Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Change Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Secure your account credential</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-sm hover:shadow disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer w-full"
          >
            {passwordLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Change Password
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default ProfilePage
