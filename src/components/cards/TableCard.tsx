interface TableData {
  headers: string[];
  rows: (string | number | boolean)[][];
  caption?: string;
}

interface TableMetadata {
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

export class TableCard {
  static render(container: HTMLElement, data: unknown, metadata?: TableMetadata): void {
    container.innerHTML = '';

    const tableData = data as TableData;
    const { headers, rows, caption } = tableData;
    const options = metadata || {};

    const table = document.createElement('table');
    table.className = 'table';
    if (options.striped) table.classList.add('table-zebra');
    if (options.hoverable) table.classList.add('table-hover');
    if (options.compact) table.classList.add('table-sm');

    let html = '';

    if (caption) {
      html += `<caption>${caption}</caption>`;
    }

    html += '<thead><tr>';
    headers.forEach((header) => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead>';

    html += '<tbody>';
    rows.forEach((row) => {
      html += '<tr>';
      row.forEach((cell) => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';

    table.innerHTML = html;
    container.appendChild(table);
  }

  static update(container: HTMLElement, data: unknown): void {
    this.render(container, data);
  }

  static destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export default TableCard;