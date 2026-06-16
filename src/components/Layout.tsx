import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, User } from 'lucide-react';

const tabs = [
  { path: '/', label: '首页', icon: Home },
  { path: '/profile', label: '我的', icon: User },
] as const;

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-[#FFF9F2]">
      {/* 内容区域 */}
      <main className="scroll-smooth pb-20">{children}</main>

      {/* 底部导航栏 */}
      <nav className="glass fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        {/* 顶部渐变边线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#FF8C42]/40 to-transparent" />

        <div
          className="flex items-center justify-around"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {tabs.map((tab) => {
            const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname === tab.path || ['/tasks', '/history', '/stats', '/exchange'].includes(location.pathname);
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-all duration-200 active:scale-95 ${
                  isActive ? 'text-[#FF8C42]' : 'text-[#94A3B8]'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.5} />
                <span className="text-[11px] leading-tight">{tab.label}</span>
                {/* 活跃指示点 */}
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full bg-[#FF8C42] transition-opacity duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
