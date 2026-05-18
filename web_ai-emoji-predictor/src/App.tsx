import { useState, useEffect } from 'react';
import { Client } from "@gradio/client";
import {
  Send,
  Loader2,
  Info,
  Github,
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Suggestion {
  text: string;
  emoji: string;
}

const SUGGESTIONS: Suggestion[] = [
  { text: "Lazy days with my pup are the best", emoji: "❤" },
  { text: "That is so hilarious lol", emoji: "😂" },
  { text: "BTS by rickrosephoto", emoji: "📷" },
  { text: "This new song is absolute fire!", emoji: "🔥" },
  { text: "Kendrick lamar inspires the shit outta me", emoji: "💯" },
  { text: "I’m a happy camper", emoji: "😊" },
  { text: "High five with my little niece", emoji: "😉" },
  { text: "Bright lights and bottle service", emoji: "😎" },
];

const EMOJI_MAP: Record<string, string> = {
  "happy": "😊",
  "joy": "😂",
  "sad": "😢",
  "angry": "😠",
  "love": "❤️",
  "vacation": "✈️",
  "heartbreaking": "💔",
  "amazing": "✨",
  "believe": "😱",
  "coffee": "☕",
  "work": "💻",
  "tired": "😴",
  "party": "🎉",
  "fire": "🔥",
  "cool": "😎",
  "default": "🤔"
};

const checkRuleBasedEmoji = (text: string): string | null => {
  const lowercaseText = text.toLowerCase();
  
  if (
    lowercaseText.includes("sad") ||
    lowercaseText.includes("cry") ||
    lowercaseText.includes("depress") ||
    lowercaseText.includes("heartbroken") ||
    lowercaseText.includes("sorrow") ||
    lowercaseText.includes("lonely") ||
    lowercaseText.includes("حزن") ||
    lowercaseText.includes("حزين") ||
    lowercaseText.includes("يبكي") ||
    lowercaseText.includes("بكاء") ||
    lowercaseText.includes("مكتئب")
  ) {
    return "😢";
  }

  if (
    lowercaseText.includes("angry") ||
    lowercaseText.includes("mad") ||
    lowercaseText.includes("hate") ||
    lowercaseText.includes("furious") ||
    lowercaseText.includes("annoy") ||
    lowercaseText.includes("غضب") ||
    lowercaseText.includes("غاضب") ||
    lowercaseText.includes("أكره") ||
    lowercaseText.includes("كره")
  ) {
    return "😠";
  }

  if (
    lowercaseText.includes("vacation") ||
    lowercaseText.includes("travel") ||
    lowercaseText.includes("plane") ||
    lowercaseText.includes("flight") ||
    lowercaseText.includes("holiday") ||
    lowercaseText.includes("سفر") ||
    lowercaseText.includes("طائرة") ||
    lowercaseText.includes("رحلة") ||
    lowercaseText.includes("عطلة")
  ) {
    return "✈️";
  }

  if (
    lowercaseText.includes("coffee") ||
    lowercaseText.includes("tea") ||
    lowercaseText.includes("caffeine") ||
    lowercaseText.includes("قهوة") ||
    lowercaseText.includes("شاي")
  ) {
    return "☕";
  }

  if (
    lowercaseText.includes("tired") ||
    lowercaseText.includes("sleep") ||
    lowercaseText.includes("exhaust") ||
    lowercaseText.includes("تعب") ||
    lowercaseText.includes("تعبان") ||
    lowercaseText.includes("مرهق") ||
    lowercaseText.includes("نوم")
  ) {
    return "😴";
  }

  return null;
};

export default function App() {
  const [inputText, setInputText] = useState("");
  const [predictedEmoji, setPredictedEmoji] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handlePredict = async (currentText: string = inputText) => {
    if (!currentText.trim()) return;

    setIsLoading(true);
    setPredictedEmoji(null);

    const ruleEmojiOriginal = checkRuleBasedEmoji(currentText);
    if (ruleEmojiOriginal) {
      setTimeout(() => {
        setPredictedEmoji(ruleEmojiOriginal);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const encodedInput = encodeURIComponent(currentText);
      const translateUrl = `https://api.mymemory.translated.net/get?q=${encodedInput}&langpair=ar|en`;

      const translateResponse = await fetch(translateUrl);
      const translateData = await translateResponse.json();

      if (!translateData.responseData || !translateData.responseData.translatedText) {
        throw new Error("Translation failed");
      }

      const englishText = translateData.responseData.translatedText;
      console.log("Translated Text:", englishText);

      const ruleEmojiTranslated = checkRuleBasedEmoji(englishText);
      if (ruleEmojiTranslated) {
        setPredictedEmoji(ruleEmojiTranslated);
        setIsLoading(false);
        return;
      }

      const client = await Client.connect("Nid4l/Emoji-Prediction-from-Text");
      const result = await client.predict("/predict", {
        text: englishText,
      });

      const data = result.data as any[];
      if (data && data.length > 0) {
        const outputLabel = data[0];
        const labelStr = typeof outputLabel === 'string' ? outputLabel : (outputLabel?.label || "🤔");
        const emoji = labelStr.split("  ")[0].trim();
        setPredictedEmoji(emoji);
      } else {
        setPredictedEmoji("🤔");
      }

    } catch (error) {
      console.error("Prediction failed:", error);
      alert("Something went wrong. Please check if your Hugging Face Space is active.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setInputText(suggestionText);
    handlePredict(suggestionText);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <Sparkles size={22} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Emoji Predictor
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col gap-10">
          <section className="text-center space-y-6">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-tight px-4"
            >
              Analyze Your Sentiments with <span className="text-primary-600 text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">AI</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 py-6 md:py-12"
            >
              {[
                {
                  name: "Ahmad Hazaymih",
                  img: "/image/Ahmad.jpeg",
                },
                {
                  name: "Zaid AI_Sulaiman",
                  img: "/image/Zaid.jpeg",
                },
                {
                  name: "Aktham Batinah",
                  img: "/image/Aktham.jpeg",
                },
                {
                  name: "Hamza Bani Hani",
                  img: "/image/Hamza.jpeg",
                }
              ].map((dev, i) => (
                <div key={i} className="flex flex-col items-center gap-2 md:gap-3 group">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full ring-6 ring-white dark:ring-slate-950 overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all duration-500 shadow-xl group-hover:shadow-primary-500/50 group-hover:scale-105">
                      <img
                        className="h-full w-full object-cover transition-transform duration-500 sharp-image"
                        src={dev.img}
                        alt={dev.name}
                        loading="eager"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dev.name)}&background=random&color=fff&size=512`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center px-1">
                    <h4 className="text-sm md:text-lg font-bold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-none">{dev.name}</h4>
                  </div>
                </div>
              ))}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4"
            >
              Type any sentence and our NLP model will predict the most matching emoji based on the sentiment and context.
            </motion.p>
          </section>

          <div className="grid gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-3xl p-6 md:p-8 space-y-6"
            >
              <div className="relative">
                <textarea
                  id="sentiment-input"
                  className="w-full min-h-[160px] p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus:border-primary-500 dark:focus:border-primary-600 outline-none resize-none text-lg transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
                  placeholder="Type a sentence here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handlePredict();
                  }}
                />
                <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-2 text-xs font-medium text-slate-400">
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">Enter</kbd>
                  <span>to predict</span>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 min-h-[80px]">
                  <AnimatePresence mode="wait">
                    {predictedEmoji ? (
                      <motion.div
                        key="prediction"
                        initial={{ scale: 0, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="relative group"
                      >
                        <div className="absolute -inset-4 bg-primary-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-6xl md:text-7xl emoji-bounce cursor-default select-none relative">
                          {predictedEmoji}
                        </div>
                      </motion.div>
                    ) : isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                        <span className="text-xs font-semibold text-primary-600 uppercase tracking-widest">Predicting...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 text-slate-400 dark:text-slate-600"
                      >
                        <Zap size={24} />
                        <span className="text-sm font-medium">Ready for your text</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 w-full lg:w-auto">
                  <button
                    onClick={() => {
                      setInputText("");
                      setPredictedEmoji(null);
                    }}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 group"
                    title="Clear text"
                  >
                    <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                  <button
                    id="predict-button"
                    onClick={() => handlePredict()}
                    disabled={isLoading || !inputText.trim()}
                    className="px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-primary-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    <span className="whitespace-nowrap">Predict Emoji</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <Zap size={14} className="text-amber-500" />
                  Quick Try
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <span className="text-base">{suggestion.emoji}</span>
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-100 dark:bg-slate-900/50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-6 border border-transparent dark:border-slate-800"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Info size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">How It Works</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  This application utilizes a powerful <strong>NLP (Natural Language Processing)</strong> Machine Learning model to analyze the emotional nuance and semantic context of your sentences. By processing text sentiment, it maps your words to the most appropriate visual representation—an emoji.
                </p>
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 mt-12">
        <div className="container mx-auto px-4 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Ahmad12Rased/Emoji-Prediction-from-Text"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-black dark:hover:text-white transition-all shadow-sm"
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
