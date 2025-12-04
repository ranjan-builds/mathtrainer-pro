import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Sigma, 
  Settings, 
  RotateCcw, 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Zap,
  Activity,
  ArrowRight,
  Delete,
  Plus,
  Minus,
  X,
  Divide,
  Github,
  TrendingUp,
  History
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// --- Chart.js Registration ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Utility Functions ---

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const getRandomNumber = (digits) => {
  const d = Number(digits);
  const min = Math.pow(10, d - 1);
  const max = Math.pow(10, d) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const calculate = (num1, num2, op) => {
  switch (op) {
    case "+": return num1 + num2;
    case "-": return num1 - num2;
    case "*": return num1 * num2;
    case "/": return num2 !== 0 ? num1 / num2 : 0;
    default: return 0;
  }
};

// --- Custom Hooks ---

// Hook to detect mobile screen width
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// --- Storage Utils ---
const STORAGE_KEY = 'math-trainer-history-v1';

const saveResult = (resultData) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const entry = { ...resultData, timestamp: Date.now() };
    const updated = [...existing, entry];
    if (updated.length > 100) updated.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

const getHistory = (mode) => {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return all.filter(r => r.mode === mode);
  } catch (e) {
    return [];
  }
};

// --- Helper Components ---

const OperationIcon = ({ op, className }) => {
  const props = { className: cn("w-5 h-5 md:w-8 md:h-5 text-neutral-500", className) };
  switch (op) {
    case "+": return <Plus {...props} />;
    case "-": return <Minus {...props} />;
    case "*": return <X {...props} />;
    case "/": return <Divide {...props} />;
    default: return <span className={cn("text-xl md:text-3xl text-neutral-500", className)}>{op}</span>;
  }
};

const Button = ({ children, onClick, variant = 'primary', className, disabled, size = 'md' }) => {
  const base = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-50 disabled:pointer-events-none active:scale-95 cursor-pointer";
  
  const variants = {
    primary: "bg-white text-neutral-950 hover:bg-neutral-200 focus:ring-white",
    secondary: "bg-neutral-800 text-white hover:bg-neutral-700 focus:ring-neutral-700",
    outline: "border border-neutral-700 text-neutral-300 hover:bg-neutral-800 focus:ring-neutral-700",
    ghost: "text-neutral-400 hover:text-white hover:bg-neutral-800/50",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/50"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-6 py-3.5",
    icon: "p-2.5"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }) => (
  <div className={cn("bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl overflow-hidden", className)}>
    {children}
  </div>
);

const Numpad = ({ onInput, onDelete, disabled }) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0];

  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto mt-6">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => onInput(k)}
          disabled={disabled}
          className="h-14 rounded-xl bg-neutral-800/50 hover:bg-neutral-700 text-2xl font-semibold text-white transition-colors active:bg-neutral-600 disabled:opacity-30 cursor-pointer"
        >
          {k}
        </button>
      ))}
      <button
        onClick={onDelete}
        disabled={disabled}
        className="h-14 rounded-xl bg-neutral-800/50 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors flex items-center justify-center active:bg-neutral-600 disabled:opacity-30 cursor-pointer"
      >
        <Delete size={24} />
      </button>
    </div>
  );
};

const GameModeCard = ({ title, description, icon: Icon, active, onClick, color }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl border text-left transition-all duration-200 w-full group overflow-hidden cursor-pointer",
        active 
          ? "bg-neutral-800 border-neutral-600 ring-1 ring-neutral-500" 
          : "bg-neutral-900/30 border-neutral-800 hover:bg-neutral-800/50 hover:border-neutral-700"
      )}
    >
      <div className={cn("absolute top-0 right-0 p-20 opacity-5 rounded-full blur-3xl transition-opacity", color, active ? "opacity-20" : "group-hover:opacity-10")} />
      <div className="relative z-10 flex items-start gap-4">
        <div className={cn("p-3 rounded-xl", active ? "bg-neutral-950" : "bg-neutral-800")}>
          <Icon className={cn("w-6 h-6", active ? "text-white" : "text-neutral-400")} />
        </div>
        <div>
          <h3 className={cn("font-semibold", active ? "text-white" : "text-neutral-200")}>{title}</h3>
          <p className="text-sm text-neutral-500 mt-1 leading-snug">{description}</p>
        </div>
      </div>
    </button>
  );
};

// --- Performance Graph Component ---

const PerformanceGraph = ({ history }) => {
  if (!history || history.length < 2) return (
    <div className="flex flex-col items-center justify-center h-48 text-neutral-500 text-sm border border-dashed border-neutral-800 rounded-xl">
      <Activity className="mb-2 opacity-50" />
      <p>Play more games to see your trend</p>
    </div>
  );

  const dataPoints = history.map((h, i) => ({
    label: `Game ${i + 1}`,
    value: h.avgTime
  }));

  const data = {
    labels: dataPoints.map(d => d.label),
    datasets: [
      {
        label: 'Avg Time (sec)',
        data: dataPoints.map(d => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(23, 23, 23, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `Avg Time: ${context.parsed.y.toFixed(2)}s`
        }
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: 'rgba(148, 163, 184, 0.5)', font: { size: 10 } }
      },
      y: {
        // Reverse axis: Lower time (better) is at the top
        reverse: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
        ticks: { color: 'rgba(148, 163, 184, 0.5)', font: { size: 10 } },
        beginAtZero: false, 
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="w-full mt-4 h-64 bg-neutral-900/30 rounded-xl border border-neutral-800/50 p-4">
      <Line data={data} options={options} />
    </div>
  );
};

// --- Sub-Screens ---

const MenuScreen = ({ gameMode, setGameMode, settings, setSettings, onStart }) => (
  <div className="max-w-4xl mx-auto pt-8 px-4 pb-20">
    <header className="flex items-center justify-between gap-4 mb-12">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-neutral-950 shadow-lg shadow-white/10">
          <Sigma size={24} className="md:w-7 md:h-7" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Math Trainer</h1>
          <p className="text-sm md:text-base text-neutral-400">Master mental arithmetic</p>
        </div>
      </div>

      <a 
        href="https://github.com/ranjan-builds" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors bg-neutral-900/50 px-3 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 cursor-pointer"
      >
        <Github size={18} />
        <span className="hidden sm:inline text-xs font-medium">ranjan-builds</span>
      </a>
    </header>

    <div className="grid md:grid-cols-12 gap-8">
      {/* Game Modes */}
      <div className="md:col-span-7 space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Activity size={20} className="text-blue-400" />
          Select Mode
        </h2>
        <div className="grid gap-3">
          <GameModeCard 
            active={gameMode === 'marathon'}
            onClick={() => setGameMode('marathon')}
            title="Marathon"
            description="Complete a fixed set of problems at your own pace. Perfect for daily practice."
            icon={Target}
            color="bg-blue-500"
          />
          <GameModeCard 
            active={gameMode === 'sprint'}
            onClick={() => setGameMode('sprint')}
            title="Sprint"
            description="Race against the clock! Solve as many problems as you can in 60 seconds."
            icon={Clock}
            color="bg-orange-500"
          />
          <GameModeCard 
            active={gameMode === 'survival'}
            onClick={() => setGameMode('survival')}
            title="Survival"
            description="One mistake and it's game over. How long can you last?"
            icon={Zap}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Configuration */}
      <div className="md:col-span-5 space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Settings size={20} className="text-neutral-400" />
          Configuration
        </h2>
        
        <Card className="p-6 space-y-6">
          {/* Operation Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-400">Operations</label>
            <div className="grid grid-cols-5 gap-2">
              {['+', '-', '*', '/', 'mixed'].map(op => (
                <button
                  key={op}
                  onClick={() => setSettings(s => ({ ...s, operation: op }))}
                  className={cn(
                    "h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-all cursor-pointer",
                    settings.operation === op 
                      ? "bg-white text-neutral-950 shadow-md" 
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  )}
                >
                  {op === 'mixed' ? '?' : <OperationIcon op={op} className="w-4 h-4 text-inherit" />}
                </button>
              ))}
            </div>
          </div>

          {/* Digit Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-400">1st Number</label>
              <div className="flex bg-neutral-800 p-1 rounded-lg">
                {[1, 2, 3].map(d => (
                  <button
                    key={d}
                    onClick={() => setSettings(s => ({ ...s, firstDigits: d }))}
                    className={cn(
                      "flex-1 h-8 rounded-md text-sm font-medium transition-all cursor-pointer",
                      settings.firstDigits == d 
                        ? "bg-neutral-700 text-white shadow-sm" 
                        : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-400">2nd Number</label>
              <div className="flex bg-neutral-800 p-1 rounded-lg">
                {[1, 2, 3].map(d => (
                  <button
                    key={d}
                    onClick={() => setSettings(s => ({ ...s, secondDigits: d }))}
                    className={cn(
                      "flex-1 h-8 rounded-md text-sm font-medium transition-all cursor-pointer",
                      settings.secondDigits == d 
                        ? "bg-neutral-700 text-white shadow-sm" 
                        : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>
          </div>

          {gameMode === 'marathon' && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-neutral-400">Problem Count</label>
                <span className="text-sm font-bold text-white">{settings.count}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={settings.count}
                onChange={(e) => setSettings(s => ({ ...s, count: parseInt(e.target.value) }))}
                className="w-full accent-white h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          <Button onClick={onStart} size="lg" className="w-full gap-2 mt-4 cursor-pointer">
            Start Quiz <ArrowRight size={18} />
          </Button>
        </Card>
      </div>
    </div>
  </div>
);

const GameScreen = ({ problems, currentIdx, gameMode, timeLeft, duration, onAnswer, onAbort }) => {
  const problem = problems[currentIdx];
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState("idle");
  const inputRef = useRef(null);
  
  const isMobile = useIsMobile();
  const onAnswerRef = useRef(onAnswer);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  // Maintain focus logic
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(timer);
  }, [currentIdx]);

  // Detection Logic
  useEffect(() => {
    if (!inputValue || status !== 'idle') return;

    const val = parseFloat(inputValue);
    const isCorrect = val === problem.answer;

    if (isCorrect) {
      setStatus("correct");
    } else if (gameMode === 'survival') {
       const answerLength = problem.answer.toString().length;
       if (inputValue.length >= answerLength) {
          if (!isCorrect) {
             setStatus("wrong");
          }
       }
    }
  }, [inputValue, problem.answer, status, gameMode]);

  // Submission Logic
  useEffect(() => {
    if (status === 'correct' || status === 'wrong') {
      const timer = setTimeout(() => {
        onAnswerRef.current(inputValue);
        setInputValue("");
        setStatus("idle");
      }, 200); 
      return () => clearTimeout(timer);
    }
  }, [status, inputValue]);

  const handleInput = (val) => {
    setInputValue(prev => prev + val);
  };

  const handleDelete = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const progress = gameMode === 'sprint' 
    ? (timeLeft / duration) * 100 
    : ((currentIdx) / problems.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-4">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-neutral-800 rounded-full mb-8 overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000 ease-linear", gameMode === 'sprint' ? "bg-orange-500" : "bg-blue-500")}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full flex justify-between items-center mb-12 text-neutral-400 font-mono text-sm">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", status === 'idle' ? "bg-neutral-600" : status === 'correct' ? "bg-green-500" : "bg-red-500")} />
          {gameMode === 'sprint' ? 'Time Remaining' : 'Question'}
        </div>
        <div className="text-white font-bold">
          {gameMode === 'sprint' ? `${timeLeft}s` : `${currentIdx + 1} / ${problems.length}`}
        </div>
      </div>

      {/* Main Problem Display */}
      <div className="text-center mb-12 relative w-full">
        <div className={cn(
          "text-6xl sm:text-7xl md:text-9xl font-bold tracking-tighter transition-all duration-300 flex items-center justify-center gap-4 sm:gap-6 md:gap-12",
          status === 'correct' ? "text-green-500 scale-110" : status === 'wrong' ? "text-red-500 shake" : "text-white"
        )}>
          <span>{problem.num1}</span>
          <OperationIcon op={problem.op} />
          <span>{problem.num2}</span>
        </div>
      </div>

      <div className="w-full max-w-sm relative">
        <input
          ref={inputRef}
          type="number"
          inputMode={isMobile ? "none" : "decimal"} // Prevent virtual keyboard on mobile
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="?"
          className={cn(
            "w-full bg-transparent border-b-4 text-center text-5xl md:text-6xl font-bold py-4 focus:outline-none transition-colors placeholder:text-neutral-800",
            status === 'correct' ? "border-green-500 text-green-500" : status === 'wrong' ? "border-red-500 text-red-500" : "border-neutral-700 text-white focus:border-white"
          )}
          autoFocus
        />
      </div>

      {/* Always show Numpad on mobile */}
      <div className="md:hidden w-full">
        <Numpad 
          onInput={handleInput} 
          onDelete={handleDelete}
          disabled={status !== 'idle'}
        />
        {/* Abort button for mobile, placed after numpad */}
        <div className="mt-6 flex justify-center">
          <Button variant="danger" size="sm" onClick={onAbort} className="w-full h-12 text-base cursor-pointer">
            Abort Game
          </Button>
        </div>
      </div>

      <div className="hidden md:flex gap-4 mt-12">
        <Button variant="ghost" onClick={onAbort} className="cursor-pointer">Abort</Button>
      </div>
    </div>
  );
};

const ResultsScreen = ({ results, gameMode, onPlayAgain, onMenu }) => {
  const correctCount = results.filter(r => r.correct).length;
  const totalTime = results.reduce((acc, curr) => acc + curr.time, 0);
  const avgTime = results.length > 0 ? (totalTime / results.length) : 0;
  
  const history = useMemo(() => getHistory(gameMode), [gameMode]);

  return (
    <div className="max-w-2xl mx-auto pt-10 px-4 pb-20">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 rounded-full bg-neutral-800 mb-6 ring-4 ring-neutral-900 shadow-xl">
          <Trophy size={40} className="text-yellow-400" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">Session Complete</h2>
        <p className="text-neutral-400">Great job! Here is how you performed.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4 text-center">
          <div className="text-sm text-neutral-500 mb-1">Score</div>
          <div className="text-2xl font-bold text-white">{correctCount} <span className="text-neutral-600 text-lg">/ {results.length}</span></div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-neutral-500 mb-1">Total Time</div>
          <div className="text-2xl font-bold text-white">{Math.round(totalTime)}s</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-neutral-500 mb-1">Avg per Q</div>
          <div className={cn("text-2xl font-bold text-blue-400")}>
            {avgTime.toFixed(1)}s
          </div>
        </Card>
      </div>

      <Card className="mb-8 p-4">
        <div className="flex items-center gap-2 mb-4 font-semibold text-white">
          <TrendingUp size={18} className="text-blue-400" />
          Performance History
        </div>
        <PerformanceGraph history={history} />
      </Card>

      <Card className="mb-8">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
          <h3 className="font-semibold text-white flex items-center gap-2"><History size={16}/> Details</h3>
          <span className="text-xs text-neutral-500 uppercase font-medium tracking-wider">Recent Problems</span>
        </div>
        <div className="max-h-60 overflow-y-auto divide-y divide-neutral-800">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4 font-mono text-lg">
                <span className={cn(r.correct ? "text-green-500" : "text-red-500")}>
                  {r.correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </span>
                <span className="text-neutral-300 flex items-center gap-2">
                  {r.num1} <OperationIcon op={r.op} className="w-4 h-4" /> {r.num2} = <span className="text-white font-bold">{r.answer}</span>
                </span>
              </div>
              <div className="text-right">
                {!r.correct && <div className="text-xs text-red-400 mb-1">You: {r.userAnswer}</div>}
                <div className="text-xs text-neutral-500 flex items-center gap-1 justify-end">
                  <Clock size={12} /> {r.time.toFixed(1)}s
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onPlayAgain} className="flex-1 gap-2 cursor-pointer" size="lg">
          <RotateCcw size={18} /> Play Again
        </Button>
        <Button variant="secondary" onClick={onMenu} className="flex-1 gap-2 cursor-pointer" size="lg">
          Main Menu
        </Button>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [gameMode, setGameMode] = useState('marathon'); 
  
  const [settings, setSettings] = useState({
    firstDigits: "2",
    secondDigits: "2",
    operation: "+", 
    count: 10,
    duration: 60,
  });

  const [problems, setProblems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]); 
  const [startTime, setStartTime] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const generateProblems = useCallback((mode, customSettings) => {
    let count = 10;
    if (mode === 'sprint') count = 999;
    if (mode === 'marathon') count = customSettings.count;
    if (mode === 'survival') count = 999;

    const newProblems = Array.from({ length: count }, () => {
      const op = customSettings.operation === 'mixed' 
        ? ['+', '-', '*', '/'][Math.floor(Math.random() * 4)] 
        : customSettings.operation;

      let d1 = customSettings.firstDigits;
      let d2 = customSettings.secondDigits;
      
      let num1 = getRandomNumber(d1);
      let num2 = getRandomNumber(d2);

      if (op === '-') {
        if (num1 < num2) [num1, num2] = [num2, num1];
      }
      if (op === '/') {
        num2 = Math.max(2, getRandomNumber(Math.min(d2, 2))); 
        const result = getRandomNumber(Math.max(1, d1 - 1)); 
        num1 = num2 * result; 
      }

      return {
        num1,
        num2,
        op,
        answer: calculate(num1, num2, op),
        id: Math.random().toString(36).substr(2, 9)
      };
    });
    return newProblems;
  }, []);

  const startGame = () => {
    const generated = generateProblems(gameMode, settings);
    setProblems(generated);
    setCurrentIdx(0);
    setScore(0);
    setResults([]);
    setScreen('game');
    setStartTime(Date.now());
    
    if (gameMode === 'sprint') {
      setGameStartTime(Date.now());
      setTimeLeft(settings.duration);
    }
  };

  const resultsRef = useRef(results);
  const gameModeRef = useRef(gameMode);
  
  useEffect(() => {
    resultsRef.current = results;
    gameModeRef.current = gameMode;
  }, [results, gameMode]);

  const handleAnswer = (userVal) => {
    const problem = problems[currentIdx];
    const isCorrect = parseFloat(userVal) === problem.answer;
    const timeTaken = (Date.now() - startTime) / 1000;

    const resultEntry = {
      ...problem,
      userAnswer: userVal,
      correct: isCorrect,
      time: timeTaken
    };

    const newResults = [...results, resultEntry];
    setResults(newResults);

    if (isCorrect) setScore(s => s + 1);

    if (gameMode === 'survival' && !isCorrect) {
      finishGame(newResults);
      return;
    }

    if (currentIdx + 1 < problems.length) {
      setCurrentIdx(i => i + 1);
      setStartTime(Date.now());
    } else {
      finishGame(newResults);
    }
  };

  const finishGame = (finalResults) => {
    const resultsToUse = finalResults || resultsRef.current;
    
    if (resultsToUse.length > 0) {
      const correctCount = resultsToUse.filter(r => r.correct).length;
      const totalTime = resultsToUse.reduce((acc, curr) => acc + curr.time, 0);
      const avgTime = totalTime / resultsToUse.length;
      
      saveResult({
        mode: gameModeRef.current,
        score: correctCount,
        totalQuestions: resultsToUse.length,
        avgTime: avgTime
      });
    }

    setResults(resultsToUse);
    setScreen('results');
  };

  useEffect(() => {
    if (screen !== 'game' || gameMode !== 'sprint') return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const remaining = settings.duration - elapsed;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        finishGame();
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [screen, gameMode, gameStartTime, settings.duration]); 

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 selection:bg-blue-500/30 selection:text-blue-200 font-sans">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.4s ease-in-out; }
        
        /* Remove default input number arrows */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      
      {screen === 'menu' && (
        <MenuScreen 
          gameMode={gameMode} 
          setGameMode={setGameMode} 
          settings={settings} 
          setSettings={setSettings} 
          onStart={startGame} 
        />
      )}
      
      {screen === 'game' && (
        <GameScreen 
          problems={problems}
          currentIdx={currentIdx}
          gameMode={gameMode}
          timeLeft={timeLeft}
          duration={settings.duration}
          onAnswer={handleAnswer}
          onAbort={() => setScreen('menu')}
        />
      )}
      
      {screen === 'results' && (
        <ResultsScreen 
          results={results} 
          gameMode={gameMode}
          onPlayAgain={startGame} 
          onMenu={() => setScreen('menu')} 
        />
      )}
    </div>
  );
}