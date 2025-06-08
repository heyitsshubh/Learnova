'use client';

import Image from 'next/image';
import { FaLock } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '../../services/auth';
import { getResetToken, removeResetToken, removeTokens } from '../../utils/token'; // Import token utilities

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const Resetpassword = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Get resetToken using the utility function
    const resetToken = getResetToken();
    console.log('Reset token:', resetToken);
    if (!resetToken) {
      setError('Reset token is missing. Please restart the reset process.');
      return;
    }

    setLoading(true);
    try {
      // Use newPassword as required by your API schema
      await resetPassword({ newPassword: form.password }, resetToken);

      // Remove tokens using utility functions
      removeResetToken();
      removeTokens();

      router.push('/login');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Failed to reset password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex">
      <div className="w-1/2 h-full relative ">
        <Image
          src="/Illustration.svg"
          alt="Illustration"
          width={800}
          height={600}
          className="w-full h-full object-contain object-left"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0 flex flex-col z-10">
          <div className="text-left m-20">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 ">
              Virtual Learning & Collaboration
            </h2>
            <p className="text-lg text-gray-600">
              Join live classes, share resources, and connect <br />with peers — all from a single platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 h-full px-8 md:px-24 py-10 md:py-20 bg-white flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-10 text-gray-800 text-center">Reset Password</h2>

        <form className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaLock className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter new password"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
              required
            />
          </div>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaLock className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
              required
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            style={{ width: 400, minWidth: 50, borderRadius: 40 }}
            disabled={loading}
          >
            {loading ? 'Setting password...' : 'Set password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Resetpassword;