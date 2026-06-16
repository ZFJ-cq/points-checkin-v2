import { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, Shuffle, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '@/store';
import Modal from '@/components/Modal';

const randomPoints = () => Math.floor(Math.random() * 20) + 1;

export default function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const reuseTemporaryTask = useStore((s) => s.reuseTemporaryTask);
  const reorderTasks = useStore((s) => s.reorderTasks);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPoints, setEditPoints] = useState('');
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState('');
  const [newType, setNewType] = useState<'fixed' | 'temporary'>('fixed');
  const [newDeadline, setNewDeadline] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editType, setEditType] = useState<'fixed' | 'temporary'>('fixed');
  const [sortBy, setSortBy] = useState<'default' | 'points-desc' | 'points-asc' | 'type'>('default');

  const fixedTasks = tasks.filter((t) => t.type === 'fixed');
  const temporaryTasks = tasks.filter((t) => t.type === 'temporary');

  const sortedTasks = (() => {
    if (sortBy === 'default') return tasks;
    const sorted = [...tasks];
    if (sortBy === 'points-desc') sorted.sort((a, b) => b.points - a.points);
    else if (sortBy === 'points-asc') sorted.sort((a, b) => a.points - b.points);
    else if (sortBy === 'type') {
      const fixed = sorted.filter((t) => t.type === 'fixed');
      const temp = sorted.filter((t) => t.type === 'temporary');
      return [...fixed, ...temp];
    }
    return sorted;
  })();

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const ids = sortedTasks.map((t) => t.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderTasks(ids);
  };

  const handleMoveDown = (index: number) => {
    if (index >= sortedTasks.length - 1) return;
    const ids = sortedTasks.map((t) => t.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderTasks(ids);
  };

  const handleAdd = () => {
    const name = newName.trim();
    const points = parseInt(newPoints, 10);
    if (!name || !newPoints || isNaN(points) || points <= 0) return;
    addTask({ name, points, type: newType, deadline: newDeadline || undefined });
    setNewName(''); setNewPoints(''); setNewType('fixed'); setNewDeadline(''); setAddOpen(false);
  };

  const openEdit = (id: string, name: string, points: number, type: 'fixed' | 'temporary', deadline?: string) => {
    setEditingId(id); setEditName(name); setEditPoints(String(points)); setEditType(type); setEditDeadline(deadline ?? ''); setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    const points = parseInt(editPoints, 10);
    if (!name || !editPoints || isNaN(points) || points <= 0) return;
    updateTask(editingId, { name, points, type: editType, deadline: editDeadline || undefined });
    setEditOpen(false); setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`确定删除任务"${name}"吗？历史打卡记录和积分将保留。`)) deleteTask(id);
  };

  const handleReuse = (id: string, name: string) => {
    reuseTemporaryTask(id);
    alert(`已将"${name}"重新添加到今日任务`);
  };

  const openAddModal = () => {
    setNewPoints(String(randomPoints()));
    setAddOpen(true);
  };

  return (
    <div className="min-h-screen pb-8 bg-[#FFF9F2]">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#1A1B3A]">任务管理</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF3E8] text-[#FF8C42]">{tasks.length}</span>
        </div>
        <div className="mt-2 h-[3px] w-16 rounded-full" style={{ background: 'linear-gradient(90deg, #FF8C42, #FFB87A)' }} />
      </div>

      <div className="px-5 mb-6">
        <button onClick={openAddModal} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-semibold active:scale-[0.98] transition-transform"
          style={{ background: 'linear-gradient(135deg, #FF8C42, #F59E0B)', boxShadow: '0 4px 14px rgba(255,140,66,0.35)' }}>
          <Plus size={20} />添加任务
        </button>
        <div className="flex gap-2 mt-3">
          {([
            { key: 'points-desc' as const, label: '按积分↓' },
            { key: 'points-asc' as const, label: '按积分↑' },
            { key: 'type' as const, label: '按类型' },
          ]).map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(sortBy === key ? 'default' : key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
              style={sortBy === key
                ? { backgroundColor: '#FF8C42', color: '#fff', boxShadow: '0 2px 8px rgba(255,140,66,0.35)' }
                : { backgroundColor: '#fff', color: '#9CA3AF', boxShadow: '0 0 0 1px #E5E7EB' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {sortBy !== 'default' ? (
        sortedTasks.length > 0 && (
          <TaskSection title="全部任务" count={sortedTasks.length} dotColor="#FF8C42" badgeBg="#FFF3E8" badgeColor="#FF8C42" borderGradient="linear-gradient(180deg, #FF8C42, #FFB87A)" editColor="#FF8C42" editHover="hover:bg-orange-50">
            {sortedTasks.map((task, i) => (
              <TaskItem key={task.id} task={task} index={i} dotColor={task.type === 'fixed' ? '#FF8C42' : '#3B82F6'} badgeBg={task.type === 'fixed' ? '#FFF3E8' : '#EFF6FF'} badgeColor={task.type === 'fixed' ? '#FF8C42' : '#3B82F6'} editColor={task.type === 'fixed' ? '#FF8C42' : '#3B82F6'} editHover={task.type === 'fixed' ? 'hover:bg-orange-50' : 'hover:bg-blue-50'}
                onEdit={() => openEdit(task.id, task.name, task.points, task.type, task.deadline)} onDelete={() => handleDelete(task.id, task.name)}
                onMoveUp={() => handleMoveUp(i)} onMoveDown={() => handleMoveDown(i)} showMove canMoveUp={i > 0} canMoveDown={i < sortedTasks.length - 1}
                onReuse={task.type === 'temporary' ? () => handleReuse(task.id, task.name) : undefined} showReuse={task.type === 'temporary'} />
            ))}
          </TaskSection>
        )
      ) : (
        <>
          {fixedTasks.length > 0 && (
            <TaskSection title="固定任务" count={fixedTasks.length} dotColor="#FF8C42" badgeBg="#FFF3E8" badgeColor="#FF8C42" borderGradient="linear-gradient(180deg, #FF8C42, #FFB87A)" editColor="#FF8C42" editHover="hover:bg-orange-50">
              {fixedTasks.map((task, i) => (
                <TaskItem key={task.id} task={task} index={i} dotColor="#FF8C42" badgeBg="#FFF3E8" badgeColor="#FF8C42" editColor="#FF8C42" editHover="hover:bg-orange-50"
                  onEdit={() => openEdit(task.id, task.name, task.points, task.type, task.deadline)} onDelete={() => handleDelete(task.id, task.name)}
                  onMoveUp={() => handleMoveUp(sortedTasks.indexOf(task))} onMoveDown={() => handleMoveDown(sortedTasks.indexOf(task))} showMove canMoveUp={i > 0} canMoveDown={i < fixedTasks.length - 1} />
              ))}
            </TaskSection>
          )}

          {temporaryTasks.length > 0 && (
            <TaskSection title="临时任务" count={temporaryTasks.length} dotColor="#3B82F6" badgeBg="#EFF6FF" badgeColor="#3B82F6" borderGradient="linear-gradient(180deg, #3B82F6, #93C5FD)" editColor="#3B82F6" editHover="hover:bg-blue-50">
              {temporaryTasks.map((task, i) => (
                <TaskItem key={task.id} task={task} index={i} dotColor="#3B82F6" badgeBg="#EFF6FF" badgeColor="#3B82F6" editColor="#3B82F6" editHover="hover:bg-blue-50"
                  onEdit={() => openEdit(task.id, task.name, task.points, task.type, task.deadline)} onDelete={() => handleDelete(task.id, task.name)}
                  onReuse={() => handleReuse(task.id, task.name)} showReuse
                  onMoveUp={() => handleMoveUp(sortedTasks.indexOf(task))} onMoveDown={() => handleMoveDown(sortedTasks.indexOf(task))} showMove canMoveUp={i > 0} canMoveDown={i < temporaryTasks.length - 1} />
              ))}
            </TaskSection>
          )}
        </>
      )}

      {tasks.length === 0 && (
        <div className="px-5 py-20 text-center animate-fade-in">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-sm font-medium text-[#9CA3AF]">还没有任何任务</p>
          <p className="text-xs mt-1 text-[#D1D5DB]">点击上方按钮，开始添加你的第一个任务吧</p>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="添加任务">
        <div className="pb-6">
          <Input label="任务名称" value={newName} onChange={setNewName} placeholder="请输入任务名称" />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">积分</label>
            <div className="flex gap-2">
              <input type="number" value={newPoints} onChange={(e) => setNewPoints(e.target.value)} placeholder="请输入正整数积分" min={1}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#1A1B3A] outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#FF8C42]" />
              <button onClick={() => setNewPoints(String(randomPoints()))}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium text-[#FF8C42] bg-[#FFF3E8] active:scale-95 transition-transform">
                <Shuffle size={12} />随机
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">任务类型</label>
            <div className="flex gap-3">
              {(['fixed', 'temporary'] as const).map((t) => (
                <button key={t} onClick={() => setNewType(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={newType === t
                    ? { color: t === 'fixed' ? '#FF8C42' : '#3B82F6', backgroundColor: t === 'fixed' ? '#FFF3E8' : '#EFF6FF', boxShadow: `0 0 0 2px ${t === 'fixed' ? '#FF8C42' : '#3B82F6'}` }
                    : { color: '#9CA3AF', backgroundColor: '#fff', boxShadow: '0 0 0 1px #E5E7EB' }}>
                  {t === 'fixed' ? '📌 固定' : '📝 临时'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#9CA3AF]">
              {newType === 'fixed' ? '固定任务每天自动出现，无需重复创建' : '临时任务仅当日有效，过期后可再次使用'}
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">截止时间（可选）</label>
            <input type="time" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#1A1B3A] outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#FF8C42]" />
            <p className="mt-1.5 text-xs text-[#9CA3AF]">超过截止时间后将无法打卡，留空则不限时间</p>
          </div>
          <button onClick={handleAdd} className="w-full py-3 rounded-2xl text-white font-semibold active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #FF8C42, #F59E0B)', boxShadow: '0 4px 14px rgba(255,140,66,0.35)' }}>确认添加</button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="编辑任务">
        <div className="pb-6">
          <Input label="任务名称" value={editName} onChange={setEditName} placeholder="" />
          <Input label="积分" value={editPoints} onChange={setEditPoints} placeholder="" type="number" min={1} />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">任务类型</label>
            <div className="flex gap-3">
              {(['fixed', 'temporary'] as const).map((t) => (
                <button key={t} onClick={() => setEditType(t)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={editType === t
                    ? { color: t === 'fixed' ? '#FF8C42' : '#3B82F6', backgroundColor: t === 'fixed' ? '#FFF3E8' : '#EFF6FF', boxShadow: `0 0 0 2px ${t === 'fixed' ? '#FF8C42' : '#3B82F6'}` }
                    : { color: '#9CA3AF', backgroundColor: '#fff', boxShadow: '0 0 0 1px #E5E7EB' }}>
                  {t === 'fixed' ? '📌 固定' : '📝 临时'}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">截止时间（可选）</label>
            <input type="time" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#1A1B3A] outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#FF8C42]" />
            <p className="mt-1.5 text-xs text-[#9CA3AF]">超过截止时间后将无法打卡，留空则不限时间</p>
          </div>
          <button onClick={handleEdit} className="w-full py-3 rounded-2xl text-white font-semibold active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #FF8C42, #F59E0B)', boxShadow: '0 4px 14px rgba(255,140,66,0.35)' }}>保存修改</button>
        </div>
      </Modal>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text', min }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; min?: number;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1.5 text-[#1A1B3A]">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={min}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[#1A1B3A] outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#FF8C42]" />
    </div>
  );
}

function TaskSection({ title, count, dotColor, badgeBg, badgeColor, borderGradient, editColor, editHover, children }: {
  title: string; count: number; dotColor: string; badgeBg: string; badgeColor: string;
  borderGradient: string; editColor: string; editHover: string; children: React.ReactNode;
}) {
  return (
    <div className="px-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full" style={{ background: borderGradient }} />
        <span className="text-sm font-semibold text-[#1A1B3A]">{title}</span>
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: badgeBg, color: badgeColor }}>{count}</span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function TaskItem({ task, index, dotColor, badgeBg, badgeColor, editColor, editHover, onEdit, onDelete, onReuse, showReuse, onMoveUp, onMoveDown, showMove, canMoveUp, canMoveDown }: {
  task: { id: string; name: string; points: number; deadline?: string };
  index: number; dotColor: string; badgeBg: string; badgeColor: string;
  editColor: string; editHover: string; onEdit: () => void; onDelete: () => void;
  onReuse?: () => void; showReuse?: boolean;
  onMoveUp?: () => void; onMoveDown?: () => void; showMove?: boolean; canMoveUp?: boolean; canMoveDown?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm flex items-center gap-3 px-4 py-4 animate-slide-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
          <span className="font-semibold truncate text-[#1A1B3A]" style={{ fontSize: 15 }}>{task.name}</span>
        </div>
        <div className="mt-1.5 ml-4 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: badgeBg, color: badgeColor }}>{task.points}分</span>
          {task.deadline && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F0FDF4] text-[#22C55E]">
              截止 {task.deadline}
            </span>
          )}
        </div>
      </div>
      {showReuse && onReuse && (
        <button onClick={onReuse} className="shrink-0 p-2 rounded-xl transition-colors hover:bg-blue-50 active:bg-blue-100" title="再次使用">
          <RotateCcw size={16} className="text-blue-400" />
        </button>
      )}
      {showMove && (
        <div className="shrink-0 flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={!canMoveUp} className="p-1 rounded-lg transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-25 disabled:cursor-default" title="上移">
            <ChevronUp size={14} className="text-gray-500" />
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="p-1 rounded-lg transition-colors hover:bg-gray-100 active:bg-gray-200 disabled:opacity-25 disabled:cursor-default" title="下移">
            <ChevronDown size={14} className="text-gray-500" />
          </button>
        </div>
      )}
      <button onClick={onEdit} className={`shrink-0 p-2 rounded-xl transition-colors ${editHover}`}>
        <Pencil size={16} style={{ color: editColor }} />
      </button>
      <button onClick={onDelete} className="shrink-0 p-2 rounded-xl transition-colors hover:bg-red-50 active:bg-red-100">
        <Trash2 size={16} className="text-red-400" />
      </button>
    </div>
  );
}