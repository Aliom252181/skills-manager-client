import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Library, ShoppingBag, ShieldCheck, Settings, Box, 
  Terminal, MessageSquare, GitBranch, Clock, BarChart3 
} from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const navItems = [
    { to: '/my-skills', icon: Library, label: 'My Skills' },
    { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  ];

  const aiItems = [
    { to: '/codex', icon: MessageSquare, label: 'Codex' },
    { to: '/executor', icon: Terminal, label: 'Executor' },
  ];

  const automationItems = [
    { to: '/workflows', icon: GitBranch, label: 'Workflows' },
    { to: '/scheduler', icon: Clock, label: 'Scheduler' },
    { to: '/monitoring', icon: BarChart3, label: 'Monitoring' },
  ];

  return (
    <div className="w-64 bg-base-200 min-h-screen flex flex-col border-r border-base-300">
      <div className="p-4 flex items-center gap-2 border-b border-base-300">
        <div className="bg-primary p-2 rounded-lg text-primary-content">
          <Box size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg">Skill Manager</h1>
          <p className="text-xs text-base-content/60">v1.1.0</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-auto">
        <div>
          <p className="px-4 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
            Skills
          </p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-content shadow-md'
                      : 'hover:bg-base-300 text-base-content'
                  )
                }
              >
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
            AI
          </p>
          <div className="space-y-1">
            {aiItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-content shadow-md'
                      : 'hover:bg-base-300 text-base-content'
                  )
                }
              >
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
            Automation
          </p>
          <div className="space-y-1">
            {automationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-content shadow-md'
                      : 'hover:bg-base-300 text-base-content'
                  )
                }
              >
                <item.icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="px-4 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">
            System
          </p>
          <div className="space-y-1">
            <NavLink
              to="/security"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-content shadow-md'
                    : 'hover:bg-base-300 text-base-content'
                )
              }
            >
              <ShieldCheck size={18} />
              <span className="font-medium text-sm">Security</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-content shadow-md'
                    : 'hover:bg-base-300 text-base-content'
                )
              }
            >
              <Settings size={18} />
              <span className="font-medium text-sm">Settings</span>
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-base-300">
        <div className="bg-base-100 p-4 rounded-xl border border-base-300 shadow-sm">
          <p className="text-xs font-medium text-base-content/70 mb-2">Storage Used</p>
          <progress className="progress progress-primary w-full" value="40" max="100"></progress>
          <p className="text-xs text-right mt-1 text-base-content/50">2.4 GB / 6 GB</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;