"use client"

import React, { useEffect, useRef } from 'react';
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, MessageSquare, Clock } from 'lucide-react';

const LandingPage = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -50]);

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900 font-sans overflow-hidden">
      <div ref={targetRef} className="relative h-screen flex items-center justify-center">
        <motion.div 
          style={{ opacity, scale, y }}
          className="text-center z-10"
        >
          <h1 className="text-6xl sm:text-8xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Navi
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8">
            The AI-powered calendar that understands you
          </p>
          <Link href="/demo" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition duration-300 transform hover:scale-105">
            Experience Navi
          </Link>
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-[800px] h-[800px] bg-gradient-to-r from-blue-400 to-purple-400 rounded-full filter blur-3xl animate-pulse"></div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid gap-24 md:grid-cols-1 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <h2 className="text-4xl sm:text-5xl font-semibold leading-tight">
              Revolutionize your time management
            </h2>
            <ul className="space-y-6">
              {[
                { icon: Calendar, text: "AI-driven task prioritization" },
                { icon: MessageSquare, text: "Conversational scheduling" },
                { icon: Clock, text: "Predictive time optimization" },
              ].map((feature, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div className="bg-blue-100 p-3 rounded-full">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-lg">{feature.text}</span>
                </motion.li>
              ))}
            </ul>
            <Link href="/demo" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-8 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 transition duration-300 transform hover:scale-105">
            Try Navi now
          </Link>
          </motion.div>
        </div>
      </main>

      <footer className="bg-gray-50 py-12 mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 mb-4">&copy; 2024 Navi. All rights reserved.</p>
          <div className="space-x-6">
            <a href="https://www.linkedin.com/in/lex-fardella/" className="text-gray-600 hover:text-blue-600 transition duration-300">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;