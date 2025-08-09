import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-6 md:px-20">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Column 1: Logo & Social */}
        <div>
          <h2 className="text-lg font-bold text-white">LearnOva</h2>
          <p className="mt-2 text-sm">
            Empowering education through technology since 2025.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="#" aria-label="Twitter">
              <Twitter className="w-5 h-5 hover:text-white" />
            </a>
            <a href="#" aria-label="Facebook">
              <Facebook className="w-5 h-5 hover:text-white" />
            </a>
            <a href="#" aria-label="Instagram">
              <Instagram className="w-5 h-5 hover:text-white" />
            </a>
            <a href="#" aria-label="YouTube">
              <Youtube className="w-5 h-5 hover:text-white" />
            </a>
          </div>
        </div>

        {/* Column 2: Product */}
        <div>
          <h3 className="text-white font-semibold mb-3">Product</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:underline">Features</a></li>
            <li><a href="#" className="hover:underline">Pricing</a></li>
            <li><a href="#" className="hover:underline">For Teachers</a></li>
            <li><a href="#" className="hover:underline">For Students</a></li>
            <li><a href="#" className="hover:underline">For Schools</a></li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div>
          <h3 className="text-white font-semibold mb-3">Support</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:underline">Help Center</a></li>
            <li><a href="#" className="hover:underline">Contact Us</a></li>
            <li><a href="#" className="hover:underline">Community</a></li>
            <li><a href="#" className="hover:underline">Tutorials</a></li>
            <li><a href="#" className="hover:underline">Webinars</a></li>
          </ul>
        </div>

        {/* Column 4: Subscribe */}
        <div>
          <h3 className="text-white font-semibold mb-3">Subscribe</h3>
          <p className="text-sm mb-3">Get the latest updates and news.</p>
          <form className="flex">
            <input
              type="email"
              placeholder="Your email"
              className="px-3 py-2 w-full text-gray-900 rounded-l-md focus:outline-none"
            />
            <button
              type="submit"
              className="bg-gray-700 px-3 py-2 rounded-r-md hover:bg-gray-600"
            >
              ➤
            </button>
          </form>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between text-sm text-gray-400">
        <p>© 2025 LearnOva. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
