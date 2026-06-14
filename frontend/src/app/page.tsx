'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowRight, FiVideo } from 'react-icons/fi';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <nav className="border-b border-dark-700 sticky top-0 z-50 bg-dark-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FiVideo className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold">AI Video Editor</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="text-gray-300 hover:text-white transition"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/register')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
            Remove Logos & Watermarks with AI
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Professional video editing powered by artificial intelligence.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center space-x-2 mx-auto transition"
          >
            <span>Get Started</span>
            <FiArrowRight />
          </button>
        </div>
      </section>
    </div>
  );
}
