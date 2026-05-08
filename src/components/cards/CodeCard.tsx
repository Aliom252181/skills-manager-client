interface CodeData {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export class CodeCard {
  static render(container: HTMLElement, data: unknown): void {
    container.innerHTML = '';

    const codeData = data as CodeData;
    const { code, language, filename, showLineNumbers } = codeData;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-card';
    wrapper.style.background = 'var(--base-300, #27272a)';
    wrapper.style.borderRadius = '0.75rem';
    wrapper.style.overflow = 'hidden';

    if (filename) {
      const header = document.createElement('div');
      header.className = 'code-header';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.padding = '0.5rem 1rem';
      header.style.background = 'var(--base-200, #3f3f46)';
      header.style.borderBottom = '1px solid var(--base-300, #27272a)';

      const filenameEl = document.createElement('span');
      filenameEl.textContent = filename;
      filenameEl.style.fontSize = '0.75rem';
      filenameEl.style.fontFamily = 'monospace';
      filenameEl.style.color = 'var(--base-content, #a1a1aa)';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.style.background = 'transparent';
      copyBtn.style.border = 'none';
      copyBtn.style.cursor = 'pointer';
      copyBtn.style.padding = '0.25rem';
      copyBtn.style.display = 'flex';
      copyBtn.style.alignItems = 'center';
      copyBtn.style.color = 'var(--base-content, #a1a1aa)';
      copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(code);
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => {
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        }, 2000);
      };

      header.appendChild(filenameEl);
      header.appendChild(copyBtn);
      wrapper.appendChild(header);
    }

    const pre = document.createElement('pre');
    pre.style.margin = '0';
    pre.style.padding = '1rem';
    pre.style.overflow = 'auto';
    pre.style.fontSize = '0.875rem';
    pre.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    pre.style.lineHeight = '1.5';
    pre.style.color = '#e4e4e7';

    const codeEl = document.createElement('code');
    if (language) {
      codeEl.className = `language-${language}`;
    }

    if (showLineNumbers) {
      const lines = code.split('\n');
      const lineNumbers = lines.map((_, i) => String(i + 1).padStart(String(lines.length).length, ' ')).join('\n');
      const lineNumbersSpan = document.createElement('span');
      lineNumbersSpan.style.position = 'absolute';
      lineNumbersSpan.style.left = '0';
      lineNumbersSpan.style.paddingLeft = '1rem';
      lineNumbersSpan.style.color = '#52525b';
      lineNumbersSpan.style.userSelect = 'none';
      lineNumbersSpan.style.borderRight = '1px solid #3f3f46';
      lineNumbersSpan.style.marginRight = '1rem';
      lineNumbersSpan.textContent = lineNumbers;

      pre.style.position = 'relative';
      pre.style.paddingLeft = `${String(lines.length).length * 0.6 + 16}px`;
      pre.appendChild(lineNumbersSpan);
    }

    codeEl.textContent = code;
    pre.appendChild(codeEl);
    wrapper.appendChild(pre);

    container.appendChild(wrapper);
  }

  static update(container: HTMLElement, data: unknown): void {
    this.render(container, data);
  }

  static destroy(container: HTMLElement): void {
    container.innerHTML = '';
  }
}

export default CodeCard;