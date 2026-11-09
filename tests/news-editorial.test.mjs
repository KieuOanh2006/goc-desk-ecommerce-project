import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

function mockPage(source, { selected = 'all', hash = '' } = {}) {
  const filters = [];
  for (const [value, label] of [['all', 'Tất cả 11'], ['setup', 'Cảm hứng setup 04'], ['guide', 'Mẹo thực hành 03'], ['product', 'Chọn phụ kiện 02'], ['experience', 'Trải nghiệm 3D 02']]) {
    const input = { value, events: {}, nextElementSibling: { textContent: label }, addEventListener(type, handler) { this.events[type] = handler; } };
    Object.defineProperty(input, 'checked', { get() { return selected === value; }, set(checked) { if (checked) selected = value; } });
    filters.push(input);
  }
  const topics = ['setup', 'guide', 'product', 'experience'].map(topic => ({ dataset: { topic }, hidden: false, querySelectorAll() { return Array({ setup: 4, guide: 3, product: 2, experience: 2 }[topic]).fill({}); } }));
  class Details {
    constructor(id, topic) { this.id = id; this.topic = topics.find(group => group.dataset.topic === topic); this.open = false; this.focused = false; this.scrolled = false; }
    closest() { return this.topic; }
    querySelector() { return { focus: () => { this.focused = true; } }; }
    scrollIntoView() { this.scrolled = true; }
  }
  const articles = [new Details('news-keyboard-choice', 'product'), new Details('news-layout-3d', 'experience')];
  const status = { textContent: '' };
  const main = {
    events: {}, addEventListener(type, handler) { this.events[type] = handler; }, contains(node) { return articles.includes(node); },
    querySelectorAll(selector) { return selector === 'input[name="news-filter"]' ? filters : topics; },
    querySelector() { return status; },
  };
  const document = { querySelector: () => main, getElementById: id => articles.find(article => article.id === id) || null };
  const location = { hash };
  const history = { pushState(_state, _unused, nextHash) { location.hash = nextHash; } };
  const window = { events: {}, addEventListener(type, handler) { this.events[type] = handler; } };
  vm.runInNewContext(source, { document, window, location, history, HTMLDetailsElement: Details, requestAnimationFrame: handler => handler() }, { filename: 'news-editorial.js' });
  return {
    filters, topics, articles, status, location, window,
    select(value) { const input = filters.find(filter => filter.value === value); input.checked = true; input.events.change(); },
    clickArticle(id) { let prevented = false; main.events.click({ button: 0, target: { closest: () => ({ getAttribute: () => `#${id}` }) }, preventDefault() { prevented = true; } }); return prevented; },
  };
}

export async function run() {
  const source = await readFile(new URL('../js/news-editorial.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../news.html', import.meta.url), 'utf8');
  new vm.Script(source, { filename: 'news-editorial.js' });
  const checks = [];
  const check = (name, fn) => { fn(); checks.push(name); };

  check('News filters update groups and preserve 3D in the visible topic label', () => {
    const page = mockPage(source);
    assert.equal(page.status.textContent, '11 bài viết · Tất cả chủ đề');
    page.select('guide'); assert.deepEqual(page.topics.map(topic => topic.hidden), [true, false, true, true]);
    assert.equal(page.status.textContent, '3 bài viết · Mẹo thực hành');
    page.select('experience'); assert.equal(page.status.textContent, '2 bài viết · Trải nghiệm 3D');
    page.select('all'); assert.ok(page.topics.every(topic => !topic.hidden));
  });
  check('Deep links reveal filtered articles; repeated reading links reopen native details', () => {
    const page = mockPage(source, { selected: 'setup', hash: '#news-keyboard-choice' });
    assert.ok(page.articles[0].open); assert.ok(page.articles[0].scrolled);
    assert.ok(page.filters[0].checked); assert.ok(page.topics.every(topic => !topic.hidden));
    page.articles[0].open = false;
    assert.ok(page.clickArticle('news-keyboard-choice')); assert.ok(page.articles[0].open); assert.ok(page.articles[0].focused);
    page.location.hash = '#%invalid'; assert.doesNotThrow(() => page.window.events.hashchange());
    assert.equal((html.match(/<details class="journal-reading\b/g) || []).length, 12);
    assert.match(html, /<details[^>]*id="news-keyboard-choice"/);
    assert.match(html, /<summary>[\s\S]*?Đọc bài viết/);
  });
  return { passed: checks.length, checks };
}
