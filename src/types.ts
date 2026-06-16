export interface Task {
  id: string;
  name: string;
  points: number;
  type: 'fixed' | 'temporary';
  createdAt: string;
  deadline?: string; // 可选截止时间，格式 "HH:MM"，超过此时间不可打卡
}

export interface CheckinRecord {
  id: string;
  taskId: string;
  taskName: string;
  taskType: string;
  date: string;
  checkinTime: string;
  completed: boolean;
  pointsEarned: number;
  isRetro?: boolean;
}

export interface ExchangeRecord {
  id: string;
  tier: number;
  pointsCost: number;
  exchangedAt: string;
  note?: string;
  usedAt?: string; // 使用时间，有值表示已使用
}

export interface ExchangeItem {
  id: string;
  points: number;
  label: string;
}

export const DEFAULT_EXCHANGE_ITEMS: Omit<ExchangeItem, 'id'>[] = [
  { points: 100, label: '95折优惠' },
  { points: 300, label: '9折优惠' },
  { points: 500, label: '8折优惠' },
];

export interface AppConfig {
  lastVisitDate: string;
  startDate: string;
  totalPointsSpent: number; // 累计消耗积分（清空记录后不返还）
}

export interface StreakInfo {
  current: number;       // 当前连续打卡天数
  longest: number;       // 历史最长连续天数
  lastCheckinDate: string; // 最后打卡日期
  isBroken: boolean;     // 是否断签
  brokenStreak: number;  // 断签前的连续天数
}

export interface BackupData {
  version: number;
  exportedAt: string;
  tasks: Task[];
  checkins: Record<string, CheckinRecord[]>;
  exchanges: ExchangeRecord[];
  exchangeItems: ExchangeItem[];
  config: AppConfig;
}
