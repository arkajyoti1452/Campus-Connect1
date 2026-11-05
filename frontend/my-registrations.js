(function () {
  const main = document.querySelector('main');
  main.innerHTML = `
    <div class="mx-auto max-w-[1280px] px-margin py-space-xl">
      <div class="flex flex-wrap items-end justify-between gap-space-md">
        <div>
          <p class="font-label-caps text-label-caps uppercase text-primary">GET /api/me/registrations</p>
          <h1 class="mt-1 font-headline-lg text-headline-lg text-on-surface">My registrations</h1>
          <p class="mt-1 text-body-md text-on-surface-variant">Your saved event registrations appear here after you sign in.</p>
        </div>
        <button id="refresh-registrations" class="rounded-lg bg-primary px-space-md py-2.5 font-label-md text-label-md text-on-primary">Refresh</button>
      </div>
      <p id="registrations-status" class="my-space-md rounded-lg bg-surface-container-low p-space-md text-body-sm text-on-surface-variant" role="status" aria-live="polite">Sign in to load your registrations.</p>
      <div id="registrations-list" class="grid grid-cols-1 gap-space-md lg:grid-cols-2"></div>
    </div>`;
  EventHubApi.mountAuthPanel(main);

  const list = document.getElementById('registrations-list');
  const status = document.getElementById('registrations-status');

  function formatDate(value) {
    if (!value) return 'Date not provided';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  async function eventName(eventId, cache) {
    if (!eventId) return 'Event';
    if (!cache.has(eventId)) {
      cache.set(eventId, EventHubApi.request(`/api/events/${encodeURIComponent(eventId)}`)
        .then(event => event.title || event.name || event.event_name || `Event ${event.id}`)
        .catch(() => `Event ${eventId}`));
    }
    return cache.get(eventId);
  }

  async function renderRegistrations(registrations) {
    const cache = new Map();
    const names = await Promise.all(registrations.map(item => eventName(item.event_id, cache)));
    list.replaceChildren();
    registrations.forEach((registration, index) => {
      const card = document.createElement('article');
      card.className = 'rounded-xl bg-surface-container-lowest p-space-lg shadow-sm';
      const heading = document.createElement('h2');
      heading.className = 'font-headline-sm text-headline-sm text-on-surface';
      heading.textContent = names[index];
      const tier = document.createElement('p');
      tier.className = 'mt-2 text-body-sm text-on-surface-variant';
      tier.textContent = `Ticket tier: ${registration.ticket_tier || 'standard'}`;
      const registered = document.createElement('p');
      registered.className = 'mt-1 text-body-sm text-on-surface-variant';
      registered.textContent = `Registered: ${formatDate(registration.created_at || registration.createdAt || registration.registered_at)}`;
      const link = document.createElement('a');
      link.className = 'mt-space-md inline-flex text-primary hover:underline';
      link.href = `/event-details?id=${encodeURIComponent(registration.event_id || '')}`;
      link.textContent = 'View event';
      card.append(heading, tier, registered, link);
      list.append(card);
    });
  }

  async function loadRegistrations() {
    if (!EventHubApi.accessToken) {
      list.replaceChildren();
      status.textContent = 'Sign in above to load your registrations.';
      return;
    }
    status.textContent = 'Loading your registrations…';
    try {
      const registrations = await EventHubApi.request('/api/me/registrations', { auth: true });
      if (!Array.isArray(registrations)) throw new Error('The registrations API returned an unexpected response.');
      await renderRegistrations(registrations);
      status.textContent = registrations.length
        ? `${registrations.length} registration${registrations.length === 1 ? '' : 's'} loaded.`
        : 'You do not have any registrations yet.';
    } catch (error) {
      list.replaceChildren();
      status.textContent = error.message;
    }
  }

  document.getElementById('refresh-registrations').addEventListener('click', loadRegistrations);
  window.addEventListener('eventhub-auth-changed', loadRegistrations);
  loadRegistrations();
})();
