(function () {
  const main = document.querySelector('main');
  main.innerHTML = `
    <div class="mx-auto max-w-[1440px] px-margin py-space-xl">
      <div class="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <p class="font-label-caps text-label-caps uppercase text-primary">GET /api/events/{id}/registrations</p>
          <h1 class="mt-1 font-headline-lg text-headline-lg text-on-surface">Organizer attendee roster</h1>
          <p class="mt-1 text-body-md text-on-surface-variant">Only the organizer who owns the selected event can view its registrations.</p>
        </div>
        <button id="refresh-roster" class="rounded-lg bg-primary px-space-md py-2.5 font-label-md text-label-md text-on-primary">Refresh roster</button>
      </div>
      <section class="my-space-md grid grid-cols-1 gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <div>
          <label class="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant" for="roster-event">Choose an event</label>
          <select id="roster-event" class="h-11 w-full rounded-lg bg-surface-container-low px-space-md text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary">
            <option value="">Loading events…</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant" for="roster-search">Search attendees</label>
          <input id="roster-search" type="search" class="h-11 w-full rounded-lg bg-surface-container-low px-space-md text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" placeholder="Name or email" />
        </div>
        <button id="export-roster" class="h-11 rounded-lg bg-surface-container-high px-space-md font-label-md text-label-md text-on-surface">Export CSV</button>
      </section>
      <p id="roster-status" class="mb-space-md rounded-lg bg-surface-container-low p-space-md text-body-sm text-on-surface-variant" role="status" aria-live="polite">Sign in with the event organizer account to load attendees.</p>
      <section class="overflow-x-auto rounded-xl bg-surface-container-lowest shadow-sm">
        <table class="w-full border-collapse text-left">
          <thead class="bg-surface-container-low text-label-caps text-label-caps uppercase text-on-surface-variant">
            <tr><th class="p-space-md">Attendee</th><th class="p-space-md">Email</th><th class="p-space-md">Ticket</th><th class="p-space-md">Registered</th></tr>
          </thead>
          <tbody id="roster-rows" class="divide-y divide-surface-container"></tbody>
        </table>
      </section>
      <p id="roster-count" class="mt-space-sm text-body-sm text-on-surface-variant">0 attendees</p>
    </div>`;
  EventHubApi.mountAuthPanel(main);

  const eventSelect = document.getElementById('roster-event');
  const searchInput = document.getElementById('roster-search');
  const rows = document.getElementById('roster-rows');
  const status = document.getElementById('roster-status');
  const count = document.getElementById('roster-count');
  let registrations = [];

  function eventTitle(event) {
    return event.title || event.name || event.event_name || `Event ${event.id}`;
  }

  function value(registration, field) {
    const attendee = registration.attendee && typeof registration.attendee === 'object'
      ? registration.attendee
      : {};
    if (field === 'full_name') return attendee.full_name || registration.full_name || registration.name || 'Attendee';
    if (field === 'email') return attendee.email || registration.email || '—';
    if (field === 'affiliation') return attendee.affiliation || registration.affiliation || '';
    return '';
  }

  function filtered() {
    const query = searchInput.value.trim().toLowerCase();
    return registrations.filter(item =>
      `${value(item, 'full_name')} ${value(item, 'email')} ${value(item, 'affiliation')}`.toLowerCase().includes(query)
    );
  }

  function renderRows() {
    const visible = filtered();
    rows.replaceChildren();
    visible.forEach(item => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-surface-container-low';
      const cells = [
        value(item, 'full_name'),
        value(item, 'email'),
        item.ticket_tier || 'standard',
        item.created_at || item.registered_at || '—'
      ];
      cells.forEach((text, index) => {
        const cell = document.createElement('td');
        cell.className = 'p-space-md text-body-sm text-on-surface';
        cell.textContent = index === 3 && text !== '—' ? new Date(text).toLocaleString() : text;
        row.append(cell);
      });
      rows.append(row);
    });
    count.textContent = `${visible.length} of ${registrations.length} attendees`;
  }

  async function loadEvents() {
    try {
      const events = await EventHubApi.request('/api/events');
      if (!Array.isArray(events)) throw new Error('The events API returned an unexpected response.');
      eventSelect.replaceChildren(new Option('Choose an event', ''));
      events.forEach(event => eventSelect.add(new Option(eventTitle(event), event.id)));
      const requestedId = new URLSearchParams(window.location.search).get('event');
      if (requestedId && events.some(event => String(event.id) === requestedId)) eventSelect.value = requestedId;
      else if (events.length === 1) eventSelect.value = String(events[0].id);
      if (eventSelect.value) await loadRoster();
    } catch (error) {
      eventSelect.replaceChildren(new Option('Unable to load events', ''));
      status.textContent = error.message;
    }
  }

  async function loadRoster() {
    const eventId = eventSelect.value;
    registrations = [];
    renderRows();
    if (!eventId) {
      status.textContent = 'Choose an event to load its attendees.';
      return;
    }
    if (!EventHubApi.accessToken) {
      status.textContent = 'Sign in above with the event organizer account to load attendees.';
      return;
    }
    status.textContent = 'Loading attendee list…';
    try {
      const response = await EventHubApi.request(`/api/events/${encodeURIComponent(eventId)}/registrations`, { auth: true });
      if (!Array.isArray(response)) throw new Error('The attendee API returned an unexpected response.');
      registrations = response;
      renderRows();
      status.textContent = `${registrations.length} registrations loaded for the selected event.`;
      history.replaceState(null, '', `/organizer-attendees?event=${encodeURIComponent(eventId)}`);
    } catch (error) {
      status.textContent = error.status === 403
        ? 'Access denied. Sign in with the account that owns this event.'
        : error.message;
    }
  }

  function exportCsv() {
    const quote = item => `"${String(item ?? '').replaceAll('"', '""')}"`;
    const data = [['Name', 'Email', 'Ticket tier', 'Registered at'], ...filtered().map(item => [
      value(item, 'full_name'),
      value(item, 'email'),
      item.ticket_tier || 'standard',
      item.created_at || item.registered_at || ''
    ])];
    const blob = new Blob([data.map(row => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'event-attendees.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  eventSelect.addEventListener('change', loadRoster);
  searchInput.addEventListener('input', renderRows);
  document.getElementById('refresh-roster').addEventListener('click', loadRoster);
  document.getElementById('export-roster').addEventListener('click', exportCsv);
  window.addEventListener('eventhub-auth-changed', loadRoster);
  loadEvents();
})();
