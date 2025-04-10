import React, { useState } from 'react';
import { Droplets, Sun, Moon, Waves, Sparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Dashboard from './components/Dashboard';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen ${isDarkMode ? 'dark bg-[#111827]' : 'bg-[#f8fafc]'}`}
    >
      <Toaster position="top-right" />
      <nav className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-700 dark:to-blue-600 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Waves className="h-8 w-8 text-white absolute opacity-50 transform translate-x-0.5 translate-y-0.5" />
                  <Sparkles className="h-8 w-8 text-white absolute opacity-50 transform -translate-x-0.5 -translate-y-0.5" />
                  <Droplets className="h-8 w-8 text-white relative z-10" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">
                    ThirstIQ
                  </span>
                  <span className="block text-xs text-blue-100 font-medium">
                    Smart Hydration Assistant
                  </span>
                </div>
              </div>
            </motion.div>
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isDarkMode ? (
                  <Sun className="h-6 w-6 text-white" />
                ) : (
                  <Moon className="h-6 w-6 text-white" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Dashboard />
      </main>
    </motion.div>
  );
}

export default App;