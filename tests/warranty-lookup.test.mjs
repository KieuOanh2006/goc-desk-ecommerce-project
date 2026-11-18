import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (file) => readFile(new URL(file, root), 'utf8');

function element() {
  return { value: '', textContent: '', hidden: true, attributes: {}, events: {},
    addEventListener(type, callback) { this.events[type] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    focus() { this.focused = true; },
  };
}

export async function run() {
  const passed = [];
  const check = (name, fn) => { fn(); passed.push(name); };
  const [source, html, css] = await Promise.all([
    read('js/warranty-lookup.js'), read('warranty.html'), read('css/warranty-lookup.css'),
  ]);
  new vm.Script(source, { filename: 'warranty-lookup.js' });
  const ids = ['warranty-lookup-form', 'warranty-serial', 'warranty-serial-error', 'warranty-lookup-result', 'warranty-result-message'];
  const nodes = new Map(ids.map((id) => [id, element()]));
  const supportLink = element();
  const traveler = { classList: { add() {}, remove() {} } };
  const journey = { ...element(), querySelector: () => traveler };
  nodes.set('warranty-journey', journey);
  nodes.set('warranty-journey-status', element());
  for (let step = 1; step <= 3; step += 1) nodes.set('warranty-milestone-' + step, element());
  nodes.get('warranty-lookup-result').querySelector = () => supportLink;
  const context = vm.createContext({
    document: { getElementById: (id) => nodes.get(id) },
    setTimeout: () => 1, clearTimeout() {},
  });
  vm.runInContext(source, context);
  const form = nodes.get('warranty-lookup-form');
  const input = nodes.get('warranty-serial');
  const error = nodes.get('warranty-serial-error');
  const result = nodes.get('warranty-lookup-result');
  const message = nodes.get('warranty-result-message');
  function submit(value) {
    input.value = value;
    let prevented = false;
    form.events.submit({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true, 'The lookup must not submit input to a server');
  }
  function assertInvalid(value) {
    submit(value);
    assert.equal(input.attributes['aria-invalid'], 'true');
    assert.equal(input.focused, true);
    assert.equal(error.hidden, false);
    assert.ok(error.textContent);
    assert.equal(result.hidden, true);
    assert.equal(message.textContent, '');
  }
  function assertUnavailable(value) {
    submit(value);
    assert.equal(error.hidden, true);
    assert.equal(input.attributes['aria-invalid'], undefined);
    assert.equal(result.hidden, false);
    assert.ok(message.textContent.includes(value.trim()));
    assert.ok(message.textContent.includes('chưa có dữ liệu bảo hành'));
  }
  check('Empty code gives an accessible error without showing a warranty result', () => assertInvalid(''));
  check('Short codes, internal spaces, markup and overlong input are rejected', () => {
    for (const value of ['ABC', 'ABC 123', '<script>', 'A'.repeat(65)]) assertInvalid(value);
  });
  check('A serial produces only a data-unavailable response, not fabricated eligibility', () => assertUnavailable('SN-GD.12/34'));
  check('A numeric IMEI can be checked without inventing an expiry date', () => assertUnavailable('123456789012345'));
  check('Surrounding whitespace is removed before displaying the code', () => {
    assertUnavailable('  GD_1234  ');
    assert.equal(input.value, 'GD_1234');
  });
  check('Editing a code clears old results and invalid state', () => {
    input.events.input();
    assert.equal(error.hidden, true);
    assert.equal(result.hidden, true);
    assert.equal(message.textContent, '');
    assert.equal(input.attributes['aria-invalid'], undefined);
    assertInvalid('');
    input.events.input();
    assert.equal(error.hidden, true);
    assert.equal(input.attributes['aria-invalid'], undefined);
  });
  check('Journey follows validation, support viewing and code edits', () => {
    assertInvalid('');
    assert.equal(journey.attributes['data-step'], '1');
    supportLink.events.click();
    assert.equal(journey.attributes['data-step'], '1');
    submit('GD-1234');
    assert.equal(journey.attributes['data-step'], '2');
    const secondPose = journey.attributes['data-pose'];
    assert.ok(['wave', 'sit', 'walk'].includes(secondPose));
    assert.equal(nodes.get('warranty-milestone-2').attributes['aria-current'], 'step');
    supportLink.events.click();
    assert.equal(journey.attributes['data-step'], '3');
    assert.notEqual(journey.attributes['data-pose'], secondPose);
    assert.equal(nodes.get('warranty-milestone-2').attributes['aria-current'], undefined);
    assert.equal(nodes.get('warranty-milestone-3').attributes['aria-current'], 'step');
    input.events.input();
    assert.equal(journey.attributes['data-step'], '1');
    supportLink.events.click();
    assert.equal(journey.attributes['data-step'], '1');
  });
  check('The page contains all lookup controls, support anchor and retained cart scripts', () => {
    for (const id of ids) assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes('id="warranty-request"'));
    for (const script of ['product-data', 'cart-store', 'cart-badge']) assert.ok(html.includes(`src="js/${script}.js"`));
    assert.ok(html.includes('aria-live="polite"'));
    assert.ok(css.includes('.warranty-main [hidden] { display: none; }'));
    assert.ok(html.includes('has-photo-header'));
    assert.ok(html.includes('css/page-hero.css'));
    assert.ok(html.includes('class="subpage-hero warranty-banner"'));
  });
  return { passed: passed.length, checks: passed };
}
