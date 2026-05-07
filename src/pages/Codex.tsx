import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillStore } from '../store/useSkillStore';
import { Send, Loader2, Copy, Check, Trash2, ChevronDown, ChevronUp, MessageSquare, Terminal, Plus, Settings, X, FileText } from 'lucide-react';
import type { AcpMessage } from '../sdk';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  tools?: { name: string; args: Record<string, unknown> }[];
}

const Codex = () => {
  const { t, i18n } = useTranslation();
  const {
    mcpConnections,
    selectedMcpServerUrl,
    availableTools,
    connectMcpServer,
  } = useSkillStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleConnect = async () => {
    try {
      await connectMcpServer(selectedMcpServerUrl || 'ws://localhost:8080');
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      setMessages(prev => [...prev, assistantMessage]);

      const response = await simulateStreamingResponse(userMessage.content);

      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: response, isStreaming: false }
          : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === messages[messages.length - 1]?.id && msg.role === 'assistant'
          ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', isStreaming: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const simulateStreamingResponse = async (input: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const responses = [
      `I understand you want to: "${input}". Let me help you with that.\n\nBased on your request, here's what I found:\n\n1. Analysis of your input\n2. Relevant skills identified\n3. Recommended actions\n\nWould you like me to execute any specific skill?`,
      `Here's what I can help you with regarding: "${input}"\n\n\`\`\`javascript\n// Example code snippet\nconst result = processInput("${input}");\nconsole.log(result);\n\`\`\`\n\nThe skill has been executed successfully.`,
      `Processing your request: "${input}"\n\n**Available tools:**\n- Skill executor\n- Code generator\n- Documentation lookup\n\nLet me know what you'd like to do next.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleExpand = (messageId: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMarkdown = (content: string) => {
    let html = content;

    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="code-block"><code class="language-${lang || 'text'}">${escapeHtml(code)}</code><button class="copy-btn" data-code="${escapeHtml(code)}">Copy</button></pre>`;
    });

    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const getConnectionStatus = () => {
    const connection = mcpConnections.find(c => c.url === selectedMcpServerUrl);
    return connection?.connected;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl">
            <MessageSquare size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Codex</h2>
            <p className="text-sm text-base-content/60">
              {i18n.language === 'zh' ? 'AI 编程助手' : 'AI Coding Assistant'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-xl">
            <div className={`w-2 h-2 rounded-full ${getConnectionStatus() ? 'bg-success' : 'bg-error'}`} />
            <span className="text-sm">
              {getConnectionStatus()
                ? (i18n.language === 'zh' ? '已连接' : 'Connected')
                : (i18n.language === 'zh' ? '未连接' : 'Disconnected')}
            </span>
          </div>

          {messages.length > 0 && (
            <button
              className="btn btn-ghost btn-sm gap-2 rounded-xl"
              onClick={clearChat}
            >
              <Trash2 size={16} />
              {i18n.language === 'zh' ? '清空' : 'Clear'}
            </button>
          )}

          <button
            className="btn btn-ghost btn-sm gap-2 rounded-xl"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-6 py-4 bg-base-200 border-b border-base-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text font-semibold">
                  {i18n.language === 'zh' ? 'MCP 服务器' : 'MCP Server'}
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full rounded-xl"
                value={selectedMcpServerUrl}
                placeholder="ws://localhost:8080"
                readOnly
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold">
                  {i18n.language === 'zh' ? '可用工具' : 'Available Tools'}
                </span>
              </label>
              <div className="text-sm text-base-content/60">
                {availableTools.length} {i18n.language === 'zh' ? '个工具已注册' : 'tools registered'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/40">
            <MessageSquare size={64} strokeWidth={1} />
            <p className="mt-4 text-lg">
              {i18n.language === 'zh' ? '开始一个新对话' : 'Start a new conversation'}
            </p>
            <p className="text-sm mt-2">
              {i18n.language === 'zh'
                ? '输入消息开始与 AI 助手交流'
                : 'Type a message to start chatting with the AI assistant'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-content'
                    : 'bg-base-200'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-base-content/50">
                    <Terminal size={12} />
                    <span>AI Assistant</span>
                    <span>·</span>
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
                )}

                {message.role === 'user' && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-primary-content/70">
                    <span>{i18n.language === 'zh' ? '你' : 'You'}</span>
                    <span>·</span>
                    <span>{formatTimestamp(message.timestamp)}</span>
                  </div>
                )}

                <div className="prose prose-sm max-w-none">
                  {message.role === 'assistant' ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                      className="message-content"
                    />
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>

                {message.isStreaming && (
                  <div className="flex items-center gap-2 mt-2 text-base-content/50">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">
                      {i18n.language === 'zh' ? '正在生成...' : 'Generating...'}
                    </span>
                  </div>
                )}

                {!message.isStreaming && message.role === 'assistant' && message.content && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-base-300/50">
                    <button
                      className="btn btn-ghost btn-xs gap-1 rounded-lg"
                      onClick={() => copyToClipboard(message.content, message.id)}
                    >
                      {copiedId === message.id ? <Check size={12} /> : <Copy size={12} />}
                      {i18n.language === 'zh' ? '复制' : 'Copy'}
                    </button>
                  </div>
                )}

                {message.tools && message.tools.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-base-300/50">
                    <div className="text-xs text-base-content/50 mb-2">
                      {i18n.language === 'zh' ? '调用的工具:' : 'Tools called:'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.tools.map((tool, i) => (
                        <span
                          key={i}
                          className="badge badge-neutral badge-sm"
                        >
                          <Terminal size={10} className="mr-1" />
                          {tool.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-base-300">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="textarea textarea-bordered w-full pr-12 rounded-xl resize-none"
              placeholder={i18n.language === 'zh'
                ? '输入你的问题... (Shift+Enter 换行，Enter 发送)'
                : 'Type your question... (Shift+Enter for new line, Enter to send)'
              }
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="absolute right-3 bottom-3 btn btn-ghost btn-xs"
              onClick={() => inputRef.current?.focus()}
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            className="btn btn-primary rounded-xl"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs text-base-content/50">
          <span>
            {i18n.language === 'zh'
              ? `${availableTools.length} 个工具可用`
              : `${availableTools.length} tools available`}
          </span>
          <span>
            {i18n.language === 'zh'
              ? '按 Enter 发送，Shift+Enter 换行'
              : 'Press Enter to send, Shift+Enter for new line'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Codex;