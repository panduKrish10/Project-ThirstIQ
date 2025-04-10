import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Cloud, Droplets, CheckCircle2, Clock, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
}

interface WaterTask {
  id: string;
  time: Date;
  amount: number;
  completed: boolean;
}

const generateTasks = (dailyGoal: number): WaterTask[] => {
  const now = new Date();
  const tasks: WaterTask[] = [];
  const tasksCount = 8;
  const amountPerTask = Math.round(dailyGoal / tasksCount);

  for (let i = 0; i < tasksCount; i++) {
    const taskTime = new Date(now);
    taskTime.setHours(9 + Math.floor(i * (12 / tasksCount)));
    taskTime.setMinutes(Math.random() * 59);

    tasks.push({
      id: `task-${i}`,
      time: taskTime,
      amount: amountPerTask,
      completed: false
    });
  }

  return tasks.sort((a, b) => a.time.getTime() - b.time.getTime());
};

const Dashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [waterTasks, setWaterTasks] = useState<WaterTask[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    addBotMessage("👋 Hello! I'm your ThirstIQ assistant, powered by advanced AI to help you stay optimally hydrated. I analyze weather conditions to provide personalized hydration recommendations.");
    addBotMessage("To get started, please share your location so I can check the weather and create a personalized hydration schedule for you.");
  }, []);

  const addBotMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date()
    }]);
  };

  const fetchWeather = async (location: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: location,
          appid: 'dccf0a0d21c27eb93cc4412502ae13ea',
          units: 'metric'
        }
      });

      const weatherData = {
        temp: Math.round(response.data.main.temp),
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description
      };

      setWeather(weatherData);
      setCurrentLocation(location);
      calculateHydrationNeeds(weatherData);
      addBotMessage(`The current weather in ${location} is ${weatherData.temp}°C with ${weatherData.humidity}% humidity and ${weatherData.description}.`);
      
      return weatherData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Invalid API key. Please check your configuration.');
          addBotMessage("I'm having trouble accessing the weather service. Please try again in a moment.");
        } else if (error.response?.status === 404) {
          toast.error('Location not found. Please try a different city.');
          addBotMessage("I couldn't find that location. Please try entering a different city name.");
        } else {
          toast.error('Could not fetch weather data. Please try again later.');
          addBotMessage("I'm having trouble getting the weather information right now. Please try again in a moment.");
        }
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHydrationNeeds = (weatherData: WeatherData) => {
    let baseIntake = 2000;
    
    if (weatherData.temp > 25) {
      baseIntake += (weatherData.temp - 25) * 50;
    }
    
    if (weatherData.humidity > 60) {
      baseIntake += (weatherData.humidity - 60) * 20;
    }

    const roundedIntake = Math.round(baseIntake);
    setDailyGoal(roundedIntake);
    setWaterTasks(generateTasks(roundedIntake));
    addBotMessage(`Based on the current weather conditions, I recommend drinking ${roundedIntake}ml of water today. I've created a personalized schedule for you below. Would you like to log your water intake?`);
  };

  const handleTaskCompletion = (taskId: string) => {
    setWaterTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        if (!task.completed) {
          setWaterIntake(prev => prev + task.amount);
          toast.success(`Great job! You've completed your ${task.amount}ml water intake task. 💧`);
        }
        return { ...task, completed: true };
      }
      return task;
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    if (userMessage.match(/^[a-zA-Z\s]+$/)) {
      const weatherData = await fetchWeather(userMessage);
      if (!weatherData) {
        addBotMessage("You can try entering another location or log your water intake (e.g., '250ml').");
      }
    } else if (userMessage.match(/\d+\s*(ml|ML|mL)/)) {
      const amount = parseInt(userMessage.match(/\d+/)?.[0] || '0');
      setWaterIntake(prev => prev + amount);
      const progress = ((waterIntake + amount) / dailyGoal) * 100;
      
      if (progress >= 100) {
        addBotMessage(`Great job! You've reached your daily goal of ${dailyGoal}ml! 🎉 Keep staying hydrated!`);
      } else {
        addBotMessage(`I've logged ${amount}ml of water. You've consumed ${waterIntake + amount}ml today (${Math.round(progress)}% of your daily goal). Keep it up! 💧`);
      }
    } else {
      addBotMessage("I can help you track your water intake and provide recommendations based on weather. Try sharing your location or logging your water intake (e.g., '250ml').");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-[calc(100vh-24rem)] min-h-[400px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-700 dark:to-blue-600 p-4 flex items-center gap-3">
          <div className="relative">
            <Waves className="h-8 w-8 text-white/50 absolute" />
            <Bot className="h-8 w-8 text-white relative z-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">ThirstIQ Assistant</h2>
            <p className="text-sm text-blue-100">AI-Powered Hydration Guidance</p>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6 max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-600'
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                    )}
                  </div>
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {format(message.timestamp, 'HH:mm')}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 border-t border-gray-100 dark:border-gray-800">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-3 max-w-3xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your location or water intake (e.g., 250ml)..."
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              disabled={isLoading}
            />
            <motion.button
              type="submit"
              disabled={isLoading || !input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </motion.button>
          </form>
        </div>
      </div>

      {weather && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-800"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                <Cloud className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Water Intake Schedule for {currentLocation}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Based on {weather.temp}°C and {weather.humidity}% humidity
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Daily Goal
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {dailyGoal}ml
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {waterTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-xl border ${
                  task.completed
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(task.time, 'HH:mm')}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTaskCompletion(task.id)}
                    disabled={task.completed}
                    className={`p-1 rounded-full ${
                      task.completed
                        ? 'text-green-500 dark:text-green-400 cursor-default'
                        : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400'
                    }`}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </motion.button>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {task.amount}ml
                  </p>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: task.completed ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-600"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Total Progress
                </p>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {waterIntake}ml / {dailyGoal}ml
              </p>
            </div>
            <div className="mt-2 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(waterIntake / dailyGoal) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-600"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;