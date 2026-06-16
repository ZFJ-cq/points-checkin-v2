import { useNavigate } from 'react-router-dom';
import { ListTodo, History, BarChart3, Gift, ChevronRight } from 'lucide-react';
import { useStore } from '@/store';
import AnimatedNumber from '@/components/AnimatedNumber';

const menuItems = [
  { path: '/tasks', label: '我的任务', icon: ListTodo, color: '#FF8C42', bg: '#FFF3E8' },
  { path: '/history', label: '我的记录', icon: History, color: '#3B82F6', bg: '#EFF6FF' },
  { path: '/stats', label: '我的统计', icon: BarChart3, color: '#8B5CF6', bg: '#F3F0FF' },
  { path: '/exchange', label: '我的兑换', icon: Gift, color: '#EF4444', bg: '#FEF2F2' },
] as const;

export default function Profile() {
  const navigate = useNavigate();
  const checkins = useStore((s) => s.checkins);
  const config = useStore((s) => s.config);
  const tasks = useStore((s) => s.tasks);
  const getStreakInfo = useStore((s) => s.getStreakInfo);

  const totalPoints = (() => {
    let total = 0;
    for (const records of Object.values(checkins)) {
      total += records.filter((r) => r.completed).reduce((sum, r) => sum + r.pointsEarned, 0);
    }
    return Math.max(0, total - (config.totalPointsSpent || 0));
  })();

  const totalCheckins = Object.values(checkins)
    .flatMap((records) => records.filter((r) => r.completed))
    .length;

  const streak = getStreakInfo();

  return (
    <div className="min-h-screen pb-8 bg-[#FFF9F2]">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-3xl font-extrabold gradient-text tracking-tight">我的</h1>
        <div className="mt-1.5 h-[3px] w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #FF8C42, #FFB87A)' }} />
      </div>

      {/* Stats Card */}
      <div className="mt-5 mx-5 rounded-2xl p-5 shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF8C42, #F59E0B)' }}>
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
        <div className="absolute right-12 bottom-[-10px] h-20 w-20 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-3xl">👤</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80">累计积分</p>
            <p className="text-[36px] font-bold leading-none text-white">
              <AnimatedNumber value={totalPoints} />
            </p>
          </div>
        </div>
        <div className="relative mt-4 flex gap-6">
          <div>
            <p className="text-xs text-white/60">打卡次数</p>
            <p className="text-lg font-bold text-white">{totalCheckins}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">任务数</p>
            <p className="text-lg font-bold text-white">{tasks.length}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">连续天数</p>
            <p className="text-lg font-bold text-white">{streak.current}</p>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="mt-6 mx-5 rounded-2xl bg-white shadow-sm overflow-hidden">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 px-5 py-4 transition-colors active:bg-gray-50"
              style={{
                borderBottom: index < menuItems.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: item.bg }}
              >
                <Icon size={20} style={{ color: item.color }} />
              </div>
              <span className="flex-1 text-left text-sm font-semibold text-[#1A1B3A]">{item.label}</span>
              <ChevronRight size={18} className="text-[#D1D5DB]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
