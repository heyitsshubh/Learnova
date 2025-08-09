'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaLock, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { MdDarkMode } from 'react-icons/md';

export default function SettingsPage() {
  const [name, setName] = useState('User');
  const [email, setEmail] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || 'User';
    const storedEmail = localStorage.getItem('userEemail') || '';
    setName(storedName);
    setEmail(storedEmail);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully!');
    router.push('/');
  };

  const handleChangePassword = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowPasswordModal(false);
      setOldPass('');
      setNewPass('');
      toast.success('Password changed successfully!');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F9] py-0">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">Settings</h1>
          <p className="text-gray-600 text-lg">Customize your LerarnOva experience to suit your preferences.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm mb-6 flex items-center p-6 gap-6">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg flex-shrink-0">
            <Image
              src="/profilee.svg"
              alt="Profile"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-gray-100 px-4 py-1 rounded-lg text-lg font-semibold text-gray-800">{name}</span>
            </div>
            <p className="text-gray-600 text-base">{email}</p>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {/* Change Password */}
          <div
            className="bg-white rounded-xl flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-full p-3">
                <FaLock className="text-2xl text-gray-500" />
              </div>
              <div>
                <div className="font-bold text-lg text-gray-800">Change Password</div>
                <div className="text-gray-500 text-base">Change your password.</div>
              </div>
            </div>
            <button className="text-blue-600 font-medium hover:underline text-base" tabIndex={-1}>
              Change
            </button>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-xl flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-full p-3">
                <MdDarkMode className="text-2xl text-gray-500" />
              </div>
              <div>
                <div className="font-bold text-lg text-gray-800">Appearance</div>
                <div className="text-gray-500 text-base">Switch between light and dark mode.</div>
              </div>
            </div>
            <button
              className={`w-14 h-8 flex items-center rounded-full transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-yellow-400' : 'bg-gray-200'}`}
              onClick={() => setDarkMode((d) => !d)}
              aria-label="Toggle dark mode"
            >
              <span
                className={`w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}
              >
                <MdDarkMode className="text-xl text-yellow-500" />
              </span>
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 rounded-full p-3">
                <FaBell className="text-2xl text-gray-500" />
              </div>
              <div>
                <div className="font-bold text-lg text-gray-800">Notifications</div>
                <div className="text-gray-500 text-base">Get notified about assignments and updates.</div>
              </div>
            </div>
            <button
              className={`w-14 h-8 flex items-center rounded-full transition-colors duration-300 focus:outline-none ${notifications ? 'bg-blue-500' : 'bg-gray-200'}`}
              onClick={() => setNotifications((n) => !n)}
              aria-label="Toggle notifications"
            >
              <span
                className={`w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-1'}`}
              >
                <FaBell className={`text-xl ${notifications ? 'text-blue-500' : 'text-gray-400'}`} />
              </span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="bg-white rounded-xl flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="bg-red-100 rounded-full p-3">
                <FaSignOutAlt className="text-2xl text-red-500" />
              </div>
              <div>
                <div className="font-bold text-lg text-red-600">Sign Out</div>
                <div className="text-gray-500 text-base">Sign out of all your devices.</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm mx-auto relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowPasswordModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Change Password</h2>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-1">Old Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                placeholder="Enter old password"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-1">New Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
              onClick={handleChangePassword}
              disabled={loading || !oldPass || !newPass}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}