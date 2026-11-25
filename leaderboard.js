const STATUS = {
  pass: { short: 'PASS', long: 'Strict PASS' },
  not_accepted: { short: 'Not accepted', long: 'Below the benefit / acceptance bar' },
  not_exact: { short: 'Not exact', long: 'Exactness check failed' },
  agent_error: { short: 'Run error', long: 'Agent did not exit successfully' },
  infrastructure: { short: 'Provider error', long: 'Provider/API failure; excluded from model scoring' },
  cancelled: { short: 'Cancelled', long: 'Stopped at user request; excluded from model scoring' },
  pending: { short: 'Pending', long: 'Formal trial not started' },
  running: { short: 'Running', long: 'Formal trial is in progress' }
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const numeric = value => typeof value === 'number' && Number.isFinite(value);
const speed = value => numeric(value) ? `${value.toFixed(2)}×` : '—';
const score = value => numeric(value) ? value.toFixed(2) : '—';
const geoMean = values => values.length ? Math.exp(values.reduce((sum, value) => sum + Math.log(value), 0) / values.length) : 0;
const dateLabel = value => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(value)) + ' CST';
const complete = record => !['pending', 'running', 'infrastructure', 'cancelled'].includes(record.status);
const validRetry = record => ['pass', 'not_accepted', 'not_exact'].includes(record.status);
const gateLabel = gate => ({ exact: 'exactness', accepted: 'benefit bar', agent_returncode: 'agent exit', verifier_returncode: 'verifier exit', judge_intact_after_agent: 'frozen artifacts', judge_intact_after_verifier: 'frozen artifacts' })[gate] || gate.replaceAll('_', ' ');
function verification(record) {
  if (record.status === 'pass') return 'Independent verifier PASS · exact N0 · benefit bar · frozen artifacts' + (record.trace_captured ? ' · Trace captured' : '');
  if (record.status === 'running') return 'Formal run active · verification pending' + (record.trace_captured ? ' · Trace captured' : '');
  if (record.status === 'pending') return 'Formal run not started · verification pending';
  if (record.status === 'infrastructure') return `${record.provider_error === 'billing_credit_low' ? 'AIHub credit balance too low' : 'Provider failure'} · excluded from performance comparison`;
  if (record.status === 'cancelled') return 'Stopped by user · excluded from performance comparison';
  const gates = [...new Set((record.failed_gates || []).filter(gate => gate !== 'status_pass').map(gateLabel))];
  return `Independent check: ${gates.length ? gates.join(', ') + ' failed' : 'not accepted'}` + (record.trace_captured ? ' · Trace captured' : '');
}

function cell(record) {
  const config = STATUS[record.status] || STATUS.pending;
  const label = record.status === 'pass' || record.status === 'not_accepted' || record.status === 'not_exact'
    ? speed(record.speedup) : config.short;
  const badge = el('span', `cell ${record.status}`, label);
  badge.title = config.long + (numeric(record.speedup) ? ` · measured ${speed(record.speedup)}` : '') + (record.trace_captured ? ' · trace captured' : '');
  badge.setAttribute('aria-label', badge.title);
  return badge;
}

function retryCell(record) {
  if (!record) return null;
  const label = record.status === 'pass' ? `Retry PASS ${speed(record.speedup)}`
    : record.status === 'running' ? 'Retry running'
    : record.status === 'pending' ? 'Retry queued'
    : record.status === 'not_exact' ? `Retry not exact ${speed(record.speedup)}`
    : record.status === 'not_accepted' ? `Retry below bar ${speed(record.speedup)}`
    : record.status === 'infrastructure' ? 'Retry provider error'
    : 'Retry run error';
  const note = el('span', `retry-note ${record.status}`, label);
  note.title = `Second attempt only · ${verification(record)} · primary score unchanged`;
  return note;
}

function rankModels(data) {
  return data.models.map(model => {
    const records = data.records.filter(record => record.model === model.id);
    const accepted = records.filter(record => record.status === 'pass');
    return { ...model, records, accepted, passCount: accepted.length, mean: geoMean(accepted.map(record => record.speedup)), pending: records.every(record => record.status === 'pending'), running: records.some(record => record.status === 'running') };
  }).sort((a, b) => {
    if (a.pending !== b.pending) return a.pending ? 1 : -1;
    return (b.score ?? -1) - (a.score ?? -1) || b.passCount - a.passCount || b.mean - a.mean;
  });
}

function renderSummary(data) {
  const pass = data.records.filter(record => record.status === 'pass').length;
  const comparable = data.records.filter(complete).length;
  const pending = data.records.filter(record => record.status === 'pending').length;
  const running = data.records.filter(record => record.status === 'running').length;
  const excluded = data.records.filter(record => ['infrastructure', 'cancelled'].includes(record.status)).length;
  const cards = [
    ['Strict PASS', String(pass), 'Independent verifier accepted'],
    ['Completed trials', `${comparable} / ${data.records.length - excluded}`, 'Active model–harness rows only'],
    ['In progress / queued', `${running} / ${pending}`, 'Running / not started'],
    ['Excluded / stopped', String(excluded), 'Provider failures and user cancellations']
  ];
  const target = document.getElementById('summary');
  target.replaceChildren(...cards.map(([label, value, sub]) => {
    const card = el('div', 'stat');
    card.append(el('div', 'stat-label', label), el('div', 'stat-value', value), el('div', 'stat-sub', sub));
    return card;
  }));
}

function renderBars(models) {
  const target = document.getElementById('bars');
  target.replaceChildren(...models.map(model => {
    const row = el('div', `bar-row${model.pending ? ' pending' : ''}`);
    const label = el('div', 'bar-label', model.name);
    label.append(el('small', '', model.pending ? 'Not started' : model.running ? `${model.harness} · in progress` : `${model.harness} · ${model.passCount}/10 PASS`));
    const track = el('div', 'bar-track');
    const fill = el('div', 'bar-fill');
    fill.style.width = `${numeric(model.score) ? model.score * 2 : 0}%`;
    track.append(fill);
    row.append(label, track, el('div', 'bar-number', score(model.score)));
    return row;
  }));
}

function renderBoard(data, models) {
  const table = document.getElementById('board');
  const head = el('thead');
  const heading = el('tr');
  heading.append(el('th', '', 'Model · harness'), el('th', '', 'Score / 50'), el('th', '', 'PASS'));
  data.tasks.forEach(task => { const th = el('th', '', task.name); th.title = task.domain; heading.append(th); });
  head.append(heading);
  const body = el('tbody');
  models.forEach(model => {
    const row = el('tr');
    const modelCell = el('th');
    modelCell.scope = 'row';
    modelCell.append(el('div', 'model-name', model.name), el('div', 'model-harness', model.harness));
    if (model.pending) modelCell.append(el('div', 'row-note', 'NOT STARTED'));
    if (model.running) modelCell.append(el('div', 'row-note', 'FORMAL RUN IN PROGRESS'));
    row.append(modelCell, el('td', 'count-cell', score(model.score)), el('td', 'count-cell', model.pending || model.running ? '—' : `${model.passCount}/10`));
    data.tasks.forEach(task => {
      const td = el('td');
      td.append(cell(model.records.find(record => record.task === task.id)));
      const retry = data.repeat_records.find(record => record.model === model.id && record.task === task.id);
      if (retry) td.append(retryCell(retry));
      row.append(td);
    });
    body.append(row);
  });
  table.replaceChildren(head, body);
}

function renderTask(data, models, taskId) {
  const task = data.tasks.find(item => item.id === taskId);
  const target = document.getElementById('task-detail');
  const header = el('div', 'task-head');
  const title = el('div');
  title.append(el('h3', '', task.name), el('p', '', task.domain + ' · final independent verifier'));
  header.append(title, el('span', 'unit', 'MEASURED SPEEDUP'));
  const list = el('div', 'task-list');
  const max = Math.max(1, ...models.flatMap(model => model.records.filter(record => record.task === taskId && record.status === 'pass').map(record => record.speedup)));
  models.forEach(model => {
    const record = model.records.find(item => item.task === taskId);
    const row = el('div', 'task-item');
    const name = el('div', 'task-item-name', model.name);
    name.append(el('div', 'task-item-harness', model.harness));
    name.append(el('div', 'task-item-verification', verification(record)));
    const retry = data.repeat_records.find(item => item.model === model.id && item.task === taskId);
    if (retry) name.append(el('div', 'task-item-retry', `Second attempt: ${verification(retry)}${numeric(retry.speedup) ? ` · ${speed(retry.speedup)}` : ''}`));
    const meter = el('div', 'task-item-meter');
    const fill = el('span');
    fill.style.width = record.status === 'pass' ? `${Math.min(100, record.speedup / max * 100)}%` : '0%';
    meter.append(fill);
    const result = el('div', 'task-item-result');
    result.append(cell(record));
    row.append(name, meter, result);
    list.append(row);
  });
  target.replaceChildren(header, list);
}

async function main() {
  const dataUrl = new URL('./data/results.json', window.location.href);
  dataUrl.searchParams.set('v', String(Date.now()));
  const response = await fetch(dataUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
  const data = await response.json();
  if (data.schema_version !== 2 || data.records.length !== data.models.length * data.tasks.length || data.repeat_records.length !== 15) throw new Error('Incomplete leaderboard data');
  document.getElementById('updated').textContent = `Primary audited ${dateLabel(data.audited_at)} · second attempts ${dateLabel(data.repeat_audited_at)}`;
  document.getElementById('footer-date').textContent = `Second-attempt snapshot: ${dateLabel(data.repeat_audited_at)}`;
  document.getElementById('score-status').textContent = 'Primary scores only; second attempts are separately labeled and do not change these totals. ChemBERTa primary trials may have inherited earlier template notes.' + (data.gemini_budget_retry_note ? ` ${data.gemini_budget_retry_note}` : '');
  const retryDone = data.repeat_records.filter(validRetry).length;
  const retryErrors = data.repeat_records.filter(item => ['agent_error', 'infrastructure', 'cancelled'].includes(item.status)).length;
  document.getElementById('repeat-status').textContent = `Second attempts: ${retryDone}/15 valid results, ${data.repeat_records.filter(item => item.status === 'running').length} running, ${data.repeat_records.filter(item => item.status === 'pending').length} queued${retryErrors ? `, ${retryErrors} run error${retryErrors === 1 ? '' : 's'} excluded from valid results` : ''}. All five ChemBERTa retries use blank report and work-log templates. Primary scores remain unchanged.`;
  const models = rankModels(data);
  renderSummary(data);
  renderBars(models);
  renderBoard(data, models);
  const select = document.getElementById('task-select');
  data.tasks.forEach(task => { const option = el('option', '', task.name); option.value = task.id; select.append(option); });
  select.addEventListener('change', () => renderTask(data, models, select.value));
  select.value = 'proteinmpnn';
  renderTask(data, models, select.value);
}

main().catch(error => {
  document.getElementById('updated').textContent = `Could not load audited snapshot: ${error.message}`;
  console.error(error);
});
