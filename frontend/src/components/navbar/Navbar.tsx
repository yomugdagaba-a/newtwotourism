"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold text-green-700">
        North Wollo Tourism
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-6 items-center">
        <Link href="/#about" className="hover:text-green-600">
          About
        </Link>
        <Link href="/#contact" className="hover:text-green-600">
          Contact
        </Link>
      </div>

      {/* Mobile / Auth Menu */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="text-2xl font-bold"
        >
          ☰
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md border">
            <Link
              href="/login"
              className="block px-4 py-2 hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="block px-4 py-2 hover:bg-gray-100"
            >
              Register
            </Link>
            <Link
              href="/reset-password"
              className="block px-4 py-2 hover:bg-gray-100"
            >
              Reset Password
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
