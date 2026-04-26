!(function () {
    'use strict';
    try {
        const e = localStorage.getItem('morphe-theme') || 'auto',
            t = window.matchMedia('(prefers-color-scheme: dark)').matches,
            o = 'auto' === e ? (t ? 'dark' : 'light') : e;
        document.documentElement.setAttribute('data-theme', o);
    } catch (e) {
        console.error('Theme preload failed:', e);
    }
})();

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
        { code: 'zh-CN', name: '中文 (简体)' },
        { code: 'zh-TW', name: '中文 (繁體)' }
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
            // The hero-morph cycle script manages this element's text;
            // letting applyTranslations overwrite it would flash the base
            // 'Android Experience' label on every locale change.
            if (el.classList.contains('hero-morph-target')) return;
            let val = getNestedKey(translations, el.getAttribute('data-i18n'));
            if (val) {
                let key = el.getAttribute('data-i18n');
                if (key === 'faq.a8') {
                    el.innerHTML = val
                        .replace(
                            '%1',
                            '<a href="https://github.com/MorpheApp/" target="_blank" rel="noopener noreferrer">GitHub repos</a>'
                        )
                        .replace('%2', '<a href="https://morphe.software/donate">donations</a>');
                } else {
                    el.textContent = val;
                }
            }
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
        populateTestimonials();
        document.documentElement.classList.remove('i18n-loading');
        document.dispatchEvent(new CustomEvent('morphe:translations-applied'));
    }

    function populateTestimonials() {
        const section = translations && translations.testimonials;
        if (!section) return;
        const cards = document.querySelectorAll('#testiTrack .testi-card');
        if (!cards.length) return;
        cards.forEach((card, i) => {
            const q = section['quote_' + (i + 1)];
            if (!q || typeof q !== 'object') return;
            const quote = card.querySelector('.testi-quote');
            const name = card.querySelector('.testi-name');
            const role = card.querySelector('.testi-role');
            const avatar = card.querySelector('.testi-avatar');
            if (quote && q.text) quote.textContent = q.text;
            if (name && q.author) name.textContent = q.author;
            if (role && q.role) role.textContent = q.role;
            if (avatar && q.author) avatar.textContent = q.author.charAt(0).toUpperCase();
        });
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
    // Hard cap: never keep the page hidden for more than 8 seconds even if
    // the locale fetch is unusually slow or fails silently. Set high enough
    // that translations almost always apply first, preventing English flash.
    setTimeout(() => {
        document.documentElement.classList.remove('i18n-loading');
    }, 8000);

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
            let iconName = 'check';
            btn.innerHTML =
                '<span class="material-symbols-rounded check-mark" style="-webkit-mask: url(icons/' +
                iconName +
                '.svg) no-repeat center; mask: url(icons/' +
                iconName +
                '.svg) no-repeat center; -webkit-mask-size: contain; mask-size: contain; background-color: currentColor;"></span><span class="lang-name">' +
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

    (function () {
        const el = document.querySelector('.hero-morph-target');
        if (!el) return;

        const APP_LABELS = ['YouTube', 'YT Music', 'Reddit'];
        const HOLD_MS = 3400;
        const OUT_MS = 820;
        const PAUSE_BEFORE_FIRST = 2000;

        const originalText = el.textContent;
        let baseLabel = originalText;
        let timer = null;
        let swapTimer = null;
        let idx = 0;
        let cycling = false;

        function getDefaultLabel() {
            return getNestedKey(translations, 'hero.title-highlight') || originalText;
        }

        function buildSteps() {
            return APP_LABELS.concat([baseLabel]);
        }

        function swapTo(text) {
            clearTimeout(swapTimer);
            el.classList.add('is-out');
            swapTimer = setTimeout(() => {
                el.textContent = text;
                // Double rAF so the class removal reliably triggers the transition
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        el.classList.remove('is-out');
                    });
                });
            }, OUT_MS);
        }

        function start() {
            stop();
            idx = 1;
            cycling = true;
            // Show the first app label immediately so the base "Android
            // Experience" label never appears at the start of the cycle.
            el.classList.remove('is-out');
            el.textContent = APP_LABELS[0];
            const tick = () => {
                // Recompute steps every tick so the final translated
                // baseLabel (set on i18nReady) is the value used, not the
                // original HTML fallback captured before the locale loaded.
                const steps = buildSteps();
                if (idx >= steps.length) {
                    cycling = false;
                    return;
                }
                swapTo(steps[idx]);
                idx++;
                timer = setTimeout(tick, HOLD_MS);
            };
            timer = setTimeout(tick, PAUSE_BEFORE_FIRST);
        }

        function stop() {
            clearTimeout(timer);
            clearTimeout(swapTimer);
            timer = null;
            swapTimer = null;
            cycling = false;
        }

        function reset() {
            stop();
            el.classList.remove('is-out');
            el.textContent = APP_LABELS[0];
        }

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (!reduced.matches) start();

        document.addEventListener('morphe:translations-applied', () => {
            const newLabel = getDefaultLabel();
            baseLabel = newLabel;
            // When the cycle isn't actively swapping, sync the visible text
            // so language changes take effect immediately (both before the
            // cycle has begun and after it has finished on the base label).
            if (!cycling) {
                el.classList.remove('is-out');
                el.textContent = newLabel;
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stop();
            } else if (!reduced.matches) {
                reset();
                start();
            }
        });

        window.addEventListener('pageshow', (e) => {
            if (e.persisted && !reduced.matches) {
                reset();
                start();
            }
        });
    })();

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
            themeBtn.classList.add('theme-swap');
            setTimeout(() => {
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('morphe-theme', next);
                updateThemeIcon(next);
                themeBtn.classList.remove('theme-swap');
            }, 180);
            themeBtn.blur();
        });
    }

    // Blur any clicked button/link so its hover/focus state doesn't visually
    // persist after tap on touch devices and after click on desktop.
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, a');
        if (target && typeof target.blur === 'function') {
            setTimeout(() => target.blur(), 0);
        }
    });

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

                    let currentSection = '';
                    document.querySelectorAll('section[id]').forEach((sec) => {
                        if (y >= sec.offsetTop - 164) currentSection = sec.id;
                    });
                    document.querySelectorAll('.nav-link, .drawer-link').forEach((link) => {
                        let href = link.getAttribute('href');
                        if (href && href.startsWith('#')) {
                            link.classList.toggle('active', href === '#' + currentSection);
                        }
                    });
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
                menuIcon.style.webkitMask = 'url(icons/close.svg) no-repeat center';
                menuIcon.style.mask = 'url(icons/close.svg) no-repeat center';
            }
        } else {
            drawer.classList.remove('open');
            if (topBar) topBar.classList.remove('menu-open');
            if (menuIcon) {
                menuIcon.style.transform = 'rotate(0deg)';
                menuIcon.style.webkitMask = 'url(icons/menu.svg) no-repeat center';
                menuIcon.style.mask = 'url(icons/menu.svg) no-repeat center';
            }
        }
    }

    let menuBtn = document.getElementById('menuBtn');
    let scrim = document.getElementById('scrim');
    if (menuBtn) menuBtn.addEventListener('click', () => toggleDrawer());
    if (scrim) scrim.addEventListener('click', () => toggleDrawer(true));
    window.closeDrawer = () => toggleDrawer(true);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (e) => {
            let target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - 64, behavior: 'smooth' });
            }
        });
    });

    if (fab) fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.querySelectorAll('.faq-q').forEach((btn) => {
        btn.addEventListener('click', () => {
            let item = btn.closest('.faq-item');
            let isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    let appTabsContainer = document.getElementById('appTabs');
    let tabBtns = document.querySelectorAll('.app-tab');
    let featPanel = document.getElementById('featPanel');
    let activeIndex = 0;

    let tabInd = document.createElement('div');
    tabInd.className = 'tab-indicator';
    if (appTabsContainer) appTabsContainer.insertBefore(tabInd, appTabsContainer.firstChild);

    function switchTab(index) {
        activeIndex = index;
        tabBtns.forEach((btn, i) => btn.classList.toggle('active', i === index));
        if (featPanel) {
            featPanel.style.transform =
                'translateX(calc(-' + 100 * index + '% - ' + 16 * index + 'px))';
            const pages = featPanel.querySelectorAll('.features-page');
            pages.forEach((page, i) => {
                if (i === index) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
        }
        if (tabBtns[index] && tabInd) {
            tabInd.style.width = tabBtns[index].offsetWidth + 'px';
            tabInd.style.transform = `translateX(${tabBtns[index].offsetLeft - 4}px)`;
        }
    }

    tabBtns.forEach((btn, index) => btn.addEventListener('click', () => switchTab(index)));
    setTimeout(() => switchTab(0), 100);
    window.addEventListener('resize', () => switchTab(activeIndex));

    let touchStartX = 0;
    let featWrap = document.querySelector('.features-panel-wrap');
    if (featWrap) {
        featWrap.addEventListener(
            'touchstart',
            (e) => {
                touchStartX = e.touches[0].clientX;
            },
            { passive: true }
        );
        featWrap.addEventListener('touchend', (e) => {
            let diffX = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diffX) > 50) {
                if (diffX > 0 && activeIndex < tabBtns.length - 1) switchTab(activeIndex + 1);
                else if (diffX < 0 && activeIndex > 0) switchTab(activeIndex - 1);
            }
        });
    }

    let isAnimating = false;
    let tTrack = document.getElementById('testiTrack');
    function nextTestimonial() {
        if (isAnimating || !tTrack || tTrack.children.length === 0) return;
        isAnimating = true;
        let first = tTrack.firstElementChild;
        let moveX = first.offsetWidth + 16;
        tTrack.style.transition = 'transform 0.5s cubic-bezier(0.05, 0.7, 0.1, 1)';
        tTrack.style.transform = `translateX(-${moveX}px)`;
        setTimeout(() => {
            tTrack.style.transition = 'none';
            tTrack.appendChild(first);
            tTrack.style.transform = 'translateX(0)';
            isAnimating = false;
        }, 520);
    }
    function prevTestimonial() {
        if (isAnimating || !tTrack || tTrack.children.length === 0) return;
        isAnimating = true;
        let last = tTrack.lastElementChild;
        let moveX = tTrack.firstElementChild.offsetWidth + 16;
        tTrack.style.transition = 'none';
        tTrack.insertBefore(last, tTrack.firstElementChild);
        tTrack.style.transform = `translateX(-${moveX}px)`;
        tTrack.offsetHeight;
        tTrack.style.transition = 'transform 0.5s cubic-bezier(0.05, 0.7, 0.1, 1)';
        tTrack.style.transform = 'translateX(0)';
        setTimeout(() => {
            isAnimating = false;
        }, 520);
    }

    let cNext = document.getElementById('cNext');
    let cPrev = document.getElementById('cPrev');
    if (cNext) cNext.addEventListener('click', nextTestimonial);
    if (cPrev) cPrev.addEventListener('click', prevTestimonial);

    let tTouchX = 0;
    if (tTrack) {
        tTrack.addEventListener(
            'touchstart',
            (e) => {
                tTouchX = e.touches[0].clientX;
            },
            { passive: true }
        );
        tTrack.addEventListener('touchend', (e) => {
            let diffX = tTouchX - e.changedTouches[0].clientX;
            if (Math.abs(diffX) > 50) diffX > 0 ? nextTestimonial() : prevTestimonial();
        });
    }

    let observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.anim').forEach((el) => observer.observe(el));

    let dmca = document.querySelectorAll('a.dmca-badge');
    if (dmca[0] && dmca[0].getAttribute('href').indexOf('refurl') < 0) {
        for (let i = 0; i < dmca.length; i++) {
            let n = dmca[i];
            n.href =
                n.href + (n.href.indexOf('?') === -1 ? '?' : '&') + 'refurl=' + document.location;
        }
    }

    async function fetchLatestAPK() {
        try {
            let res = await fetch(
                'https://api.github.com/repos/MorpheApp/morphe-manager/releases/latest'
            );
            let data = await res.json();
            let apkAsset = data.assets.find((a) => a.name.endsWith('.apk'));
            if (apkAsset) {
                document.querySelectorAll('a.btn-filled').forEach((btn) => {
                    if (btn.href.indexOf('github.com/MorpheApp') !== -1) {
                        btn.href = apkAsset.browser_download_url;
                    }
                });
            }
        } catch (e) {}
    }
    fetchLatestAPK();
});
