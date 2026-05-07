import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMonitoringStore } from '../store/extendedStores';
import { useStatsStore } from '../store/extendedStores';
import { 
  BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle, 
  XCircle, AlertTriangle, Download, RefreshCw, Filter, Calendar
} from 'lucide-react';

const MonitoringDashboard = () => {
  const { t, i18n } = useTranslation();
  const {
    dashboards,
    fetchDashboards,
    createDashboard,
    metrics,
    fetchMetrics,
    recordMetrics,
  } = useMonitoringStore();
  const { stats, fetchAllStats } = useStatsStore();

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDashboards(), fetchAllStats()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchDashboards, fetchAllStats]);

  const totalStats = Object.values(stats).reduce((acc, s) => ({
    totalExecutions: acc.totalExecutions + s.totalExecutions,
    successfulExecutions: acc.successfulExecutions + s.successfulExecutions,
    failedExecutions: acc.failedExecutions + s.failedExecutions,
    averageExecutionTime: acc.averageExecutionTime + s.averageExecutionTime,
  }), { totalExecutions: 0, successfulExecutions: 0, failedExecutions: 0, averageExecutionTime: 0 });

  const avgExecutionTime = totalStats.totalExecutions > 0
    ? totalStats.averageExecutionTime / Object.keys(stats).length
    : 0;

  const successRate = totalStats.totalExecutions > 0
    ? (totalStats.successfulExecutions / totalStats.totalExecutions * 100).toFixed(1)
    : '0';

  const filteredStats = selectedSkill === 'all'
    ? Object.values(stats)
    : [stats[selectedSkill]].filter(Boolean);

  const chartData = filteredStats.map(s => ({
    name: s.skillId.substring(0, 15),
    executions: s.totalExecutions,
    success: s.successfulExecutions,
    failed: s.failedExecutions,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {i18n.language === 'zh' ? '监控仪表板' : 'Monitoring Dashboard'}
            </h2>
            <p className="text-sm text-base-content/60">
              {i18n.language === 'zh' ? 'Skill 使用统计和性能分析' : 'Skill usage statistics and performance analysis'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            className="select select-bordered select-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
          >
            <option value="24h">24 {i18n.language === 'zh' ? '小时' : 'hours'}</option>
            <option value="7d">7 {i18n.language === 'zh' ? '天' : 'days'}</option>
            <option value="30d">30 {i18n.language === 'zh' ? '天' : 'days'}</option>
            <option value="all">{i18n.language === 'zh' ? '全部' : 'All'}</option>
          </select>

          <button
            className="btn btn-ghost btn-sm gap-2"
            onClick={() => fetchAllStats()}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button className="btn btn-ghost btn-sm gap-2">
            <Download size={14} />
            {i18n.language === 'zh' ? '导出' : 'Export'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base-content/60 text-sm">
              {i18n.language === 'zh' ? '总执行次数' : 'Total Executions'}
            </span>
            <TrendingUp size={20} className="text-success" />
          </div>
          <div className="text-3xl font-bold">{totalStats.totalExecutions}</div>
          <div className="text-sm text-base-content/50 mt-1">
            {i18n.language === 'zh' ? '所有 Skill' : 'All Skills'}
          </div>
        </div>

        <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base-content/60 text-sm">
              {i18n.language === 'zh' ? '成功率' : 'Success Rate'}
            </span>
            <CheckCircle size={20} className="text-success" />
          </div>
          <div className="text-3xl font-bold">{successRate}%</div>
          <div className="text-sm text-base-content/50 mt-1">
            {totalStats.successfulExecutions} {i18n.language === 'zh' ? '成功' : 'successful'}
          </div>
        </div>

        <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base-content/60 text-sm">
              {i18n.language === 'zh' ? '失败次数' : 'Failed'}
            </span>
            <XCircle size={20} className="text-error" />
          </div>
          <div className="text-3xl font-bold">{totalStats.failedExecutions}</div>
          <div className="text-sm text-base-content/50 mt-1">
            {i18n.language === 'zh' ? '需要关注' : 'Needs attention'}
          </div>
        </div>

        <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base-content/60 text-sm">
              {i18n.language === 'zh' ? '平均执行时间' : 'Avg Execution Time'}
            </span>
            <Clock size={20} className="text-warning" />
          </div>
          <div className="text-3xl font-bold">{avgExecutionTime.toFixed(0)}ms</div>
          <div className="text-sm text-base-content/50 mt-1">
            {i18n.language === 'zh' ? '响应时间' : 'Response time'}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
          <h3 className="font-bold mb-4">
            {i18n.language === 'zh' ? 'Skill 执行统计' : 'Skill Execution Stats'}
          </h3>

          <div className="space-y-3">
            {chartData.slice(0, 10).map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium truncate">{item.name}</span>
                  <span className="text-base-content/60">{item.executions}</span>
                </div>
                <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(item.executions / Math.max(...chartData.map(d => d.executions), 1)) * 100}%` }}
                  />
                </div>
                <div className="flex gap-3 text-xs text-base-content/50">
                  <span className="flex items-center gap-1">
                    <CheckCircle size={10} className="text-success" />
                    {item.success}
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle size={10} className="text-error" />
                    {item.failed}
                  </span>
                </div>
              </div>
            ))}

            {chartData.length === 0 && (
              <div className="text-center py-8 text-base-content/40">
                <BarChart3 size={32} strokeWidth={1} className="mx-auto mb-2" />
                <p>{i18n.language === 'zh' ? '暂无数据' : 'No data available'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart - Success/Failure */}
        <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
          <h3 className="font-bold mb-4">
            {i18n.language === 'zh' ? '执行结果分布' : 'Execution Result Distribution'}
          </h3>

          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-base-300"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="20"
                  strokeDasharray={`${(parseFloat(successRate) / 100) * 251.2} 251.2`}
                  className="text-success transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{successRate}%</span>
                <span className="text-sm text-base-content/60">
                  {i18n.language === 'zh' ? '成功率' : 'Success'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm">
                {i18n.language === 'zh' ? '成功' : 'Success'}: {totalStats.successfulExecutions}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error" />
              <span className="text-sm">
                {i18n.language === 'zh' ? '失败' : 'Failed'}: {totalStats.failedExecutions}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-base-200/50 rounded-2xl border border-base-300 p-5">
        <h3 className="font-bold mb-4">
          {i18n.language === 'zh' ? '最近执行记录' : 'Recent Execution History'}
        </h3>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{i18n.language === 'zh' ? 'Skill' : 'Skill'}</th>
                <th>{i18n.language === 'zh' ? '状态' : 'Status'}</th>
                <th>{i18n.language === 'zh' ? '执行时间' : 'Duration'}</th>
                <th>{i18n.language === 'zh' ? '时间' : 'Time'}</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(stats)
                .flatMap(s => s.executionHistory.slice(0, 5))
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .map((record, index) => (
                  <tr key={index}>
                    <td className="font-medium">{record.skillId}</td>
                    <td>
                      {record.success ? (
                        <span className="badge badge-success gap-1">
                          <CheckCircle size={12} />
                          {i18n.language === 'zh' ? '成功' : 'Success'}
                        </span>
                      ) : (
                        <span className="badge badge-error gap-1">
                          <XCircle size={12} />
                          {i18n.language === 'zh' ? '失败' : 'Failed'}
                        </span>
                      )}
                    </td>
                    <td>{record.duration}ms</td>
                    <td className="text-base-content/60">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}

              {Object.values(stats).every(s => s.executionHistory.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-base-content/40">
                    <Clock size={24} strokeWidth={1} className="mx-auto mb-2" />
                    <p>{i18n.language === 'zh' ? '暂无执行记录' : 'No execution history'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;