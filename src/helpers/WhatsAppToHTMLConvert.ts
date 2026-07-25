export function whatsappToHtml(input: string): string {
    function escapeHtml(s: string) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function inlineFormat(s: string): string {
        if (!s) return '';
        // s = escapeHtml(s);
        s = s.replace(/```([^```]+?)```/g, (_, inner) => `<code class="wh-monospaced">${inner}</code>`);
        s = s.replace(/`([^`]+?)`/g, (_, inner) => `<code>${inner}</code>`);
        s = s.replace(/\*([^\*]+?)\*/g, (_, inner) => `<strong>${inner}</strong>`);
        s = s.replace(/_([^_]+?)_/g, (_, inner) => `<em>${inner}</em>`);
        s = s.replace(/~([^~]+?)~/g, (_, inner) => `<del>${inner}</del>`);
        return s;
    }
    const lines = input.split(/\r?\n/);
    const out: string[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // Bulleted list
        if (/^\s*(?:\*|-)\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*(?:\*|-)\s+/.test(lines[i])) {
                const match = lines[i].replace(/^\s*(?:\*|-)\s+/, '');
                items.push(`<li>${inlineFormat(match)}</li>`);
                i++;
            }
            out.push(`<ul>${items.join('')}</ul>`);
            continue;
        }
        // Numbered list
        if (/^\s*\d+\.\s+/.test(line)) {
            const items: string[] = [];
            while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
                const match = lines[i].replace(/^\s*\d+\.\s+/, '');
                items.push(`<li>${inlineFormat(match)}</li>`);
                i++;
            }
            out.push(`<ol>${items.join('')}</ol>`);
            continue;
        }
        // Quote
        if (/^\s*>\s?/.test(line)) {
            const quoteLines: string[] = [];
            while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
                const match = lines[i].replace(/^\s*>\s?/, '');
                quoteLines.push(inlineFormat(match));
                i++;
            }
            out.push(`<blockquote>${quoteLines.join('<br>')}</blockquote>`);
            continue;
        }
        // Empty line
        if (line.trim() === '') {
            out.push('');
            i++;
            continue;
        }
        // Paragraph
        out.push(`<p>${inlineFormat(line)}</p>`);
        i++;
    }
    const resultParts: string[] = [];
    for (let j = 0; j < out.length; j++) {
        const v = out[j];
        if (v === '') {
            resultParts.push('<br>');
        } else {
            resultParts.push(v);
        }
    }
    return resultParts.join('\n');
}