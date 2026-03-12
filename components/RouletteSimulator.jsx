import { useState, useEffect, useCallback, useRef } from "react";
import { saveSession } from "@/lib/api";
import SimulatorHeader from "@/components/SimulatorHeader";
import { buildRound as buildRouletteRound } from "@/features/roulette/engine";
import { ROULETTE_ROWS } from "@/features/roulette/rulesets";

// ============================================================
// ROULETTE DATA
// ============================================================
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

const BET_TYPES = {
  straight: { name: "Plein", payout: 35, description: "Un seul numéro" },
  split: { name: "Cheval", payout: 17, description: "2 numéros adjacents" },
  street: { name: "Transversale", payout: 11, description: "3 numéros en ligne" },
  corner: { name: "Carré", payout: 8, description: "4 numéros en carré" },
  sixLine: { name: "Sixain", payout: 5, description: "6 numéros (2 lignes)" },
  dozen: { name: "Douzaine", payout: 2, description: "12 numéros" },
  column: { name: "Colonne", payout: 2, description: "12 numéros" },
  red: { name: "Rouge", payout: 1, description: "18 numéros rouges" },
  black: { name: "Noir", payout: 1, description: "18 numéros noirs" },
  even: { name: "Pair", payout: 1, description: "Numéros pairs" },
  odd: { name: "Impair", payout: 1, description: "Numéros impairs" },
  low: { name: "Manque (1-18)", payout: 1, description: "1 à 18" },
  high: { name: "Passe (19-36)", payout: 1, description: "19 à 36" },
};

const CHIP_VALUES = [1, 5, 10, 25, 100];
const CHIP_COLORS = { 1: "#FFFFFF", 5: "#E53935", 10: "#1565C0", 25: "#2E7D46", 100: "#1A1A1A" };
const CHIP_TEXT = { 1: "#333", 5: "#FFF", 10: "#FFF", 25: "#FFF", 100: "#C9A84C" };

// ============================================================
// HELPERS
// ============================================================
function getNumberColor(n) {
  if (n === 0) return "green";
  if (RED_NUMBERS.includes(n)) return "red";
  return "black";
}

function isWinningBet(bet, winningNumber) {
  const n = winningNumber;
  switch (bet.type) {
    case "straight": return bet.numbers.includes(n);
    case "split": return bet.numbers.includes(n);
    case "street": return bet.numbers.includes(n);
    case "corner": return bet.numbers.includes(n);
    case "sixLine": return bet.numbers.includes(n);
    case "dozen": return bet.numbers.includes(n);
    case "column": return bet.numbers.includes(n);
    case "red": return RED_NUMBERS.includes(n);
    case "black": return BLACK_NUMBERS.includes(n);
    case "even": return n > 0 && n % 2 === 0;
    case "odd": return n > 0 && n % 2 === 1;
    case "low": return n >= 1 && n <= 18;
    case "high": return n >= 19 && n <= 36;
    default: return false;
  }
}

function calculateTotalPayout(bets, winningNumber) {
  let total = 0;
  bets.forEach(bet => {
    if (isWinningBet(bet, winningNumber)) {
      total += bet.amount * BET_TYPES[bet.type].payout + bet.amount;
    }
  });
  return total;
}

function generateRandomBets(difficulty) {
  const bets = [];
  const numBets = difficulty <= 1 ? 1 : difficulty <= 3 ? Math.floor(Math.random() * 2) + 2 : Math.floor(Math.random() * 3) + 3;

  const availableTypes = difficulty <= 1
    ? ["straight", "red", "black", "even", "odd"]
    : difficulty <= 3
    ? ["straight", "split", "street", "dozen", "column", "red", "black", "even", "odd", "low", "high"]
    : Object.keys(BET_TYPES);

  for (let i = 0; i < numBets; i++) {
    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const chipVal = CHIP_VALUES[Math.floor(Math.random() * Math.min(difficulty + 1, CHIP_VALUES.length))];
    const amount = chipVal * (Math.floor(Math.random() * 3) + 1);
    let numbers = [];

    switch (type) {
      case "straight": {
        const n = Math.floor(Math.random() * 37);
        numbers = [n];
        break;
      }
      case "split": {
        const row = Math.floor(Math.random() * 3);
        const col = Math.floor(Math.random() * 11);
        const n1 = row + col * 3 + 1;
        const n2 = n1 + (Math.random() > 0.5 && row < 2 ? 1 : 3);
        if (n2 <= 36) numbers = [n1, n2]; else numbers = [n1, n1 - 1];
        break;
      }
      case "street": {
        const col = Math.floor(Math.random() * 12);
        numbers = [col * 3 + 1, col * 3 + 2, col * 3 + 3];
        break;
      }
      case "corner": {
        const row = Math.floor(Math.random() * 2);
        const col = Math.floor(Math.random() * 11);
        const base = row + col * 3 + 1;
        numbers = [base, base + 1, base + 3, base + 4];
        break;
      }
      case "sixLine": {
        const col = Math.floor(Math.random() * 11);
        const base = col * 3 + 1;
        numbers = [base, base+1, base+2, base+3, base+4, base+5];
        break;
      }
      case "dozen": {
        const d = Math.floor(Math.random() * 3);
        numbers = Array.from({length: 12}, (_, i) => d * 12 + i + 1);
        break;
      }
      case "column": {
        const c = Math.floor(Math.random() * 3);
        numbers = Array.from({length: 12}, (_, i) => c + 1 + i * 3);
        break;
      }
      default:
        numbers = [];
    }

    bets.push({ type, amount, numbers, id: `bet-${i}` });
  }
  return bets;
}

function generateWinningNumber() {
  return Math.floor(Math.random() * 37);
}

// ============================================================
// COMPONENTS
// ============================================================

function Chip({ value, size = 28, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: CHIP_COLORS[value] || "#C9A84C",
      color: CHIP_TEXT[value] || "#000",
      border: `2px solid rgba(201,168,76,0.5)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800,
      boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.15)",
      fontFamily: "'DM Sans', sans-serif",
      ...style
    }}>
      {value}
    </div>
  );
}

function NumberCell({ number, highlighted, onClick }) {
  const color = getNumberColor(number);
  const bg = color === "red" ? "#C62828" : color === "black" ? "#1a1a1a" : "#1B5E32";
  const isHighlighted = highlighted;

  return (
    <div
      onClick={() => onClick?.(number)}
      style={{
        background: bg,
        border: isHighlighted ? "2px solid #E8D48B" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700, fontSize: 13,
        color: isHighlighted ? "#E8D48B" : "#fff",
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        boxShadow: isHighlighted ? "0 0 12px rgba(201,168,76,0.3)" : "none",
        transform: isHighlighted ? "scale(1.08)" : "scale(1)",
        minHeight: 36,
      }}
    >
      {number}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function RouletteSimulator() {
  const [screen, setScreen] = useState("menu"); // menu, training, result, review
  const [difficulty, setDifficulty] = useState(1);
  const [bets, setBets] = useState([]);
  const [winningNumber, setWinningNumber] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const inputRef = useRef(null);

  // Timer
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth || 1440);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const startRound = useCallback(() => {
    const { bets: newBets, winningNumber: newWin, correctAnswer: correct } = buildRouletteRound(difficulty);

    setBets(newBets);
    setWinningNumber(newWin);
    setCorrectAnswer(correct);
    setUserAnswer("");
    setShowHint(false);
    setScreen("training");
    setTimer(0);
    setIsTimerRunning(true);
    setRound(r => r + 1);

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [difficulty]);

  const submitAnswer = () => {
    setIsTimerRunning(false);
    const userNum = parseInt(userAnswer) || 0;
    const isCorrect = userNum === correctAnswer;
    const timeBonus = Math.max(0, 30 - timer) * 2;
    const roundScore = isCorrect ? 100 + timeBonus : 0;
    const nextTotalRounds = totalRounds + 1;
    const nextCorrectRounds = correctRounds + (isCorrect ? 1 : 0);
    const nextAccuracy = nextTotalRounds > 0 ? Math.round((nextCorrectRounds / nextTotalRounds) * 100) : 0;

    setScore(s => s + roundScore);
    setTotalRounds(nextTotalRounds);
    if (isCorrect) {
      setCorrectRounds(nextCorrectRounds);
      setStreak(s => {
        const ns = s + 1;
        if (ns > bestStreak) setBestStreak(ns);
        return ns;
      });
    } else {
      setStreak(0);
    }

    setHistory(h => [...h, {
      round: round,
      bets: bets,
      winningNumber,
      correctAnswer,
      userAnswer: userNum,
      isCorrect,
      time: timer,
      score: roundScore,
    }]);

    saveSession({
      game_id: "roulette",
      mode: difficulty >= 4 ? "examen" : difficulty >= 2 ? "simulation" : "guidee",
      score: roundScore,
      accuracy: nextAccuracy,
      duration_seconds: timer,
      rounds_played: 1,
      rounds_correct: isCorrect ? 1 : 0,
      errors: isCorrect ? [] : [`Réponse donnée: ${userNum}`],
      details: {
        difficulty,
        winningNumber,
        correctAnswer,
        userAnswer: userNum,
        bets: bets.map((bet) => ({ type: bet.type, amount: bet.amount, numbers: bet.numbers })),
      },
    }).catch(() => null);

    setScreen("result");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && userAnswer.length > 0) submitAnswer();
  };

  const getHighlightedNumbers = () => {
    const nums = new Set();
    bets.forEach(bet => {
      if (isWinningBet(bet, winningNumber)) {
        bet.numbers.forEach(n => nums.add(n));
        if (bet.type === "red") RED_NUMBERS.forEach(n => nums.add(n));
        if (bet.type === "black") BLACK_NUMBERS.forEach(n => nums.add(n));
        if (bet.type === "even") { for(let i=2;i<=36;i+=2) nums.add(i); }
        if (bet.type === "odd") { for(let i=1;i<=36;i+=2) nums.add(i); }
        if (bet.type === "low") { for(let i=1;i<=18;i++) nums.add(i); }
        if (bet.type === "high") { for(let i=19;i<=36;i++) nums.add(i); }
      }
    });
    return nums;
  };

  const winColor = winningNumber !== null ? getNumberColor(winningNumber) : "green";
  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth >= 640 && viewportWidth < 1024;
  const isDesktopWide = viewportWidth >= 1440;
  const tableLead = isMobile ? 30 : isDesktopWide ? 52 : viewportWidth >= 1024 ? 44 : 38;
  const tableCellHeight = isMobile ? 30 : isDesktopWide ? 46 : viewportWidth >= 1024 ? 40 : 36;

  // ============================================================
  // STYLES
  // ============================================================
  const styles = {
    app: {
      minHeight: "100vh",
      background: "var(--sim-bg)",
      color: "var(--sim-text)",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
    },
    noise: {
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      opacity: 0.025, pointerEvents: "none", zIndex: 9999,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
    },
    header: {
      padding: "20px 32px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      borderBottom: "1px solid var(--sim-border)",
      background: "var(--sim-surface-2)",
      backdropFilter: "blur(10px)",
    },
    logo: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 22, fontWeight: 900,
    },
    logoAccent: { color: "#C9A84C" },
    headerBadge: {
      padding: "6px 16px",
      border: "1px solid rgba(201,168,76,0.25)",
      borderRadius: 50, fontSize: 11, fontWeight: 600,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: "#C9A84C",
    },
    main: {
      width: "min(1680px, calc(100% - 24px))", margin: "0 auto", padding: isMobile ? "24px 0 28px" : "40px 0 32px",
    },
    // Menu
    menuWrap: {
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "70vh", gap: viewportWidth < 640 ? 24 : 40,
    },
    menuTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900,
      textAlign: "center", lineHeight: 1.15,
    },
    menuSub: {
      fontSize: 15, color: "var(--sim-muted)", fontWeight: 300,
      textAlign: "center", maxWidth: 500, lineHeight: 1.7,
    },
    diffGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(78px, 1fr))",
      gap: 10, maxWidth: 620, width: "100%",
    },
    diffBtn: (active) => ({
      padding: "16px 10px",
      background: active ? "rgba(201,168,76,0.12)" : "var(--sim-surface)",
      border: active ? "2px solid #C9A84C" : "1px solid var(--sim-border)",
      borderRadius: 4, cursor: "pointer",
      textAlign: "center", transition: "all 0.2s ease",
      color: active ? "#C9A84C" : "var(--sim-muted)",
    }),
    diffNum: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 24, fontWeight: 900, lineHeight: 1,
    },
    diffLabel: {
      fontSize: 10, textTransform: "uppercase",
      letterSpacing: "0.1em", marginTop: 4, fontWeight: 500,
    },
    startBtn: {
      padding: "16px 48px",
      background: "#C9A84C", color: "#0A0A0A",
      border: "none", borderRadius: 2,
      fontSize: 14, fontWeight: 700,
      letterSpacing: "0.1em", textTransform: "uppercase",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      transition: "all 0.3s ease",
    },
    // Training layout
    trainingLayout: {
      display: "grid",
      gridTemplateColumns: viewportWidth < 1180 ? "1fr" : "minmax(0, 1.45fr) minmax(340px, 430px)",
      gap: 28, alignItems: "start",
    },
    // Roulette table
    tableWrap: {
      background: "var(--sim-felt-3)",
      borderRadius: 10, padding: isMobile ? 12 : isDesktopWide ? 28 : 20,
      border: "2px solid var(--sim-border-strong)",
      boxShadow: "inset 0 0 60px rgba(0,0,0,0.4), 0 20px 60px rgba(0,0,0,0.5)",
      position: "relative",
      overflow: "hidden",
    },
    tableGlow: {
      position: "absolute", top: "30%", left: "50%",
      transform: "translate(-50%, -50%)",
      width: 400, height: 300, borderRadius: "50%",
      background: "radial-gradient(ellipse, rgba(46,125,70,0.3), transparent 70%)",
      pointerEvents: "none",
    },
    tableGrid: {
      display: "grid",
      gridTemplateColumns: `${tableLead}px repeat(12, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(3, ${tableCellHeight}px)`,
      gap: isMobile ? 2 : isDesktopWide ? 4 : 3, position: "relative", zIndex: 1,
    },
    zeroCell: {
      gridColumn: "1", gridRow: "1 / 4",
      background: "var(--sim-felt)",
      border: "1px solid var(--sim-border-strong)",
      borderRadius: 3,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Playfair Display', serif",
      fontWeight: 700, fontSize: isMobile ? 13 : isDesktopWide ? 18 : 16, color: "#E8D48B",
    },
    outsideBets: {
      display: "grid",
      gridTemplateColumns: `${tableLead}px repeat(12, minmax(0, 1fr))`,
      gap: isMobile ? 2 : isDesktopWide ? 4 : 3, marginTop: 3, position: "relative", zIndex: 1,
    },
    dozenCell: {
      gridColumn: "span 4",
      background: "rgba(27,94,50,0.28)",
      border: "1px solid var(--sim-border)",
      borderRadius: 3, padding: isMobile ? "5px 0" : isDesktopWide ? "8px 0" : "6px 0",
      textAlign: "center", fontSize: isMobile ? 8 : isDesktopWide ? 11 : 10,
      fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "var(--sim-muted)",
    },
    evenMoneyRow: {
      display: "grid",
      gridTemplateColumns: `${tableLead}px repeat(6, minmax(0, 1fr))`,
      gap: isMobile ? 2 : isDesktopWide ? 4 : 3, marginTop: 3, position: "relative", zIndex: 1,
    },
    evenMoneyCell: (type) => ({
      padding: isMobile ? "6px 0" : isDesktopWide ? "10px 0" : "8px 0", textAlign: "center",
      borderRadius: 3, fontSize: isMobile ? 8 : isDesktopWide ? 11 : 10,
      fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase",
      border: "1px solid var(--sim-border)",
      background: type === "rouge" ? "rgba(198,40,40,0.35)"
        : type === "noir" ? "rgba(26,26,26,0.6)"
        : "rgba(27,94,50,0.3)",
      color: "var(--sim-muted)",
    }),
    winBanner: {
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12, margin: "16px 0 0",
      padding: "12px 20px",
      background: "color-mix(in srgb, var(--sim-surface) 84%, transparent)",
      borderRadius: 4,
      border: "1px solid var(--sim-border)",
    },
    winNum: (color) => ({
      width: 44, height: 44, borderRadius: "50%",
      background: color === "red" ? "#C62828" : color === "black" ? "#1a1a1a" : "#1B5E32",
      border: "3px solid #C9A84C",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Playfair Display', serif",
      fontWeight: 900, fontSize: 18, color: "#fff",
      boxShadow: "0 0 20px rgba(201,168,76,0.3)",
    }),
    // Side panel
    sidePanel: {
      display: "flex", flexDirection: "column", gap: 16,
    },
    card: {
      background: "var(--sim-surface)",
      border: "1px solid var(--sim-border)",
      borderRadius: 4, padding: isMobile ? 16 : isDesktopWide ? 24 : 20,
    },
    cardTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 15, fontWeight: 700, marginBottom: 12,
      display: "flex", alignItems: "center", gap: 8,
    },
    betRow: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      fontSize: 13,
    },
    betType: { color: "#C9A84C", fontWeight: 600, fontSize: 12 },
    betNums: { color: "var(--sim-muted)", fontSize: 11, fontWeight: 300 },
    betAmount: { fontWeight: 700, fontSize: 14 },
    betWin: { color: "#2E7D46", fontWeight: 700, fontSize: 11 },
    betLose: { color: "#C62828", fontWeight: 700, fontSize: 11 },
    // Input area
    inputWrap: {
      display: "grid", gap: viewportWidth < 640 ? 8 : 0,
      gridTemplateColumns: viewportWidth < 640 ? "1fr" : "1fr auto",
    },
    input: {
      flex: 1, padding: "14px 16px",
      background: "color-mix(in srgb, var(--sim-surface) 90%, #000 10%)", color: "var(--sim-text)",
      border: "1px solid var(--sim-border-strong)",
      borderRight: viewportWidth < 640 ? "1px solid var(--sim-border-strong)" : "none",
      borderRadius: viewportWidth < 640 ? 2 : "2px 0 0 2px",
      fontSize: 18, fontWeight: 700,
      fontFamily: "'DM Sans', sans-serif",
      outline: "none",
    },
    submitBtn: {
      padding: "14px 24px",
      background: "#C9A84C", color: "#0A0A0A",
      border: "none", borderRadius: viewportWidth < 640 ? 2 : "0 2px 2px 0",
      fontSize: 13, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
    },
    // Timer
    timerWrap: {
      display: "flex", alignItems: "center", gap: 6,
      fontSize: viewportWidth < 640 ? 11 : 13, color: "var(--sim-muted)", fontWeight: 500,
    },
    // Scores
    scoreGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: 10,
    },
    scoreStat: {
      textAlign: "center", padding: "10px 8px",
      background: "rgba(201,168,76,0.08)",
      borderRadius: 3,
    },
    scoreNum: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 22, fontWeight: 900, color: "#C9A84C",
      lineHeight: 1,
    },
    scoreLabel: {
      fontSize: 9, textTransform: "uppercase",
      letterSpacing: "0.1em", color: "#BFB9AD",
      fontWeight: 500, marginTop: 3,
    },
    // Result
    resultBig: (correct) => ({
      fontSize: 14, fontWeight: 700,
      letterSpacing: "0.15em", textTransform: "uppercase",
      color: correct ? "#2E7D46" : "#C62828",
      marginBottom: 8,
    }),
    resultPayout: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 36, fontWeight: 900,
      color: "#C9A84C", lineHeight: 1,
    },
    resultYours: (correct) => ({
      fontSize: 14, color: correct ? "#2E7D46" : "#C62828",
      fontWeight: 600, marginTop: 4,
    }),
    hintBtn: {
      background: "none", border: "1px solid rgba(201,168,76,0.2)",
      color: "#C9A84C", padding: "6px 14px",
      borderRadius: 2, fontSize: 11, fontWeight: 600,
      cursor: "pointer", letterSpacing: "0.05em",
      fontFamily: "'DM Sans', sans-serif",
    },
    hintBox: {
      background: "rgba(201,168,76,0.1)",
      border: "1px solid var(--sim-border-strong)",
      borderRadius: 4, padding: 14, marginTop: 10,
      fontSize: 12, color: "var(--sim-muted)", lineHeight: 1.6,
    },
    nextBtn: {
      width: "100%", padding: "14px",
      background: "#C9A84C", color: "#0A0A0A",
      border: "none", borderRadius: 2,
      fontSize: 13, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      marginTop: 10,
    },
    backBtn: {
      background: "none", border: "1px solid var(--sim-border)",
      color: "var(--sim-muted)", padding: "10px 20px",
      borderRadius: 2, fontSize: 12, fontWeight: 500,
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    // Responsive override
    mobileStack: {
      display: "flex", flexDirection: "column", gap: 20,
    },
  };

  // Build the roulette table rows
  const highlightedNums = screen === "result" || screen === "training" ? getHighlightedNumbers() : new Set();

  const betNumbersOnTable = new Set();
  bets.forEach(b => b.numbers.forEach(n => betNumbersOnTable.add(n)));

  const renderTable = () => (
    <div style={styles.tableWrap}>
      <div style={styles.tableGlow} />
      
      {/* Winning number banner */}
      <div style={styles.winBanner}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#BFB9AD" }}>
          Numéro gagnant
        </span>
        <div style={styles.winNum(winColor)}>{winningNumber}</div>
      </div>

      {/* Main grid */}
      <div style={{ marginTop: 16 }}>
        <div style={styles.tableGrid}>
          {/* Zero */}
          <div style={styles.zeroCell}>0</div>
          
          {/* Numbers */}
          {ROULETTE_ROWS.map((row) => 
            row.map((num) => (
              <NumberCell
                key={num}
                number={num}
                highlighted={highlightedNums.has(num) || betNumbersOnTable.has(num)}
              />
            ))
          )}
        </div>

        {/* Dozens */}
        <div style={styles.outsideBets}>
          <div />
          <div style={styles.dozenCell}>1ère Douzaine</div>
          <div style={styles.dozenCell}>2ème Douzaine</div>
          <div style={styles.dozenCell}>3ème Douzaine</div>
        </div>

        {/* Even money */}
        <div style={styles.evenMoneyRow}>
          <div />
          <div style={styles.evenMoneyCell("other")}>1-18</div>
          <div style={styles.evenMoneyCell("other")}>Pair</div>
          <div style={styles.evenMoneyCell("rouge")}>Rouge</div>
          <div style={styles.evenMoneyCell("noir")}>Noir</div>
          <div style={styles.evenMoneyCell("other")}>Impair</div>
          <div style={styles.evenMoneyCell("other")}>19-36</div>
        </div>
      </div>
    </div>
  );

  const renderBets = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        🎯 Mises sur la table
      </div>
      {bets.map((bet, i) => {
        const info = BET_TYPES[bet.type];
        const won = screen === "result" ? isWinningBet(bet, winningNumber) : null;
        const payout = won ? bet.amount * info.payout + bet.amount : 0;
        return (
          <div key={i} style={styles.betRow}>
            <div>
              <div style={styles.betType}>{info.name}</div>
              <div style={styles.betNums}>
                {bet.numbers.length > 0 && bet.numbers.length <= 6
                  ? bet.numbers.join(", ")
                  : info.description}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={styles.betAmount}>{bet.amount}€</div>
              {screen === "result" && (
                <div style={won ? styles.betWin : styles.betLose}>
                  {won ? `+${payout}€` : "Perdu"}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div style={{ 
        marginTop: 12, paddingTop: 12, 
        borderTop: "1px solid rgba(201,168,76,0.12)",
        display: "flex", justifyContent: "space-between",
        fontSize: 13, fontWeight: 700, color: "#C9A84C",
      }}>
        <span>Total misé</span>
        <span>{bets.reduce((s, b) => s + b.amount, 0)}€</span>
      </div>
    </div>
  );

  const renderScores = () => (
    <div style={styles.card}>
      <div style={styles.cardTitle}>📊 Score</div>
      <div style={styles.scoreGrid}>
        <div style={styles.scoreStat}>
          <div style={styles.scoreNum}>{score}</div>
          <div style={styles.scoreLabel}>Points</div>
        </div>
        <div style={styles.scoreStat}>
          <div style={styles.scoreNum}>{streak}🔥</div>
          <div style={styles.scoreLabel}>Série</div>
        </div>
        <div style={styles.scoreStat}>
          <div style={styles.scoreNum}>{totalRounds > 0 ? Math.round(correctRounds / totalRounds * 100) : 0}%</div>
          <div style={styles.scoreLabel}>Précision</div>
        </div>
        <div style={styles.scoreStat}>
          <div style={styles.scoreNum}>{totalRounds}</div>
          <div style={styles.scoreLabel}>Coups joués</div>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // SCREENS
  // ============================================================

  if (screen === "menu") {
    return (
      <div className="cp-sim-shell cp-sim-page" style={styles.app}>
        <div style={styles.noise} />
        <SimulatorHeader badge="Simulateur Roulette" title="Roulette" />
        <div className="cp-sim-main" style={styles.main}>
          <div className="cp-sim-menu-shell" style={styles.menuWrap}>
            <div>
              <div style={{
                textAlign: "center", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: "#C9A84C", marginBottom: 16,
              }}>Entraînement paiements</div>
              <h1 style={styles.menuTitle}>
                Calculez les paiements<br />
                <span style={{ color: "#C9A84C", fontStyle: "italic" }}>comme un pro</span>
              </h1>
            </div>
            <p className="cp-sim-menu-copy" style={styles.menuSub}>
              Des mises aléatoires sont placées sur le tapis. Un numéro gagnant est tiré. 
              Calculez le montant total à payer aux joueurs — rapidement et sans erreur.
            </p>

            <div>
              <div style={{
                textAlign: "center", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: "#BFB9AD", marginBottom: 10,
              }}>Difficulté</div>
              <div style={styles.diffGrid}>
                {[1,2,3,4,5].map(d => (
                  <div
                    key={d}
                    style={styles.diffBtn(difficulty === d)}
                    onClick={() => setDifficulty(d)}
                  >
                    <div style={styles.diffNum}>{d}</div>
                    <div style={styles.diffLabel}>
                      {d === 1 ? "Facile" : d === 2 ? "Normal" : d === 3 ? "Dur" : d === 4 ? "Expert" : "Élite"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cp-sim-info-card cp-sim-info-card-muted" style={{ fontSize: 12, color: "#BFB9AD", lineHeight: 1.7, maxWidth: 460, textAlign: "center" }}>
              <strong style={{ color: "#C9A84C" }}>Niveau {difficulty}</strong> — {
                difficulty === 1 ? "1 mise simple (plein ou chance simple). Idéal pour débuter." :
                difficulty === 2 ? "2-3 mises variées. Les douzaines et colonnes apparaissent." :
                difficulty === 3 ? "3-4 mises de tous types. Chevaux, carrés et sixains inclus." :
                difficulty === 4 ? "4-5 mises complexes avec montants variables." :
                "5+ mises, tous types, gros montants. Vitesse et précision requises."
              }
            </div>

            <button style={styles.startBtn} onClick={startRound}>
              Lancer l'entraînement
            </button>

            {totalRounds > 0 && (
              <div style={{ fontSize: 12, color: "#BFB9AD", textAlign: "center" }}>
                Session en cours : {correctRounds}/{totalRounds} corrects · Score : {score} · Meilleure série : {bestStreak}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "training" || screen === "result") {
    const isResult = screen === "result";
    const lastResult = history.length > 0 ? history[history.length - 1] : null;
    const wasCorrect = lastResult?.isCorrect;

    return (
      <div className="cp-sim-shell cp-sim-page" style={styles.app}>
        <div style={styles.noise} />
        <SimulatorHeader
          badge="Simulateur Roulette"
          title="Roulette"
          stats={`⏱ ${timer}s · Coup #${round}`}
          onBackToMenu={() => setScreen("menu")}
        />

        <div className="cp-sim-main" style={styles.main}>
          <div className="cp-sim-stage-layout" style={styles.trainingLayout}>
            {/* Left: Table */}
            <div>
              {renderTable()}
            </div>

            {/* Right: Panel */}
            <div className="cp-sim-side-stack" style={styles.sidePanel}>
              {renderScores()}
              {renderBets()}

              {/* Input / Result */}
              <div style={styles.card}>
                {!isResult ? (
                  <>
                    <div style={styles.cardTitle}>
                      💰 Paiement total à effectuer ?
                    </div>
                    <p style={{ fontSize: 12, color: "#BFB9AD", marginBottom: 12, lineHeight: 1.6 }}>
                      Incluez le remboursement des mises gagnantes. Si aucune mise ne gagne, répondez 0.
                    </p>
                    <div style={styles.inputWrap}>
                      <input
                        ref={inputRef}
                        type="number"
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Montant en €"
                        style={styles.input}
                      />
                      <button
                        style={{
                          ...styles.submitBtn,
                          opacity: userAnswer.length > 0 ? 1 : 0.4,
                          pointerEvents: userAnswer.length > 0 ? "auto" : "none",
                        }}
                        onClick={submitAnswer}
                      >
                        Valider
                      </button>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button style={styles.hintBtn} onClick={() => setShowHint(!showHint)}>
                        {showHint ? "Masquer l'aide" : "💡 Aide"}
                      </button>
                      <span style={{ fontSize: 11, color: "rgba(191,185,173,0.4)" }}>
                        Entrée pour valider
                      </span>
                    </div>
                    {showHint && (
                      <div style={styles.hintBox}>
                        <strong style={{ color: "#C9A84C" }}>Rappel des paiements :</strong><br />
                        Plein = 35:1 · Cheval = 17:1 · Transversale = 11:1<br />
                        Carré = 8:1 · Sixain = 5:1 · Douzaine/Colonne = 2:1<br />
                        Chances simples = 1:1<br /><br />
                        <em>Le paiement inclut toujours le remboursement de la mise.</em>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: "center" }}>
                      <div style={styles.resultBig(wasCorrect)}>
                        {wasCorrect ? "✓ Correct !" : "✗ Incorrect"}
                      </div>
                      <div style={styles.resultPayout}>{correctAnswer}€</div>
                      <div style={{ fontSize: 11, color: "#BFB9AD", marginTop: 4 }}>
                        Paiement correct
                      </div>
                      {!wasCorrect && (
                        <div style={styles.resultYours(false)}>
                          Votre réponse : {lastResult?.userAnswer}€
                        </div>
                      )}
                      {wasCorrect && (
                        <div style={{
                          marginTop: 8, fontSize: 12, color: "#2E7D46", fontWeight: 600,
                        }}>
                          +{lastResult?.score} points · {lastResult?.time}s
                        </div>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div style={{
                      marginTop: 16, paddingTop: 16,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#BFB9AD", marginBottom: 8 }}>
                        Détail du calcul
                      </div>
                      {bets.map((bet, i) => {
                        const info = BET_TYPES[bet.type];
                        const won = isWinningBet(bet, winningNumber);
                        return (
                          <div key={i} style={{
                            fontSize: 12, color: "#BFB9AD", lineHeight: 1.8,
                            padding: "4px 0",
                          }}>
                            <span style={{ color: won ? "#2E7D46" : "#C62828" }}>
                              {won ? "✓" : "✗"}
                            </span>{" "}
                            {info.name} {bet.amount}€ × {info.payout}:1 ={" "}
                            <strong style={{ color: won ? "#C9A84C" : "rgba(191,185,173,0.4)" }}>
                              {won ? `${bet.amount * info.payout + bet.amount}€` : "0€"}
                            </strong>
                          </div>
                        );
                      })}
                    </div>

                    <button style={styles.nextBtn} onClick={startRound}>
                      Coup suivant →
                    </button>
                    <button
                      style={{ ...styles.backBtn, width: "100%", marginTop: 8, textAlign: "center" }}
                      onClick={() => setScreen("menu")}
                    >
                      Retour au menu
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
