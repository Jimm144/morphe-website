document.addEventListener("DOMContentLoaded", () => {
  const langs = [
    {
      code: "en",
      name: "English",
    },
    {
      code: "cs-CZ",
      name: "Čeština",
    },
    {
      code: "de-DE",
      name: "Deutsch",
    },
    {
      code: "es-ES",
      name: "Español",
    },
    {
      code: "fr-FR",
      name: "Français",
    },
    {
      code: "it-IT",
      name: "Italiano",
    },
    {
      code: "nl-NL",
      name: "Nederlands",
    },
    {
      code: "pl-PL",
      name: "Polski",
    },
    {
      code: "pt-BR",
      name: "Português (BR)",
    },
    {
      code: "pt-PT",
      name: "Português (PT)",
    },
    {
      code: "ru-RU",
      name: "Русский",
    },
    {
      code: "sk-SK",
      name: "Slovenčina",
    },
    {
      code: "vi-VN",
      name: "Tiếng Việt",
    },
    {
      code: "tr-TR",
      name: "Türkçe",
    },
    {
      code: "uk-UA",
      name: "Українська",
    },
    {
      code: "ja-JP",
      name: "日本語",
    },
    {
      code: "ko-KR",
      name: "한국어",
    },
    {
      code: "zh-CN",
      name: "中文",
    },
  ];
  const langCodes = langs.map((e) => e.code);
  let translations = {};
  let currentLang = "en";

  function getLang() {
    let e = localStorage.getItem("morphe-language");
    if (e && langCodes.includes(e)) return e;
    let n = navigator.language || "en";
    if (langCodes.includes(n)) return n;
    let o = n.split("-")[0];
    for (let i = 0; i < langCodes.length; i++) {
      if (langCodes[i] === o || langCodes[i].split("-")[0] === o)
        return langCodes[i];
    }
    return "en";
  }

  function getNestedKey(obj, key) {
    let parts = key.split(".");
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      if (!current || typeof current !== "object") return null;
      current = current[parts[i]];
    }
    return typeof current === "string" ? current : null;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      let val = getNestedKey(translations, el.getAttribute("data-i18n"));
      if (val) el.textContent = val;
    });
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("morphe-language", lang);
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang-menu-item").forEach((el) => {
      el.classList.toggle("selected", el.getAttribute("data-code") === lang);
    });
    fetch(
      "https://raw.githubusercontent.com/MorpheApp/morphe-website/main/public/locales/" +
        lang +
        ".json",
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
        if (lang !== "en") {
          fetch(
            "https://raw.githubusercontent.com/MorpheApp/morphe-website/main/public/locales/en.json",
          )
            .then((res) => res.json())
            .then((data) => {
              translations = data;
              applyTranslations();
            })
            .catch(() => {});
        }
      });
  }

  function setupDropdown(triggerId, menuId) {
    let trigger = document.getElementById(triggerId);
    let menu = document.getElementById(menuId);
    if (!trigger || !menu) return;
    menu.innerHTML = "";
    let scrollContainer = document.createElement("div");
    scrollContainer.className = "lang-menu-scroll";
    langs.forEach((lang) => {
      let btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "lang-menu-item" + (lang.code === currentLang ? " selected" : "");
      btn.setAttribute("data-code", lang.code);
      btn.innerHTML =
        '<span class="material-symbols-rounded check-mark" style="-webkit-mask: url(icons/check.svg) no-repeat center; mask: url(icons/check.svg) no-repeat center; -webkit-mask-size: contain; mask-size: contain; background-color: currentColor;"></span><span class="lang-name">' +
        lang.name +
        "</span>";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document
          .querySelectorAll(".lang-menu")
          .forEach((m) => m.classList.remove("open"));
        setLanguage(lang.code);
      });
      scrollContainer.appendChild(btn);
    });
    menu.appendChild(scrollContainer);
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      let isOpen = menu.classList.contains("open");
      document
        .querySelectorAll(".lang-menu")
        .forEach((m) => m.classList.remove("open"));
      if (!isOpen) menu.classList.add("open");
    });
  }
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".lang-dropdown")) {
      document
        .querySelectorAll(".lang-menu")
        .forEach((m) => m.classList.remove("open"));
    }
  });
  currentLang = getLang();
  setupDropdown("langTriggerBar", "langMenuBar");
  setupDropdown("langTriggerMobile", "langMenuMobile");
  setLanguage(currentLang);
  let themeBtn = document.getElementById("themeToggle");
  let themeIcon = document.getElementById("themeIcon");

  function getTheme() {
    return (
      localStorage.getItem("morphe-theme") ||
      (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light")
    );
  }

  function updateThemeIcon(theme) {
    if (themeIcon) {
      const icon = theme === "dark" ? "light_mode" : "dark_mode";
      themeIcon.style.webkitMask = `url(icons/${icon}.svg) no-repeat center`;
      themeIcon.style.mask = `url(icons/${icon}.svg) no-repeat center`;
      themeIcon.style.webkitMaskSize = "contain";
      themeIcon.style.maskSize = "contain";
      themeIcon.style.backgroundColor = "currentColor";
      themeIcon.setAttribute("aria-label", icon);
      themeIcon.textContent = "";
    }
  }
  updateThemeIcon(getTheme());
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      let current = getTheme();
      let next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("morphe-theme", next);
      updateThemeIcon(next);
    });
  }
  let topBar = document.getElementById("topBar");
  let fab = document.getElementById("fab");
  let drawer = document.getElementById("drawer");
  let menuIcon = document.getElementById("menuIconToggle");
  let isScrolling = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          let y = window.scrollY;
          if (topBar) topBar.classList.toggle("scrolled", y > 50);
          if (fab) fab.classList.toggle("visible", y > 400);
          isScrolling = false;
        });
        isScrolling = true;
      }
    },
    {
      passive: true,
    },
  );

  function toggleDrawer(forceClose) {
    let close = forceClose === true ? true : drawer.classList.contains("open");
    if (!close) {
      drawer.classList.add("open");
      if (topBar) topBar.classList.add("menu-open");
      if (menuIcon) {
        menuIcon.style.transform = "rotate(90deg)";
        menuIcon.style.webkitMask = "url(icons/close.svg) no-repeat center";
        menuIcon.style.mask = "url(icons/close.svg) no-repeat center";
      }
    } else {
      drawer.classList.remove("open");
      if (topBar) topBar.classList.remove("menu-open");
      if (menuIcon) {
        menuIcon.style.transform = "rotate(0deg)";
        menuIcon.style.webkitMask = "url(icons/menu.svg) no-repeat center";
        menuIcon.style.mask = "url(icons/menu.svg) no-repeat center";
      }
    }
  }
  let menuBtn = document.getElementById("menuBtn");
  let scrim = document.getElementById("scrim");
  if (menuBtn) menuBtn.addEventListener("click", () => toggleDrawer());
  if (scrim) scrim.addEventListener("click", () => toggleDrawer(true));
  window.closeDrawer = () => toggleDrawer(true);
  if (fab)
    fab.addEventListener("click", () =>
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      }),
    );
  let observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -60px 0px",
    },
  );
  document.querySelectorAll(".anim").forEach((el) => observer.observe(el));
  async function fetchOpenCollective() {
    const query = `
              {
                collective(slug: "morpheapp") {
                  members(role: BACKER, limit: 20, orderBy: { field: CREATED_AT, direction: DESC }) {
                    totalCount
                    nodes {
                      tier { name }
                      account { name imageUrl(height: 128) slug website }
                    }
                  }
                }
              }`;
    try {
      const res = await fetch("https://api.opencollective.com/graphql/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      });
      const data = await res.json();
      const members = data.data?.collective?.members;
      if (!members || !members.nodes) return;
      const isMega = (m) =>
        m.tier &&
        m.tier.name &&
        (m.tier.name.toLowerCase().includes("mega") ||
          m.tier.name.toLowerCase().includes("sponsor"));
      const sponsors = members.nodes.filter(isMega);
      const backers = members.nodes.filter((m) => !isMega(m));
      const sponsorContainer = document.getElementById(
        "donate-sponsors-avatars",
      );
      const sponsorLoading = document.getElementById("donate-sponsors-loading");
      if (sponsorContainer) {
        if (sponsorLoading) sponsorLoading.hidden = true;
        if (sponsors.length > 0) {
          sponsors.forEach((m) => {
            const acc = m.account;
            const a = document.createElement("a");
            a.href = acc.website || "https://opencollective.com/" + acc.slug;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.className = "donate-sponsor-avatar";
            a.title = acc.name || "Sponsor";
            if (acc.imageUrl) {
              const img = document.createElement("img");
              img.src = acc.imageUrl;
              img.alt = acc.name || "Sponsor";
              img.loading = "lazy";
              img.onerror = () => {
                img.remove();
                a.textContent = (acc.name || "?")[0].toUpperCase();
              };
              a.appendChild(img);
            } else {
              a.textContent = (acc.name || "?")[0].toUpperCase();
            }
            sponsorContainer.appendChild(a);
          });
        } else {
          document.getElementById("donate-sponsors-empty").hidden = false;
        }
      }
      const backerContainer = document.getElementById("donate-avatars");
      const backerLoading = document.getElementById("donate-state-loading");
      if (backerContainer) {
        if (backerLoading) backerLoading.hidden = true;
        if (backers.length > 0) {
          backers.forEach((m) => {
            const acc = m.account;
            const a = document.createElement("a");
            a.href = "https://opencollective.com/" + acc.slug;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.className = "donate-avatar";
            a.title = acc.name || "Backer";
            if (acc.imageUrl) {
              const img = document.createElement("img");
              img.src = acc.imageUrl;
              img.alt = acc.name || "Backer";
              img.loading = "lazy";
              img.onerror = () => {
                img.remove();
                a.textContent = (acc.name || "?")[0].toUpperCase();
              };
              a.appendChild(img);
            } else {
              a.textContent = (acc.name || "?")[0].toUpperCase();
            }
            backerContainer.appendChild(a);
          });
          const remaining = Math.max(
            0,
            members.totalCount - backers.length - sponsors.length,
          );
          if (remaining > 0) {
            const a = document.createElement("a");
            a.href =
              "https://opencollective.com/morpheapp#section-contributors";
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.className = "donate-avatar donate-avatar-more";
            a.textContent = "+" + remaining;
            a.title = remaining + " more backers";
            backerContainer.appendChild(a);
          }
        } else {
          document.getElementById("donate-state-empty").hidden = false;
        }
      }
    } catch (e) {
      const sLoad = document.getElementById("donate-state-loading");
      if (sLoad) sLoad.hidden = true;
      const sEmpty = document.getElementById("donate-state-empty");
      if (sEmpty) sEmpty.hidden = false;
      const spLoad = document.getElementById("donate-sponsors-loading");
      if (spLoad) spLoad.hidden = true;
      const spEmpty = document.getElementById("donate-sponsors-empty");
      if (spEmpty) spEmpty.hidden = false;
    }
  }
  fetchOpenCollective();
});
