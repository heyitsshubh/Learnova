'use client';

import Image from 'next/image';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../services/auth'; 
import { setTokens } from '../../utils/token';
import { toast } from 'react-hot-toast';
import { auth } from '../../utils/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const Login = () => {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/forgotpassword');
  };

  const handleSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/signup');
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const accessToken = await user.getIdToken();
      setTokens(accessToken, '');
      localStorage.setItem('userName', user.displayName || '');
      localStorage.setItem('userEmail', user.email || '');
      toast.success('Logged in successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Google login failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/;
    if (!passwordRegex.test(form.password)) {
      toast.error('Incorrect Password');
      return;
    }

    setLoading(true);
    setShowSpinner(true);
    try {
      const res = await login(form);
      setTokens(res.accessToken, res.refreshToken);
      localStorage.setItem('userName', res.username || '');
      localStorage.setItem('userEmail', res.userEmail || '');
      localStorage.setItem('userId', res.userId || '');
      toast.success('Logged in successfully!');
      setTimeout(() => {
        setShowSpinner(false);
        router.push('/dashboard');
      }, 1200); // Show spinner for a short time after success
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const errorMsg =
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
      setShowSpinner(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col md:flex-row">
      {/* Spinner Overlay */}
      {showSpinner && (
        <div className="fixed inset-0 bg-opacity-40 flex items-center justify-center z-50 bg-black/30">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-lg font-semibold text-white">Logging in...</span>
          </div>
        </div>
      )}

      {/* Left Panel: Hide on mobile */}
      <div className="hidden md:block md:w-1/2 h-64 md:h-full relative">
        <Image
          src="/Illustration.svg"
          alt="Illustration"
          width={800}
          height={600}
          className="w-full h-full object-contain object-left"
          style={{ zIndex: 0 }}
        />

        <div className="absolute inset-0 flex flex-col z-10">
          <div className="text-left m-10 md:m-20">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 ">
              Virtual Learning 
            </h2>
            <p className="text-lg text-gray-600">
              Join live classes, share resources, and connect with<br />peers — all from a single platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 h-full px-4 sm:px-8 md:px-24 py-10 md:py-20 bg-white flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-12 text-gray-800 text-center">Login</h2>

        <form className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="relative w-[400px] flex items-center justify-center max-w-xs sm:max-w-md md:max-w-full" style={{ minWidth: 50 }}>
            <FaEnvelope className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="pl-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative w-[400px] flex items-center justify-center max-w-xs sm:max-w-md md:max-w-full" style={{ minWidth: 50 }}>
            <FaLock className="absolute left-4 text-gray-400 text-lg" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="pl-12 pr-12 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="button"
              className="absolute right-4 text-gray-400 hover:text-gray-600 text-lg focus:outline-none"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="w-[400px] flex justify-end max-w-xs sm:max-w-md md:max-w-full" style={{ minWidth: 50 }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:underline text-sm bg-transparent border-none p-0 m-0"
              style={{ cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <div className="w-[400px] flex justify-end max-w-xs sm:max-w-md md:max-w-full" style={{ minWidth: 50 }}  >
          <button
            type="submit"
            className="w-[400px] bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            style={{ borderRadius: 40 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          </div>
        </form>

        <p className="text-sm mt-6 text-gray-500 text-center">
          Already have an account?{' '}
            <a
            href="#"
            onClick={handleSignup}
            className="text-blue-600 hover:underline text-center"
          >
            Sign up
          </a>
        </p>

        <div className="mt-8 flex items-center gap-2 justify-center max-w-xs sm:max-w-md md:max-w-full mx-auto">
          <hr className="flex-grow border-t border-gray-300" />
          <span className="text-sm text-gray-500">Or</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <button
          className="mt-6 flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition self-center w-[400px] max-w-xs sm:max-w-md md:max-w-full"
          onClick={handleGoogleLogin}
        >
          <Image src="google.svg" alt="Google" width={20} height={20} />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;