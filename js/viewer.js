/* Picture viewer (16 Oct 2026): shows one image (a class poster, the monthly timetable) over the page, with its
   title, a few lines and links beside it on laptops and beneath it on phones. Pinch or double-tap to zoom on
   phones; Esc, the close button or the backdrop closes it. Styles: css/viewer.css.
   Built on GLightbox, which the homepage already loads for videos; other pages fetch it from jsDelivr the first
   time a picture is opened. If it cannot load, the image opens on its own instead.
   Use: window.GMTViewer.open({ src, alt, kind, title, lines: [], actions: [{ label, href, primary, download, newTab }] }) */
(() => {
    'use strict';

    const GLIGHTBOX = 'https://cdn.jsdelivr.net/npm/glightbox@3.3.1/dist';
    let loading = null;

    function load() {
        if (typeof window.GLightbox === 'function') return Promise.resolve();
        if (!loading) {
            loading = new Promise((resolve, reject) => {
                if (!document.querySelector('link[href*="glightbox"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = `${GLIGHTBOX}/css/glightbox.min.css`;
                    document.head.appendChild(link);
                }
                const script = document.createElement('script');
                script.src = `${GLIGHTBOX}/js/glightbox.min.js`;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        return loading;
    }

    const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

    function details({ lines = [], actions = [] }) {
        const text = lines.filter(Boolean).map(line => `<span class="gv-line">${escape(line)}</span>`).join('');
        const links = actions.map(action => `<a class="btn ${action.primary ? 'btn-primary' : 'btn-outline'}" href="${escape(action.href)}"`
            + `${action.download ? ' download' : ''}${action.newTab ? ' target="_blank" rel="noopener"' : ''}>${escape(action.label)}</a>`).join('');
        return text + (links ? `<span class="gv-actions">${links}</span>` : '');
    }

    function open(picture) {
        return load().then(() => {
            const box = window.GLightbox({
                elements: [{
                    href: picture.src,
                    type: 'image',
                    alt: picture.alt || '',
                    title: `${picture.kind ? `<span class="gv-kind">${escape(picture.kind)}</span>` : ''}${escape(picture.title || '')}`,
                    description: details(picture),
                    descPosition: 'right',
                }],
                moreLength: 0,
                zoomable: true,
                draggable: false,
                touchNavigation: true,
            });
            box.on('open', () => (box.modal || document.getElementById('glightbox-body'))?.classList.add('gmt-viewer'));
            box.on('close', () => window.setTimeout(() => box.destroy(), 500));
            box.open();
        }).catch(() => {
            window.location.href = picture.src;
        });
    }

    window.GMTViewer = { open };
})();
