import { czGetSite, czSetSite, czResetSite } from "@/lib/storage";
import type { Message, RunResult, StateResponse, ActionResponse } from "@/lib/messages";

const CZ_STYLE_ID = "containerizer-injected-style";
const CZ_ATTR = "data-containerizer-container";
const CZ_MODE_ATTR = "data-cz-mode";

let czLastResult: RunResult | null = null;
let czPicker: { cleanup: () => void } | null = null;

function czViewportWidth(): number {
  return document.documentElement.clientWidth || window.innerWidth;
}

function czParsePx(value: string): number | null {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function czDescribe(el: Element | null): string | null {
  if (!el) return null;
  let s = el.tagName.toLowerCase();
  if (el.id) s += "#" + el.id;
  else if (el.classList.length) s += "." + [...el.classList].slice(0, 2).join(".");
  return s;
}

function czIsAlreadyContained(el: Element): boolean {
  const vw = czViewportWidth();
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    if (cs.maxWidth && cs.maxWidth !== "none") {
      const px = czParsePx(cs.maxWidth);
      if (px && px < vw * 0.95) return true;
    }
    node = node.parentElement;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width && rect.width < vw * 0.9) return true;
  return false;
}

const CZ_PREFERRED = [
  "main",
  '[role="main"]',
  "article",
  "#content",
  "#main",
  ".content",
  ".main-content",
  ".post",
  ".entry-content",
];

function czScoreBestCandidate(): HTMLElement | null {
  if (!document.body) return null;
  const vw = czViewportWidth();
  let best: HTMLElement | null = null;
  let bestScore = 0;
  for (const el of document.body.querySelectorAll<HTMLElement>("main, article, section, div")) {
    const rect = el.getBoundingClientRect();
    if (rect.width < vw * 0.7) continue;
    const textLen = el.innerText ? el.innerText.trim().length : 0;
    if (textLen < 200) continue;
    if (textLen > bestScore) {
      bestScore = textLen;
      best = el;
    }
  }
  return best;
}

function czFindCandidate(): HTMLElement | null {
  for (const sel of CZ_PREFERRED) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el && el.getBoundingClientRect().width > 0) return el;
  }
  return czScoreBestCandidate();
}

function czEnsureStyle(maxWidth: number): void {
  let style = document.getElementById(CZ_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = CZ_STYLE_ID;
    document.documentElement.appendChild(style);
  }
  const w = `${maxWidth}px`;
  style.textContent =
    `[${CZ_ATTR}][${CZ_MODE_ATTR}="margin"]{` +
    `max-width:${w} !important;margin-left:auto !important;margin-right:auto !important;box-sizing:border-box !important;}` +
    `[${CZ_ATTR}][${CZ_MODE_ATTR}="pad"]{` +
    `padding-left:max(0px,calc((100% - ${w}) / 2)) !important;` +
    `padding-right:max(0px,calc((100% - ${w}) / 2)) !important;box-sizing:border-box !important;}`;
}

function czClear(): void {
  document.querySelectorAll(`[${CZ_ATTR}]`).forEach((e) => {
    e.removeAttribute(CZ_ATTR);
    e.removeAttribute(CZ_MODE_ATTR);
  });
}

// A scrolling box centered with margins would drag its scrollbar inward; center it
// with padding instead so the box stays full-width and the scrollbar stays at the edge.
function czIsScrollContainer(el: HTMLElement): boolean {
  if (el === document.body || el === document.documentElement) return false;
  const overflowY = getComputedStyle(el).overflowY;
  const scrolls = overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
  return scrolls && el.scrollHeight > el.clientHeight + 1;
}

function czApply(el: HTMLElement, maxWidth: number): boolean {
  if (!el) return false;
  czClear();
  el.setAttribute(CZ_ATTR, "");
  el.setAttribute(CZ_MODE_ATTR, czIsScrollContainer(el) ? "pad" : "margin");
  czEnsureStyle(maxWidth);
  return true;
}

async function czRun(): Promise<RunResult> {
  const host = location.hostname;
  const site = await czGetSite(host);

  // Reset to the site's natural layout before measuring, so a container from a
  // previous run isn't mistaken for the site's own and toggled on and off.
  czClear();

  if (!site.enabled) return { applied: false, reason: "disabled" };

  if (site.selector) {
    const picked = document.querySelector<HTMLElement>(site.selector);
    if (picked) {
      const ok = czApply(picked, site.maxWidth);
      return { applied: ok, reason: "applied-manual", element: czDescribe(picked), maxWidth: site.maxWidth };
    }
  }

  const candidate = czFindCandidate();
  if (!candidate) return { applied: false, reason: "no-candidate" };
  if (czIsAlreadyContained(candidate)) {
    return { applied: false, reason: "already-contained", element: czDescribe(candidate) };
  }
  const ok = czApply(candidate, site.maxWidth);
  return { applied: ok, reason: "applied-auto", element: czDescribe(candidate), maxWidth: site.maxWidth };
}

function czCssPath(el: Element): string {
  if (el.id) return "#" + CSS.escape(el.id);
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node !== document.body && parts.length < 6) {
    let sel = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (parent) {
      const sameTag = [...parent.children].filter((c) => c.tagName === node!.tagName);
      if (sameTag.length > 1) sel += `:nth-of-type(${sameTag.indexOf(node) + 1})`;
    }
    parts.unshift(sel);
    if (node.id) {
      parts[0] = "#" + CSS.escape(node.id);
      break;
    }
    node = parent;
  }
  return parts.join(" > ");
}

function czStartPicker(): void {
  if (czPicker) return;

  const box = document.createElement("div");
  box.style.cssText =
    "position:fixed;z-index:2147483647;pointer-events:none;box-sizing:border-box;" +
    "border:2px solid #4f8cff;background:rgba(79,140,255,.15);border-radius:2px;";

  const hint = document.createElement("div");
  hint.textContent = "Click an element to make it the container · Esc to cancel";
  hint.style.cssText =
    "position:fixed;z-index:2147483647;top:12px;left:50%;transform:translateX(-50%);" +
    "background:#111;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:8px 12px;" +
    "border-radius:8px;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.3);";

  document.documentElement.append(box, hint);
  let current: HTMLElement | null = null;

  const onMove = (e: MouseEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!el || el === box || el === hint) return;
    current = el;
    const r = el.getBoundingClientRect();
    box.style.top = r.top + "px";
    box.style.left = r.left + "px";
    box.style.width = r.width + "px";
    box.style.height = r.height + "px";
  };

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!current) return;
    const selector = czCssPath(current);
    czSetSite(location.hostname, { selector, enabled: true }).then(async () => {
      czLastResult = await czRun();
    });
    cleanup();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") cleanup();
  };

  const cleanup = () => {
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    box.remove();
    hint.remove();
    czPicker = null;
  };

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
  czPicker = { cleanup };
}

chrome.runtime.onMessage.addListener(
  (msg: Message, _sender, sendResponse: (r: StateResponse | ActionResponse) => void) => {
    (async () => {
      const host = location.hostname;
      switch (msg.type) {
        case "GET_STATE": {
          const site = await czGetSite(host);
          sendResponse({ host, ...site, last: czLastResult });
          break;
        }
        case "SET_ENABLED": {
          await czSetSite(host, { enabled: msg.enabled });
          czLastResult = await czRun();
          sendResponse({ ok: true, last: czLastResult });
          break;
        }
        case "SET_MAX_WIDTH": {
          await czSetSite(host, { maxWidth: msg.maxWidth });
          czLastResult = await czRun();
          sendResponse({ ok: true, last: czLastResult });
          break;
        }
        case "START_PICKER": {
          czStartPicker();
          sendResponse({ ok: true });
          break;
        }
        case "RESET_SITE": {
          await czResetSite(host);
          czLastResult = await czRun();
          sendResponse({ ok: true, last: czLastResult });
          break;
        }
      }
    })();
    return true; // keep the channel open for the async sendResponse
  }
);

(async function czInit() {
  czLastResult = await czRun();
  let tries = 0;
  while (czLastResult && czLastResult.reason === "no-candidate" && tries < 5) {
    await new Promise((r) => setTimeout(r, 600));
    czLastResult = await czRun();
    tries++;
  }
})();
