'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOtpp, resendOtp } from '../../services/auth';
import { setResetToken } from '../../utils/token';
import { toast } from 'react-hot-toast';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const VerifyOtp = () => {
  const router = useRouter();
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  if (inputRefs.current.length !== 6) {
    inputRefs.current = Array(6).fill(null);
  }

  const [email] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('email') || '' : ''));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);

    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    } else if (!value && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const otpValue = otp.join('');
      const res = await verifyOtpp({ email, otp: otpValue });

      if (res?.resetToken) {
        setResetToken(res.resetToken);
      }

      toast.success('OTP verified successfully!');
      router.push('/reset-password');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const msg =
        apiError?.response?.data?.message ||
        apiError?.message ||
        'OTP verification failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setResendMessage(null);
    setError(null);
    try {
      await resendOtp({ email });
      setResendMessage('OTP resent successfully!');
      toast.success('OTP resent successfully!');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const msg =
        apiError?.response?.data?.message ||
        apiError?.message ||
        'Failed to resend OTP';
      toast.error(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col md:flex-row">
      {/* Left Panel: Hide on mobile */}
      <div className="hidden md:block md:w-1/2 h-64 md:h-full relative">
        <Image
          src="/Component.svg"
          alt="Illustration"
          width={800}
          height={600}
          className="w-full h-full object-contain object-left"
          style={{ zIndex: 0 }}
        />
        <div className="absolute inset-0 flex flex-col z-10">
          <div className="text-left m-10 md:m-20">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Reset Password
            </h2>
            <p className="text-lg text-black-600">
              Don&apos;t remember your password? 
              <br />Don&apos;t worry!!! we are here to help you.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 h-full px-4 sm:px-8 md:px-24 py-10 md:py-20 bg-white flex flex-col justify-center">
        <h2 className="text-2xl font-semibold mb-10 text-gray-800 text-center">Verify OTP</h2>
        <p className="text-md text-gray-600 text-center mb-6">
          Enter the OTP that has been sent to your email
        </p>

        <form className="space-y-6 flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                className="text-center text-2xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ width: 40, height: 40, minWidth: 40, maxWidth: 40 }}
                onChange={(e) => handleChange(e, idx)}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
              />
            ))}
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {resendMessage && <div className="text-green-500 text-sm text-center">{resendMessage}</div>}

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition self-center"
            style={{ width: 289, borderRadius: 40, height: 40 }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <p className="text-sm mt-6 text-gray-500 text-center">
          Didn&apos;t receive the code?{' '}
          <a
            href="#"
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={handleResendOtp}
            style={{
              cursor: resendLoading ? 'not-allowed' : 'pointer',
              pointerEvents: resendLoading ? 'none' : 'auto'
            }}
          >
            {resendLoading ? 'Resending...' : 'Resend OTP'}
          </a>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;