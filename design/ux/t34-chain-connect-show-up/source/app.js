/*ICON_IMPORTS*/
const MERO = '/*MERO_DATA*/';
const QR = '/*QR_DATA*/';
const $ = (id) => document.getElementById(id);
const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (name, small = false) => `<svg class="icon${small ? ' small' : ''}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${(ICONS[name] || ICONS.check).map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([key]) => key !== 'key').map(([key, value]) => `${key}="${escape(value)}"`).join(' ')}></${tag}>`).join('')}</svg>`;
const state = { scenario: 'mixed', theme: 'light', width: '390', presentation: 'proposed', generation: 0, connections: [], events: [], sent: new Set(), pending: new Set(), errors: {}, quota: new Set(), attempts: {}, baselineSent: new Set(), stale: false, loading: false };
const view = { proposed: { tab: 'show', page: 'chain', person: null, toast: '', qr: false }, current: { tab: 'connect', page: 'chain', person: null, toast: '', qr: false } };
const ownHabits = ['Read ten pages', 'A short walk'];
let inviteHabit = ownHabits[0];
let accepted = false;
let detailsOpen = false;

function fixtures() {
  const people = [
    { id: 'sara', username: 'sara', name: 'Sara', habit: 'An evening walk', mine: 'A short walk', status: 'Not completed today' },
    { id: 'alex', username: 'alex', name: 'Alex', habit: 'Read ten pages', mine: 'Read ten pages', status: 'Completed today' },
    { id: 'noor', username: 'noor', name: 'Noor', habit: 'Stretch after breakfast', mine: 'A short walk', status: 'Not completed today' },
    { id: 'mina', username: 'mina', name: 'Mina', habit: 'Write one sentence', mine: 'Read ten pages', status: 'Goal reached' },
  ];
  const events = [
    { id: 'sara-evening', person: 'sara', day: 'Yesterday', time: '23:00', summary: 'Completed an evening walk' },
    { id: 'alex-morning', person: 'alex', day: 'Today', time: '08:10', summary: 'Completed a step' },
    { id: 'mina-final', person: 'mina', day: 'Today', time: '07:45', summary: 'Completed the final step' },
  ];
  if (state.scenario === 'empty') return { people: [], events: [] };
  if (state.scenario === 'one') return { people: [people[0]], events: [events[0]] };
  if (state.scenario === 'incomplete') return { people: people.map((p) => ({ ...p, status: 'Not completed today' })), events: [] };
  if (state.scenario === 'long') {
    people[0].username = 'sara.reads.and.walks.every.evening';
    people[0].name = 'Sara Montgomery With A Longer Name';
    people[0].habit = 'A gentle evening walk around the neighbourhood after a very long working day';
  }
  if (state.scenario === 'many') {
    for (const [i, name] of ['Owen', 'Lina', 'Sam', 'Jules', 'Ari', 'Robin'].entries()) {
      const id = name.toLowerCase();
      people.push({ id, username: id, name, habit: i % 2 ? 'Practice a little drawing' : 'Read before bed', mine: 'Read ten pages', status: i % 2 ? 'Not completed today' : 'Completed today' });
      if (i % 2 === 0) events.push({ id: `${id}-today`, person: id, day: 'Today', time: '08:00', summary: 'Completed a step' });
    }
  }
  if (state.scenario === 'limit') events.push({ id: 'sara-new', person: 'sara', day: 'Today', time: '08:15', summary: 'Completed another step' });
  return { people, events };
}

function reset() {
  state.generation++;
  const data = fixtures();
  state.connections = data.people;
  state.events = data.events;
  state.sent = new Set(state.scenario === 'sent' ? data.events.map((e) => e.id) : data.events.some((e) => e.id === 'mina-final') ? ['mina-final'] : []);
  state.quota = new Set(data.events.filter((e) => state.sent.has(e.id)).map((e) => e.person));
  if (state.scenario === 'limit') { state.sent.add('sara-evening'); state.quota.add('sara'); }
  state.pending = new Set(); state.errors = {}; state.attempts = {}; state.baselineSent = new Set();
  state.stale = state.scenario === 'stale'; state.loading = state.scenario === 'loading';
  accepted = false; detailsOpen = false;
  for (const frame of Object.values(view)) Object.assign(frame, { page: 'chain', tab: 'show', person: null, toast: '', qr: false });
  render();
}

function button(action, label, cls = 'app-secondary', extra = '') { return `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`; }
function back(label = 'Back to Connect') { return button('back', icon('arrow-left', true) + label, 'app-quiet app-back'); }
function avatar(person) { return `<span class="app-avatar" aria-hidden="true">${escape(person.name[0])}</span>`; }
function navigation(kind) {
  return `<nav class="app-nav" aria-label="Main navigation">${[['home', 'house', 'Home'], ['chain', 'link-2', 'Chain'], ['journey', 'trending-up', 'Journey'], ['profile', 'user', 'Profile']].map(([id, glyph, label]) => button(`nav-${id}`, icon(glyph) + `<span>${label}</span>`, '', `${(view[kind].page === id || (id === 'chain' && !['home', 'journey', 'profile'].includes(view[kind].page))) ? 'aria-current="page"' : ''} aria-label="${label}"`)).join('')}</nav>`;
}
function header() { return `<header class="app-header"><div><h2>MehrChain</h2><p class="app-subtitle">A little support for each other.</p></div></header>`; }
function empty(title, text, cta = '', mero = false) { return `<section class="app-empty">${mero ? `<img src="${MERO}" alt="Mero, your MehrChain companion">` : `<span class="empty-icon">${icon('check-check')}</span>`}<h3>${title}</h3><p>${text}</p>${cta}</section>`; }
function sharePanel(current = false) {
  if (current) return `<section class="app-card app-current-share"><div class="app-invite-summary">${icon('book-open')}<div><p class="app-name">${escape(inviteHabit)}</p><p class="app-meta">-1d · Streak: 4d</p></div></div><div class="app-actions">${button('invite', icon('share-2', true) + 'Share', 'app-primary')}${button('copy', icon('copy', true) + 'Copy')}${button('qr', icon('qr-code'), 'app-secondary', 'aria-label="Show invite QR code"')}</div></section>`;
  return `<section class="app-card"><div class="app-card-row"><span class="app-avatar">${icon('link-2', true)}</span><div class="app-grow"><h3 class="app-name">A little company for your commitment</h3><p class="app-meta">Invite someone with one of your public habits.</p></div></div><div class="app-actions">${button('invite', icon('plus', true) + 'Invite a partner', 'app-primary')}${button('accept', 'Open an invite')}</div></section>`;
}
function connectionCard(person, current = false) {
  const sent = state.baselineSent.has(person.id);
  return `<article class="app-card" data-connection="${person.id}"><div class="app-card-row">${avatar(person)}<div class="app-grow"><p class="app-name">@${escape(person.username)}</p><p class="app-habit">${escape(person.habit)}</p>${current ? `<p class="app-current-state">${state.stale ? 'Refresh required' : escape(person.status)}</p>` : `<p class="app-meta">Linked with your ${escape(person.mine.toLowerCase())}</p>`}</div>${current ? `<button type="button" class="app-icon-button ${sent ? 'baseline-sent' : ''}" data-action="baseline-heart" data-person="${person.id}" ${sent || state.stale || state.loading ? 'disabled' : ''} aria-label="${sent ? 'Heart sent' : 'Send heart to ' + escape(person.name)}">${icon('heart')}</button>` : ''}${button('details', icon('more-vertical'), 'app-icon-button', `data-person="${person.id}" aria-label="Chain details for ${escape(person.name)}"`)}</div></article>`;
}
function connect() {
  return sharePanel() + `<div class="app-section-head"><h3>Your connections</h3></div>` + (state.connections.length ? state.connections.map((p) => connectionCard(p)).join('') : empty('No chains connected yet', 'Invite someone to share a little support along the way.', '', true));
}
function eventCard(event) {
  const person = state.connections.find((p) => p.id === event.person);
  if (!person) return '';
  const supported = state.sent.has(event.id), pending = state.pending.has(event.person), limited = state.quota.has(event.person) && !supported;
  const status = supported ? 'sent' : pending ? 'pending' : limited ? 'limited' : 'ready';
  const label = supported ? 'Supported' : pending ? 'Sending…' : limited ? 'Daily limit reached' : state.errors[event.id] ? 'Try again' : 'Send a heart';
  return `<article class="app-card" data-event="${event.id}" aria-busy="${pending}"><div class="app-card-row">${avatar(person)}<div class="app-grow"><p class="app-name">@${escape(person.username)}</p><p class="app-habit">${escape(person.habit)}</p><p class="completion-meta">${icon('circle-check', true)}${escape(event.summary)}</p></div></div><div class="app-card-bottom"><p class="app-meta">${escape(event.day)} · ${event.time}</p><button type="button" class="support-button" data-action="heart" data-event="${event.id}" data-state="${status}" aria-label="${label} for ${escape(person.name)}'s ${escape(event.day.toLowerCase())} completion" ${supported || pending || limited || state.stale || state.loading ? 'disabled' : ''}>${icon('heart', true)}<span>${label}</span></button></div><span class="sr-only" role="status">${supported ? 'Heart confirmed for this completion.' : pending ? 'Sending heart.' : ''}</span>${limited ? '<p class="app-meta">You have already supported this habit today. This completion has not been supported yet.</p>' : ''}${state.errors[event.id] ? `<p class="app-error" role="alert">Your heart could not be confirmed. Try again when you are ready.</p>` : ''}</article>`;
}
function showUp() {
  const head = `<div class="app-section-head"><h3>A step worth acknowledging</h3>${button('refresh', icon('refresh-cw', true), 'app-icon-button', 'aria-label="Refresh completions"')}</div>`;
  if (state.loading) return head + `<p class="app-section-description" role="status">Checking for completed steps…</p><div class="app-skeleton" aria-hidden="true"><i></i><i></i><i></i></div><div class="app-skeleton" aria-hidden="true"><i></i><i></i><i></i></div>` + button('refresh', 'Check again', 'app-secondary full');
  if (state.stale) return head + `<div class="app-callout" role="alert"><strong>Completions need a refresh.</strong><p>We could not check for updates. Refresh before sending support.</p>${button('refresh', icon('refresh-cw', true) + 'Try refresh', 'app-quiet')}</div>`;
  if (!state.connections.length) return head + empty('A little support starts with a connection', 'Invite someone, then their completed steps will appear here.', button('connect-tab', 'Go to Connect', 'app-primary'), true);
  const pending = state.events.filter((e) => !state.sent.has(e.id));
  const supported = state.events.filter((e) => state.sent.has(e.id));
  let body = `<p class="app-section-description">When someone completes a step, you can send a little support.</p>`;
  if (!pending.length) body += empty(supported.length ? 'You have shown up for every step here' : 'No new completed steps', supported.length ? 'Your support is sent. New completed steps will appear here.' : 'There is nothing to respond to right now. Come back whenever you like.', button('connect-tab', 'View connections', 'app-quiet'));
  for (const day of ['Today', 'Yesterday']) {
    const rows = pending.filter((e) => e.day === day);
    if (rows.length) body += `<h4 class="app-day-label">${day === 'Yesterday' ? 'Yesterday · still worth a little support' : day}</h4>` + rows.map(eventCard).join('');
  }
  if (supported.length) body += `<details class="app-details" data-supported ${detailsOpen ? 'open' : ''}><summary>Support you have sent</summary>${supported.map(eventCard).join('')}</details>`;
  return head + body;
}
function current() {
  return sharePanel(true) + `<p class="app-current-title">Active Support Chains</p>` + (state.connections.length ? state.connections.map((p) => connectionCard(p, true)).join('') : empty('No Chains Connected Yet', 'Share your invite link with friends to start a mutual support chain.', '', true));
}
function invitation(kind) {
  const qr = view[kind].qr;
  return back() + `<h3 class="app-destination-title">Invite a partner</h3><p class="app-section-description">Choose the public habit you want to share.</p><section class="app-card"><label for="${kind}-habit">Your public habit</label><select id="${kind}-habit" data-own-habit>${ownHabits.map((h) => `<option ${h === inviteHabit ? 'selected' : ''}>${h}</option>`).join('')}</select><p class="app-meta">Your connection shares this commitment's activity.</p><div class="app-link-display">https://example.invalid/chain/demo-invite</div>${qr ? `<img class="app-qr" src="${QR}" alt="QR code for the synthetic example.invalid invitation">` : ''}<div class="app-actions">${button('share', icon('share-2', true) + 'Share link', 'app-primary')}${button('copy', icon('copy', true) + 'Copy link')}</div>${button('qr', icon('qr-code', true) + (qr ? 'Hide QR code' : 'Show QR code'), 'app-quiet full')}</section>`;
}
function acceptance(kind) {
  return back() + `<h3 class="app-destination-title">A little support, together</h3><p class="app-section-description">Jules invited you to connect.</p><section class="app-card"><p class="app-name">@jules</p><p class="app-habit">Practice a little drawing</p><label for="${kind}-accept-habit">Your public habit to link</label><select id="${kind}-accept-habit" data-own-habit>${ownHabits.map((h) => `<option ${h === inviteHabit ? 'selected' : ''}>${h}</option>`).join('')}</select><div class="app-actions">${button('confirm-accept', 'Accept invitation', 'app-primary')}${button('back', 'Not now')}</div></section>`;
}
function detail(kind) {
  const person = state.connections.find((p) => p.id === view[kind].person);
  if (!person) return back() + '<p>This chain is no longer available.</p>';
  return back() + `<h3 class="app-destination-title">Your chain with ${escape(person.name)}</h3><section class="app-card"><p class="app-name">@${escape(person.username)}</p><p class="app-habit">${escape(person.habit)}</p><p class="app-meta">Your linked habit: ${escape(person.mine)}</p><p class="app-meta">Support is optional. You can manage this connection here.</p>${button('disconnect', 'Disconnect this chain', 'app-quiet full')}</section>`;
}
function disconnect(kind) {
  const person = state.connections.find((p) => p.id === view[kind].person);
  return back('Back to chain details') + `<h3 class="app-destination-title">Disconnect this chain?</h3><p class="app-section-description">Only ${escape(person?.name || 'your partner')} will receive your explanation.</p><form data-disconnect-form><section class="app-card"><label for="${kind}-reason">Reason</label><select id="${kind}-reason" required name="reason"><option value="">Choose a reason</option><option value="TAKING_BREAK">I'm taking a break from this chain.</option><option value="DIFFERENT_ROUTINE">I have a different routine now.</option><option value="OTHER">I have decided to end this chain.</option><option value="PREFER_NOT_TO_SHARE">I prefer not to share a reason.</option></select><label for="${kind}-note">Optional note</label><textarea id="${kind}-note" name="note" maxlength="500" rows="3"></textarea><p class="app-meta">Your habit and past effort stay yours.</p><div class="app-actions"><button class="app-secondary" type="button" data-action="cancel-disconnect">Keep connection</button><button class="app-primary" type="submit">Confirm disconnect</button></div></section></form>`;
}
function content(kind) {
  const local = view[kind];
  if (local.page === 'invite') return invitation(kind);
  if (local.page === 'accept') return acceptance(kind);
  if (local.page === 'details') return detail(kind);
  if (local.page === 'disconnect') return disconnect(kind);
  if (local.page !== 'chain') return `<h3 class="app-destination-title">${escape(local.page[0].toUpperCase() + local.page.slice(1))}</h3><p class="app-section-description">Your Chain is one tap away.</p>${button('nav-chain', 'Return to Chain', 'app-primary')}`;
  if (kind === 'current') return header() + current();
  const unread = state.events.some((e) => !state.sent.has(e.id));
  return header() + `<div class="app-tabs" role="tablist" aria-label="Chain views"><button type="button" class="app-tab" role="tab" id="proposed-tab-connect" aria-controls="proposed-panel" aria-selected="${local.tab === 'connect'}" tabindex="${local.tab === 'connect' ? '0' : '-1'}" data-action="connect-tab">${icon('link-2', true)}Connect</button><button type="button" class="app-tab" role="tab" id="proposed-tab-show" aria-controls="proposed-panel" aria-selected="${local.tab === 'show'}" tabindex="${local.tab === 'show' ? '0' : '-1'}" data-action="show-tab">${icon('heart', true)}Show up${unread && !state.stale && !state.loading ? '<span class="activity-dot" aria-hidden="true"></span>' : ''}</button></div><section id="proposed-panel" role="tabpanel" aria-labelledby="proposed-tab-${local.tab}">${local.tab === 'connect' ? connect() : showUp()}</section>`;
}
function render(focusSelector = '') {
  const kinds = state.presentation === 'compare' ? ['current', 'proposed'] : [state.presentation];
  const oldScroll = {};
  document.querySelectorAll('.app').forEach((frame) => { oldScroll[frame.dataset.kind] = frame.querySelector('.app-scroll').scrollTop; });
  const focused = document.activeElement;
  const oldKind = focused?.closest('.app')?.dataset.kind;
  const oldAction = focused?.dataset?.action;
  const oldEvent = focused?.dataset?.event;
  $('previews').dataset.compare = state.presentation === 'compare';
  $('previews').innerHTML = kinds.map((kind) => `<div class="preview-column" style="--frame-width:${state.width}px"><div class="frame-heading"><strong>${kind === 'proposed' ? 'PROPOSED · Connect & Show up' : 'CURRENT · Template reconstruction'}</strong><span>${state.width}px</span></div><div class="app" data-kind="${kind}" data-theme="${state.theme}"><div class="app-topline"><span>09:41</span><span>MehrChain</span></div><div class="app-scroll"><div class="app-page">${content(kind)}${view[kind].toast ? `<p class="app-toast" role="status">${escape(view[kind].toast)}</p>` : ''}</div></div>${navigation(kind)}</div></div>`).join('');
  document.querySelectorAll('.app').forEach((frame) => { frame.querySelector('.app-scroll').scrollTop = oldScroll[frame.dataset.kind] || 0; });
  const restored = focusSelector ? document.querySelector(focusSelector) : oldAction && oldKind ? document.querySelector(`.app[data-kind="${oldKind}"] [data-action="${oldAction}"]${oldEvent ? `[data-event="${oldEvent}"]` : ''}`) : null;
  if (restored && !restored.disabled) restored.focus({ preventScroll: true });
}
function go(kind, page) {
  view[kind].page = page; view[kind].toast = '';
  render();
  const frame = document.querySelector(`.app[data-kind="${kind}"]`);
  frame.querySelector('.app-scroll').scrollTop = 0;
  const target = frame.querySelector('.app-back, button[aria-selected="true"], .app-primary');
  target?.focus({ preventScroll: true });
}
function sendHeart(eventId) {
  const event = state.events.find((e) => e.id === eventId);
  if (!event || state.stale || state.loading || state.sent.has(eventId) || state.quota.has(event.person) || state.pending.has(event.person)) return;
  const generation = state.generation;
  state.pending.add(event.person); delete state.errors[eventId];
  state.attempts[eventId] = (state.attempts[eventId] || 0) + 1;
  render();
  setTimeout(() => {
    if (state.generation !== generation) return;
    state.pending.delete(event.person);
    if (!state.connections.some((p) => p.id === event.person)) return;
    if (state.scenario === 'failure' && state.attempts[eventId] === 1) state.errors[eventId] = true;
    else { state.sent.add(eventId); state.quota.add(event.person); detailsOpen = true; }
    render();
    const selector = `.app[data-kind="proposed"] [data-action="heart"][data-event="${eventId}"]`;
    const target = document.querySelector(selector);
    if (target && !target.disabled) target.focus({ preventScroll: true });
    else document.querySelector('.app[data-kind="proposed"] [data-supported] summary')?.focus({ preventScroll: true });
  }, 700);
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button[data-action]');
  if (!target || target.disabled) return;
  const kind = target.closest('.app').dataset.kind, local = view[kind], action = target.dataset.action;
  if (action.startsWith('nav-')) { go(kind, action.slice(4)); return; }
  if (action === 'show-tab' || action === 'connect-tab') { local.tab = action === 'show-tab' ? 'show' : 'connect'; local.page = 'chain'; local.toast = ''; render(`[data-kind="${kind}"] #proposed-tab-${local.tab}`); return; }
  if (action === 'heart') { sendHeart(target.dataset.event); return; }
  if (action === 'baseline-heart') { state.baselineSent.add(target.dataset.person); render(); return; }
  if (action === 'invite') { go(kind, 'invite'); return; }
  if (action === 'accept') { go(kind, 'accept'); return; }
  if (action === 'back') { if (local.page === 'disconnect') go(kind, 'details'); else { local.tab = 'connect'; go(kind, 'chain'); } return; }
  if (action === 'details') { local.person = target.dataset.person; go(kind, 'details'); return; }
  if (action === 'disconnect') { go(kind, 'disconnect'); return; }
  if (action === 'cancel-disconnect') { go(kind, 'details'); return; }
  if (action === 'qr') { if (local.page !== 'invite') { local.qr = true; go(kind, 'invite'); } else { local.qr = !local.qr; render(); } return; }
  if (action === 'copy' || action === 'share') { local.toast = action === 'copy' ? 'Invite link ready to copy.' : 'Invite link ready to share.'; render(); return; }
  if (action === 'confirm-accept') {
    if (!accepted) { state.connections.push({ id: 'jules', username: 'jules', name: 'Jules', habit: 'Practice a little drawing', mine: inviteHabit, status: 'Not completed today' }); accepted = true; }
    local.tab = 'connect'; go(kind, 'chain'); local.toast = 'Connected with Jules.'; render(); return;
  }
  if (action === 'refresh') {
    const generation = state.generation;
    state.loading = true; state.stale = false; render();
    setTimeout(() => { if (state.generation !== generation) return; state.loading = false; render(); }, 700);
  }
});
document.addEventListener('change', (event) => {
  if (event.target.matches('[data-own-habit]')) { inviteHabit = event.target.value; return; }
  if (['theme', 'width', 'presentation', 'scenario'].includes(event.target.id)) {
    state[event.target.id] = event.target.value;
    if (event.target.id === 'scenario') reset(); else render();
  }
  if (event.target.name === 'reason') {
    const form = event.target.closest('form'), note = form.elements.note;
    note.disabled = event.target.value === 'PREFER_NOT_TO_SHARE';
    if (note.disabled) note.value = '';
  }
});
document.addEventListener('submit', (event) => {
  if (!event.target.matches('[data-disconnect-form]')) return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  const kind = event.target.closest('.app').dataset.kind, person = view[kind].person;
  state.connections = state.connections.filter((p) => p.id !== person);
  state.events = state.events.filter((e) => e.person !== person);
  view[kind].tab = 'connect'; go(kind, 'chain'); view[kind].toast = 'Chain disconnected.'; render();
});
document.addEventListener('keydown', (event) => {
  const tab = event.target.closest('[role="tab"]');
  if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next = event.key === 'Home' ? 'connect' : event.key === 'End' ? 'show' : view.proposed.tab === 'show' ? 'connect' : 'show';
    view.proposed.tab = next; render(`#proposed-tab-${next}`);
  }
  if (event.key === 'Escape') {
    const frame = event.target.closest('.app');
    if (!frame) return;
    const kind = frame.dataset.kind;
    if (view[kind].page !== 'chain') { event.preventDefault(); view[kind].tab = 'connect'; go(kind, 'chain'); }
  }
});
document.addEventListener('toggle', (event) => { if (event.target.matches?.('[data-supported]')) detailsOpen = event.target.open; }, true);
$('reset').addEventListener('click', reset);
reset();
