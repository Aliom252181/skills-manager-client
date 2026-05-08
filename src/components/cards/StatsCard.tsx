interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
  color?: string;
}

interface StatsData {
  stats: StatItem[];
}

interface StatsMetadata {
  columns?: number;
  horizontal?: boolean;
}

export class StatsCard {
  static render(container: HTMLElement, data: unknown, metadata?: StatsMetadata): void {
    container.innerHTML = '';

    const statsData = data as StatsData;
    const { stats } = statsData;
    const columns = metadata?.columns || 3;
    const horizontal = metadata?.horizontal || false;

    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    grid.style.display = horizontal ? 'flex' : 'grid';
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    grid.style.gap = '1rem';

    stats.forEach((stat) => {
      const statItem = this.createStatItem(stat);
      grid.appendChild(statItem);
    });

    container.appendChild(grid);
  }

  private static createStatItem(stat: StatItem): HTMLElement {
    const item = document.createElement('div');
    item.className = 'stat-item';
    item.style.padding = '1rem';
    item.style.background = 'var(--base-200, #f4f4f5)';
    item.style.borderRadius = '0.75rem';
    item.style.textAlign = 'center';

    const label = document.createElement('div');
    label.className = 'stat-label';
    label.textContent = stat.label;
    label.style.fontSize = '0.875rem';
    label.style.color = 'var(--base-content, #71717a)';
    label.style.marginBottom = '0.5rem';

    const value = document.createElement('div');
    value.className = 'stat-value';
    value.textContent = String(stat.value);
    value.style.fontSize = '1.5rem';
    value.style.fontWeight = '700';
    value.style.color = stat.color || 'var(--base-content, #09090b)';

    item.appendChild(label);
    item.appendChild(value);

    if (stat.change !== undefined) {
      const change = document.createElement('div');
      change.className = 'stat-change';

      const isPositive = stat.change > 0;
      const isNeutral = stat.change === 0;

      change.innerHTML = `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          background: ${isNeutral ? 'var(--base-300, #e4e4e7)' : isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
          color: ${isNeutral ? 'var(--base-content, #71717a)' : isPositive ? '#10B981' : '#EF4444'};
        ">
          ${isNeutral ? '<span>−</span>' : isPositive ? '<span>↑</span>' : '<span>↓</span>'}
          ${Math.abs(stat.change)}%
        </span>
      `;

      item.appendChild(change);
    }

    return item;
  }

  static update(container: HTMLElement, data: unknown): void {
    this.render(container, data);
  }

  static destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export default StatsCard;