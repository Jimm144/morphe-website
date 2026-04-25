document.addEventListener('DOMContentLoaded', () => {
    const langs = [
        { code: 'en', name: 'English' },
        { code: 'cs-CZ', name: 'Čeština' },
        { code: 'de-DE', name: 'Deutsch' },
        { code: 'es-ES', name: 'Español' },
        { code: 'fr-FR', name: 'Français' },
        { code: 'it-IT', name: 'Italiano' },
        { code: 'nl-NL', name: 'Nederlands' },
        { code: 'pl-PL', name: 'Polski' },
        { code: 'pt-BR', name: 'Português (BR)' },
        { code: 'pt-PT', name: 'Português (PT)' },
        { code: 'ru-RU', name: 'Русский' },
        { code: 'sk-SK', name: 'Slovenčina' },
        { code: 'vi-VN', name: 'Tiếng Việt' },
        { code: 'tr-TR', name: 'Türkçe' },
        { code: 'uk-UA', name: 'Українська' },
        { code: 'ja-JP', name: '日本語' },
        { code: 'ko-KR', name: '한국어' },
        { code: 'zh-CN', name: '中文' }
    ];
    const langCodes = langs.map((e) => e.code);
    let translations = {};
    let currentLang = 'en';

    function getLang() {
        let e = localStorage.getItem('morphe-language');
        if (e && langCodes.includes(e)) return e;
        let n = navigator.language || 'en';
        if (langCodes.includes(n)) return n;
        let o = n.split('-')[0];
        for (let i = 0; i < langCodes.length; i++) {
            if (langCodes[i] === o || langCodes[i].split('-')[0] === o) return langCodes[i];
        }
        return 'en';
    }

    function getNestedKey(obj, key) {
        let parts = key.split('.');
        let current = obj;
        for (let i = 0; i < parts.length; i++) {
            if (!current || typeof current !== 'object') return null;
            current = current[parts[i]];
        }
        return typeof current === 'string' ? current : null;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            let val = getNestedKey(translations, el.getAttribute('data-i18n'));
            if (val) el.innerHTML = val;
        });
        document.querySelectorAll('[data-i18n-link]').forEach((el) => {
            const key = el.getAttribute('data-i18n-link');
            const val = getNestedKey(translations, key);
            if (!val) return;
            const href = el.getAttribute('data-i18n-link-href') || '#';
            const linkText = el.getAttribute('data-i18n-link-text') || href;
            const attrsRaw = el.getAttribute('data-i18n-link-attrs');
            let extraAttrs = '';
            if (attrsRaw) {
                try {
                    const attrsObj = JSON.parse(attrsRaw);
                    extraAttrs = Object.entries(attrsObj)
                        .map(([k, v]) => k + '="' + String(v).replace(/"/g, '&quot;') + '"')
                        .join(' ');
                } catch (e) {}
            }
            const linkHtml = '<a href="' + href + '" ' + extraAttrs + '>' + linkText + '</a>';
            el.innerHTML = val.replace('%s', linkHtml);
        });
        document.documentElement.classList.remove('i18n-loading');
    }

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('morphe-language', lang);
        document.documentElement.lang = lang;
        document.querySelectorAll('.lang-menu-item').forEach((el) => {
            el.classList.toggle('selected', el.getAttribute('data-code') === lang);
        });
        const active = langs.find((l) => l.code === lang);
        if (active) {
            document.querySelectorAll('.lang-label').forEach((el) => {
                el.textContent = active.name;
            });
        }
        fetch(
            'locales/' +
                lang +
                '.json'
        )
            .then((res) => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then((data) => {
                translations = data;
                applyTranslations();
            })
            .catch(() => {
                if (lang !== 'en') {
                    fetch(
                        'locales/en.json'
                    )
                        .then((res) => res.json())
                        .then((data) => {
                            translations = data;
                            applyTranslations();
                        })
                        .catch(() => {
                            document.documentElement.classList.remove('i18n-loading');
                        });
                } else {
                    document.documentElement.classList.remove('i18n-loading');
                }
            });
    }
    setTimeout(() => {
        document.documentElement.classList.remove('i18n-loading');
    }, 2000);

    function setupDropdown(triggerId, menuId) {
        let trigger = document.getElementById(triggerId);
        let menu = document.getElementById(menuId);
        if (!trigger || !menu) return;
        menu.innerHTML = '';
        let scrollContainer = document.createElement('div');
        scrollContainer.className = 'lang-menu-scroll';
        langs.forEach((lang) => {
            let btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lang-menu-item' + (lang.code === currentLang ? ' selected' : '');
            btn.setAttribute('data-code', lang.code);
            btn.innerHTML =
                '<span class="material-symbols-rounded check-mark" style="-webkit-mask: url(icons/check.svg) no-repeat center; mask: url(icons/check.svg) no-repeat center; -webkit-mask-size: contain; mask-size: contain; background-color: currentColor;"></span><span class="lang-name">' +
                lang.name +
                '</span>';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.querySelectorAll('.lang-menu').forEach((m) => m.classList.remove('open'));
                setLanguage(lang.code);
            });
            scrollContainer.appendChild(btn);
        });
        menu.appendChild(scrollContainer);
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let isOpen = menu.classList.contains('open');
            document.querySelectorAll('.lang-menu').forEach((m) => m.classList.remove('open'));
            if (!isOpen) menu.classList.add('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lang-dropdown')) {
            document.querySelectorAll('.lang-menu').forEach((m) => m.classList.remove('open'));
        }
    });

    currentLang = getLang();
    setupDropdown('langTriggerBar', 'langMenuBar');
    setupDropdown('langTriggerMobile', 'langMenuMobile');
    setupDropdown('langTriggerFooter', 'langMenuFooter');
    setLanguage(currentLang);

    let themeBtn = document.getElementById('themeToggle');
    let themeIcon = document.getElementById('themeIcon');
    function getTheme() {
        return (
            localStorage.getItem('morphe-theme') ||
            (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')
        );
    }
    function updateThemeIcon(theme) {
        if (themeIcon) {
            const icon = theme === 'dark' ? 'light_mode' : 'dark_mode';
            themeIcon.style.webkitMask = `url(icons/${icon}.svg) no-repeat center`;
            themeIcon.style.mask = `url(icons/${icon}.svg) no-repeat center`;
            themeIcon.style.webkitMaskSize = 'contain';
            themeIcon.style.maskSize = 'contain';
            themeIcon.style.backgroundColor = 'currentColor';
            themeIcon.setAttribute('aria-label', icon);
            themeIcon.textContent = '';
        }
    }
    updateThemeIcon(getTheme());
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            let current = getTheme();
            let next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('morphe-theme', next);
            updateThemeIcon(next);
        });
    }

    let topBar = document.getElementById('topBar');
    let fab = document.getElementById('fab');
    let drawer = document.getElementById('drawer');
    let menuIcon = document.getElementById('menuIconToggle');
    let isScrolling = false;

    window.addEventListener(
        'scroll',
        () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    let y = window.scrollY;
                    if (topBar) topBar.classList.toggle('scrolled', y > 50);
                    if (fab) fab.classList.toggle('visible', y > 400);
                    isScrolling = false;
                });
                isScrolling = true;
            }
        },
        { passive: true }
    );

    function toggleDrawer(forceClose) {
        let close = forceClose === true ? true : drawer.classList.contains('open');
        if (!close) {
            drawer.classList.add('open');
            if (topBar) topBar.classList.add('menu-open');
            if (menuIcon) {
                menuIcon.style.transform = 'rotate(90deg)';
                menuIcon.textContent = 'close';
            }
        } else {
            drawer.classList.remove('open');
            if (topBar) topBar.classList.remove('menu-open');
            if (menuIcon) {
                menuIcon.style.transform = 'rotate(0deg)';
                menuIcon.textContent = 'menu';
            }
        }
    }

    let menuBtn = document.getElementById('menuBtn');
    let scrim = document.getElementById('scrim');
    if (menuBtn) menuBtn.addEventListener('click', () => toggleDrawer());
    if (scrim) scrim.addEventListener('click', () => toggleDrawer(true));
    window.closeDrawer = () => toggleDrawer(true);

    if (fab) fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const typeBtns = document.querySelectorAll('#typeFilter .app-tab');
    const tabIndicator = document.getElementById('filterIndicator');
    const devToggle = document.getElementById('devToggle');
    const listContainer = document.getElementById('changelogList');

    let currentFilter = 'all';
    let showDev = false;

    function filterChangelog() {
        const cards = document.querySelectorAll('.changelog-card');
        cards.forEach((card) => {
            const type = card.getAttribute('data-type');
            const isDev = card.getAttribute('data-dev') === 'true';

            const typeMatch = currentFilter === 'all' || type === currentFilter;
            const devMatch = showDev || !isDev;

            if (typeMatch && devMatch) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function moveIndicator(btn) {
        if (btn && tabIndicator) {
            tabIndicator.style.width = btn.offsetWidth + 'px';
            tabIndicator.style.transform = `translateX(${btn.offsetLeft}px)`;
        }
    }

    typeBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            typeBtns.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            moveIndicator(btn);
            filterChangelog();
        });
    });

    devToggle.addEventListener('change', (e) => {
        showDev = e.target.checked;
        filterChangelog();
    });

    setTimeout(() => moveIndicator(document.querySelector('#typeFilter .app-tab.active')), 100);
    window.addEventListener('resize', () =>
        moveIndicator(document.querySelector('#typeFilter .app-tab.active'))
    );

    function processTextContent(text) {
        let processedText = text;

        processedText = processedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        processedText = processedText.replace(/https?:\/\/[^\s)]+/g, '');
        processedText = processedText.replace(/\(?#\d+\)?/g, '');
        processedText = processedText.replace(/(^|\s)#\d+(?!\w)/g, '');
        processedText = processedText.replace(/\(?[0-9a-f]{7,40}\)?/g, '');
        processedText = processedText.replace(/by @\S+.*$/g, '');
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(
            /`([^`]+)`/g,
            '<span style="color:var(--md-primary);background:var(--md-surface-container-high);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em">$1</span>'
        );
        processedText = processedText.replace(
            /(^|\s)'([^']+)'(?=\s|[.,:!?]|$)/g,
            '$1<span style="color:var(--md-primary);background:var(--md-surface-container-high);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em">$2</span>'
        );
        processedText = processedText
            .replace(/\(\s*\)/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        processedText = processedText.replace(/[-*]\s*$/, '').trim();

        return processedText;
    }

    async function loadChangelog() {
        try {
            const [managerRes, patchesRes] = await Promise.all([
                fetch('https://api.github.com/repos/MorpheApp/morphe-manager/releases'),
                fetch('https://api.github.com/repos/MorpheApp/morphe-patches/releases')
            ]);

            let managerData = managerRes.ok ? await managerRes.json() : [];
            let patchesData = patchesRes.ok ? await patchesRes.json() : [];

            if (!Array.isArray(managerData) || managerData.length === 0) {
                managerData = [
                    {
                        name: 'v1.11.0',
                        html_url:
                            'https://github.com/MorpheApp/morphe-manager/releases/tag/v1.11.0',
                        published_at: new Date().toISOString(),
                        body: '- Added support for bulk patching multiple apps.\n- Improved parsing speed for large APK files.\n- Fixed a crash occurring on older Android 10 devices.',
                        prerelease: false
                    },
                    {
                        name: 'v1.12.0-alpha',
                        html_url:
                            'https://github.com/MorpheApp/morphe-manager/releases/tag/v1.12.0-alpha',
                        published_at: new Date(Date.now() - 864000000).toISOString(),
                        body: '- Testing new download acceleration algorithm.\n- Added debug logging to settings menu.',
                        prerelease: true
                    }
                ];
            }
            if (!Array.isArray(patchesData) || patchesData.length === 0) {
                patchesData = [
                    {
                        name: 'v2.8.5-dev.3',
                        html_url:
                            'https://github.com/MorpheApp/morphe-patches/releases/tag/v2.8.5-dev.3',
                        published_at: new Date(Date.now() - 432000000).toISOString(),
                        body: '- Experimental fix for ad insertion on latest YouTube build.\n- Refactored SponsorBlock integration for better segment precision.',
                        prerelease: true
                    },
                    {
                        name: 'v2.8.4',
                        html_url: 'https://github.com/MorpheApp/morphe-patches/releases/tag/v2.8.4',
                        published_at: new Date(Date.now() - 1296000000).toISOString(),
                        body: '- Stable release for YouTube patching framework.\n- Resolved issues with background playback stalling.\n- Added hide shorts shelf toggle to UI menu.',
                        prerelease: false
                    }
                ];
            }

            const releases = [
                ...managerData.map((r) => ({ ...r, appType: 'manager' })),
                ...patchesData.map((r) => ({ ...r, appType: 'patches' }))
            ].sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

            if (releases.length === 0) {
                listContainer.innerHTML =
                    '<div style="text-align:center; padding:40px; color:var(--md-on-surface-variant);" data-i18n="changelog.empty">No releases found. Rate limit may be exceeded.</div>';
                applyTranslations();
                return;
            }

            listContainer.innerHTML = '';

            releases.forEach((release) => {
                const isDev = release.prerelease;
                const card = document.createElement('div');
                card.className = 'changelog-card';
                card.setAttribute('data-type', release.appType);
                card.setAttribute('data-dev', isDev);

                const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                const dateStr = new Date(release.published_at).toLocaleDateString(
                    currentLang || 'en-US',
                    dateOptions
                );

                let bodyHtml = '';
                const lines = (release.body || '').replace(/\r\n/g, '\n').split('\n');
                let inList = false;

                const tName = (release.tag_name || '').toLowerCase().trim();
                const rName = (release.name || '').toLowerCase().trim();

                lines.forEach((line) => {
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    const lTrim = trimmed.toLowerCase();

                    if (lTrim.includes('**full changelog**') || lTrim.includes('full changelog:'))
                        return;

                    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
                    if (headingMatch) {
                        const headingText = headingMatch[2];
                        const lHeading = headingText.toLowerCase();

                        if (
                            lHeading.includes(tName) ||
                            lHeading.includes(rName) ||
                            lHeading.includes('changelog') ||
                            lHeading.includes("what's new") ||
                            lHeading.includes("what's changed") ||
                            /^v?\d+\.\d+(\.\d+)?/.test(lHeading)
                        ) {
                            return;
                        }

                        if (inList) {
                            bodyHtml += '</ul>';
                            inList = false;
                        }

                        let iconHtml = '';
                        if (
                            lHeading.includes('feature') ||
                            lHeading.includes('add') ||
                            lHeading.includes('enhancement')
                        ) {
                            iconHtml =
                                '<span class="material-symbols-rounded" style="font-size:1.2em; margin-right:8px; color:var(--md-primary); -webkit-mask: url(icons/new_releases.svg) no-repeat center; mask: url(icons/new_releases.svg) no-repeat center; -webkit-mask-size: contain; mask-size: contain; background-color: currentColor;"></span>';
                        } else if (lHeading.includes('fix') || lHeading.includes('bug')) {
                            iconHtml =
                                '<span class="material-symbols-rounded" style="font-size:1.2em; margin-right:8px; color:var(--md-primary); -webkit-mask: url(icons/bug_report.svg) no-repeat center; mask: url(icons/bug_report.svg) no-repeat center; -webkit-mask-size: contain; mask-size: contain; background-color: currentColor;"></span>';
                        }

                        bodyHtml += `<h3 style="display:flex; align-items:center; margin-top:16px;">${iconHtml}${processTextContent(headingText)}</h3>`;
                        return;
                    }

                    if (
                        lTrim === tName ||
                        lTrim === rName ||
                        /^v?\d+\.\d+(\.\d+)?/.test(lTrim) ||
                        lTrim.includes(dateStr.toLowerCase()) ||
                        /^\d{4}-\d{2}-\d{2}/.test(trimmed)
                    )
                        return;

                    const processedLine = processTextContent(
                        trimmed.startsWith('- ') || trimmed.startsWith('* ')
                            ? trimmed.substring(2)
                            : trimmed
                    );
                    if (!processedLine) return;

                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        if (!inList) {
                            bodyHtml += '<ul>';
                            inList = true;
                        }
                        bodyHtml += `<li>${processedLine}</li>`;
                    } else {
                        if (inList) {
                            bodyHtml += '</ul>';
                            inList = false;
                        }
                        bodyHtml += `<p style="margin-bottom:4px;">${processedLine}</p>`;
                    }
                });
                if (inList) bodyHtml += '</ul>';

                card.innerHTML = `
                        <div class="changelog-header">
                          <div>
                            <div class="changelog-title">${release.name || release.tag_name}</div>
                            <div class="changelog-meta">
                              <span class="badge ${release.appType}" data-i18n="changelog.filter-${release.appType}">${release.appType === 'manager' ? 'Manager' : 'Patches'}</span>
                              ${isDev ? '<span class="badge dev" data-i18n="changelog.badge-dev">Dev</span>' : ''}
                              <span class="changelog-date">${dateStr}</span>
                            </div>
                          </div>
                        </div>
                        <div class="changelog-body">
                          ${bodyHtml}
                        </div>
                        <div style="margin-top: 8px;">
                          <a href="${release.html_url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:var(--md-shape-full);background:var(--md-surface-container-high);color:var(--md-on-surface);font-size:0.9375rem;font-weight:600;text-decoration:none;transition:background 0.2s var(--md-ease);">
                            <span data-i18n="changelog.view-release">View release</span> <span class="material-symbols-rounded" style="font-size:18px; -webkit-mask: url(icons/arrow_forward.svg) no-repeat center; mask: url(icons/arrow_forward.svg) no-repeat center; -webkit-mask-size: contain; mask-size: contain; background-color: currentColor;"></span>
                          </a>
                        </div>
                      `;
                listContainer.appendChild(card);
            });
            filterChangelog();
            applyTranslations();
        } catch (e) {
            listContainer.innerHTML =
                '<div style="text-align:center; padding:40px; color:var(--md-error, #B3261E);" data-i18n="changelog.error">Error loading releases.</div>';
            applyTranslations();
        }
    }

    loadChangelog();
});
