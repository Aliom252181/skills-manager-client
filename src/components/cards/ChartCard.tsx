import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  labels?: string[];
  values?: number[];
  data?: { name: string; value: number }[];
  type?: 'bar' | 'line' | 'pie';
  colors?: string[];
}

interface ChartMetadata {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

export class ChartCard {
  static render(container: HTMLElement, data: unknown, metadata?: ChartMetadata): void {
    container.innerHTML = '';

    const chartData = data as ChartData;
    let processedData = chartData.data || [];

    if (!processedData.length && chartData.labels && chartData.values) {
      processedData = chartData.labels.map((label, i) => ({
        name: label,
        value: chartData.values?.[i] || 0,
      }));
    }

    const colors = chartData.colors || COLORS;
    const chartType = chartData.type || 'bar';

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-card-wrapper';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    if (chartType === 'line') {
      wrapper.innerHTML = this.renderLineChart(processedData, colors, metadata);
    } else if (chartType === 'pie') {
      wrapper.innerHTML = this.renderPieChart(processedData, colors);
    } else {
      wrapper.innerHTML = this.renderBarChart(processedData, colors, metadata);
    }

    container.appendChild(wrapper);
  }

  private static renderBarChart(data: { name: string; value: number }[], colors: string[], metadata?: ChartMetadata): string {
    return `
      <div class="chart-container">
        ${metadata?.title ? `<div class="chart-title">${metadata.title}</div>` : ''}
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={${JSON.stringify(data)}} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            ${metadata?.xAxisLabel ? `<XAxis dataKey="name" stroke="#888" fontSize={12} />` : ''}
            ${metadata?.yAxisLabel ? `<YAxis stroke="#888" fontSize={12} />` : ''}
            <Tooltip />
            <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    `;
  }

  private static renderLineChart(data: { name: string; value: number }[], colors: string[], metadata?: ChartMetadata): string {
    return `
      <div class="chart-container">
        ${metadata?.title ? `<div class="chart-title">${metadata.title}</div>` : ''}
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={${JSON.stringify(data)}} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            ${metadata?.xAxisLabel ? `<XAxis dataKey="name" stroke="#888" fontSize={12} />` : ''}
            ${metadata?.yAxisLabel ? `<YAxis stroke="#888" fontSize={12} />` : ''}
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    `;
  }

  private static renderPieChart(data: { name: string; value: number }[], colors: string[]): string {
    return `
      <div class="chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={${JSON.stringify(data)}}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              ${data.map((_, i) => `<Cell key={${i}} fill={${JSON.stringify(colors[i % colors.length])}} />`).join('')}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div class="pie-legend">
          ${data.map((item, i) => `
            <div class="legend-item">
              <span class="legend-color" style="background: ${colors[i % colors.length]}"></span>
              <span class="legend-label">${item.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  static renderReact(container: HTMLElement, data: unknown, metadata?: ChartMetadata): void {
    const chartData = data as ChartData;
    let processedData = chartData.data || [];

    if (!processedData.length && chartData.labels && chartData.values) {
      processedData = chartData.labels.map((label, i) => ({
        name: label,
        value: chartData.values?.[i] || 0,
      }));
    }

    const colors = chartData.colors || COLORS;
    const chartType = chartData.type || 'bar';

    const chartContainer = document.createElement('div');
    chartContainer.style.width = '100%';
    chartContainer.style.height = '250px';

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-card-wrapper';
    wrapper.style.padding = '1rem';

    if (chartType === 'line') {
      wrapper.innerHTML = `
        ${metadata?.title ? `<div style="font-weight: 600; margin-bottom: 0.5rem;">${metadata.title}</div>` : ''}
      `;
    } else if (chartType === 'pie') {
      wrapper.innerHTML = `
        ${metadata?.title ? `<div style="font-weight: 600; margin-bottom: 0.5rem;">${metadata.title}</div>` : ''}
      `;
    } else {
      wrapper.innerHTML = `
        ${metadata?.title ? `<div style="font-weight: 600; margin-bottom: 0.5rem;">${metadata.title}</div>` : ''}
      `;
    }

    container.appendChild(wrapper);
  }

  static update(container: HTMLElement, data: unknown): void {
    this.render(container, data);
  }

  static destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export default ChartCard;