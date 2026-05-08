// frontend/src/components/layout/Footer.tsx
"use client";

import React from "react";
import Link from "next/link";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-100 border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">North Wollo Tourism</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Discover the hidden gems of North Wollo, Ethiopia. Experience rich heritage, 
              breathtaking landscapes, and warm hospitality.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                className="w-10 h-10 bg-gray-300 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors text-gray-900 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77,7.46H14.5v-1.9c0-.9.6-1.1,1-1.1h3V.5h-4.33C10.24.5,9.5,3.44,9.5,5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4Z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-300 hover:bg-sky-500 rounded-full flex items-center justify-center transition-colors text-gray-900 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-300 hover:bg-pink-600 rounded-full flex items-center justify-center transition-colors text-gray-900 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-300 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors text-gray-900 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://t.me/northwollotourism" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-300 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors text-gray-900 hover:text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-300 hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link href="/tourisms" className="text-gray-300 hover:text-blue-400 transition-colors">Tourism Places</Link></li>
              <li><Link href="/hotels" className="text-gray-300 hover:text-blue-400 transition-colors">Hotels</Link></li>
              <li><Link href="/tourisms" className="text-gray-300 hover:text-blue-400 transition-colors">Interactive Map</Link></li>
              <li><Link href="/about" className="text-gray-300 hover:text-blue-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Explore Categories</h4>
            <ul className="space-y-3">
              <li><Link href="/tourisms?categories=HERITAGE" className="text-gray-300 hover:text-blue-400 transition-colors">🕌 Heritage Sites</Link></li>
              <li><Link href="/tourisms?categories=HIGHLAND" className="text-gray-300 hover:text-blue-400 transition-colors">⛰️ Highland Adventures</Link></li>
              <li><Link href="/tourisms?categories=CAVERN" className="text-gray-300 hover:text-blue-400 transition-colors">🕳️ Cave Explorations</Link></li>
              <li><Link href="/tourisms?categories=AQUATICS" className="text-gray-300 hover:text-blue-400 transition-colors">🌊 Aquatic Wonders</Link></li>
              <li><Link href="/tourisms?categories=CULTURE" className="text-gray-300 hover:text-blue-400 transition-colors">🎭 Cultural Experiences</Link></li>
              <li><Link href="/tourisms?categories=MODERN" className="text-gray-300 hover:text-blue-400 transition-colors">🏛️ Modern Attractions</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">📍</span>
                <span className="text-gray-300">Woldia, North Wollo Zone<br/>Amhara Region, Ethiopia</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">📞</span>
                <a href="tel:+251911234567" className="text-gray-300 hover:text-blue-400 transition-colors">+251 911 234 567</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">📧</span>
                <a href="mailto:info@northwollotourism.com" className="text-gray-300 hover:text-blue-400 transition-colors">info@northwollotourism.com</a>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-blue-400">🕐</span>
                <span className="text-gray-300">Mon - Sat: 8:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} North Wollo Tourism. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/tourisms" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</Link>
              <Link href="/tourisms" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</Link>
              <Link href="/tourisms" className="text-gray-400 hover:text-blue-400 transition-colors">FAQ</Link>
              <Link href="/tourisms" className="text-gray-400 hover:text-blue-400 transition-colors">Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
