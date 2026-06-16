import { useState, useMemo } from 'react';
import { Zap, TrendingDown, Trophy, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, BarChart3, Calendar } from 'lucide-react';
import { useStore, getYesterdayStr, getWeekDates, getMonthDates } from '@/store';
import { getWeekDayName, getIncompletePointsForPeriod } from '@/utils';
import BarChart from '@/components/BarChart';
import AnimatedNumber from '@/components/AnimatedNumber';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type StatsTab = 'thisWeek' | 'lastWeek' | 'month' | 'total';

export default function Stats() {
  const [activeTab, setActiveTab] = useState<StatsTab>('thisWeek');

  const todayStr = today();
  const yesterdayStr = getYesterdayStr();
  const thisWeekDates = useMemo(() => getWeekDates(0), []);
  const lastWeekDates = useMemo(() => getWeekDates(-1), []);
  const monthDates = useMemo(() => getMonthDates(), []);

  const checkins = useStore((s) => s.checkins);
  const config = useStore((s) => s.config);
  const tasks = useStore((s) => s.tasks);

  const todayPoints = useMemo(() => {
    const dayRecords = checkins[todayStr] || [];
    return dayRecords.filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);
  }, [checkins, todayStr]);

  const yesterdayPoints = useMemo(() => {
    const dayRecords = checkins[yesterdayStr] || [];
    return dayRecords.filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);
  }, [checkins, yesterdayStr]);

  const totalPoints = useMemo(() => {
    let total = 0;
    for (const records of Object.values(checkins)) {
      total += records.filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);
    }
    total -= config.totalPointsSpent || 0;
    return Math.max(0, total);
  }, [checkins, config.totalPointsSpent]);

  const incompletePoints = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.type === 'fixed' || t.createdAt === todayStr);
    const dayRecords = checkins[todayStr] || [];
    const completedIds = new Set(dayRecords.filter((r) => r.completed).map((r) => r.taskId));
    return todayTasks.filter((t) => !completedIds.has(t.id)).reduce((sum, t) => sum + t.points, 0);
  }, [tasks, checkins, todayStr]);

  // Get dates for current tab
  const activeDates = useMemo(() => {
    switch (activeTab) {
      case 'thisWeek': return thisWeekDates;
      case 'lastWeek': return lastWeekDates;
      case 'month': return monthDates;
      case 'total': return Object.keys(checkins).sort();
    }
  }, [activeTab, thisWeekDates, lastWeekDates, monthDates, checkins]);

  const periodIncompletePoints = useMemo(() => {
    return getIncompletePointsForPeriod(tasks, checkins, activeDates);
  }, [tasks, checkins, activeDates]);

  const periodPoints = useMemo(() => {
    return activeDates.map((date) => {
      const dayRecords = checkins[date] || [];
      return dayRecords.filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);
    });
  }, [checkins, activeDates]);

  const periodTotal = periodPoints.reduce((sum, p) => sum + p, 0);
  const activeDays = periodPoints.filter((p) => p > 0).length;
  const dailyAvg = activeDays > 0 ? Math.round(periodTotal / activeDays) : 0;
  const highestDay = Math.max(...periodPoints);

  // Chart data - for total view, aggregate by week; for month, show daily
  const chartData = useMemo(() => {
    if (activeTab === 'total') {
      // Aggregate by week for total view
      const allDates = Object.keys(checkins).sort();
      if (allDates.length === 0) return [];
      // Group by week (using Monday as start)
      const weekMap = new Map<string, number>();
      for (const date of allDates) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setDate(d.getDate() + mondayOffset);
        const weekKey = `${monday.getMonth() + 1}/${monday.getDate()}`;
        const dayPoints = (checkins[date] || []).filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);
        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + dayPoints);
      }
      return Array.from(weekMap.entries()).map(([label, value]) => ({
        label,
        value,
        color: '#FFB87A',
      }));
    }
    if (activeTab === 'month') {
      // Show by week within the month
      const weeks: { label: string; value: number }[] = [];
      let weekSum = 0;
      let weekStart = 0;
      for (let i = 0; i < monthDates.length; i++) {
        const dayRecords = checkins[monthDates[i]] || [];
        const pts = dayRecords.filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);
        weekSum += pts;
        const d = new Date(monthDates[i]);
        if (d.getDay() === 0 || i === monthDates.length - 1) {
          const startLabel = new Date(monthDates[weekStart]);
          weeks.push({
            label: `${startLabel.getMonth() + 1}/${startLabel.getDate()}`,
            value: weekSum,
          });
          weekSum = 0;
          weekStart = i + 1;
        }
      }
      return weeks.map((w, i) => ({
        ...w,
        color: i === weeks.length - 1 ? '#FF8C42' : '#FFB87A',
      }));
    }
    // Week view - daily
    return activeDates.map((date, i) => ({
      label: getWeekDayName(date),
      value: periodPoints[i],
      color: date === todayStr ? '#FF8C42' : '#FFB87A',
    }));
  }, [activeTab, activeDates, checkins, monthDates, periodPoints, todayStr]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);
  const allZero = chartData.every((d) => d.value === 0);

  const diff = todayPoints - yesterdayPoints;
  const trendLabel =
    diff > 0 ? `今日比昨日多 ${diff} 分` : diff < 0 ? `今日比昨日少 ${Math.abs(diff)} 分` : '今日与昨日持平';

  const tabs: { key: StatsTab; label: string }[] = [
    { key: 'thisWeek', label: '本周' },
    { key: 'lastWeek', label: '上周' },
    { key: 'month', label: '本月' },
    { key: 'total', label: '累计' },
  ];

  const periodLabel = activeTab === 'thisWeek' ? '本周' : activeTab === 'lastWeek' ? '上周' : activeTab === 'month' ? '本月' : '累计';

  return (
    <div className="min-h-screen px-4 pb-8 pt-6" style={{ backgroundColor: '#FFF9F2' }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1B3A' }}>数据统计</h1>
        <div className="mt-1.5 h-[3px] w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #FF8C42, #FFB87A)' }} />
      </div>

      {/* Core Stats Panel */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        {[
          { label: '本日获得', value: todayPoints, icon: Zap, color: '#FF8C42', bg: '#FFF3E8', isSpecial: false },
          { label: '昨日获得', value: yesterdayPoints, icon: TrendingDown, color: '#3B82F6', bg: '#EFF6FF', isSpecial: false },
          { label: '累计积分', value: totalPoints, icon: Trophy, color: '#8B5CF6', bg: '#F3F0FF', isSpecial: true },
          { label: '未完成积分', value: incompletePoints, icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2', isSpecial: false },
        ].map((card) =>
          card.isSpecial ? (
            <div key={card.label} className="relative overflow-hidden rounded-2xl p-4 shadow-md" style={{ background: 'linear-gradient(135deg, #FF8C42, #F59E0B)' }}>
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute -right-1 bottom-[-12px] h-16 w-16 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-2.5 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <card.icon size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-white/80">{card.label}</span>
              </div>
              <div className="relative text-[28px] font-bold text-white"><AnimatedNumber value={card.value} /></div>
            </div>
          ) : (
            <div key={card.label} className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm" style={{ borderTop: `3px solid ${card.color}` }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: card.bg }}>
                  <card.icon size={20} style={{ color: card.color }} />
                </div>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{card.label}</span>
              </div>
              <div className="text-[28px] font-bold" style={{ color: card.color }}><AnimatedNumber value={card.value} /></div>
            </div>
          )
        )}
      </div>

      {/* Period Tabs */}
      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white shadow-md shadow-[#FF8C42]/25'
                : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Section */}
      <div className="mb-5 overflow-hidden rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} style={{ color: '#FF8C42' }} />
          <h2 className="text-base font-semibold" style={{ color: '#1A1B3A' }}>{periodLabel}积分</h2>
        </div>
        {allZero ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: '#FFF3E8' }}>
              <Calendar size={28} style={{ color: '#FFB87A' }} />
            </div>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>暂无数据</span>
          </div>
        ) : (
          <BarChart data={chartData} maxValue={maxChartValue} />
        )}
      </div>

      {/* Period Summary */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: `${periodLabel}总积分`, value: periodTotal, color: '#FF8C42' },
          { label: '日均积分', value: dailyAvg, color: '#3B82F6' },
          { label: '最高单日', value: highestDay, color: '#8B5CF6' },
        ].map((item) => (
          <div key={item.label} className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-sm" style={{ borderTop: `3px solid ${item.color}` }}>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>{item.label}</span>
            <div className="mt-1.5 text-2xl font-bold" style={{ color: item.color }}><AnimatedNumber value={item.value} /></div>
          </div>
        ))}
      </div>

      {/* Period Incomplete Points */}
      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm" style={{ borderTop: '3px solid #EF4444' }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: '#FEF2F2' }}>
          <AlertCircle size={20} style={{ color: '#EF4444' }} />
        </div>
        <div className="flex-1">
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{periodLabel}未完成积分</span>
          <div className="text-2xl font-bold" style={{ color: '#EF4444' }}><AnimatedNumber value={periodIncompletePoints} /></div>
        </div>
      </div>

      {/* Points Trend */}
      <div
        className="flex items-center justify-center gap-2.5 rounded-2xl px-4 py-3.5 shadow-sm"
        style={{ backgroundColor: diff > 0 ? '#F0FDF4' : diff < 0 ? '#FEF2F2' : '#F9FAFB' }}
      >
        {diff > 0 ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100">
            <ArrowUpRight size={16} className="text-green-500" />
          </div>
        ) : diff < 0 ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
            <ArrowDownRight size={16} className="text-red-500" />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
            <Minus size={16} className="text-gray-400" />
          </div>
        )}
        <span className={`text-sm font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-500'}`}>
          {trendLabel}
        </span>
      </div>
    </div>
  );
}