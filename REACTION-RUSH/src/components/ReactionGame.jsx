import React, {useState, useEffect, useRef, useCallback} from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- CONSTANTS ---
const BEST_SCORE_KEY = 'reaction_best_score_v2'
const LEADERBOARD_KEY = 'reaction_leaderboard_v2'
const PLAYER_NAME_KEY = 'reaction_player_name_v2'

// --- HELPER HOOK for Audio ---
// This is the excellent audio hook you provided. No changes needed.
function useAudioBeep(){
  const ctxRef = useRef(null)
  useEffect(()=>{ ctxRef.current = null },[])
  const beep = (freq=440, duration=0.08) => {
    try{
      const ctx = ctxRef.current ?? new (window.AudioContext || window.webkitAudioContext)()
      ctxRef.current = ctx
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      o.stop(ctx.currentTime + duration + 0.02)
    }catch(e){ /* ignore */ }
  }
  return beep
}

// --- HELPER COMPONENT for Modals ---
const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto text-white border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-cyan-400">{title}</h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-600"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M6.293 6.293a1 1 0 011.414 0L12 10.586l4.293-4.293a1 1 0 111.414 1.414L13.414 12l4.293 4.293a1 1 0 01-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 01-1.414-1.414L10.586 12 6.293 7.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);


// --- MAIN GAME COMPONENT ---
export default function ReactionGame(){
  const [playerName, setPlayerName] = useState(localStorage.getItem(PLAYER_NAME_KEY) || "");
  const [nameInputValue, setNameInputValue] = useState("");
  const [gameState, setGameState] = useState('setup'); // 'setup', 'start', 'playing', 'paused', 'gameOver'
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1)
  const [targetTime, setTargetTime] = useState(2000)
  const [gameTime, setGameTime] = useState(25)
  const [targetKey, setTargetKey] = useState(0)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(()=> parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0'))
  const [message, setMessage] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)
  const [checkedForLeaderboard, setCheckedForLeaderboard] = useState(false);

  const targetTimerRef = useRef(null)
  const gameCountdownRef = useRef(null)
  const beep = useAudioBeep()

  // Load leaderboard from localStorage on initial render
  useEffect(()=>{
    const saved = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]')
    setLeaderboard(saved)
  },[])

  // Your core target-spawning logic
  useEffect(()=>{
    if(gameState === 'playing'){
        clearTimeout(targetTimerRef.current)
        targetTimerRef.current = setTimeout(()=>{
          beep(220, 0.12)
          setTargetKey(k => k + 1)
        }, targetTime)
    }
    return ()=> clearTimeout(targetTimerRef.current)
  },[gameState, round, targetKey])

  // Simplified endGame function
  const endGame = useCallback(() => {
    clearTimeout(targetTimerRef.current);
    clearInterval(gameCountdownRef.current);
    setGameState('gameOver');
  }, []);

  // Your global game countdown timer
  useEffect(()=>{
    if(gameState === 'playing'){
      gameCountdownRef.current = setInterval(()=>{
        setGameTime(t => {
          if(t <= 1){
            setMessage("Time's up! Game over.")
            endGame()
            return 0
          }
          return t - 1
        })
      },1000)
    }
    return ()=> clearInterval(gameCountdownRef.current)
  },[gameState, endGame])

  // Update best score whenever score changes
  useEffect(()=>{
    if(score > best){
      setBest(score)
      localStorage.setItem(BEST_SCORE_KEY, String(score))
    }
  },[score, best])

  // Handles logic for when the game is over
  useEffect(() => {
    if (gameState === 'gameOver' && score > 0 && !checkedForLeaderboard) {
      setCheckedForLeaderboard(true);
      const isBoardFull = leaderboard.length >= 5;
      const lowestScoreOnBoard = isBoardFull 
        ? Math.min(...leaderboard.map(entry => entry.score))
        : 0;

      if (!isBoardFull || score > lowestScoreOnBoard) {
        setShowNameInput(true);
      }
    }
  }, [gameState, score, leaderboard, checkedForLeaderboard]);

  const handleNameSubmit = (e) => {
      e.preventDefault();
      const nameFromInput = nameInputValue.trim();
      if (!nameFromInput) return;
      
      setPlayerName(nameFromInput);
      localStorage.setItem(PLAYER_NAME_KEY, nameFromInput);
      setGameState('start');
  };

  const startGame = useCallback(() => {
    setScore(0)
    setLevel(1);
    setRound(1)
    setTargetTime(2000)
    setGameTime(25)
    setMessage('')
    setTargetKey(k => k + 1)
    setCheckedForLeaderboard(false);
    setGameState('playing')
  }, [])

  const handleHit = () => {
    if(gameState !== 'playing') return;
    
    const newScore = score + 100 + (round * 5) + (level * 10);
    const currentLevel = level;
    const nextLevel = Math.floor(newScore / 750) + 1;

    if (nextLevel > currentLevel) {
      setLevel(nextLevel);
      beep(1200, 0.15);
      setMessage(`Level ${nextLevel}!`);
      setTimeout(() => {
        setMessage(prev => (prev === `Level ${nextLevel}!` ? '' : prev));
      }, 1500);
    } else {
      beep(880, 0.06);
    }

    setScore(newScore);
    setRound(r => r + 1);
    const difficultyMultiplier = 0.94 - (nextLevel * 0.005);
    setTargetTime(t => Math.max(400, Math.round(t * difficultyMultiplier)));
    setTargetKey(k => k + 1)
  }

  const handlePauseToggle = () => {
    if (gameState === 'playing') setGameState('paused')
    else if (gameState === 'paused') setGameState('playing')
  }
  
  const handleSaveScore = () => {
    const name = playerName.trim() || 'Anonymous';
    const newEntry = { name, score };

    setLeaderboard(prevLeaderboard => {
        const updated = [...prevLeaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
        return updated;
    });

    setShowNameInput(false);
  };

  const handleSwitchUser = () => {
    localStorage.removeItem(PLAYER_NAME_KEY);
    setPlayerName("");
    setNameInputValue("");
    setGameState('setup');
  };

  const handleClearScores = () => {
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem(BEST_SCORE_KEY);
    setLeaderboard([]);
    setBest(0);
    setShowLeaderboard(false);
    handleSwitchUser();
  };

  return (
    <main className="w-full h-screen bg-gray-900 text-white font-sans overflow-hidden flex flex-col items-center relative select-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0"></div>

        {/* Unified Setup Screen */}
        {gameState === 'setup' && (
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                <div className="w-full max-w-lg p-8 bg-black/20 rounded-2xl border border-gray-700 backdrop-blur-sm text-center">
                    <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-wider mb-4">
                        <span className="text-cyan-400">Reaction</span> Rush
                    </h1>

                    {playerName ? (
                      <>
                        <p className="text-2xl text-gray-300 mb-8">Welcome, <span className="font-bold text-cyan-400">{playerName}</span>!</p>
                        <div className="mt-4 flex flex-col sm:flex-row gap-4 w-full max-w-sm mx-auto">
                            <button onClick={() => setGameState('start')} className="flex-1 px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 transition-colors font-bold text-xl active:scale-95 shadow-lg shadow-cyan-500/20">Continue</button>
                            <button onClick={handleSwitchUser} className="flex-1 px-4 py-3 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors font-bold text-xl active:scale-95">Not You?</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-xl text-gray-300 mb-8">Please enter your name to begin.</p>
                        <form onSubmit={handleNameSubmit} className="w-full max-w-sm mx-auto">
                            <input
                                name="playerName"
                                value={nameInputValue}
                                onChange={(e) => setNameInputValue(e.target.value)}
                                className="w-full px-4 py-3 text-lg rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                                placeholder="Enter your name"
                                autoFocus
                            />
                            <button type="submit" className="mt-4 w-full px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 transition-colors font-bold text-xl active:scale-95 shadow-lg shadow-cyan-500/20">Play</button>
                        </form>
                      </>
                    )}
                </div>
            </div>
        )}

        {/* Game Area */}
        {gameState !== 'setup' && (
            <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-4 mt-8">
                {/* Header */}
                <header className="mb-4 flex flex-wrap items-center justify-between gap-4 p-4 bg-black/20 rounded-xl border border-gray-700">
                    <div className="flex flex-wrap items-center gap-6">
                        <div>
                            <div className="text-slate-300 text-sm">Score</div>
                            <div className="text-2xl font-bold text-cyan-400">{score}</div>
                        </div>
                        <div>
                            <div className="text-slate-300 text-sm">Best</div>
                            <div className="text-2xl font-bold">{best}</div>
                        </div>
                        <div>
                            <div className="text-slate-300 text-sm">Level</div>
                            <div className="text-2xl font-bold text-yellow-400">{level}</div>
                        </div>
                        <div className="text-lg">Player: <span className="font-bold text-cyan-400">{playerName}</span></div>
                    </div>

                    {gameState === 'playing' || gameState === 'paused' ? (
                         <div>
                            <div className="text-slate-300 text-sm">⏳ Time</div>
                            <div className="text-2xl font-bold text-yellow-400">{gameTime}s</div>
                        </div>
                    ) : null }

                    <div className="flex gap-2">
                        {gameState === 'start' || gameState === 'gameOver' ? (
                          <>
                            <button onClick={startGame} className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 transition-colors font-bold text-lg active:scale-95">{gameState === 'start' ? 'Start' : 'Play Again'}</button>
                            <button onClick={handleSwitchUser} className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors font-bold text-lg active:scale-95">Switch User</button>
                          </>
                        ) : (
                          <button onClick={handlePauseToggle} className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-400 transition-colors font-bold text-lg active:scale-95">{gameState === 'paused' ? 'Resume' : 'Pause'}</button>
                        )}
                         <button onClick={() => setShowLeaderboard(true)} className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 transition-colors font-bold text-lg active:scale-95">Scores</button>
                    </div>
                </header>

                {/* Target Area */}
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden flex items-center justify-center border border-gray-700 h-[50vh]">
                  <AnimatePresence>
                    {gameState === 'playing' && (
                      <motion.div key={targetKey}
                        initial={{opacity:0, scale:0.5}}
                        animate={{opacity:1, scale:1}}
                        exit={{opacity:0, scale:0.5, transition: {duration: 0.1}}}
                        transition={{type:'spring', stiffness:500, damping:30}}
                        onClick={handleHit}
                        className="absolute touch-manipulation cursor-pointer"
                        style={{
                            left: `${10 + Math.random() * 70}%`,
                            top: `${10 + Math.random() * 70}%`,
                        }}
                      >
                        <div className="w-24 h-24 rounded-full bg-cyan-400/90 flex items-center justify-center shadow-lg shadow-cyan-500/50" style={{backdropFilter:'blur(4px)'}}>
                            <div className="text-slate-900 text-2xl font-extrabold">HIT</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {message && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 px-6 py-3 rounded-lg text-xl font-bold backdrop-blur-sm">{message}</div>
                      </div>
                  )}
                </div>
            </div>
        )}

        {/* Modals */}
        {showLeaderboard && (
            <Modal title="Leaderboard" onClose={() => setShowLeaderboard(false)}>
                <div className="space-y-2">
                    {leaderboard.length === 0 ? (
                        <div className="text-slate-400 text-sm">No scores yet. Play a game to be the first!</div>
                    ) : (
                        leaderboard.map((p, idx)=>(
                            <div key={idx} className="flex items-center justify-between bg-slate-700 p-3 rounded-lg">
                                <div className="text-lg">{idx+1}. {p.name}</div>
                                <div className="font-semibold text-cyan-400">{p.score}</div>
                            </div>
                        ))
                    )}
                </div>
                {leaderboard.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                      <button 
                          onClick={handleClearScores}
                          className="w-full px-4 py-2 rounded bg-red-600 hover:bg-red-500 transition-colors font-bold text-sm active:scale-95"
                      >
                          Clear All Scores
                      </button>
                  </div>
                )}
            </Modal>
        )}
        {showNameInput && (
            <Modal title="Leaderboard Score!">
                <p className="text-lg text-gray-300 mb-4">
                    Nice! Your score of <span className="font-bold text-yellow-400">{score}</span> made the leaderboard.
                </p>
                <div className="flex gap-2">
                    <button onClick={handleSaveScore} className="flex-1 px-6 py-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-400 transition-all">Save</button>
                    <button onClick={() => setShowNameInput(false)} className="flex-1 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-all">Cancel</button>
                </div>
            </Modal>
        )}
    </main>
  )
}

