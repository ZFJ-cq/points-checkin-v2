import { useRef } from 'react';
import { Settings, Download, Upload, Trash2, Smartphone } from 'lucide-react';
import { useStore } from '@/store';

export default function SettingsSection() {
  const exportBackup = useStore((s) => s.exportBackup);
  const importBackup = useStore((s) => s.importBackup);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `积分打卡备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const success = importBackup(content);
      alert(success ? '导入成功！' : '导入失败，请检查文件格式。');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    const confirmed = window.confirm('⚠️ 确定删除全部缓存数据？此操作不可恢复！建议先导出备份。');
    if (!confirmed) return;
    const confirmed2 = window.confirm('再次确认：所有任务、打卡记录、积分数据将被永久删除！');
    if (!confirmed2) return;
    localStorage.removeItem('points-checkin-storage');
    window.location.reload();
  };

  const handleInstallPWA = () => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      alert('已经安装为独立应用了！');
      return;
    }
    // Check if install prompt is available
    const deferredPrompt = (window as any).deferredPWAPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((result: any) => {
        if (result.outcome === 'accepted') {
          alert('安装成功！');
        }
      });
    } else {
      alert('请使用浏览器菜单中的"添加到主屏幕"功能来安装应用。\n\niOS Safari：点击分享按钮 → 添加到主屏幕\nAndroid Chrome：点击菜单 → 安装应用');
    }
  };

  return (
    <div className="px-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Settings size={16} style={{ color: '#9CA3AF' }} />
        <span className="text-sm font-semibold text-[#9CA3AF]">设置</span>
      </div>
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        {/* Data Backup */}
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF3E8]">
            <Download size={16} style={{ color: '#FF8C42' }} />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-[#1A1B3A]">导出备份</span>
            <p className="text-[11px] text-[#9CA3AF]">将数据导出为JSON文件</p>
          </div>
        </button>

        <div className="h-px bg-gray-100 mx-4" />

        <button
          onClick={handleImport}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF]">
            <Upload size={16} style={{ color: '#3B82F6' }} />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-[#1A1B3A]">导入备份</span>
            <p className="text-[11px] text-[#9CA3AF]">从JSON文件恢复数据</p>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="h-px bg-gray-100 mx-4" />

        {/* Install PWA */}
        <button
          onClick={handleInstallPWA}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F0FF]">
            <Smartphone size={16} style={{ color: '#8B5CF6' }} />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-[#1A1B3A]">安装到桌面</span>
            <p className="text-[11px] text-[#9CA3AF]">添加到主屏幕，全屏使用</p>
          </div>
        </button>

        <div className="h-px bg-gray-100 mx-4" />

        {/* Clear All Data */}
        <button
          onClick={handleClearAll}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-red-50 active:bg-red-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF2F2]">
            <Trash2 size={16} style={{ color: '#EF4444' }} />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-[#EF4444]">删除全部数据</span>
            <p className="text-[11px] text-[#9CA3AF]">清空所有缓存数据，不可恢复</p>
          </div>
        </button>
      </div>
    </div>
  );
}
