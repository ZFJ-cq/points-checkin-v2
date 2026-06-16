import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { formatDateCN, getWeekDayName, today, dayOffset, copyToClipboard } from '@/utils';
import { Calendar, Copy, Check, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

type FilterTab = 'today' | 'yesterday' | 'week' | 'custom';

export default function HistoryPage() {
  const getDayAllRecords = useStore((state) => state.getDayAllRecords);
  const retroCheckin = useStore((state) => state.retroCheckin);
  const getIncompletePoints = useStore((state) => state.getIncompletePoints);
  const tasks = useStore((state) => state.tasks);
  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [customDate, setCustomDate] = useState(today());
  const [copied, setCopied] = useState(false);

  const dates = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return [today()];
      case 'yesterday':
        return [dayOffset(today(), -1)];
      case 'week': {
        const result: string[] = [];
        for (let i = 0; i < 7; i++) {
          result.push(dayOffset(today(), -i));
        }
        return result;
      }
      case 'custom':
        return [customDate];
    }
  }, [activeTab, customDate]);

  const groupedRecords = useMemo(() => {
    const groups: { date: string; records: ReturnType<typeof getDayAllRecords> }[] = [];
    for (const date of dates) {
      const allRecords = getDayAllRecords(date);
      if (allRecords.length > 0) {
        groups.push({ date, records: allRecords });
      }
    }
    return groups;
  }, [dates, getDayAllRecords]);

  const getDatePoints = (records: { completed: boolean; pointsEarned: number }[]) =>
    records.filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);

  const handleCopy = async () => {
    const lines: string[] = [];
    for (const group of groupedRecords) {
      const totalPoints = getDatePoints(group.records);
      lines.push(`${formatDateCN(group.date)} ${getWeekDayName(group.date)} +${totalPoints}分`);
      for (const r of group.records) {
        const status = r.completed ? '✅' : '❌';
        const points = r.completed ? `+${r.pointsEarned}` : `${r.pointsEarned}`;
        lines.push(`  ${status} ${r.taskName} (${r.taskType === 'fixed' ? '固定' : '临时'}) ${points}分 ${r.checkinTime}`);
      }
      lines.push('');
    }
    if (lines.length === 0) return;
    await copyToClipboard(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: 'yesterday', label: '昨日' },
    { key: 'week', label: '近7天' },
    { key: 'custom', label: '自定义' },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F2] pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFF9F2]/95 backdrop-blur-md px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-[#FF8C42] to-[#FF6B6B]" />
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">历史记录</h1>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="sticky top-[56px] z-10 bg-[#FFF9F2]/95 backdrop-blur-md px-5 pb-4">
        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white shadow-md shadow-[#FF8C42]/25'
                  : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date Picker */}
        {activeTab === 'custom' && (
          <div className="mt-3.5 flex items-center gap-2.5 animate-fade-in">
            <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-100 px-3.5 py-2 shadow-sm">
              <Calendar size={15} className="text-[#FF8C42]" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                max={today()}
                className="bg-transparent text-sm text-gray-700 outline-none [color-scheme:light]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Records List */}
      <div className="px-5">
        {groupedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF8C42]/10 to-[#FF6B6B]/10 mb-5">
              <Calendar size={40} strokeWidth={1.5} className="text-[#FF8C42]/50" />
            </div>
            <p className="text-base font-bold text-gray-500">暂无记录</p>
            <p className="mt-1.5 text-sm text-gray-400">该时间段还没有打卡记录哦</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedRecords.map((group, groupIdx) => {
              const totalPoints = getDatePoints(group.records);
              return (
                <div key={group.date}>
                  {/* Date Header */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-gradient-to-b from-[#FF8C42] to-[#FF6B6B]" />
                    <span className="text-base font-extrabold text-gray-800">
                      {formatDateCN(group.date)} {getWeekDayName(group.date)}
                    </span>
                    <span className="rounded-full bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm shadow-[#FF8C42]/20">
                      +{totalPoints}分
                    </span>
                  </div>

                  {/* Record Cards */}
                  <div className="space-y-2.5">
                    {group.records.map((record, recordIdx) => (
                      <div
                        key={record.id}
                        className={`rounded-xl bg-white p-4 shadow-sm transition-all duration-300 animate-slide-up ${
                          record.completed
                            ? 'border-l-[3px] border-l-[#34D399]'
                            : 'border-l-[3px] border-l-gray-200'
                        }`}
                        style={{
                          animationDelay: `${groupIdx * 60 + recordIdx * 80}ms`,
                          animationFillMode: 'both',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2.5">
                            {/* Status dot */}
                            <div className="mt-1.5">
                              {record.completed ? (
                                <CheckCircle2 size={16} className="text-[#34D399]" />
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <XCircle size={16} className="text-gray-300" />
                                  {group.date !== today() && (
                                    <button
                                      onClick={() => {
                                        const incompletePoints = getIncompletePoints(group.date);
                                        const cost = incompletePoints * 10;
                                        const task = tasks.find(t => t.id === record.taskId);
                                        if (confirm(`补卡需要消耗 ${cost} 积分（当日未完成积分×10），确认补卡？`)) {
                                          const success = retroCheckin(record.taskId, group.date);
                                          if (!success) {
                                            alert('积分不足，无法补卡');
                                          } else {
                                            alert(`补卡成功！获得 ${task?.points ?? 0} 积分`);
                                          }
                                        }
                                      }}
                                      className="flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 active:scale-95"
                                    >
                                      <RotateCcw size={12} />
                                      补卡
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-semibold ${
                                    record.completed ? 'text-gray-800' : 'text-gray-400'
                                  }`}
                                >
                                  {record.taskName}
                                </span>
                                {/* Type dot indicator */}
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    record.taskType === 'fixed' ? 'bg-[#FF8C42]' : 'bg-blue-400'
                                  }`}
                                />
                                {!record.completed && (
                                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                                    未完成
                                  </span>
                                )}
                              </div>
                              {record.checkinTime && (
                                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                                  <Clock size={11} className="text-gray-300" />
                                  <span>{record.checkinTime}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              record.completed
                                ? 'text-[#34D399]'
                                : 'text-gray-300 line-through'
                            }`}
                          >
                            {record.completed ? `+${record.pointsEarned}` : record.pointsEarned}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider between date groups */}
                  {groupIdx < groupedRecords.length - 1 && (
                    <div className="mt-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Export Button */}
      {groupedRecords.length > 0 && (
        <div className="mt-8 px-5">
          <button
            onClick={handleCopy}
            className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold shadow-lg transition-all duration-300 active:scale-[0.97] ${
              copied
                ? 'bg-gradient-to-r from-[#34D399] to-[#10B981] text-white shadow-[#34D399]/25'
                : 'bg-gradient-to-r from-[#FF8C42] to-[#FF6B6B] text-white shadow-[#FF8C42]/25'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} />
                已复制
              </>
            ) : (
              <>
                <Copy size={16} />
                复制记录
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
