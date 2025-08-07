'use client';

import Image from 'next/image';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../services/auth'; 
import { setTokens } from '../../utils/token';
import { toast } from 'react-hot-toast';
import { auth } from '../../utils/firebase'; // Import Firebase auth
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; // Import Firebase Google auth

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
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/forgotpassword');
  };

  const handleSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/signup'); // Navigate to the signup page
  };

 const handleGoogleLogin = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const accessToken = await user.getIdToken();
    setTokens(accessToken, ''); // Store access token
    localStorage.setItem('userName', user.displayName || ''); // Store user name
    localStorage.setItem('userEmail', user.email || ''); // Store user email// Store user ID
    toast.success('Logged in successfully!'); // <-- Success toast
    router.push('/dashboard'); // Redirect to dashboard
  } catch (error) {
    console.error('Google login failed:', error);
    setError('Google login failed. Please try again.');
    toast.error('Google login failed. Please try again.'); // <-- Error toast
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.email || !emailRegex.test(form.email)) {
    setError('Please enter a valid email address');
    toast.error('Please enter a valid email address'); // <-- Error toast
    return;
  }

  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/;
  if (!passwordRegex.test(form.password)) {
    setError('Password must contain at least 1 special character, 1 number, and be at least 5 characters long');
    toast.error('Incorrect Password'); // <-- Error toast
    return;
  }

  setLoading(true);
  try {
    const res = await login(form);
    setTokens(res.accessToken, res.refreshToken);
    localStorage.setItem('userName', res.username || '');
    localStorage.setItem('userEmail', res.userEmail || '');
    localStorage.setItem('userId', res.userId || ''); // Store user ID
    toast.success('Logged in successfully!'); // <-- Success toast
    router.push('/dashboard');
  } catch (err: unknown) {
    const apiError = err as ApiError;
    const errorMsg =
      apiError?.response?.data?.message ||
      apiError?.message ||
      'Login failed';
    setError(errorMsg);
    toast.error(errorMsg); // <-- Error toast
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
          <div className="text-left m-20 ">
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
      <div className="w-1/2 h-full px-8 md:px-24 py-10 md:py-20 bg-white flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-12 text-gray-800 text-center">Login</h2>

        <form className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaEnvelope className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
              required
            />
          </div>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaLock className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
              required
            />
          </div>
          <div className="w-full flex justify-end" style={{ width: 400, minWidth: 50 }}>
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            style={{ width: 400, minWidth: 50, borderRadius: 40 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
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

        <div className="mt-8 flex items-center gap-2 justify-center" style={{ width: 400, minWidth: 50, margin: '0 auto' }}>
          <hr className="flex-grow border-t border-gray-300" />
          <span className="text-sm text-gray-500">Or</span>
          <hr className="flex-grow border-t border-gray-300" />
        </div>

        <button
          className="mt-6 flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition self-center"
          style={{ width: 400, minWidth: 50 }}
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