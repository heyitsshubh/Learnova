'use client';

import Image from 'next/image';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

const Forgotpassword = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen flex">
      <div className="w-1/2 h-full relative ">
        <img
          src="/Illustration.svg"
          alt="Illustration"
          className="w-full h-full object-contain object-left"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0 flex flex-col z-10">
          <div className="text-center px-8 mr-26">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 m-8">
              Virtual Learning & Collaboration
            </h2>
            <p className="text-lg text-gray-600">
              Join live classes, share resources, and connect <br />with peers — all from a single platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 h-full px-10 py-14 bg-white flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-10 text-gray-800 text-center">Forgot Password</h2>
        <p className="text-md text-gray-600 text-center mb-6">
          Enter the OTP that has been sent to your email
        </p>

        <form className="space-y-4 flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center" style={{ width: 400, minWidth: 50 }}>
            <FaEnvelope className="absolute left-4 text-gray-400 text-lg" />
            <input
              type="email"
              placeholder="Enter your email"
              className="pl-12 w-[200px] max-w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: 400, minWidth: 50 }}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition m-4"
            style={{ width: 400, minWidth: 50 }}
          >
            Get OTP
          </button>
             <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            style={{ width: 400, minWidth: 50 }}
          >
            Get back to login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Forgotpassword;
