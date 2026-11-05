(function () {
  const grid = document.getElementById('events-grid');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const searchInput = document.getElementById('event-search-input');
  const foodCheckbox = document.getElementById('filter-free-food');
  const categoryButtons = [...document.querySelectorAll('.category-btn')];
  const locationSelect = document.getElementById('location-select');
  const sortSelect = document.getElementById('sort-select');
  const eventsEndpointBadge = document.getElementById('api-inspector-badge');
  let events = [];
  let currentCategory = 'all';
  let loadError = null;

  function eventId(event) {
    return event.id ?? event.event_id;
  }

  function eventTitle(event) {
    return event.title || event.name || event.event_name || `Event ${event.id}`;
  }

  function eventLocation(event) {
    return event.location || event.venue || event.address || 'Location to be announced';
  }

  function dateValue(event) {
    return event.start_date || event.starts_at || event.start_time || event.event_date || event.date || event.timestamp || '';
  }

  function formatDate(value) {
    if (!value) return 'Date to be announced';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function categoryFor(event) {
    const value = String(event.category || event.category_name || event.type || '').toLowerCase();
    if (/tech|computer|ai|science|engineering/.test(value)) return 'tech';
    if (/career|job|employment|network/.test(value)) return 'career';
    if (/art|music|film|culture/.test(value)) return 'arts';
    if (/sport|fitness|wellness/.test(value)) return 'sports';
    return 'campus';
  }

  function hasFreeFood(event) {
    return event.free_food === true || event.offers_food === true || event.food_available === true;
  }

  function createCard(event) {
    const card = document.createElement('article');
    card.className = 'group bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden';
    card.dataset.category = categoryFor(event);
    card.dataset.food = String(hasFreeFood(event));

    const banner = document.createElement('div');
    banner.className = 'relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary-fixed to-surface-container-high flex items-center justify-center';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-primary text-5xl';
    icon.textContent = 'event';
    banner.append(icon);

    const body = document.createElement('div');
    body.className = 'p-space-md flex flex-col flex-1 justify-between gap-space-md';
    const details = document.createElement('div');
    details.className = 'flex flex-col gap-space-xs';

    const category = document.createElement('span');
    category.className = 'font-label-caps text-label-caps uppercase text-primary';
    category.textContent = event.category || event.category_name || 'Campus event';
    const title = document.createElement('h2');
    title.className = 'font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2';
    title.textContent = eventTitle(event);
    const date = document.createElement('p');
    date.className = 'font-body-sm text-body-sm text-on-surface-variant';
    date.textContent = formatDate(dateValue(event));
    const location = document.createElement('p');
    location.className = 'font-body-sm text-body-sm text-on-surface-variant';
    location.textContent = eventLocation(event);
    const description = document.createElement('p');
    description.className = 'font-body-sm text-body-sm text-on-surface-variant line-clamp-3';
    description.textContent = event.description || 'Open this event to view details and registration options.';
    details.append(category, title, date, location, description);

    const link = document.createElement('a');
    link.className = 'w-full bg-primary hover:bg-primary-container text-on-primary py-2 rounded-lg font-label-md text-label-md transition-colors text-center shadow-xs';
    link.href = `/event-details?id=${encodeURIComponent(eventId(event))}`;
    link.textContent = 'View details & register';
    body.append(details, link);
    card.append(banner, body);
    return card;
  }

  function selectedLocation() {
    if (!locationSelect || !locationSelect.value || locationSelect.value === 'all') return '';
    return locationSelect.options[locationSelect.selectedIndex]?.text.toLowerCase() || locationSelect.value.toLowerCase();
  }

  function filteredEvents() {
    const query = (searchInput?.value || '').trim().toLowerCase();
    const locationQuery = selectedLocation();
    const matching = events.filter(event => {
      const text = [eventTitle(event), event.description, eventLocation(event), event.organizer, event.category]
        .filter(Boolean).join(' ').toLowerCase();
      return (!query || text.includes(query)) &&
        (currentCategory === 'all' || categoryFor(event) === currentCategory) &&
        (!foodCheckbox?.checked || hasFreeFood(event)) &&
        (!locationQuery || eventLocation(event).toLowerCase().includes(locationQuery));
    });
    const sort = sortSelect?.value || 'upcoming';
    if (sort === 'title') matching.sort((a, b) => eventTitle(a).localeCompare(eventTitle(b)));
    else if (sort === 'newest') matching.sort((a, b) => new Date(dateValue(b)) - new Date(dateValue(a)));
    else matching.sort((a, b) => new Date(dateValue(a) || 8640000000000000) - new Date(dateValue(b) || 8640000000000000));
    return matching;
  }

  function render() {
    const matching = filteredEvents();
    grid.replaceChildren(...matching.map(createCard));
    resultsCount.textContent = loadError ? 'Could not load events' : `${matching.length} of ${events.length} events`;
    if (matching.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.classList.add('flex');
      const heading = emptyState.querySelector('h3');
      const message = emptyState.querySelector('p');
      heading.textContent = loadError ? 'Events are temporarily unavailable' : 'No campus events found';
      message.textContent = loadError ? loadError : 'No events match these filters. Try changing your search.';
      grid.classList.add('hidden');
    } else {
      emptyState.classList.add('hidden');
      emptyState.classList.remove('flex');
      grid.classList.remove('hidden');
    }
  }

  categoryButtons.forEach(button => button.addEventListener('click', () => {
    categoryButtons.forEach(item => item.classList.remove('bg-primary', 'text-on-primary', 'active'));
    button.classList.add('bg-primary', 'text-on-primary', 'active');
    currentCategory = button.dataset.cat || 'all';
    render();
  }));
  searchInput?.addEventListener('input', render);
  document.getElementById('search-trigger-btn')?.addEventListener('click', render);
  foodCheckbox?.addEventListener('change', render);
  locationSelect?.addEventListener('change', render);
  sortSelect?.addEventListener('change', render);
  document.getElementById('reset-filters')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (foodCheckbox) foodCheckbox.checked = false;
    if (locationSelect) locationSelect.value = 'all';
    currentCategory = 'all';
    categoryButtons.forEach(button => {
      button.classList.toggle('bg-primary', button.dataset.cat === 'all');
      button.classList.toggle('text-on-primary', button.dataset.cat === 'all');
      button.classList.toggle('active', button.dataset.cat === 'all');
    });
    render();
  });
  document.getElementById('empty-state')?.querySelector('button')?.addEventListener('click', () => {
    document.getElementById('reset-filters')?.click();
  });

  async function loadEvents() {
    loadError = null;
    resultsCount.textContent = 'Loading events…';
    try {
      const response = await EventHubApi.request('/api/events');
      if (!Array.isArray(response)) throw new Error('The events API returned an unexpected response.');
      events = response.filter(event => event && eventId(event) !== undefined && eventId(event) !== null);
      if (eventsEndpointBadge) eventsEndpointBadge.setAttribute('title', `Connected: ${EventHubApi.apiUrl('/api/events')}`);
    } catch (error) {
      loadError = error.message;
      events = [];
      if (eventsEndpointBadge) eventsEndpointBadge.setAttribute('title', `API error: ${error.message}`);
    }
    render();
  }

  const page = document.querySelector('main');
  const summary = document.getElementById('results-summary');
  if (summary) summary.textContent = 'Events loaded directly from the events API.';
  loadEvents();
})();
