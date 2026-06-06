export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
}

export type ButtonType = 'digit' | 'operator' | 'function' | 'memory' | 'action';

export interface CalcButton {
  label: string;
  value: string;
  type: ButtonType;
  id: string;
}
