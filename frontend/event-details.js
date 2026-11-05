(function () {
  const main = document.querySelector('main');
  main.innerHTML = `
    <div class="mx-auto max-w-[1280px] px-margin py-space-xl">
      <a class="mb-space-md inline-flex items-center gap-1 text-primary hover:underline" href="/">← Browse events</a>
      <section class="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div class="mb-space-sm flex flex-wrap items-center gap-space-sm text-on-surface-variant">
          <span class="rounded-full bg-primary-fixed px-2.5 py-1 font-label-caps text-label-caps uppercase text-on-primary-fixed">Event details</span>
          <span id="event-date" class="font-body-sm text-body-sm">Loading event…</span>
          <span id="event-location" class="font-body-sm text-body-sm"></span>
        </div>
        <h1 id="event-title" class="font-headline-lg text-headline-lg text-on-surface">Loading event…</h1>
        <p id="event-description" class="mt-space-sm max-w-3xl whitespace-pre-wrap text-on-surface-variant">The event details will appear here.</p>
        <p id="event-details-status" class="mt-space-sm font-body-sm text-body-sm text-on-surface-variant" role="status"></p>
      </section>
      <section class="mt-space-lg grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <div class="rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
          <h2 class="font-headline-md text-headline-md text-on-surface">Register for this event</h2>
          <p class="mt-1 text-body-sm text-on-surface-variant">Sign in above, then submit your attendee details.</p>
          <form id="event-registration-form" class="mt-space-md space-y-space-sm">
            <label class="block font-label-caps text-label-caps uppercase text-on-surface-variant" for="attendee-name">Full name</label>
            <input id="attendee-name" required maxlength="120" class="h-11 w-full rounded-lg bg-surface-container-low px-space-md text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" placeholder="Your name" />
            <label class="block font-label-caps text-label-caps uppercase text-on-surface-variant" for="ticket-tier">Ticket tier</label>
            <select id="ticket-tier" class="h-11 w-full rounded-lg bg-surface-container-low px-space-md text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary">
              <option value="standard">Standard</option>
              <option value="vip_workshop">VIP workshop</option>
            </select>
            <label class="block font-label-caps text-label-caps uppercase text-on-surface-variant" for="attendee-affiliation">Company / affiliation</label>
            <input id="attendee-affiliation" maxlength="160" class="h-11 w-full rounded-lg bg-surface-container-low px-space-md text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" placeholder="Optional" />
            <label class="block font-label-caps text-label-caps uppercase text-on-surface-variant" for="attendee-dietary">Dietary or accessibility needs</label>
            <textarea id="attendee-dietary" maxlength="500" rows="3" class="w-full rounded-lg bg-surface-container-low px-space-md py-2 text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" placeholder="Optional"></textarea>
            <button id="registration-submit" class="w-full rounded-lg bg-primary px-space-md py-3 font-label-md text-label-md text-on-primary hover:bg-primary-container disabled:opacity-50" type="submit">Complete registration</button>
          </form>
          <p id="registration-result" class="mt-space-sm rounded-lg bg-surface-container-low p-space-sm text-body-sm text-on-surface-variant" role="status" aria-live="polite"></p>
        </div>
        <aside class="rounded-2xl bg-surface-container-low p-space-lg">
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Your registrations</h2>
          <p class="mt-1 text-body-sm text-on-surface-variant">After registering, view your private registration list from the student portal.</p>
          <a href="/my-registrations" class="mt-space-md inline-flex rounded-lg bg-surface-container-lowest px-space-md py-2 font-label-md text-label-md text-primary">My registrations</a>
        </aside>
      </section>
    </div>`;

  EventHubApi.mountAuthPanel(main);
  const status = document.getElementById('event-details-status');
  const result = document.getElementById('registration-result');
  const eventId = new URLSearchParams(window.location.search).get('id') || new URLSearchParams(window.location.search).get('event_id');
  let currentEvent = null;

  function label(event) {
    return event.title || event.name || event.event_name || `Event ${event.id}`;
  }

  function displayDate(event) {
    const value = event.start_date || event.starts_at || event.start_time || event.event_date || event.date;
    if (!value) return 'Date to be announced';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  async function loadEvent() {
    if (!eventId) {
      document.getElementById('event-title').textContent = 'Choose an event';
      document.getElementById('event-description').textContent = 'Return to Browse events and select an event to see its details and register.';
      document.getElementById('event-registration-form').querySelector('button').disabled = true;
      status.textContent = 'No event id was provided.';
      return;
    }
    try {
      currentEvent = await EventHubApi.request(`/api/events/${encodeURIComponent(eventId)}`);
      document.getElementById('event-title').textContent = label(currentEvent);
      document.getElementById('event-description').textContent = currentEvent.description || 'No description is available for this event.';
      document.getElementById('event-date').textContent = displayDate(currentEvent);
      document.getElementById('event-location').textContent = currentEvent.location || currentEvent.venue || '';
      status.textContent = `Loaded from GET /api/events/${currentEvent.id}.`;
      document.title = `${label(currentEvent)} | Campus Connect`;
    } catch (error) {
      document.getElementById('event-title').textContent = 'Event unavailable';
      document.getElementById('event-description').textContent = error.message;
      status.textContent = error.status === 404 ? 'This event id was not found.' : 'Could not connect to the events API.';
      document.getElementById('event-registration-form').querySelector('button').disabled = true;
    }
  }

  document.getElementById('event-registration-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!currentEvent) return;
    const button = document.getElementById('registration-submit');
    button.disabled = true;
    result.textContent = 'Submitting registration…';
    const email = EventHubApi.currentEmail();
    const payload = {
      event_id: currentEvent.id,
      ticket_tier: document.getElementById('ticket-tier').value,
      attendee: {
        full_name: document.getElementById('attendee-name').value.trim(),
        email,
        affiliation: document.getElementById('attendee-affiliation').value.trim(),
        dietary_accessibility: document.getElementById('attendee-dietary').value.trim()
      }
    };
    try {
      const registration = await EventHubApi.request('/api/registrations', {
        method: 'POST',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      result.textContent = `Registration created (201). Reference: ${registration.id || 'saved'}.`;
    } catch (error) {
      result.textContent = error.status === 409
        ? 'You are already registered for this event.'
        : error.message;
    } finally {
      button.disabled = false;
    }
  });

  loadEvent();
})();
