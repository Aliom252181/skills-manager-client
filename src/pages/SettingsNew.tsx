import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useShortcutStore } from '../store/extendedStores';
import { useNotificationStore } from '../store/extendedStores';
import {
  Settings, Keyboard, Bell, X, Check, AlertCircle,
  Info, AlertTriangle, CheckCircle, Trash2, BellRing
} from 'lucide-react';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { shortcuts, fetchShortcuts, updateShortcut, resetShortcuts } = useShortcutStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearExpired } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'general' | 'shortcuts' | 'notifications' | 'security'>('general');
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [newKeys, setNewKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchShortcuts();
    clearExpired();
  }, [fetchShortcuts, clearExpired]);

  const handleStartEdit = (shortcutId: string, currentKeys: string[]) => {
    setEditingShortcut(shortcutId);
    setNewKeys([...currentKeys]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingShortcut) return;

    e.preventDefault();
    const key = e.key;

    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      return;
    }

    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');
    if (e.metaKey) modifiers.push('Meta');

    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      setNewKeys([...modifiers, key.length === 1 ? key.toUpperCase() : key]);
    }
  };

  const handleSaveShortcut = () => {
    if (editingShortcut && newKeys.length > 0) {
      updateShortcut(editingShortcut, { keys: newKeys });
    }
    setEditingShortcut(null);
    setNewKeys([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-success" />;
      case 'warning': return <AlertTriangle size={18} className="text-warning" />;
      case 'error': return <AlertCircle size={18} className="text-error" />;
      default: return <Info size={18} className="text-info" />;
    }
  };

  const tabs = [
    { id: 'general', label: i18n.language === 'zh' ? '通用设置' : 'General' },
    { id: 'shortcuts', label: i18n.language === 'zh' ? '快捷键' : 'Shortcuts' },
    { id: 'notifications', label: i18n.language === 'zh' ? '通知' : 'Notifications' },
    { id: 'security', label: i18n.language === 'zh' ? '安全设置' : 'Security' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl">
          <Settings size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {i18n.language === 'zh' ? '设置' : 'Settings'}
          </h2>
          <p className="text-sm text-base-content/60">
            {i18n.language === 'zh' ? '配置应用程序偏好设置' : 'Configure application preferences'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-base-200/50 rounded-2xl border border-base-300 p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">
              {i18n.language === 'zh' ? '通用设置' : 'General Settings'}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '语言' : 'Language'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '选择界面语言' : 'Select interface language'}
                  </p>
                </div>
                <select
                  className="select select-bordered w-40"
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '主题' : 'Theme'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '选择界面主题' : 'Select interface theme'}
                  </p>
                </div>
                <select className="select select-bordered w-40" defaultValue="system">
                  <option value="light">{i18n.language === 'zh' ? '浅色' : 'Light'}</option>
                  <option value="dark">{i18n.language === 'zh' ? '深色' : 'Dark'}</option>
                  <option value="system">{i18n.language === 'zh' ? '跟随系统' : 'System'}</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '启动时自动启动 MCP 服务器' : 'Auto-start MCP server on launch'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '应用程序启动时自动连接' : 'Connect automatically when app starts'}
                  </p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '自动更新检查' : 'Auto-update check'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '定期检查 Skill 更新' : 'Periodically check for skill updates'}
                  </p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shortcuts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {i18n.language === 'zh' ? '键盘快捷键' : 'Keyboard Shortcuts'}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={resetShortcuts}
              >
                {i18n.language === 'zh' ? '重置为默认' : 'Reset to Default'}
              </button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between p-3 bg-base-100 rounded-xl"
                >
                  <div>
                    <div className="font-medium">{shortcut.action}</div>
                    <div className="text-sm text-base-content/60">{shortcut.description}</div>
                  </div>

                  {editingShortcut === shortcut.id ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="px-3 py-2 bg-base-200 rounded-lg font-mono text-sm min-w-[120px] text-center"
                        tabIndex={0}
                        onKeyDown={handleKeyDown}
                      >
                        {newKeys.length > 0 ? newKeys.join(' + ') : (
                          <span className="text-base-content/40">
                            {i18n.language === 'zh' ? '按快捷键...' : 'Press keys...'}
                          </span>
                        )}
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSaveShortcut}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingShortcut(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, i) => (
                          <kbd key={i} className="kbd kbd-sm">{key}</kbd>
                        ))}
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleStartEdit(shortcut.id, shortcut.keys)}
                      >
                        <Keyboard size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {i18n.language === 'zh' ? '通知' : 'Notifications'}
                {unreadCount > 0 && (
                  <span className="ml-2 badge badge-primary badge-sm">{unreadCount}</span>
                )}
              </h3>
              {notifications.length > 0 && (
                <button
                  className="btn btn-ghost btn-sm gap-1"
                  onClick={markAllAsRead}
                >
                  <Check size={14} />
                  {i18n.language === 'zh' ? '全部标记为已读' : 'Mark all as read'}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 bg-base-100 rounded-xl ${
                    !notification.read ? 'border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-base-content/60 mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="text-xs text-base-content/40 mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="text-center py-12 text-base-content/40">
                  <Bell size={48} strokeWidth={1} className="mx-auto mb-3" />
                  <p>{i18n.language === 'zh' ? '暂无通知' : 'No notifications'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg">
              {i18n.language === 'zh' ? '安全设置' : 'Security Settings'}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '沙箱执行' : 'Sandbox Execution'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '在隔离环境中运行 Skill' : 'Run skills in isolated environment'}
                  </p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '网络访问控制' : 'Network Access Control'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '控制 Skill 的网络请求权限' : 'Control network request permissions for skills'}
                  </p>
                </div>
                <select className="select select-bordered w-40" defaultValue="prompt">
                  <option value="allow">{i18n.language === 'zh' ? '允许' : 'Allow'}</option>
                  <option value="deny">{i18n.language === 'zh' ? '拒绝' : 'Deny'}</option>
                  <option value="prompt">{i18n.language === 'zh' ? '询问' : 'Prompt'}</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '文件访问控制' : 'File Access Control'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '控制 Skill 的文件读写权限' : 'Control file read/write permissions for skills'}
                  </p>
                </div>
                <select className="select select-bordered w-40" defaultValue="read">
                  <option value="read">{i18n.language === 'zh' ? '只读' : 'Read only'}</option>
                  <option value="write">{i18n.language === 'zh' ? '读写' : 'Read/Write'}</option>
                  <option value="none">{i18n.language === 'zh' ? '无访问' : 'No access'}</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '执行超时' : 'Execution Timeout'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? 'Skill 最大执行时间' : 'Maximum execution time for skills'}
                  </p>
                </div>
                <select className="select select-bordered w-40" defaultValue="300">
                  <option value="60">1 {i18n.language === 'zh' ? '分钟' : 'min'}</option>
                  <option value="300">5 {i18n.language === 'zh' ? '分钟' : 'min'}</option>
                  <option value="600">10 {i18n.language === 'zh' ? '分钟' : 'min'}</option>
                  <option value="1800">30 {i18n.language === 'zh' ? '分钟' : 'min'}</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-xl">
                <div>
                  <h4 className="font-medium">
                    {i18n.language === 'zh' ? '审计日志' : 'Audit Logs'}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    {i18n.language === 'zh' ? '记录所有 Skill 执行历史' : 'Record all skill execution history'}
                  </p>
                </div>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </div>

              <button className="btn btn-outline w-full">
                <BellRing size={16} />
                {i18n.language === 'zh' ? '查看审计日志' : 'View Audit Logs'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;