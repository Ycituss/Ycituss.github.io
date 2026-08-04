/* =========================================================
 * 渲染逻辑 —— 支持「组内拖拽排序」与「星标置顶」
 * 排序/置顶状态保存在浏览器 localStorage，不影响 config.js
 * ========================================================= */

(function () {
  "use strict";

  const cfg = window.SITE_CONFIG || { title: "导航", sites: [] };

  const LS_PINNED = "nav.pinned.v1";
  const LS_ORDER = "nav.order.v1";

  function loadJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function saveJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  // state.pinned: 置顶网址顺序数组（含置顶集合）
  // state.order: { 分组名: [网址顺序] }
  let state = {
    pinned: loadJSON(LS_PINNED, []),
    order: loadJSON(LS_ORDER, {}),
  };

  const PINNED_KEY = "__pinned__";

  function isPinned(url) {
    return state.pinned.includes(url);
  }
  function togglePin(url) {
    if (isPinned(url)) {
      state.pinned = state.pinned.filter((u) => u !== url);
    } else {
      state.pinned.push(url);
    }
    saveJSON(LS_PINNED, state.pinned);
    render("");
  }
  // 取某分组的自定义顺序（不存在则空数组）
  function getOrder(key) {
    return state.order[key] || [];
  }
  function setOrder(key, arr) {
    state.order[key] = arr;
    saveJSON(LS_ORDER, state.order);
  }

  // 收集所有配置项（扁平），便于按 url 查找
  const allItems = [];
  (cfg.sites || []).forEach((g) => (g.items || []).forEach((it) => allItems.push(it)));
  function findItem(url) {
    return allItems.find((it) => it.url === url);
  }

  // ---- 主题 ----
  function applyTheme(pref) {
    const dark =
      pref === "dark" ||
      (pref === "auto" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.textContent = dark ? "☀️" : "🌙";
  }
  const themePref = cfg.theme || "auto";
  applyTheme(themePref);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => applyTheme(themePref));
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.getElementById("theme-toggle").textContent =
      next === "dark" ? "☀️" : "🌙";
  });

  // ---- 文案 ----
  document.getElementById("page-title").textContent = cfg.title || "导航";
  const sub = document.getElementById("page-subtitle");
  if (cfg.subtitle) sub.textContent = cfg.subtitle;
  else sub.style.display = "none";

  // ---- 图标 ----
  function domainOf(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return "";
    }
  }
  function colorFromText(t) {
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
    return `hsl(${h}, 55%, 55%)`;
  }
  function makeIcon(item) {
    const box = document.createElement("div");
    box.className = "icon";
    const fallback = () => {
      box.style.background = colorFromText(item.name || item.url);
      box.textContent = ((item.name || item.url || "?").trim().charAt(0) || "?").toUpperCase();
    };
    if (item.icon) {
      const img = document.createElement("img");
      img.src = item.icon;
      img.alt = item.name;
      img.onerror = () => { img.remove(); fallback(); };
      box.appendChild(img);
    } else {
      const dm = domainOf(item.url);
      if (dm) {
        const img = document.createElement("img");
        img.src = `https://www.google.com/s2/favicons?domain=${dm}&sz=64`;
        img.alt = item.name;
        img.onerror = () => { img.remove(); fallback(); };
        box.appendChild(img);
      } else {
        fallback();
      }
    }
    return box;
  }

  // ---- 单卡片（含星标 + 可拖拽）----
  function makeCard(item, groupKey) {
    const a = document.createElement("a");
    a.className = "card";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.draggable = true;
    a.dataset.url = item.url;
    a.dataset.key = groupKey;

    a.appendChild(makeIcon(item));

    const text = document.createElement("div");
    text.className = "card-text";
    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = item.name || item.url;
    text.appendChild(name);
    if (item.desc) {
      const desc = document.createElement("div");
      desc.className = "card-desc";
      desc.textContent = item.desc;
      text.appendChild(desc);
    }
    a.appendChild(text);

    const star = document.createElement("button");
    star.className = "star" + (isPinned(item.url) ? " pinned" : "");
    star.type = "button";
    star.title = isPinned(item.url) ? "取消置顶" : "置顶常用";
    star.textContent = isPinned(item.url) ? "★" : "☆";
    star.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePin(item.url);
    });
    a.appendChild(star);

    // 拖拽
    a.addEventListener("dragstart", (e) => {
      drag.el = a;
      drag.key = groupKey;
      a.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", item.url); } catch (_) {}
    });
    a.addEventListener("dragend", () => {
      a.classList.remove("dragging");
      clearDropMark();
    });

    return a;
  }

  // ---- 分组渲染（按自定义顺序排列）----
  function orderedItems(items, key) {
    const order = getOrder(key);
    const map = {};
    items.forEach((it) => (map[it.url] = it));
    const seen = new Set();
    const out = [];
    order.forEach((u) => {
      if (map[u]) { out.push(map[u]); seen.add(u); }
    });
    items.forEach((it) => { if (!seen.has(it.url)) out.push(it); });
    return out;
  }

  // ---- 拖拽状态 ----
  const drag = { el: null, key: null };
  function clearDropMark() {
    document.querySelectorAll(".drop-before,.drop-after").forEach((n) => {
      n.classList.remove("drop-before", "drop-after");
    });
  }
  function onDragOver(e) {
    if (!drag.el) return;
    const grid = e.currentTarget;
    if (grid.dataset.key !== drag.key) return; // 仅允许同组排序
    e.preventDefault();
    const after = isAfter(e.clientY, grid);
    clearDropMark();
    if (after.ref) after.ref.classList.add(after.pos === "after" ? "drop-after" : "drop-before");
  }
  function isAfter(y, grid) {
    const cards = [...grid.querySelectorAll(".card:not(.dragging)")];
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (y < r.top + r.height / 2) return { ref: c, pos: "before" };
    }
    return { ref: cards[cards.length - 1] || null, pos: "after" };
  }
  function onDrop(e) {
    if (!drag.el) return;
    const grid = e.currentTarget;
    if (grid.dataset.key !== drag.key) return;
    e.preventDefault();
    const after = isAfter(e.clientY, grid);
    if (after.ref) {
      if (after.pos === "before") grid.insertBefore(drag.el, after.ref);
      else grid.insertBefore(drag.el, after.ref.nextSibling);
    } else {
      grid.appendChild(drag.el);
    }
    clearDropMark();
    // 从 DOM 读取新顺序并保存
    const urls = [...grid.querySelectorAll(".card")].map((c) => c.dataset.url);
    setOrder(grid.dataset.key, urls);
  }

  const content = document.getElementById("content");

  function render(filter) {
    content.innerHTML = "";
    const q = (filter || "").trim().toLowerCase();

    // 构建待渲染分组：置顶组（若有）+ 配置分组
    const groups = [];
    const pinnedItems = allItems
      .filter((it) => isPinned(it.url))
      .filter((it) =>
        !q ||
        (it.name || "").toLowerCase().includes(q) ||
        (it.desc || "").toLowerCase().includes(q) ||
        (it.url || "").toLowerCase().includes(q)
      );
    if (pinnedItems.length) {
      groups.push({ key: PINNED_KEY, title: "★ 置顶常用", items: pinnedItems });
    }
    (cfg.sites || []).forEach((grp) => {
      const items = (grp.items || []).filter(
        (it) => !isPinned(it.url) && (!q ||
          (it.name || "").toLowerCase().includes(q) ||
          (it.desc || "").toLowerCase().includes(q) ||
          (it.url || "").toLowerCase().includes(q))
      );
      if (items.length)
        groups.push({ key: grp.group, title: grp.group, items });
    });

    let total = 0;
    groups.forEach((g) => {
      const gt = document.createElement("div");
      gt.className = "group-title";
      gt.textContent = g.title;
      content.appendChild(gt);

      const grid = document.createElement("div");
      grid.className = "grid";
      grid.dataset.key = g.key;
      orderedItems(g.items, g.key).forEach((it) => {
        grid.appendChild(makeCard(it, g.key));
        total++;
      });
      grid.addEventListener("dragover", onDragOver);
      grid.addEventListener("drop", onDrop);
      content.appendChild(grid);
    });

    const tip = document.getElementById("count-tip");
    if (total === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = q ? "没有匹配的网站" : "还没有添加任何网站";
      content.appendChild(empty);
      tip.textContent = "";
    } else {
      tip.textContent = `共 ${total} 个网站`;
    }
  }

  render("");

  document.getElementById("search").addEventListener("input", (e) => {
    render(e.target.value);
  });
})();
