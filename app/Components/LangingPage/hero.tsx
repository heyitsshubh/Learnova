"use client";
import { FiArrowRight } from "react-icons/fi";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white w-full">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm w-full">
        <div className="flex items-center gap-2">
          <Image
            src="/logoo.svg"
            alt="learnOva logo"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
          <span className="font-bold text-lg">learnOva</span>
        </div>
        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <a href="#">Home</a>
          <a href="#">Features</a>
          <a href="#">FAQs</a>
          <a href="#">Contact Us</a>
        </nav>
        <button className="hidden md:flex items-center gap-2 border border-black rounded-full px-4 py-2 hover:bg-black hover:text-white transition">
          Get Started <FiArrowRight />
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col-reverse md:flex-row items-center justify-between w-full px-4 md:px-12 py-16 bg-[#fafafa] flex-1">
        {/* Left Side */}
        <div className="max-w-lg">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-snug">
            Empower Learning.
            <br /> Anytime, Anywhere.
          </h1>
          <p className="mt-4 text-gray-600">
            Join a seamless, interactive digital classroom experience designed
            for the future of education. Connect,{" "}
            <a href="#" className="text-blue-500 underline">
              collaborate, and learn with cutting-edge tools.
            </a>
          </p>
          <div className="mt-6 flex gap-4">
            <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md shadow hover:bg-gray-800">
              📚 Start learning
            </button>
            <button className="border border-gray-400 px-4 py-2 rounded-md hover:bg-gray-100">
              Know more
            </button>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex justify-center md:justify-end mb-10 md:mb-0">
          <Image
            src="/landing.svg"
            alt="Hero Illustration"
            width={400}
            height={400}
            className="max-w-sm w-full h-auto"
            priority
          />
        </div>
      </main>
    </div>
  );
}