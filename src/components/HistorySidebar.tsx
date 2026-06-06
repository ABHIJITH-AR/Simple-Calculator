/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { History, Trash2, X, RotateCcw } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  onClear: () => void;
  onRecall: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function HistorySidebar({
  history,
  onClear,
  onRecall,
  onDeleteItem,
  isOpen,
  onClose,
}: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay background */}
          <motion.div
            id="history-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-900 z-40 cursor-pointer"
          />

          {/* Sliding panel */}
          <motion.div
            id="history-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#18181B]/95 backdrop-blur-xl text-neutral-250 border-l border-white/5 shadow-2xl z-50 flex flex-col font-sans"
          >
            {/* Header */}
            <div id="history-header" className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <span className="font-display font-medium text-lg tracking-tight text-white">Calculation History</span>
              </div>
              <button
                id="close-history-btn"
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
                aria-label="Close history"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div id="history-items-container" className="flex-1 overflow-y-auto p-5 space-y-4">
              {history.length === 0 ? (
                <div id="no-history-state" className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-12">
                  <div className="p-3 bg-white/5 rounded-full mb-3">
                    <History className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="font-sans text-sm">No recent calculations</p>
                  <p className="font-sans text-xs text-neutral-600 mt-1">Your calculation history will appear here.</p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    id={`history-item-${item.id}`}
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-all group flex flex-col"
                  >
                    <div className="text-right text-xs text-neutral-400 font-mono tracking-wide break-all opacity-70">
                      {item.expression}
                    </div>
                    <div className="text-right text-lg font-display font-bold text-white mt-1 break-all flex items-baseline justify-between gap-2">
                      <span className="text-[10px] text-neutral-550 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        = {item.result}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center gap-4">
                      <button
                        id={`delete-item-btn-${item.id}`}
                        onClick={() => onDeleteItem(item.id)}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-red-400/90 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                      <button
                        id={`recall-item-btn-${item.id}`}
                        onClick={() => onRecall(item)}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Recall
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div id="history-footer" className="p-4 border-t border-white/5 bg-black/20">
                <button
                  id="clear-all-history-btn"
                  onClick={onClear}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-red-950/40 hover:border-red-900/40 border border-white/5 text-red-400 hover:text-red-300 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
