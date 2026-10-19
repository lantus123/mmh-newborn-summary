'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const APP_PATH = process.env.MMH_TEST_APP_PATH || path.resolve(__dirname, '..', 'index.html');

// A deliberately small DOM for this static page. It reads the real controls
// from index.html and supports only the selectors used by the application.
// Rendering is tested separately in a browser; these tests exercise the real
// parser and generators, without copying their medical or parsing logic.
function decodeEntities(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function makeDOM(html) {
  const nodes = [];
  const root = { children: [], parent: null };
  const stack = [root];
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

  function select(selector, within = root) {
    const groups = selector.split(',').map(s => s.trim()).filter(Boolean);
    return nodes.filter(node => {
      let inside = false;
      for (let p = node.parent; p; p = p.parent) if (p === within) inside = true;
      if (!inside) return false;
      return groups.some(group => {
        const parts = group.split(/\s+(?=(?:[^"']|"[^"]*"|'[^']*')*$)/).filter(Boolean);
        let current = node;
        if (!matches(current, parts.pop())) return false;
        while (parts.length) {
          const ancestor = parts.pop();
          current = current.parent;
          while (current && !matches(current, ancestor)) current = current.parent;
          if (!current) return false;
        }
        return true;
      });
    });
  }

  function matches(node, selector) {
    if (!node || !node.tagName) return false;
    let remaining = selector;
    if (remaining.includes(':checked')) {
      if (!node.checked) return false;
      remaining = remaining.replace(/:checked/g, '');
    }
    for (const match of remaining.matchAll(/\[([^\]=\s]+)(?:=["']?([^\]"']*)["']?)?\]/g)) {
      const [, key, value] = match;
      if (!(key in node.attributes)) return false;
      if (value !== undefined && node.attributes[key] !== value) return false;
    }
    remaining = remaining.replace(/\[[^\]]*\]/g, '');
    const tag = remaining.match(/^[\w-]+/);
    if (tag && node.tagName !== tag[0].toLowerCase()) return false;
    const id = remaining.match(/#([\w-]+)/);
    if (id && node.id !== id[1]) return false;
    for (const match of remaining.matchAll(/\.([\w-]+)/g)) {
      if (!node.classList.contains(match[1])) return false;
    }
    return true;
  }

  function element(tagName, attributes, parent) {
    const classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
    const listeners = new Map();
    const el = {
      tagName,
      attributes,
      parent,
      children: [],
      id: attributes.id || '',
      type: attributes.type || '',
      name: attributes.name || '',
      value: attributes.value || '',
      placeholder: attributes.placeholder || '',
      checked: 'checked' in attributes,
      innerHTML: '',
      textContent: '',
      style: {},
      dataset: Object.fromEntries(Object.entries(attributes)
        .filter(([key]) => key.startsWith('data-'))
        .map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase()), value])),
      classList: {
        add(...names) { names.forEach(name => classes.add(name)); },
        remove(...names) { names.forEach(name => classes.delete(name)); },
        contains(name) { return classes.has(name); },
        toggle(name, force) {
          const add = force === undefined ? !classes.has(name) : force;
          if (add) classes.add(name); else classes.delete(name);
          return add;
        },
      },
      addEventListener(name, callback) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(callback);
      },
      dispatchEvent(event) {
        for (const callback of listeners.get(event.type) || []) callback({ ...event, target: el });
      },
      querySelectorAll(selector) { return select(selector, el); },
      querySelector(selector) { return select(selector, el)[0] || null; },
      focus() {},
      select() {},
      getAttribute(name) { return attributes[name] ?? null; },
      setAttribute(name, value) { attributes[name] = String(value); },
    };
    Object.defineProperty(el, 'innerText', { get() { return toText(el.innerHTML || el.textContent); } });
    parent.children.push(el);
    nodes.push(el);
    return el;
  }

  // Omit script/style bodies so JavaScript strings are never parsed as HTML.
  const markup = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const tags = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][a-z0-9-]*(?:\s+(?:[^>"']|"[^"]*"|'[^']*')*)?\s*\/?\s*>/gi;
  for (const token of markup.match(tags) || []) {
    if (token.startsWith('<!')) continue;
    const name = token.match(/^<\/?([a-z][a-z0-9-]*)/i)[1].toLowerCase();
    if (token.startsWith('</')) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tagName === name) { stack.length = i; break; }
      }
      continue;
    }
    const attributes = {};
    const attrText = token.replace(/^<[a-z][a-z0-9-]*/i, '').replace(/\/?\s*>$/, '');
    const attrRE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    for (const match of attrText.matchAll(attrRE)) {
      attributes[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
    }
    const el = element(name, attributes, stack[stack.length - 1]);
    if (!voidTags.has(name) && !/\/\s*>$/.test(token)) stack.push(el);
  }

  return {
    title: '',
    getElementById(id) { return nodes.find(node => node.id === id) || null; },
    querySelectorAll(selector) { return select(selector); },
    querySelector(selector) { return select(selector)[0] || null; },
    createElement(tagName) { return element(tagName.toLowerCase(), {}, root); },
    body: {
      appendChild() {},
      removeChild() {},
    },
    execCommand() { return true; },
  };
}

function toText(html) {
  return decodeEntities(String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''));
}

function loadApp(campus = 'tpc') {
  const html = fs.readFileSync(APP_PATH, 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]));
  if (!scripts.length) throw new Error('No inline application script found');
  const document = makeDOM(html);
  const errors = [];
  const context = vm.createContext({
    document,
    window: {
      location: { search: campus === 'tpc' ? '' : `?campus=${campus}` },
      addEventListener() {},
    },
    navigator: {},
    URLSearchParams,
    setTimeout,
    clearTimeout,
    console: { log() {}, warn() {}, error(...args) { errors.push(args); } },
  });
  vm.runInContext(scripts.at(-1)[2], context, { filename: 'index.html:inline', timeout: 5000 });
  // Apply the actual campus configuration and bind application events, but
  // leave initial placeholder rendering to the tests that explicitly need it.
  context.applyCampusConfig();
  context.setupConditionalCheckboxes();
  context.bindEvents();
  return {
    context,
    document,
    errors,
    parse(text) { return context.parseInputData(text); },
    render(data, manualPE = []) {
      return {
        summary: context.generateSummary(data, manualPE),
        consultation: context.generateConsultation(data, manualPE),
        discharge: context.generateDischargeSummary(data, manualPE),
        diagnosis: context.generateDiagnosis(data, manualPE),
      };
    },
  };
}

module.exports = { loadApp, toText };
