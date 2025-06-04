'use client';

import Image from 'next/image';
import { useRef } from 'react';

const VerifyOtp = () => {
  // Create refs for each input
  const inputs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  // Handle input change and auto-focus next
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const value = e.target.value;
    if (value.length === 1 && idx < 5) {
      inputs[idx + 1].current?.focus();
    }
    if (value.length === 0 && idx > 0) {
      inputs[idx - 1].current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex">
      {/* Left Panel */}
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
      <div className="w-1/2 h-full px-8 md:px-24 py-10 md:py-20 bg-white flex flex-col justify-center">
        <h2 className="text-2xl font-semibold mb-10 text-gray-800 text-center">Verify OTP</h2>
        <p className="text-md text-gray-600 text-center mb-6">
          Enter the OTP that has been sent to your email
        </p>

        <form className="space-y-6 flex flex-col items-center">
          <div className="flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <input
                key={idx}
                ref={inputs[idx]}
                type="text"
                maxLength={1}
                className="text-center text-2xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ width: 40, height: 40, minWidth: 40, maxWidth: 40 }}
                onChange={e => handleChange(e, idx)}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition self-center"
            style={{ width: 289, minWidth: 50, borderRadius: 40, height: 40 }}
          >
            Verify OTP
          </button>
        </form>

        <p className="text-sm mt-6 text-gray-500 text-center">
          Didn't receive the code?{' '}
          <a href="#" className="text-blue-600 hover:underline">
            Resend OTP
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;