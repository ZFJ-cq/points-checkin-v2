import { useState, useMemo, useCallback, useEffect } from 'react';
import { Zap, TrendingDown, Trophy, AlertCircle, Plus, Check, Flame, AlertTriangle, CheckCircle, CheckCircle2 } from 'lucide-react';
import { useStore, getYesterdayStr } from '@/store';
import Modal from '@/components/Modal';
import AnimatedNumber from '@/components/AnimatedNumber';

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatChineseDate = () => {
  const d = new Date();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`;
};

const randomPoints = () => Math.floor(Math.random() * 20) + 1;

const POINTS_CARDS = [
  { label: '本日获得', icon: Zap, color: '#FF8C42', bg: '#FFF3E8' },
  { label: '昨日获得', icon: TrendingDown, color: '#3B82F6', bg: '#EFF6FF' },
  { label: '累计积分', icon: Trophy, color: '#8B5CF6', bg: '#F3F0FF' },
  { label: '未完成积分', icon: AlertCircle, color: '#EF4444', bg: '#FEF2F2' },
] as const;

type ConfirmAction = {
  title: string;
  message: string;
  confirmText: string;
  danger?: boolean;
  onConfirm: () => void;
} | null;

export default function Home() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState('');
  const [newTaskType, setNewTaskType] = useState<'fixed' | 'temporary'>('fixed');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [showPing, setShowPing] = useState(true);

  // 通用确认弹窗
  const [actionConfirm, setActionConfirm] = useState<ConfirmAction>(null);

  // Toast 状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const showConfirm = useCallback((action: Omit<NonNullable<ConfirmAction>, 'onConfirm'> & { onConfirm: () => void }) => {
    setActionConfirm(action);
  }, []);

  const handleActionConfirm = () => {
    if (actionConfirm) {
      actionConfirm.onConfirm();
      setActionConfirm(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowPing(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const todayStr = getTodayStr();
  const yesterdayStr = getYesterdayStr();
  const tasks = useStore((s) => s.tasks);
  const checkins = useStore((s) => s.checkins);
  const config = useStore((s) => s.config);
  const checkin = useStore((s) => s.checkin);
  const uncheckin = useStore((s) => s.uncheckin);
  const addTask = useStore((s) => s.addTask);
  const getStreakInfo = useStore((s) => s.getStreakInfo);
  const renewStreak = useStore((s) => s.renewStreak);

  const [pointsAnimations, setPointsAnimations] = useState<{ id: string; points: number; x: number; y: number }[]>([]);

  const todayTasks = useMemo(() => tasks.filter((t) => t.type === 'fixed' || t.createdAt === todayStr), [tasks, todayStr]);
  const todayCheckins = useMemo(() => checkins[todayStr] || [], [checkins, todayStr]);
  const completedTaskIds = useMemo(() => new Set(todayCheckins.filter((r) => r.completed).map((r) => r.taskId)), [todayCheckins]);
  const incomplete = useMemo(() => todayTasks.filter((t) => !completedTaskIds.has(t.id)), [todayTasks, completedTaskIds]);
  const completed = useMemo(() => todayTasks.filter((t) => completedTaskIds.has(t.id)), [todayTasks, completedTaskIds]);

  const todayPoints = useMemo(() => todayCheckins.filter((r) => r.completed).reduce((s, r) => s + r.pointsEarned, 0), [todayCheckins]);
  const yesterdayPoints = useMemo(() => {
    const dr = checkins[yesterdayStr] || [];
    return dr.filter((r) => r.completed).reduce((s, r) => s + r.pointsEarned, 0);
  }, [checkins, yesterdayStr]);
  const totalPoints = useMemo(() => {
    let t = 0;
    for (const rs of Object.values(checkins)) t += rs.filter((r) => r.completed).reduce((s, r) => s + r.pointsEarned, 0);
    return Math.max(0, t - (config.totalPointsSpent || 0));
  }, [checkins, config.totalPointsSpent]);
  const incompletePoints = useMemo(() => incomplete.reduce((s, t) => s + t.points, 0), [incomplete]);

  const values = [todayPoints, yesterdayPoints, totalPoints, incompletePoints];
  const completionRate = todayTasks.length ? completed.length / todayTasks.length : 0;

  const openAddModal = useCallback(() => {
    setNewTaskPoints(String(randomPoints()));
    setShowAddModal(true);
  }, []);

  const handleAddTask = () => {
    const name = newTaskName.trim();
    const pts = parseInt(newTaskPoints, 10);
    if (!name || isNaN(pts) || pts <= 0) return;
    addTask({ name, points: pts, type: newTaskType, deadline: newTaskDeadline || undefined });
    setNewTaskName('');
    setNewTaskPoints('');
    setNewTaskType('fixed');
    setNewTaskDeadline('');
    setShowAddModal(false);
  };

  const handleCheckin = (taskId: string, points: number, e?: React.MouseEvent) => {
    const success = checkin(taskId, todayStr);
    if (!success) {
      showToast('打卡失败，可能已超过截止时间或已打卡', 'error');
      return;
    }
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const animId = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      setPointsAnimations((prev) => [...prev, { id: animId, points, x: rect.left + rect.width / 2, y: rect.top }]);
      setTimeout(() => {
        setPointsAnimations((prev) => prev.filter((a) => a.id !== animId));
      }, 850);
    }
  };

  const handleUncheckin = (taskId: string, taskName: string, points: number, deadline?: string) => {
    const isExpired = deadline ? (() => {
      const now = new Date();
      const [h, m] = deadline.split(':').map(Number);
      return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
    })() : false;

    showConfirm({
      title: '取消打卡',
      message: isExpired
        ? `该任务已超过截止时间（${deadline}），取消后将无法再次打卡。确认将「${taskName}」改为待完成？将扣除已获得的 ${points} 积分。`
        : `确认将「${taskName}」改为待完成？将扣除已获得的 ${points} 积分。`,
      confirmText: '确认取消',
      danger: true,
      onConfirm: () => {
        uncheckin(taskId, todayStr);
        showToast('已取消打卡', 'info');
      },
    });
  };

  const isEmpty = incomplete.length === 0 && completed.length === 0;
  const allDone = incomplete.length === 0 && completed.length > 0;
  const streak = useMemo(() => getStreakInfo(), [checkins, todayStr]);

  return (
    <div className="min-h-screen pb-28 bg-[#FFF9F2]" style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-3xl font-extrabold gradient-text tracking-tight">积分打卡</h1>
        <div className="flex items-center gap-3 mt-2.5">
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-[#FFF3E8]" style={{ color: '#FF8C42' }}>{formatChineseDate()}</span>
        </div>
        <p className="mt-2 text-sm text-[#9CA3AF]">每天进步一点点，坚持就是胜利 ✨</p>
      </div>

      {/* Points Overview */}
      <div className="mt-4 px-5 relative">
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-snap-x-mandatory scrollbar-hide">
          {POINTS_CARDS.map((card, idx) => (
            <div
              key={card.label}
              className="flex-shrink-0 rounded-2xl p-4 shadow-sm card-hover animate-slide-up bg-white"
              style={{
                width: card.label === '累计积分' ? 140 : 120,
                borderTop: `3px solid ${card.color}`,
                animationDelay: `${idx * 60}ms`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <card.icon size={14} style={{ color: card.color }} />
                <span className="text-[11px] text-[#9CA3AF]">{card.label}</span>
              </div>
              <div className={`text-2xl font-extrabold animate-count-up ${card.label === '累计积分' ? 'text-3xl' : ''}`} style={{ color: card.color }}>
                <AnimatedNumber value={values[idx]} />
              </div>
            </div>
          ))}
        </div>
        {/* Scroll hint fade */}
        <div className="pointer-events-none absolute right-5 top-0 bottom-2 w-8 bg-gradient-to-l from-[#FFF9F2] to-transparent" />
      </div>

      {/* Progress Bar */}
      {todayTasks.length > 0 && (
        <div className="mt-4 px-5 animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#1A1B3A]">今日进度</span>
            <span className="text-xs font-semibold text-[#FF8C42]">{completed.length}/{todayTasks.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#F3E8DC] overflow-hidden">
            <div
              className="h-full rounded-full progress-animated"
              style={{
                width: `${completionRate * 100}%`,
                background: completionRate === 1
                  ? 'linear-gradient(90deg, #34D399, #6EE7B7)'
                  : 'linear-gradient(90deg, #FF8C42, #FFB87A)',
              }}
            />
          </div>
        </div>
      )}

      {/* Streak Banner */}
      {(streak.current > 0 || streak.isBroken) && (
        <div className="mt-4 px-5 animate-fade-in">
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{ background: streak.isBroken ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)' : 'linear-gradient(135deg, #FFF7ED, #FFEDD5)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame size={22} style={{ color: streak.isBroken ? '#D97706' : '#FF8C42' }} />
                <div>
                  {streak.isBroken ? (
                    <>
                      <span className="text-sm font-semibold text-[#D97706]">上次连续 {streak.brokenStreak} 天</span>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: '续签确认',
                            message: '续签需要消耗 50 积分，确认续签？',
                            confirmText: '确认续签',
                            onConfirm: () => {
                              const success = renewStreak();
                              if (success) {
                                showToast('续签成功！已恢复连续打卡天数', 'success');
                              } else {
                                showToast('续签失败，积分不足或无需续签', 'error');
                              }
                            },
                          });
                        }}
                        className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-[#FF8C42] active:scale-95 transition-transform"
                      >
                        续签(50分)
                      </button>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-[#FF8C42]">连续打卡 {streak.current} 天 🔥</span>
                  )}
                  {streak.current >= 7 && !streak.isBroken && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium text-[#FF8C42] bg-[#FFF3E8]">
                      连续7天奖励 +10分
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-1.5 ml-8">最长连续 {streak.longest} 天</p>
          </div>
        </div>
      )}

      {/* Points Animations */}
      {pointsAnimations.map((anim) => (
        <PointsAnimation key={anim.id} points={anim.points} x={anim.x} y={anim.y} />
      ))}

      {/* Incomplete Tasks - Card Style */}
      <div className="mt-6 px-5">
        <h2 className="text-base font-semibold mb-3 text-[#1A1B3A]">
          待完成
          {incomplete.length > 0 && <span className="ml-2 text-xs font-normal text-[#9CA3AF]">{incomplete.length}项</span>}
        </h2>
        {isEmpty ? (
          <EmptyState emoji="🌟" title="还没有任务哦" desc="点击右下角按钮，开启你的打卡之旅吧" />
        ) : allDone ? (
          <EmptyState emoji="🎉" title="太棒了，今日任务已全部完成！" desc="休息一下，明天继续加油" />
        ) : (
          <div className="space-y-3">
            {incomplete.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                checked={false}
                onToggle={(e) => handleCheckin(task.id, task.points, e)}
                onUncheck={() => {}}
                delay={idx * 50}
              />
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <div className="mt-5">
            <h2 className="text-base font-semibold mb-3 text-[#1A1B3A]">
              已完成<span className="ml-2 text-xs font-normal text-[#9CA3AF]">{completed.length}项</span>
            </h2>
            <div className="space-y-2.5">
              {completed.map((task, idx) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  checked={true}
                  onToggle={() => {}}
                  onUncheck={() => handleUncheckin(task.id, task.name, task.points, task.deadline)}
                  delay={idx * 50}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={openAddModal}
        className="fixed z-30 flex items-center justify-center rounded-full shadow-lg card-hover"
        style={{ backgroundColor: '#FF8C42', width: 56, height: 56, bottom: 88, right: 24 }}
      >
        <div className={`absolute inset-0 rounded-full bg-[#FF8C42]/25 ${showPing ? 'animate-ping' : ''}`} />
        <Plus size={26} color="#FFFFFF" className="relative z-[1]" />
      </button>

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 top-12 z-[60] -translate-x-1/2"
          style={{
            animation: 'toastIn 0.3s ease-out, toastOut 0.3s ease-in 1.9s forwards',
          }}
        >
          <div
            className="flex items-center gap-2 rounded-2xl px-5 py-3 shadow-lg"
            style={{
              backgroundColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6',
            }}
          >
            {toast.type === 'success' && <CheckCircle size={18} className="text-white" />}
            {toast.type === 'error' && <AlertTriangle size={18} className="text-white" />}
            {toast.type === 'info' && <CheckCircle2 size={18} className="text-white" />}
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Action Confirm Modal */}
      <Modal isOpen={!!actionConfirm} onClose={() => setActionConfirm(null)} title={actionConfirm?.title || '确认'}>
        {actionConfirm && (
          <div className="pb-6">
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${actionConfirm.danger ? 'bg-red-50' : 'bg-orange-50'}`}>
                <AlertTriangle size={20} style={{ color: actionConfirm.danger ? '#EF4444' : '#FF8C42' }} />
              </div>
              <p className="text-sm" style={{ color: '#374151' }}>{actionConfirm.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActionConfirm(null)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold bg-gray-100 active:scale-[0.98] transition-transform"
                style={{ color: '#6B7280' }}
              >
                取消
              </button>
              <button
                onClick={handleActionConfirm}
                className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white shadow-md active:scale-[0.98] transition-transform ${actionConfirm.danger ? 'bg-red-500' : ''}`}
                style={!actionConfirm.danger ? { background: 'linear-gradient(135deg, #FF8C42, #F59E0B)' } : undefined}
              >
                {actionConfirm.confirmText}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="添加任务">
        <div className="pb-6">
          <InputField label="任务名称" value={newTaskName} onChange={setNewTaskName} placeholder="输入任务名称" />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">积分</label>
            <div className="flex gap-2">
              <input
                type="number" value={newTaskPoints} onChange={(e) => setNewTaskPoints(e.target.value)} min={1}
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none border border-[#E5E7EB] bg-white text-[#1A1B3A] focus:ring-2 focus:ring-orange-200"
              />
              <button
                onClick={() => setNewTaskPoints(String(randomPoints()))}
                className="px-3 py-3 rounded-xl text-xs font-medium text-[#FF8C42] bg-[#FFF3E8] active:scale-95 transition-transform"
              >
                随机
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">任务类型</label>
            <div className="flex gap-3">
              {(['fixed', 'temporary'] as const).map((t) => (
                <button key={t} onClick={() => setNewTaskType(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={newTaskType === t
                    ? { color: t === 'fixed' ? '#FF8C42' : '#3B82F6', backgroundColor: t === 'fixed' ? '#FFF3E8' : '#EFF6FF', boxShadow: `0 0 0 2px ${t === 'fixed' ? '#FF8C42' : '#3B82F6'}` }
                    : { color: '#9CA3AF', backgroundColor: '#fff', boxShadow: '0 0 0 1px #E5E7EB' }}>
                  {t === 'fixed' ? '📌 固定' : '📝 临时'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#9CA3AF]">
              {newTaskType === 'fixed' ? '固定任务每天自动出现，无需重复创建' : '临时任务仅当日有效，过期后可再次使用'}
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">截止时间（可选）</label>
            <input
              type="time" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-[#E5E7EB] bg-white text-[#1A1B3A] focus:ring-2 focus:ring-orange-200"
            />
            <p className="mt-1.5 text-xs text-[#9CA3AF]">超过截止时间后将无法打卡，留空则不限时间</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl text-sm font-medium bg-[#F3F4F6] text-[#6B7280]">取消</button>
            <button onClick={handleAddTask} disabled={!newTaskName.trim() || !newTaskPoints || parseInt(newTaskPoints, 10) <= 0} className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-[#FF8C42] disabled:opacity-40">添加</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EmptyState({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl p-8 text-center shadow-sm bg-white animate-pop-in">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="text-sm font-medium text-[#1A1B3A]">{title}</p>
      <p className="text-xs mt-1 text-[#9CA3AF]">{desc}</p>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', min }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; min?: number;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none border border-[#E5E7EB] bg-white text-[#1A1B3A] focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}

function TaskCard({ task, checked, onToggle, onUncheck, delay }: {
  task: { id: string; name: string; points: number; type: string; deadline?: string };
  checked: boolean; onToggle: (e: React.MouseEvent) => void; onUncheck: () => void; delay: number;
}) {
  const isFixed = task.type === 'fixed';
  const isExpired = task.deadline ? (() => {
    const now = new Date();
    const [h, m] = task.deadline.split(':').map(Number);
    return now.getHours() > h || (now.getHours() === h && now.getMinutes() > m);
  })() : false;
  const canCheckin = !checked && !isExpired;

  return (
    <div
      className="rounded-2xl p-4 shadow-sm transition-all duration-300 card-hover animate-slide-up bg-white"
      style={{
        opacity: checked ? 0.65 : isExpired ? 0.45 : 1,
        borderLeft: checked ? '4px solid #34D399' : isExpired ? '4px solid #9CA3AF' : `4px solid ${isFixed ? '#FF8C42' : '#3B82F6'}`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Check Button */}
        <button
          onClick={checked ? onUncheck : canCheckin ? onToggle : undefined}
          className="flex-shrink-0 flex items-center justify-center transition-all active:scale-90 rounded-full"
          style={{
            width: 44, height: 44,
            backgroundColor: checked ? '#34D399' : isExpired ? '#F3F4F6' : 'transparent',
            border: checked ? 'none' : isExpired ? '2px solid #D1D5DB' : `2px solid ${isFixed ? '#FF8C42' : '#3B82F6'}`,
            cursor: canCheckin || checked ? 'pointer' : 'not-allowed',
          }}
        >
          {checked ? <Check size={22} color="#FFFFFF" strokeWidth={3} /> : isExpired ? (
            <span className="block rounded-full bg-[#D1D5DB]" style={{ width: 12, height: 12 }} />
          ) : (
            <span className="block rounded-full" style={{ width: 12, height: 12, backgroundColor: isFixed ? '#FF8C42' : '#3B82F6' }} />
          )}
        </button>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${checked ? 'line-through text-[#9CA3AF]' : isExpired ? 'text-[#9CA3AF]' : 'text-[#1A1B3A]'}`}>{task.name}</span>
            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ backgroundColor: isFixed ? '#FFF3E8' : '#EFF6FF', color: isFixed ? '#FF8C42' : '#3B82F6' }}>
              {isFixed ? '固定' : '临时'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: checked ? '#F3F4F6' : '#FFF3E8', color: checked ? '#9CA3AF' : '#FF8C42' }}>
              +{task.points}分
            </span>
            {task.deadline && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: isExpired ? '#FEF2F2' : '#F0FDF4',
                  color: isExpired ? '#EF4444' : '#22C55E',
                }}>
                {isExpired ? `已超时 ${task.deadline}` : `截止 ${task.deadline}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PointsAnimation({ points, x, y }: { points: number; x: number; y: number }) {
  return (
    <div
      className="fixed z-50 pointer-events-none animate-float-up"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
    >
      <span className="text-lg font-extrabold text-[#FF8C42] drop-shadow-sm">+{points}分</span>
    </div>
  );
}
