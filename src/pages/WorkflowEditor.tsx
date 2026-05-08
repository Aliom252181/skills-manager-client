import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkflowStore } from '../store/extendedStores';
import { useSkillStore } from '../store/useSkillStore';
import { 
  Plus, Play, Pause, Trash2, X, GripVertical, 
  ArrowRight, RefreshCw, CheckCircle, 
  XCircle, Clock, AlertCircle, GitBranch
} from 'lucide-react';

const WorkflowEditor = () => {
  const { i18n } = useTranslation();
  const {
    workflows,
    isExecuting,
    fetchWorkflows,
    createWorkflow,
    deleteWorkflow,
    executeWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    addStep,
    removeStep,
    reorderSteps,
  } = useWorkflowStore();
  const { installedSkills } = useSkillStore();

  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const workflow = workflows.find(w => w.id === selectedWorkflow);

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) return;

    const created = await createWorkflow({
      name: newWorkflowName,
      description: '',
      steps: [],
      variables: {},
      trigger: { type: 'manual', config: {} },
      status: 'draft',
    });

    setSelectedWorkflow(created.id);
    setNewWorkflowName('');
    setIsCreating(false);
  };

  const handleExecute = async () => {
    if (!selectedWorkflow) return;
    try {
      await executeWorkflow(selectedWorkflow);
    } catch (error) {
      console.error('Workflow execution failed:', error);
    }
  };

  const handleAddStep = () => {
    if (!selectedWorkflow || installedSkills.length === 0) return;

    addStep(selectedWorkflow, {
      skillId: installedSkills[0].id,
      skillName: installedSkills[0].name,
      input: {},
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index && selectedWorkflow) {
      reorderSteps(selectedWorkflow, draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'paused': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-base-content/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'paused': return <Pause size={16} />;
      case 'error': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Workflow List */}
      <div className="w-80 border-r border-base-300 flex flex-col">
        <div className="p-4 border-b border-base-300">
          <h3 className="font-bold mb-3">
            {i18n.language === 'zh' ? '工作流' : 'Workflows'}
          </h3>
          <button
            className="btn btn-primary btn-sm w-full gap-2"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={16} />
            {i18n.language === 'zh' ? '新建工作流' : 'New Workflow'}
          </button>
        </div>

        {isCreating && (
          <div className="p-4 border-b border-base-300 bg-base-200/50">
            <input
              type="text"
              className="input input-bordered w-full mb-2"
              placeholder={i18n.language === 'zh' ? '工作流名称' : 'Workflow name'}
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
            />
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm flex-1"
                onClick={handleCreateWorkflow}
              >
                <CheckCircle size={14} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewWorkflowName('');
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-2">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              className={`w-full text-left p-3 rounded-xl mb-2 transition-colors ${
                selectedWorkflow === wf.id
                  ? 'bg-primary/10 border border-primary'
                  : 'hover:bg-base-200'
              }`}
              onClick={() => setSelectedWorkflow(wf.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{wf.name}</span>
                <span className={getStatusColor(wf.status)}>
                  {getStatusIcon(wf.status)}
                </span>
              </div>
              <div className="text-xs text-base-content/50">
                {wf.steps.length} {i18n.language === 'zh' ? '步骤' : 'steps'}
                {wf.lastRun && (
                  <span> · {new Date(wf.lastRun).toLocaleDateString()}</span>
                )}
              </div>
            </button>
          ))}

          {workflows.length === 0 && (
            <div className="text-center text-base-content/50 py-8">
              <GitBranch size={32} strokeWidth={1} className="mx-auto mb-2" />
              <p className="text-sm">
                {i18n.language === 'zh' ? '暂无工作流' : 'No workflows yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Workflow Editor */}
      <div className="flex-1 flex flex-col">
        {workflow ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{workflow.name}</h2>
                {workflow.description && (
                  <p className="text-sm text-base-content/60">{workflow.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                {workflow.status === 'active' ? (
                  <button
                    className="btn btn-warning gap-2"
                    onClick={() => pauseWorkflow(workflow.id)}
                  >
                    <Pause size={16} />
                    {i18n.language === 'zh' ? '暂停' : 'Pause'}
                  </button>
                ) : workflow.status === 'paused' ? (
                  <button
                    className="btn btn-success gap-2"
                    onClick={() => resumeWorkflow(workflow.id)}
                  >
                    <Play size={16} />
                    {i18n.language === 'zh' ? '恢复' : 'Resume'}
                  </button>
                ) : null}

                <button
                  className="btn btn-primary gap-2"
                  onClick={handleExecute}
                  disabled={isExecuting || workflow.steps.length === 0}
                >
                  {isExecuting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  {i18n.language === 'zh' ? '执行' : 'Execute'}
                </button>

                <button
                  className="btn btn-error btn-outline gap-2"
                  onClick={() => {
                    deleteWorkflow(workflow.id);
                    setSelectedWorkflow(null);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {i18n.language === 'zh' ? '步骤' : 'Steps'}
                </h3>
                <button
                  className="btn btn-ghost btn-sm gap-2"
                  onClick={handleAddStep}
                >
                  <Plus size={14} />
                  {i18n.language === 'zh' ? '添加步骤' : 'Add Step'}
                </button>
              </div>

              <div className="space-y-3">
                {workflow.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-base-200 rounded-xl p-4 border border-base-300"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center gap-3">
                      <div className="cursor-move text-base-content/40">
                        <GripVertical size={16} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-primary badge-sm">
                            Step {index + 1}
                          </span>
                          <span className="font-medium">{step.skillName}</span>
                        </div>

                        <select
                          className="select select-bordered select-sm w-full max-w-xs"
                          value={step.skillId}
                          onChange={(e) => {
                            const skill = installedSkills.find(s => s.id === e.target.value);
                            if (skill) {
                              useWorkflowStore.getState().addStep(workflow.id, {
                                ...step,
                                skillId: skill.id,
                                skillName: skill.name,
                              });
                              useWorkflowStore.getState().removeStep(workflow.id, step.id);
                            }
                          }}
                        >
                          {installedSkills.map((skill) => (
                            <option key={skill.id} value={skill.id}>
                              {skill.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {step.condition && (
                        <div className="text-sm text-base-content/60 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {i18n.language === 'zh' ? '有条件' : 'Conditional'}
                        </div>
                      )}

                      <button
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={() => removeStep(workflow.id, step.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {index < workflow.steps.length - 1 && (
                      <div className="flex justify-center mt-3">
                        <ArrowRight size={16} className="text-base-content/30" />
                      </div>
                    )}
                  </div>
                ))}

                {workflow.steps.length === 0 && (
                  <div className="text-center py-12 text-base-content/40">
                    <GitBranch size={48} strokeWidth={1} className="mx-auto mb-3" />
                    <p>
                      {i18n.language === 'zh' ? '点击"添加步骤"开始构建工作流' : 'Click "Add Step" to build your workflow'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="p-4 border-t border-base-300 bg-base-200/30">
              <div className="flex justify-between text-sm text-base-content/60">
                <span>
                  {i18n.language === 'zh' ? '执行次数' : 'Run count'}: {workflow.runCount}
                </span>
                <span>
                  {i18n.language === 'zh' ? '创建于' : 'Created'}: {new Date(workflow.createdAt).toLocaleDateString()}
                </span>
                {workflow.lastRun && (
                  <span>
                    {i18n.language === 'zh' ? '上次执行' : 'Last run'}: {new Date(workflow.lastRun).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-base-content/40">
            <div className="text-center">
              <GitBranch size={64} strokeWidth={1} className="mx-auto mb-4" />
              <p className="text-lg">
                {i18n.language === 'zh' ? '选择一个工作流或创建新的' : 'Select a workflow or create a new one'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowEditor;