"use client";
import { FiArrowRight } from "react-icons/fi";
import { FaBook } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans  w-full"
        style={{ background: "rgba(245, 241, 241, 1)" }}>
      <header className="flex justify-between items-center px-8 py-4 bg-white shadow-sm w-full">
        <div className="flex items-center gap-2">
          <Image
      src="/logooo.svg"
      alt="learnOva logo"
      width={64} 
      height={64} 
      className="h-12 w-12" 
      priority
    />
                <span className="font-bold" style={{ fontSize: 24 }}>learnOva</span>
        </div>
     <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
  <Link
    href="/"
    className="transition-colors text-[1.25rem] duration-200 hover:text-black hover:underline underline-offset-4"
  >
    Home
  </Link>
  <Link
    href="/#Feature"
    className="transition-colors text-[1.25rem] duration-200 hover:text-black hover:underline underline-offset-4"
  >
    Features
  </Link>
  <Link
    href="/#FAQs"
    className="transition-colors text-[1.25rem] duration-200 hover:text-black hover:underline underline-offset-4"
  >
    FAQs
  </Link>
  <Link
    href="/#Contact Us"
    className="transition-colors text-[1.25rem] duration-200 hover:text-black hover:underline underline-offset-4"
  >
    Contact Us
  </Link>
</nav>
      <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <button className="border border-black rounded-full px-4 py-2 hover:bg-black hover:text-white transition cursor-pointer">
              Log in
            </button>
          </Link>
          <Link href="/signup">
            <button className="flex items-center gap-2 border border-black rounded-full px-4 py-2 bg-black text-white hover:bg-white hover:text-black transition cursor-pointer">
              Sign up <FiArrowRight />
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
<main className="flex flex-col-reverse md:flex-row items-center justify-center w-full px-4 md:px-12 py-16 bg-[#fafafa] flex-1">
        {/* Left Side */}
        <div className="max-w-lg mb-30">
      <motion.h1
    className="text-4xl font-extrabold text-gray-900 leading-snug"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.1 }}
  >
    Empower Learning.
    <br /> Anytime, Anywhere.
  </motion.h1>
  <motion.p
    className="mt-4 text-gray-600"
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.4 }}
  >
    Join a seamless, interactive digital classroom <br />
    experience designed for the future of education. <br /> Connect, collaborate, and learn with cutting-edge tools.
  </motion.p>
          <div className="mt-6 flex gap-4">
              <Link href="/signup">
             <motion.button
      className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md shadow hover:bg-gray-800 hover:scale-105 transition duration-200 cursor-pointer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      whileHover={{ scale: 1.07 }}
    >
      <FaBook className="w-5 h-5" />
      Start learning
    </motion.button>
  </Link>
  <motion.button
    className="border border-black px-4 py-2 rounded-md hover:bg-gray-100 hover:scale-105 transition duration-200"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: 0.8 }}
    whileHover={{ scale: 1.07 }}
  >
    Know more
  </motion.button>
          </div>
        </div>

        {/* Right Side */}
      <div className="flex justify-center items-center mb-10 md:mb-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image
              src="/landing.svg"
              alt="Hero Illustration"
              width={500}
              height={500}
              className="w-full h-auto"
              priority
            />
          </motion.div>
</div>
      </main>
    </div>
  );
}