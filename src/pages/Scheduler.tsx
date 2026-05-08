import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSchedulerStore } from '../store/extendedStores';
import { useWorkflowStore } from '../store/extendedStores';
import { useSkillStore } from '../store/useSkillStore';
import { 
  Clock, Plus, Play, Trash2,
  ToggleLeft, ToggleRight, RefreshCw, Calendar, Zap
} from 'lucide-react';

const SchedulerPage = () => {
  const { i18n } = useTranslation();
  const {
    tasks,
    fetchTasks,
    createTask,
    deleteTask,
    toggleTask,
    runTaskNow,
  } = useSchedulerStore();
  const { workflows } = useWorkflowStore();
  const { installedSkills } = useSkillStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    cron: '* * * * *',
    type: 'skill' as 'skill' | 'workflow',
    skillId: '',
    workflowId: '',
    enabled: true,
  });

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async () => {
    if (!newTask.name.trim()) return;

    await createTask({
      name: newTask.name,
      cron: newTask.cron,
      enabled: newTask.enabled,
      skillId: newTask.type === 'skill' ? newTask.skillId : undefined,
      workflowId: newTask.type === 'workflow' ? newTask.workflowId : undefined,
      config: {},
    });

    setShowCreateModal(false);
    setNewTask({
      name: '',
      cron: '* * * * *',
      type: 'skill',
      skillId: '',
      workflowId: '',
      enabled: true,
    });
  };

  const cronPresets = [
    { label: i18n.language === 'zh' ? '每分钟' : 'Every minute', value: '* * * * *' },
    { label: i18n.language === 'zh' ? '每小时' : 'Every hour', value: '0 * * * *' },
    { label: i18n.language === 'zh' ? '每天午夜' : 'Daily at midnight', value: '0 0 * * *' },
    { label: i18n.language === 'zh' ? '每周一' : 'Every Monday', value: '0 0 * * 1' },
    { label: i18n.language === 'zh' ? '每月第一天' : 'First of month', value: '0 0 1 * *' },
  ];

  const formatCron = (cron: string) => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const [minute, hour] = parts;

    if (cron === '* * * * *') return i18n.language === 'zh' ? '每分钟' : 'Every minute';
    if (minute === '0' && hour === '*') return i18n.language === 'zh' ? '每小时' : 'Every hour';
    if (cron === '0 0 * * *') return i18n.language === 'zh' ? '每天' : 'Daily';
    if (cron === '0 0 * * 1') return i18n.language === 'zh' ? '每周' : 'Weekly';
    if (cron === '0 0 1 * *') return i18n.language === 'zh' ? '每月' : 'Monthly';

    return `${i18n.language === 'zh' ? '每' : 'Every'} ${minute}m ${hour}h`;
  };

  const getTaskTarget = (task: typeof tasks[0]) => {
    if (task.skillId) {
      const skill = installedSkills.find(s => s.id === task.skillId);
      return skill?.name || task.skillId;
    }
    if (task.workflowId) {
      const workflow = workflows.find(w => w.id === task.workflowId);
      return workflow?.name || task.workflowId;
    }
    return '-';
  };

  const getNextRun = (task: typeof tasks[0]) => {
    if (!task.nextRun) return '-';
    return new Date(task.nextRun).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {i18n.language === 'zh' ? '定时任务' : 'Scheduled Tasks'}
            </h2>
            <p className="text-sm text-base-content/60">
              {i18n.language === 'zh' ? '自动执行 Skill 和工作流' : 'Automate skill and workflow execution'}
            </p>
          </div>
        </div>

        <button
          className="btn btn-primary gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          {i18n.language === 'zh' ? '新建任务' : 'New Task'}
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-base-200/50 rounded-2xl border border-base-300 p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg">{task.name}</h3>
                  <button
                    className={`btn btn-ghost btn-xs gap-1 ${
                      task.enabled ? 'text-success' : 'text-base-content/40'
                    }`}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.enabled ? (
                      <ToggleRight size={20} />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{formatCron(task.cron)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap size={14} />
                    <span>{i18n.language === 'zh' ? '目标' : 'Target'}: {getTaskTarget(task)}</span>
                  </div>

                  {task.nextRun && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        {i18n.language === 'zh' ? '下次执行' : 'Next run'}: {getNextRun(task)}
                      </span>
                    </div>
                  )}

                  {task.lastRun && (
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} />
                      <span>
                        {i18n.language === 'zh' ? '上次执行' : 'Last run'}: {new Date(task.lastRun).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm gap-1"
                  onClick={() => runTaskNow(task.id)}
                >
                  <Play size={14} />
                  {i18n.language === 'zh' ? '立即执行' : 'Run now'}
                </button>

                <button
                  className="btn btn-ghost btn-sm btn-circle text-error"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="bg-base-200/50 rounded-2xl border border-base-300 p-12 text-center">
            <Clock size={64} strokeWidth={1} className="mx-auto text-base-content/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {i18n.language === 'zh' ? '暂无定时任务' : 'No scheduled tasks'}
            </h3>
            <p className="text-base-content/60 mb-4">
              {i18n.language === 'zh' 
                ? '创建一个定时任务来自动执行 Skill 或工作流'
                : 'Create a scheduled task to automate skill or workflow execution'}
            </p>
            <button
              className="btn btn-primary gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              {i18n.language === 'zh' ? '新建任务' : 'New Task'}
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {i18n.language === 'zh' ? '新建定时任务' : 'New Scheduled Task'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">{i18n.language === 'zh' ? '任务名称' : 'Task Name'}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder={i18n.language === 'zh' ? '输入任务名称' : 'Enter task name'}
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">{i18n.language === 'zh' ? '执行类型' : 'Execution Type'}</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value as 'skill' | 'workflow' })}
                >
                  <option value="skill">{i18n.language === 'zh' ? 'Skill' : 'Skill'}</option>
                  <option value="workflow">{i18n.language === 'zh' ? '工作流' : 'Workflow'}</option>
                </select>
              </div>

              {newTask.type === 'skill' ? (
                <div>
                  <label className="label">
                    <span className="label-text">{i18n.language === 'zh' ? '选择 Skill' : 'Select Skill'}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={newTask.skillId}
                    onChange={(e) => setNewTask({ ...newTask, skillId: e.target.value })}
                  >
                    <option value="">{i18n.language === 'zh' ? '选择一个 Skill' : 'Select a skill'}</option>
                    {installedSkills.map((skill) => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label">
                    <span className="label-text">{i18n.language === 'zh' ? '选择工作流' : 'Select Workflow'}</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={newTask.workflowId}
                    onChange={(e) => setNewTask({ ...newTask, workflowId: e.target.value })}
                  >
                    <option value="">{i18n.language === 'zh' ? '选择一个工作流' : 'Select a workflow'}</option>
                    {workflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">
                  <span className="label-text">{i18n.language === 'zh' ? 'Cron 表达式' : 'Cron Expression'}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full font-mono"
                  placeholder="* * * * *"
                  value={newTask.cron}
                  onChange={(e) => setNewTask({ ...newTask, cron: e.target.value })}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {cronPresets.map((preset) => (
                    <button
                      key={preset.value}
                      className={`btn btn-xs ${newTask.cron === preset.value ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setNewTask({ ...newTask, cron: preset.value })}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={newTask.enabled}
                    onChange={(e) => setNewTask({ ...newTask, enabled: e.target.checked })}
                  />
                  <span className="label-text">{i18n.language === 'zh' ? '创建后立即启用' : 'Enable immediately after creation'}</span>
                </label>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                {i18n.language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTask}
                disabled={!newTask.name.trim()}
              >
                {i18n.language === 'zh' ? '创建' : 'Create'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
        </div>
      )}
    </div>
  );
};

export default SchedulerPage;