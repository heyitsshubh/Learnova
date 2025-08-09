"use client";
import { FiArrowRight } from "react-icons/fi";
import { FaBook } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F1F1] w-full">
      {/* Navbar */}
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm w-full">
        <div className="flex items-center gap-2">
          <Image
            src="/logooo.svg"
            alt="learnOva logo"
            width={40}
            height={40}
            className="h-6 w-6"
            priority
          />
                <span className="font-bold" style={{ fontSize: 24 }}>learnOva</span>
        </div>
        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
          <a href="#">Home</a>
          <a href="#Feature">Features</a>
          <a href="#">FAQs</a>
          <a href="#">Contact Us</a>
        </nav>
      <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <button className="border border-black rounded-full px-4 py-2 hover:bg-black hover:text-white transition">
              Log in
            </button>
          </Link>
          <Link href="/signup">
            <button className="flex items-center gap-2 border border-black rounded-full px-4 py-2 bg-black text-white hover:bg-white hover:text-black transition">
              Sign up <FiArrowRight />
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
<main className="flex flex-col-reverse md:flex-row items-center justify-center w-full px-4 md:px-12 py-16 bg-[#fafafa] flex-1">
        {/* Left Side */}
        <div className="max-w-lg mb-30">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-snug">
            Empower Learning.
            <br /> Anytime, Anywhere.
          </h1>
          <p className="mt-4 text-gray-600">
            Join a seamless, interactive digital classroom   <br /> 
            experience designed
            for the future of education.  <br />  Connect,{" "}
            {/* <a href="#" className="text-blue-500 underline"> */}
              collaborate, and learn with cutting-edge tools.
            {/* </a> */}
          </p>
          <div className="mt-6 flex gap-4">
             <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md shadow hover:bg-gray-800">
              <FaBook className="w-5 h-5" />
              Start learning
            </button>
            <button className="border border-black px-4 py-2 rounded-md hover:bg-gray-100">
              Know more
            </button>
          </div>
        </div>

        {/* Right Side */}
      <div className="flex justify-center items-center mb-10 md:mb-0">
  <Image
    src="/landing.svg"
    alt="Hero Illustration"
    width={500}
    height={500}
    className="w-full h-auto"
    priority
  />
</div>
      </main>
    </div>
  );
}