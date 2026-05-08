import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Terminal, Play, RefreshCw, X, Server, Zap, Code2, FileText, Settings } from 'lucide-react';
import type { McpTool } from '../mcp';

const Executor = () => {
  const { t, i18n } = useTranslation();
  const {
    installedSkills,
    mcpConnections,
    selectedMcpServerUrl,
    isConnecting,
    connectMcpServer,
    disconnectMcpServer,
    availableTools,
    isExecuting,
    executionResult,
    executeSkill,
    invokeTool,
    clearExecutionResult,
    availableTools: tools,
  } = useSkillStore();

  const [serverUrl, setServerUrl] = useState('ws://localhost:8080/mcp');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [toolArguments, setToolArguments] = useState<Record<string, unknown>>({});
  const [activeTab, setActiveTab] = useState<'execute' | 'tools'>('execute');

  const selectedSkill = installedSkills.find(s => s.id === selectedSkillId);

  useEffect(() => {
    if (tools.length > 0 && selectedTool) {
      const tool = tools.find(t => t.name === selectedTool.name);
      if (tool) {
        const args: Record<string, unknown> = {};
        tool.parameters.forEach(p => {
          args[p.name] = p.type === 'string' ? '' : p.type === 'number' ? 0 : p.type === 'boolean' ? false : [];
        });
        setToolArguments(args);
      }
    }
  }, [selectedTool, tools]);

  const handleConnect = async () => {
    try {
      await connectMcpServer(serverUrl);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectMcpServer(selectedMcpServerUrl);
  };

  const handleExecuteSkill = async () => {
    if (!selectedSkillId || !inputText.trim()) return;

    try {
      await executeSkill(selectedSkillId, selectedSkill?.localPath || '', inputText);
    } catch (error) {
      console.error('Execution failed:', error);
    }
  };

  const handleInvokeTool = async () => {
    if (!selectedTool) return;

    try {
      await invokeTool(selectedTool.name, toolArguments);
    } catch (error) {
      console.error('Tool invocation failed:', error);
    }
  };

  const handleArgumentChange = (name: string, value: unknown) => {
    setToolArguments(prev => ({ ...prev, [name]: value }));
  };

  const handleClearResult = () => {
    clearExecutionResult();
    setInputText('');
  };

  const getConnectionStatus = () => {
    const connection = mcpConnections.find(c => c.url === selectedMcpServerUrl);
    return connection?.connected ? 'connected' : 'disconnected';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
            <Terminal size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t('executor')}</h2>
            <p className="text-sm text-base-content/60">
              {i18n.language === 'zh' ? '执行 Skill 并查看结果' : 'Execute Skills and view results'}
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-xl">
            <Server size={16} className={getConnectionStatus() === 'connected' ? 'text-success' : 'text-error'} />
            <span className="text-sm font-medium">
              {getConnectionStatus() === 'connected'
                ? (i18n.language === 'zh' ? '已连接' : 'Connected')
                : (i18n.language === 'zh' ? '未连接' : 'Disconnected')}
            </span>
          </div>
        </div>
      </div>

      {/* MCP Server Connection */}
      <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="label">
              <span className="label-text font-semibold flex items-center gap-2">
                <Server size={14} />
                {i18n.language === 'zh' ? 'MCP 服务器地址' : 'MCP Server URL'}
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered flex-1 rounded-xl"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="ws://localhost:8080/mcp"
              />
              {selectedMcpServerUrl === serverUrl && getConnectionStatus() === 'connected' ? (
                <button
                  className="btn btn-error btn-sm rounded-xl"
                  onClick={handleDisconnect}
                >
                  {i18n.language === 'zh' ? '断开' : 'Disconnect'}
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-sm rounded-xl"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  {i18n.language === 'zh' ? '连接' : 'Connect'}
                </button>
              )}
            </div>
          </div>

          {selectedMcpServerUrl && getConnectionStatus() === 'connected' && (
            <div className="md:w-64">
              <label className="label">
                <span className="label-text font-semibold">
                  {i18n.language === 'zh' ? '可用工具' : 'Available Tools'}
                </span>
              </label>
              <div className="text-sm text-base-content/60">
                {availableTools.length} {i18n.language === 'zh' ? '个工具' : 'tools'}
              </div>
            </div>
          )}
        </div>
      </div>

      {getConnectionStatus() === 'connected' && (
        <>
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              className={`btn ${activeTab === 'execute' ? 'btn-primary' : 'btn-ghost'} rounded-xl`}
              onClick={() => setActiveTab('execute')}
            >
              <Zap size={16} className="mr-2" />
              {i18n.language === 'zh' ? '执行 Skill' : 'Execute Skill'}
            </button>
            <button
              className={`btn ${activeTab === 'tools' ? 'btn-primary' : 'btn-ghost'} rounded-xl`}
              onClick={() => setActiveTab('tools')}
            >
              <Code2 size={16} className="mr-2" />
              {i18n.language === 'zh' ? '调用工具' : 'Invoke Tool'}
            </button>
          </div>

          {/* Execute Tab */}
          {activeTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Skill Selection & Input */}
              <div className="lg:col-span-2 space-y-4">
                {/* Skill Selection */}
                <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <FileText size={14} />
                      {i18n.language === 'zh' ? '选择 Skill' : 'Select Skill'}
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full rounded-xl"
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                  >
                    <option value="">{i18n.language === 'zh' ? '请选择一个 Skill' : 'Select a skill'}</option>
                    {installedSkills.map((skill) => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name} ({skill.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input */}
                <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
                  <label className="label">
                    <span className="label-text font-semibold">
                      {i18n.language === 'zh' ? '输入参数' : 'Input'}
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-40 rounded-xl"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={i18n.language === 'zh' ? '输入 Skill 执行所需的参数...' : 'Enter input parameters for the skill...'}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      className="btn btn-primary gap-2 rounded-xl shadow-lg shadow-primary/25"
                      onClick={handleExecuteSkill}
                      disabled={!selectedSkillId || !inputText.trim() || isExecuting}
                    >
                      {isExecuting ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <Play size={18} />
                      )}
                      {i18n.language === 'zh' ? '执行' : 'Execute'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel - Result */}
              <div className="space-y-4">
                <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5 h-full">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Terminal size={16} />
                      {i18n.language === 'zh' ? '执行结果' : 'Execution Result'}
                    </h3>
                    {executionResult && (
                      <button
                        className="btn btn-ghost btn-xs rounded-lg"
                        onClick={handleClearResult}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {isExecuting ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                      <p className="mt-3 text-base-content/60">
                        {i18n.language === 'zh' ? '正在执行...' : 'Executing...'}
                      </p>
                    </div>
                  ) : executionResult ? (
                    <div className="space-y-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        executionResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {executionResult.success ? (
                          <span className="text-lg">✓</span>
                        ) : (
                          <span className="text-lg">✗</span>
                        )}
                        <span className="font-medium">
                          {executionResult.success
                            ? (i18n.language === 'zh' ? '执行成功' : 'Success')
                            : (i18n.language === 'zh' ? '执行失败' : 'Failed')}
                        </span>
                      </div>

                      {executionResult.output && (
                        <div className="bg-base-100 rounded-xl p-4 max-h-80 overflow-auto">
                          <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                            {executionResult.output}
                          </pre>
                        </div>
                      )}

                      {executionResult.error && (
                        <div className="bg-error/10 rounded-xl p-4">
                          <p className="text-sm text-error">{executionResult.error}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-base-content/40">
                      <Terminal size={48} strokeWidth={1} />
                      <p className="mt-3 text-center">
                        {i18n.language === 'zh' ? '选择一个 Skill 并执行' : 'Select a skill and execute'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Panel - Tool Selection */}
              <div className="space-y-4">
                <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <Code2 size={14} />
                      {i18n.language === 'zh' ? '选择工具' : 'Select Tool'}
                    </span>
                  </label>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {availableTools.map((tool) => (
                      <button
                        key={tool.name}
                        className={`w-full text-left p-3 rounded-xl transition-colors ${
                          selectedTool?.name === tool.name
                            ? 'bg-primary/10 border border-primary'
                            : 'bg-base-100 hover:bg-base-200'
                        }`}
                        onClick={() => setSelectedTool(selectedTool?.name === tool.name ? null : tool)}
                      >
                        <div className="font-medium">{tool.name}</div>
                        <div className="text-xs text-base-content/60 mt-1 line-clamp-2">
                          {tool.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel - Tool Arguments & Result */}
              <div className="lg:col-span-2 space-y-4">
                {selectedTool ? (
                  <>
                    {/* Tool Info */}
                    <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{selectedTool.name}</h3>
                          <p className="text-sm text-base-content/60 mt-1">
                            {selectedTool.description}
                          </p>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm rounded-lg"
                          onClick={() => setSelectedTool(null)}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Parameters */}
                      <div className="space-y-3">
                        <label className="label">
                          <span className="label-text font-semibold flex items-center gap-2">
                            <Settings size={14} />
                            {i18n.language === 'zh' ? '参数' : 'Parameters'}
                          </span>
                        </label>
                        {selectedTool.parameters.map((param) => (
                          <div key={param.name}>
                            <label className="label">
                              <span className="label-text">
                                {param.name}
                                {param.required && <span className="text-error ml-1">*</span>}
                              </span>
                              {param.description && (
                                <span className="label-text-alt text-xs text-base-content/50">
                                  {param.description}
                                </span>
                              )}
                            </label>
                            {param.type === 'string' && (
                              <input
                                type="text"
                                className="input input-bordered w-full rounded-xl"
                                value={(toolArguments[param.name] as string) || ''}
                                onChange={(e) => handleArgumentChange(param.name, e.target.value)}
                                placeholder={param.description}
                              />
                            )}
                            {param.type === 'number' && (
                              <input
                                type="number"
                                className="input input-bordered w-full rounded-xl"
                                value={(toolArguments[param.name] as number) || ''}
                                onChange={(e) => handleArgumentChange(param.name, parseFloat(e.target.value) || 0)}
                              />
                            )}
                            {param.type === 'boolean' && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-primary"
                                  checked={toolArguments[param.name] as boolean || false}
                                  onChange={(e) => handleArgumentChange(param.name, e.target.checked)}
                                />
                                <span className="text-sm">{i18n.language === 'zh' ? '启用' : 'Enable'}</span>
                              </label>
                            )}
                            {param.type === 'array' && (
                              <input
                                type="text"
                                className="input input-bordered w-full rounded-xl"
                                value={(toolArguments[param.name] as string[])?.join(', ') || ''}
                                onChange={(e) => handleArgumentChange(param.name, e.target.value.split(',').map(s => s.trim()))}
                                placeholder={i18n.language === 'zh' ? '用逗号分隔的值' : 'Comma-separated values'}
                              />
                            )}
                          </div>
                        ))}

                        <button
                          className="btn btn-primary gap-2 rounded-xl shadow-lg shadow-primary/25 mt-4"
                          onClick={handleInvokeTool}
                          disabled={isExecuting}
                        >
                          {isExecuting ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <Play size={18} />
                          )}
                          {i18n.language === 'zh' ? '调用工具' : 'Invoke Tool'}
                        </button>
                      </div>
                    </div>

                    {/* Result */}
                    <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Terminal size={16} />
                          {i18n.language === 'zh' ? '工具调用结果' : 'Tool Result'}
                        </h3>
                        {executionResult && (
                          <button
                            className="btn btn-ghost btn-xs rounded-lg"
                            onClick={() => clearExecutionResult()}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {isExecuting ? (
                        <div className="flex flex-col items-center justify-center py-10">
                          <span className="loading loading-spinner loading-lg text-primary"></span>
                          <p className="mt-3 text-base-content/60">
                            {i18n.language === 'zh' ? '正在调用...' : 'Invoking...'}
                          </p>
                        </div>
                      ) : executionResult ? (
                        <div className="space-y-3">
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            executionResult.success ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                          }`}>
                            {executionResult.success ? (
                              <span className="text-lg">✓</span>
                            ) : (
                              <span className="text-lg">✗</span>
                            )}
                            <span className="font-medium">
                              {executionResult.success
                                ? (i18n.language === 'zh' ? '调用成功' : 'Success')
                                : (i18n.language === 'zh' ? '调用失败' : 'Failed')}
                            </span>
                          </div>

                          {executionResult.output && (
                            <div className="bg-base-100 rounded-xl p-4 max-h-60 overflow-auto">
                              <pre className="text-sm font-mono whitespace-pre-wrap break-all">
                                {executionResult.output}
                              </pre>
                            </div>
                          )}

                          {executionResult.error && (
                            <div className="bg-error/10 rounded-xl p-4">
                              <p className="text-sm text-error">{executionResult.error}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-base-content/40">
                          <Code2 size={32} strokeWidth={1} />
                          <p className="mt-2 text-center text-sm">
                            {i18n.language === 'zh' ? '选择工具并输入参数' : 'Select a tool and enter parameters'}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-base-200/50 rounded-2xl border border-base-300 p-12 text-center">
                    <Code2 size={48} strokeWidth={1} className="mx-auto text-base-content/40" />
                    <p className="mt-4 text-base-content/60">
                      {i18n.language === 'zh' ? '从左侧选择一个工具' : 'Select a tool from the left panel'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {getConnectionStatus() === 'disconnected' && (
        <div className="bg-base-200/50 rounded-2xl border border-base-300 p-12 text-center">
          <Server size={48} strokeWidth={1} className="mx-auto text-base-content/40" />
          <p className="mt-4 text-base-content/60">
            {i18n.language === 'zh' ? '请先连接到 MCP 服务器' : 'Please connect to an MCP server first'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Executor;