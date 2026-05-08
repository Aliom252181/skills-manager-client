import type { AcpCard, AcpCardAction } from './types';
import { ChartCard } from '../components/cards/ChartCard';
import { TableCard } from '../components/cards/TableCard';
import { StatsCard } from '../components/cards/StatsCard';
import { CodeCard } from '../components/cards/CodeCard';

export type CardType = 'chart' | 'table' | 'stats' | 'code' | 'image' | 'custom';

export interface CardConfig {
  id: string;
  type: CardType;
  title?: string;
}

export class CardSystem {
  private cards: Map<string, HTMLElement> = new Map();
  private cardConfigs: Map<string, CardConfig> = new Map();

  registerCard(config: CardConfig, element: HTMLElement): void {
    this.cardConfigs.set(config.id, config);
    this.cards.set(config.id, element);
  }

  unregisterCard(id: string): void {
    this.cardConfigs.delete(id);
    const card = this.cards.get(id);
    if (card) {
      card.remove();
      this.cards.delete(id);
    }
  }

  getCard(id: string): HTMLElement | undefined {
    return this.cards.get(id);
  }

  getCardConfig(id: string): CardConfig | undefined {
    return this.cardConfigs.get(id);
  }

  getAllCards(): Map<string, HTMLElement> {
    return new Map(this.cards);
  }

  renderCard(card: AcpCard): HTMLElement {
    const container = document.createElement('div');
    container.className = `acp-card acp-card-${card.type}`;
    container.dataset.cardId = card.id;

    const header = document.createElement('div');
    header.className = 'acp-card-header';
    if (card.title) {
      header.textContent = card.title;
    }
    container.appendChild(header);

    const content = document.createElement('div');
    content.className = 'acp-card-content';
    this.renderCardContent(card, content);
    container.appendChild(content);

    if (card.actions?.length) {
      const footer = document.createElement('div');
      footer.className = 'acp-card-footer';
      card.actions.forEach((action) => {
        const btn = this.createActionButton(action);
        footer.appendChild(btn);
      });
      container.appendChild(footer);
    }

    this.cards.set(card.id, container);
    return container;
  }

  private renderCardContent(card: AcpCard, container: HTMLElement): void {
    switch (card.type) {
      case 'chart':
        ChartCard.render(container, card.data, card.metadata);
        break;
      case 'table':
        TableCard.render(container, card.data, card.metadata);
        break;
      case 'stats':
        StatsCard.render(container, card.data, card.metadata);
        break;
      case 'code':
        CodeCard.render(container, card.data);
        break;
      case 'image':
        container.innerHTML = `<img src="${card.data}" alt="${card.title || 'image'}" />`;
        break;
      default:
        container.innerHTML = `<pre>${JSON.stringify(card.data, null, 2)}</pre>`;
    }
  }

  private createActionButton(action: AcpCardAction): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `acp-card-action acp-card-action-${action.type}`;
    btn.textContent = action.label;
    btn.dataset.actionId = action.id;

    if (action.href) {
      btn.onclick = () => window.open(action.href, '_blank');
    } else if (action.onClick) {
      btn.onclick = action.onClick;
    }

    return btn;
  }

  updateCard(id: string, data: unknown): void {
    const config = this.cardConfigs.get(id);
    const element = this.cards.get(id);
    if (!config || !element) return;

    const content = element.querySelector('.acp-card-content') as HTMLElement | null;
    if (content) {
      this.renderCardContent({ ...config, data } as AcpCard, content);
    }
  }

  clearAllCards(): void {
    this.cards.forEach((card) => card.remove());
    this.cards.clear();
    this.cardConfigs.clear();
  }
}

export const cardSystem = new CardSystem();

export function createChartCard(
  id: string,
  title: string,
  data: { labels: string[]; values: number[]; type: 'bar' | 'line' | 'pie' }
): HTMLElement {
  return cardSystem.renderCard({
    id,
    type: 'chart',
    title,
    data,
  });
}

export function createStatsCard(
  id: string,
  title: string,
  data: { stats: { label: string; value: string | number; change?: number }[] }
): HTMLElement {
  return cardSystem.renderCard({
    id,
    type: 'stats',
    title,
    data,
  });
}

export function createTableCard(
  id: string,
  title: string,
  data: { headers: string[]; rows: string[][] }
): HTMLElement {
  return cardSystem.renderCard({
    id,
    type: 'table',
    title,
    data,
  });
}

export function createCodeCard(
  id: string,
  title: string,
  data: { code: string; language: string }
): HTMLElement {
  return cardSystem.renderCard({
    id,
    type: 'code',
    title,
    data,
  });
}