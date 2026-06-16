import type { Task, CheckinRecord } from './types';

export function formatDateCN(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

export function formatDateTimeCN(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getWeekDayName(dateStr: string): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return '周' + days[new Date(dateStr + 'T00:00:00').getDay()];
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dayOffset(dateStr: string, offset: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getIncompletePointsForPeriod(tasks: Task[], checkins: Record<string, CheckinRecord[]>, dates: string[]): number {
  let total = 0;
  for (const date of dates) {
    const dayTasks = tasks.filter(t => t.type === 'fixed' || t.createdAt === date);
    const dayRecords = checkins[date] || [];
    const completedIds = new Set(dayRecords.filter(r => r.completed).map(r => r.taskId));
    total += dayTasks.filter(t => !completedIds.has(t.id)).reduce((sum, t) => sum + t.points, 0);
  }
  return total;
}
