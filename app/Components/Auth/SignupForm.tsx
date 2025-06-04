'use client';

import Image from 'next/image';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const SignupForm = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen flex">
      <div className="w-1/2 h-full relative ">
         <Image
                src="/Illustration.svg"
                alt="Illustration"
                width={800} // <-- Add a width (adjust as needed)
                height={600} // <-- Add a height (adjust as needed)
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

      {/* Right Panel */}
      <div className="w-1/2 h-full px-8 md:px-24 py-10 md:py-20 bg-white flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-12 text-gray-800 text-center">Sign up</h2>

        <form className="space-y-6 flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaUser className="absolute left-4 text-gray-400 text-lg " />
            <input
              type="text"
              placeholder="Enter your Fullname"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
            />
          </div>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaEnvelope className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="email"
              placeholder="Enter your email"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
            />
          </div>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaLock className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="password"
              placeholder="Enter password"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
            />
          </div>
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaLock className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="password"
              placeholder="Confirm password"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            style={{ width: 400, minWidth: 50, borderRadius: 40 }}
          >
            Next
          </button>
        </form>

        <p className="text-sm mt-6 text-gray-500 text-center">
          Already have an account?{' '}
          <a href="#" className="text-blue-600 hover:underline text-center">
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
        >
          <Image src="google.svg" alt="Google" width={20} height={20} />
          Continue with Google
        </button>
      </div>

    </div>
  );
};

export default SignupForm;
