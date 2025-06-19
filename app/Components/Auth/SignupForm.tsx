'use client';

import Image from 'next/image';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useState } from 'react';
import { signup } from '../../services/auth';
import { useRouter } from 'next/navigation';
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

const SignupForm = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for toggling confirm password visibility

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/login');
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store user info as needed
      const accessToken = await user.getIdToken();
      localStorage.setItem('accessToken', accessToken); // Store access token
      localStorage.setItem('userName', user.displayName || ''); // Store user name
      localStorage.setItem('userEmail', user.email || ''); // Store user email

      router.push('/dashboard'); // Redirect to dashboard
    } catch (error) {
      console.error('Google signup failed:', error);
      setError('Google signup failed. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{5,}$/;
    if (!passwordRegex.test(form.password)) {
      setError('Password must contain at least 1 special character, 1 number, and be at least 5 characters long');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting:', form);
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      localStorage.setItem('email', form.email);
      router.push('/otp');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Signup failed'
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
        <h2 className="text-2xl font-bold mb-12 text-gray-800 text-center">Sign up</h2>

        <form className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaUser className="absolute left-4 text-gray-400 text-lg " />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your Fullname"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
              required
            />
          </div>
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
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 text-lg"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaLock className="absolute left-4 text-gray-400 text-lg" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 text-gray-400 text-lg"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
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
            {loading ? 'Signing up...' : 'Next'}
          </button>
        </form>

        <p className="text-sm mt-6 text-gray-500 text-center">
          Already have an account?{' '}
          <a
            href="#"
            onClick={handleSignup}
            className="text-blue-600 hover:underline text-center"
          >
            Sign in
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
          onClick={handleGoogleSignup}
        >
          <Image src="google.svg" alt="Google" width={20} height={20} />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default SignupForm;