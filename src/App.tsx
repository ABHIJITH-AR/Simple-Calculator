/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  History as HistoryIcon, 
  Delete, 
  Sparkles
} from 'lucide-react';

import { HistoryItem } from './types';
import HistorySidebar from './components/HistorySidebar';

export default function App() {
  // Calculator numerical systems
  const [display, setDisplay] = useState<string>('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [isNextNumberPending, setIsNextNumberPending] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [formula, setFormula] = useState<string>('');
  
  // System parameters
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activePressedKey, setActivePressedKey] = useState<string | null>(null);

  // References
  const displayRef = useRef<HTMLDivElement>(null);

  // Load history from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('calc_history_v1');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse calc history:', e);
      }
    }
  }, []);

  // Save history to localstorage on update
  const updateHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem('calc_history_v1', JSON.stringify(newHistory));
  };

  // Sound play gate (disabled per user instruction "click feedback venda")
  const triggerClick = () => {};

  // Format dynamic display digits safely (add comma grouping for integers)
  const formatDisplayString = (val: string): string => {
    if (val === 'Error' || val === 'Overflow' || val === 'NaN') return val;
    
    // Check if exponent is present, return as-is
    if (val.includes('e')) return val;

    const parts = val.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : null;

    // Handle initial negative sign if any
    const isNegative = integerPart.startsWith('-');
    if (isNegative) {
      integerPart = integerPart.slice(1);
    }

    // Format with commas
    const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const finalInt = isNegative ? `-${formattedInt}` : formattedInt;

    return decimalPart !== null ? `${finalInt}.${decimalPart}` : finalInt;
  };

  // Adjust display text size dynamically as digits increase
  const getFontSizeClass = (val: string): string => {
    const len = val.length;
    if (len <= 8) return 'text-5xl sm:text-6xl font-light tracking-tighter';
    if (len <= 11) return 'text-4xl sm:text-5xl font-light tracking-tighter';
    if (len <= 14) return 'text-3xl sm:text-4xl font-normal tracking-tight';
    return 'text-2xl sm:text-3xl font-mono';
  };

  // Helper converter for UI expressions
  const getOperatorGlyph = (operatorCode: string): string => {
    switch (operatorCode) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return '';
    }
  };

  // Math solver engine
  const calculateResult = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : NaN;
      default: return b;
    }
  };

  // Floating point cleaner
  const formatNumberPruning = (num: number): string => {
    if (isNaN(num)) return 'Error';
    if (!isFinite(num)) return 'Overflow';
    
    const absolute = Math.abs(num);
    // Exponent range
    if (absolute > 999999999999 || (absolute < 1e-7 && absolute > 0)) {
      return num.toExponential(6);
    }

    // Solve JS decimals binary representation discrepancies (e.g. 0.1 + 0.2 = 0.3)
    const fixedRepresentation = parseFloat(num.toFixed(10));
    const str = fixedRepresentation.toString();
    if (str.length > 12) {
      return fixedRepresentation.toPrecision(8).replace(/\.?0+$/, '');
    }
    return str;
  };

  // State actions mappings
  const inputDigit = (digit: string) => {
    triggerClick();
    
    if (isFinished || display === 'Error' || display === 'Overflow') {
      setDisplay(digit);
      setIsFinished(false);
      setIsNextNumberPending(false);
      return;
    }

    if (isNextNumberPending) {
      setDisplay(digit);
      setIsNextNumberPending(false);
    } else {
      if (display === '0') {
        setDisplay(digit);
      } else {
        // Enforce 15 digit entry cap
        const digitsOnly = display.replace(/[^0-9]/g, '');
        if (digitsOnly.length < 15) {
          setDisplay(display + digit);
        }
      }
    }
  };

  const inputDecimal = () => {
    triggerClick();

    if (isFinished || display === 'Error' || display === 'Overflow') {
      setDisplay('0.');
      setIsFinished(false);
      setIsNextNumberPending(false);
      return;
    }

    if (isNextNumberPending) {
      setDisplay('0.');
      setIsNextNumberPending(false);
    } else {
      if (!display.includes('.')) {
        setDisplay(display + '.');
      }
    }
  };

  const handleOperator = (nextOp: string) => {
    triggerClick();
    const inputValue = parseFloat(display);

    if (display === 'Error' || display === 'Overflow') return;

    if (op && isNextNumberPending) {
      // Simply switch active operator if no value has been typed yet
      setOp(nextOp);
      setFormula(`${prevValue} ${getOperatorGlyph(nextOp)}`);
      return;
    }

    if (prevValue === null) {
      setPrevValue(inputValue);
      setFormula(`${inputValue} ${getOperatorGlyph(nextOp)}`);
    } else if (op) {
      const runningResult = calculateResult(prevValue, inputValue, op);
      const formattedResult = formatNumberPruning(runningResult);
      setPrevValue(runningResult);
      setDisplay(formattedResult);
      setFormula(`${formattedResult} ${getOperatorGlyph(nextOp)}`);
    }

    setOp(nextOp);
    setIsNextNumberPending(true);
    setIsFinished(false);
  };

  const evaluate = () => {
    triggerClick();

    if (op === null || prevValue === null || isNextNumberPending) return;

    const b = parseFloat(display);
    const resultValue = calculateResult(prevValue, b, op);
    const formattedResult = formatNumberPruning(resultValue);

    // Save calculation to history
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      expression: `${prevValue} ${getOperatorGlyph(op)} ${b}`,
      result: formattedResult,
      timestamp: new Date()
    };
    updateHistory([newItem, ...history].slice(0, 50)); // cap at 50 logs

    setDisplay(formattedResult);
    setPrevValue(null);
    setOp(null);
    setFormula('');
    setIsFinished(true);
    setIsNextNumberPending(false);
  };

  const clearAll = () => {
    triggerClick();
    setDisplay('0');
    setPrevValue(null);
    setOp(null);
    setFormula('');
    setIsFinished(false);
    setIsNextNumberPending(false);
  };

  const clearCurrent = () => {
    triggerClick();
    setDisplay('0');
  };

  const toggleSign = () => {
    triggerClick();
    if (display === '0' || display === 'Error' || display === 'Overflow') return;
    
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const percentage = () => {
    triggerClick();
    if (display === '0' || display === 'Error' || display === 'Overflow') return;

    const currentNum = parseFloat(display);
    
    if (op && prevValue !== null) {
      // Percent logic based on preceding value (e.g., 200 + 10% translates to 200 + 20)
      const percentVal = prevValue * (currentNum / 100);
      setDisplay(formatNumberPruning(percentVal));
    } else {
      // Basic division by 100
      setDisplay(formatNumberPruning(currentNum / 100));
    }
  };

  const backspaceEnd = () => {
    triggerClick();
    if (isFinished || display === 'Error' || display === 'Overflow') return;
    
    if (display.length > 1) {
      const sliced = display.slice(0, -1);
      // If it ends with just a sign, reset to '0'
      if (sliced === '-') {
        setDisplay('0');
      } else {
        setDisplay(sliced);
      }
    } else {
      setDisplay('0');
    }
  };

  const handleRecallHistory = (item: HistoryItem) => {
    // Set display value to targeted history evaluation result
    setDisplay(item.result);
    setFormula('');
    setPrevValue(null);
    setOp(null);
    setIsFinished(true);
    setHistoryOpen(false);
    triggerClick();
  };

  const handleDeleteHistoryItem = (id: string) => {
    const nextHistory = history.filter(item => item.id !== id);
    updateHistory(nextHistory);
  };

  // Handle Keyboard synchronization map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid interference if elements like input buttons are selected
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement).tagName)) return;

      const key = e.key;

      // Key flashes simulator references
      let matchedId = '';

      if (/[0-9]/.test(key)) {
        inputDigit(key);
        matchedId = `btn-${key}`;
      } else if (key === '.') {
        inputDecimal();
        matchedId = 'btn-decimal';
      } else if (key === '+') {
        handleOperator('+');
        matchedId = 'btn-add';
      } else if (key === '-') {
        handleOperator('-');
        matchedId = 'btn-subtract';
      } else if (key === '*') {
        handleOperator('*');
        matchedId = 'btn-multiply';
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('/');
        matchedId = 'btn-divide';
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        evaluate();
        matchedId = 'btn-equals';
      } else if (key === 'Backspace') {
        backspaceEnd();
        matchedId = 'btn-backspace';
      } else if (key === 'Escape') {
        clearAll();
        matchedId = 'btn-clear';
      } else if (key === '%') {
        percentage();
        matchedId = 'btn-percent';
      }

      if (matchedId) {
        setActivePressedKey(matchedId);
        setTimeout(() => setActivePressedKey(null), 120);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, prevValue, op, isNextNumberPending, isFinished]);

  // Clean all history records
  const handleClearHistory = () => {
    updateHistory([]);
  };

  // Determine if Clear button displays C or AC
  const isDisplayEmpty = display === '0';

  return (
    <div id="calculator-root" className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-6 pb-20 sm:p-8 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-white transition-all relative">
      
      {/* Background Decorative Gradient Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />

      {/* Header Navigation Mockup */}
      <nav className="absolute top-0 w-full px-6 sm:px-10 py-6 flex justify-between items-center z-20 font-sans select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-900/40">
            <span className="text-white font-bold text-lg leading-none font-display">S</span>
          </div>
          <span className="text-white/90 font-medium tracking-tight">Simple Calculator <span className="text-white/40 font-normal font-sans">2026</span></span>
        </div>
        <div className="flex gap-4 sm:gap-6 text-sm text-white/50">
          <span 
            onClick={() => setHistoryOpen(true)}
            className="hover:text-white cursor-pointer transition-colors relative flex items-center gap-1 font-medium text-indigo-400"
          >
            History
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            )}
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <div className="relative w-full max-w-[360px] z-10 mt-16 sm:mt-12">
        
        {/* Hardware Frame Core Card styled to match Sleek Interface */}
        <div 
          id="calculator-card" 
          className="w-full bg-[#18181B] rounded-[3rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/5 flex flex-col gap-6 relative"
        >
          {/* Screen/Display Area */}
          <div 
            id="calculator-screen" 
            className="flex flex-col items-end justify-end px-4 py-6 bg-black/20 rounded-3xl mb-1 min-h-[142px] select-all relative overflow-hidden group border border-white/5 shadow-inner"
          >
            {/* Live running mathematical formula */}
            <div id="dynamic-formula-display" className="text-white/30 text-base mb-1 font-light tracking-widest h-6 overflow-hidden text-right leading-relaxed pr-1 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
              {formula || (op ? `${prevValue} ${getOperatorGlyph(op)}` : '')}
            </div>

            {/* Dynamic visual numeric LCD print */}
            <div 
              id="dynamic-numeric-lcd"
              ref={displayRef}
              className={`text-white transition-all font-display truncate pr-0.5 select-text ${getFontSizeClass(display)}`}
            >
              {formatDisplayString(display)}
            </div>
          </div>

          {/* Calculator Keypad Grid */}
          <div id="calculator-key-grid" className="grid grid-cols-4 gap-4 bg-transparent select-none">
            {/* ROW 1: AC/C, Backspace, %, Division */}
            {isDisplayEmpty ? (
              <button
                id="btn-clear"
                type="button"
                onClick={clearAll}
                className={`w-full aspect-square rounded-full text-xl font-medium flex items-center justify-center hover:bg-white/10 cursor-pointer border transition-all active:scale-[0.96] ${
                  activePressedKey === 'btn-clear'
                    ? 'bg-white/20 border-white/15 scale-95 text-indigo-200' 
                    : 'bg-white/5 text-indigo-300 border-white/5'
                }`}
              >
                AC
              </button>
            ) : (
              <button
                id="btn-clear-buffer"
                type="button"
                onClick={clearCurrent}
                className="w-full aspect-square rounded-full bg-white/5 text-indigo-300 hover:text-indigo-200 hover:bg-white/10 border border-white/5 text-xl font-medium flex items-center justify-center cursor-pointer transition-all active:scale-[0.96]"
              >
                C
              </button>
            )}

            <button
              id="btn-backspace"
              type="button"
              onClick={backspaceEnd}
              className={`w-full aspect-square rounded-full text-xl font-medium cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-backspace'
                  ? 'bg-white/20 border-white/15 scale-95 text-indigo-200'
                  : 'bg-white/5 text-indigo-300 border-white/5 hover:bg-white/10'
              }`}
              aria-label="Delete character"
            >
              <Delete className="w-5 h-5" />
            </button>

            <button
              id="btn-percent"
              type="button"
              onClick={percentage}
              className={`w-full aspect-square rounded-full text-xl font-medium cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-percent'
                  ? 'bg-white/20 border-white/15 scale-95 text-indigo-200'
                  : 'bg-white/5 text-indigo-300 border-white/5 hover:bg-white/10'
              }`}
            >
              %
            </button>

            <button
              id="btn-divide"
              type="button"
              onClick={() => handleOperator('/')}
              className={`w-full aspect-square rounded-full text-3xl font-light cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                op === '/' 
                  ? 'bg-indigo-700 text-white border-indigo-400 font-bold scale-95 shadow-inner shadow-indigo-900/40' 
                  : activePressedKey === 'btn-divide'
                    ? 'bg-indigo-500 text-white border-indigo-400 scale-95'
                    : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
              }`}
            >
              ÷
            </button>

            {/* ROW 2: 7, 8, 9, Multiply */}
            <button
              id="btn-7"
              type="button"
              onClick={() => inputDigit('7')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-7'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              7
            </button>
            <button
              id="btn-8"
              type="button"
              onClick={() => inputDigit('8')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-8'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              8
            </button>
            <button
              id="btn-9"
              type="button"
              onClick={() => inputDigit('9')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-9'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              9
            </button>
            <button
              id="btn-multiply"
              type="button"
              onClick={() => handleOperator('*')}
              className={`w-full aspect-square rounded-full text-3xl font-light cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                op === '*' 
                  ? 'bg-indigo-700 text-white border-indigo-400 font-bold scale-95 shadow-inner' 
                  : activePressedKey === 'btn-multiply'
                    ? 'bg-indigo-500 text-white border-indigo-400 scale-95'
                    : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
              }`}
            >
              ×
            </button>

            {/* ROW 3: 4, 5, 6, Subtract */}
            <button
              id="btn-4"
              type="button"
              onClick={() => inputDigit('4')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-4'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              4
            </button>
            <button
              id="btn-5"
              type="button"
              onClick={() => inputDigit('5')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-5'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              5
            </button>
            <button
              id="btn-6"
              type="button"
              onClick={() => inputDigit('6')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-6'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              6
            </button>
            <button
              id="btn-subtract"
              type="button"
              onClick={() => handleOperator('-')}
              className={`w-full aspect-square rounded-full text-3xl font-light cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                op === '-' 
                  ? 'bg-indigo-700 text-white border-indigo-400 font-bold scale-95 shadow-inner' 
                  : activePressedKey === 'btn-subtract'
                    ? 'bg-indigo-500 text-white border-indigo-400 scale-95'
                    : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
              }`}
            >
              −
            </button>

            {/* ROW 4: 1, 2, 3, Add */}
            <button
              id="btn-1"
              type="button"
              onClick={() => inputDigit('1')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-1'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              1
            </button>
            <button
              id="btn-2"
              type="button"
              onClick={() => inputDigit('2')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-2'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              2
            </button>
            <button
              id="btn-3"
              type="button"
              onClick={() => inputDigit('3')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-3'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              3
            </button>
            <button
              id="btn-add"
              type="button"
              onClick={() => handleOperator('+')}
              className={`w-full aspect-square rounded-full text-3xl font-light cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                op === '+' 
                  ? 'bg-indigo-700 text-white border-indigo-400 font-bold scale-95 shadow-inner' 
                  : activePressedKey === 'btn-add'
                    ? 'bg-indigo-500 text-white border-indigo-400 scale-95'
                    : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
              }`}
            >
              +
            </button>

            {/* ROW 5: Sign ±, 0, Dot ., Equals = */}
            <button
              id="btn-sign"
              type="button"
              onClick={toggleSign}
              className="w-full aspect-square rounded-full bg-white/10 text-white border border-white/5 hover:bg-white/20 text-2xl font-normal flex items-center justify-center cursor-pointer transition-all active:scale-[0.96]"
            >
              ±
            </button>
            <button
              id="btn-0"
              type="button"
              onClick={() => inputDigit('0')}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-0'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              0
            </button>
            <button
              id="btn-decimal"
              type="button"
              onClick={inputDecimal}
              className={`w-full aspect-square rounded-full text-2xl font-normal text-white cursor-pointer border transition-all active:scale-[0.96] flex items-center justify-center ${
                activePressedKey === 'btn-decimal'
                  ? 'bg-white/25 border-white/15 scale-95'
                  : 'bg-white/10 border-white/5 hover:bg-white/20'
              }`}
            >
              .
            </button>
            <button
              id="btn-equals"
              type="button"
              onClick={evaluate}
              className={`w-full aspect-square rounded-full text-3xl font-light cursor-pointer transition-all active:scale-[0.96] flex items-center justify-center shadow-lg shadow-purple-900/40 ${
                activePressedKey === 'btn-equals'
                  ? 'from-indigo-600 to-purple-700 scale-95 text-white'
                  : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white hover:brightness-110'
              }`}
            >
              =
            </button>

          </div>
        </div>

      </div>

      {/* Slide-out History Menu - Placed at root level to prevent clipping and secure pointer events */}
      <HistorySidebar
        history={history}
        onClear={handleClearHistory}
        onRecall={handleRecallHistory}
        onDeleteItem={handleDeleteHistoryItem}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
