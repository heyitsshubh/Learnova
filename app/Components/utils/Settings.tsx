'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FaLock, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { MdDarkMode } from 'react-icons/md';
import { useTheme } from '../Contexts/ThemeContext'; // <-- import the context

export default function SettingsPage() {
  const [name, setName] = useState('User');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Use theme context
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';

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

  // Theme classes
  const themeClasses = darkMode
    ? {
        bg: 'bg-[#18181b] dark:bg-[#18181b]',
        card: 'bg-[#23232a] dark:bg-[#23232a]',
        text: 'text-white',
        subtext: 'text-gray-400',
        border: 'border-gray-700',
        input: 'bg-[#23232a] text-white border-gray-700',
        inputFocus: 'focus:ring-blue-500',
        btn: 'bg-gray-800 hover:bg-gray-700 text-white',
        modal: 'bg-[#23232a] text-white',
        modalInput: 'bg-[#18181b] text-white border-gray-700',
        modalLabel: 'text-gray-300',
        modalClose: 'hover:bg-gray-700',
      }
    : {
        bg: 'bg-[#F4F5F9]',
        card: 'bg-white',
        text: 'text-gray-900',
        subtext: 'text-gray-600',
        border: 'border-gray-200',
        input: 'bg-gray-100 text-gray-900 border-gray-300',
        inputFocus: 'focus:ring-blue-500',
        btn: 'bg-blue-600 hover:bg-blue-700 text-white',
        modal: 'bg-white text-gray-900',
        modalInput: 'bg-gray-100 text-gray-900 border-gray-300',
        modalLabel: 'text-gray-700',
        modalClose: 'hover:bg-gray-200',
      };

  return (
    <div className={`min-h-screen ${themeClasses.bg} py-0 transition-colors`}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${themeClasses.text}`}>Settings</h1>
          <p className={`${themeClasses.subtext} text-lg`}>Customize your LearnOva experience to suit your preferences.</p>
        </div>

        {/* Profile Card */}
        <div className={`${themeClasses.card} rounded-xl shadow-sm mb-6 flex items-center p-6 gap-6`}>
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
              <span className={`px-4 py-1 rounded-lg text-lg font-semibold ${themeClasses.text} ${darkMode ? 'bg-[#23232a]' : 'bg-gray-100'}`}>{name}</span>
            </div>
            <p className={`${themeClasses.subtext} text-base`}>{email}</p>
          </div>
        </div>

        {/* Settings List */}
        <div className="space-y-4">
          {/* Change Password */}
          <div
            className={`${themeClasses.card} rounded-xl flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#23232a]/80 transition`}
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="flex items-center gap-4 ">
              <div className="bg-gray-100 dark:bg-[#23232a] rounded-full p-3">
                <FaLock className="text-2xl text-gray-500" />
              </div>
              <div>
                <div className={`font-bold text-lg ${themeClasses.text}`}>Change Password</div>
                <div className={`${themeClasses.subtext} text-base`}>Change your password.</div>
              </div>
            </div>
         
          </div>

          {/* Appearance */}
          <div className={`${themeClasses.card} rounded-xl flex items-center justify-between p-6`}>
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-[#23232a] rounded-full p-3">
                <MdDarkMode className="text-2xl text-gray-500" />
              </div>
              <div>
                <div className={`font-bold text-lg ${themeClasses.text}`}>Appearance</div>
                <div className={`${themeClasses.subtext} text-base`}>Switch between light and dark mode.</div>
              </div>
            </div>
            <button
              className={`w-14 h-8 flex items-center rounded-full transition-colors duration-300 focus:outline-none ${darkMode ? 'bg-yellow-400' : 'bg-gray-200'}`}
              onClick={toggleTheme}
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
          <div className={`${themeClasses.card} rounded-xl flex items-center justify-between p-6`}>
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-[#23232a] rounded-full p-3">
                <FaBell className="text-2xl text-gray-500" />
              </div>
              <div>
                <div className={`font-bold text-lg ${themeClasses.text}`}>Notifications</div>
                <div className={`${themeClasses.subtext} text-base`}>Get notified about assignments and updates.</div>
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
          <div className={`${themeClasses.card} rounded-xl flex items-center justify-between p-6`}>
            <div className="flex items-center gap-4">
              <div className="bg-red-100 dark:bg-[#23232a] rounded-full p-3">
                <FaSignOutAlt className="text-2xl text-red-500" />
              </div>
              <div>
                <div className="font-bold text-lg text-red-600">Sign Out</div>
                <div className={`${themeClasses.subtext} text-base`}>Sign out of all your devices.</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className={`${themeClasses.modal} rounded-xl shadow-lg p-8 w-full max-w-sm mx-auto relative`}>
            <button
              className={`absolute top-3 right-3 text-gray-400 text-2xl ${themeClasses.modalClose}`}
              onClick={() => setShowPasswordModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className={`text-2xl font-bold mb-4 ${themeClasses.text} text-center`}>Change Password</h2>
            <div className="mb-4">
              <label className={`block font-medium mb-1 ${themeClasses.modalLabel}`}>Old Password</label>
              <input
                type="password"
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none ${themeClasses.modalInput} ${themeClasses.inputFocus}`}
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                placeholder="Enter old password"
              />
            </div>
            <div className="mb-6">
              <label className={`block font-medium mb-1 ${themeClasses.modalLabel}`}>New Password</label>
              <input
                type="password"
                className={`w-full border rounded-lg px-4 py-2 focus:outline-none ${themeClasses.modalInput} ${themeClasses.inputFocus}`}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors cursor-pointer"
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