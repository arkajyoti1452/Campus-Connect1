import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  api,
  clearSession,
  eventDate,
  eventId,
  eventLocation,
  eventTitle,
  formatDate,
  readSession,
  saveSession,
  supabaseAuth,
} from './api.js';

const SessionContext = createContext(null);

function SessionProvider({ children }) {
  const [session, setSession] = useState(readSession);
  useEffect(() => {
    const sync = () => setSession(readSession());
    window.addEventListener('eventhub-auth-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('eventhub-auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return <SessionContext.Provider value={{ session, setSession }}>{children}</SessionContext.Provider>;
}

function useSession() {
  return useContext(SessionContext);
}

function Icon({ name, size = 19 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const shapes = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h7"/></>,
    ticket: <><path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Z"/><path d="M13 8v2M13 14v2"/></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.8 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.2-3"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
  };
  return <svg {...common}>{shapes[name] || shapes.grid}</svg>;
}

function routeFor(path) {
  if (path === '/my-registrations') return 'registrations';
  if (path === '/organizer-attendees') return 'attendees';
  if (path === '/event-details') return 'details';
  return path === '/' ? 'explore' : 'not-found';
}

function CampusApp() {
  const page = routeFor(window.location.pathname);
  const { session } = useSession();
  const activeEventId = new URLSearchParams(window.location.search).get('id');
  let content;
  if (page === 'explore') content = <ExploreEvents />;
  else if (page === 'details') content = <EventDetails eventId={activeEventId} />;
  else if (page === 'registrations') content = <MyRegistrations />;
  else if (page === 'attendees') content = <OrganizerAttendees />;
  else content = <PageNotFound />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Campus Connect home">
          <span className="brand-mark">CC</span>
          <span><strong>Campus Connect</strong><small>EVENT NETWORK</small></span>
        </a>
        <p className="nav-caption">YOUR CAMPUS</p>
        <nav className="side-nav" aria-label="Main navigation">
          <NavItem href="/" icon="grid" label="Explore events" active={page === 'explore' || page === 'details'} />
          <NavItem href="/my-registrations" icon="ticket" label="My registrations" active={page === 'registrations'} />
          <NavItem href="/organizer-attendees" icon="people" label="Organizer attendees" active={page === 'attendees'} />
        </nav>
        <div className="sidebar-note">
          <span className="live-dot" />
          <div><strong>Campus events, together</strong><span>Browse what’s happening near you.</span></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">CC</span><strong>Campus Connect</strong></div>
          <div className="topbar-spacer" />
          <span className={`connection-pill ${session.accessToken ? 'is-connected' : ''}`}><span className="live-dot" />{session.accessToken ? 'Signed in' : 'API connected'}</span>
          <span className="topbar-divider" />
          <div className="account-chip"><span className="avatar">{session.email ? session.email.charAt(0).toUpperCase() : 'G'}</span><span><strong>{session.email || 'Guest'}</strong><small>{session.email ? 'Campus account' : 'Browse as guest'}</small></span></div>
        </header>
        <main className="main-content">{content}</main>
        <footer className="footer">Campus Connect <span>•</span> Event information is served by your campus API.</footer>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active }) {
  return <a className={`nav-item ${active ? 'active' : ''}`} href={href}><Icon name={icon} /><span>{label}</span>{active && <span className="nav-active-dot" />}</a>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>;
}

function Notice({ type = 'info', children }) {
  if (!children) return null;
  return <div className={`notice ${type}`} role={type === 'error' ? 'alert' : 'status'}>{children}</div>;
}

function AuthPanel() {
  const { session } = useSession();
  const [email, setEmail] = useState(session.email || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Sign in to register and view private lists.');
  const [busy, setBusy] = useState(false);

  useEffect(() => setEmail(session.email || ''), [session.email]);

  async function authenticate(mode) {
    if (!email.trim() || !password) {
      setMessage('Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    setMessage(mode === 'signup' ? 'Creating your account…' : 'Signing in…');
    try {
      const result = await supabaseAuth(mode, email.trim(), password);
      if (result.access_token) {
        saveSession(result, email);
        setPassword('');
        setMessage(`Signed in as ${email.trim()}.`);
      } else {
        setMessage('Account created. Confirm your email, then sign in.');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-icon"><Icon name={session.accessToken ? 'ticket' : 'lock'} size={20} /></div>
      <div className="auth-body">
        <div className="auth-title-row"><div><h2>{session.accessToken ? 'Your campus account' : 'Sign in for registrations'}</h2><p>{session.accessToken ? `You’re signed in as ${session.email}.` : 'Use your Supabase account to register and see private lists.'}</p></div>{session.accessToken && <button className="button button-light button-small" onClick={clearSession}>Sign out</button>}</div>
        {!session.accessToken && <form className="auth-form" onSubmit={event => { event.preventDefault(); authenticate('signin'); }}>
          <label className="field"><span>Email</span><input autoComplete="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></label>
          <label className="field"><span>Password</span><input autoComplete="current-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Your account password" required /></label>
          <div className="auth-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}</button><button className="button button-light" type="button" disabled={busy} onClick={() => authenticate('signup')}>Create account</button></div>
        </form>}
        <p className="auth-message" role="status">{message}</p>
      </div>
    </section>
  );
}

function ExploreEvents() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('soonest');

  useEffect(() => {
    let active = true;
    api('/api/events').then(data => {
      if (!Array.isArray(data)) throw new Error('The events API returned an unexpected response.');
      if (active) setEvents(data.filter(item => eventId(item)));
    }).catch(reason => { if (active) { setEvents([]); setError(reason.message); } });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => ['All', ...new Set((events || []).map(item => item.category || item.category_name || item.type).filter(Boolean))], [events]);
  const visibleEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = (events || []).filter(item => {
      const text = [eventTitle(item), item.description, eventLocation(item), item.category, item.organizer].filter(Boolean).join(' ').toLowerCase();
      const itemCategory = item.category || item.category_name || item.type || '';
      return (!term || text.includes(term)) && (category === 'All' || itemCategory === category);
    });
    result.sort((a, b) => {
      if (sort === 'title') return eventTitle(a).localeCompare(eventTitle(b));
      if (sort === 'newest') return new Date(eventDate(b) || 0) - new Date(eventDate(a) || 0);
      return new Date(eventDate(a) || 8640000000000000) - new Date(eventDate(b) || 8640000000000000);
    });
    return result;
  }, [events, query, category, sort]);

  return <>
    <div className="hero-banner"><div className="hero-orb orb-one"/><div className="hero-orb orb-two"/><div className="hero-content"><span className="hero-kicker">MAKE THE MOST OF CAMPUS</span><h1>Find your next<br /><em>great experience.</em></h1><p>Discover workshops, meetups, performances, and more—all happening around campus.</p><a className="button button-white" href="#event-list">Explore events <Icon name="arrow" size={17} /></a></div><div className="hero-art"><div className="hero-calendar"><div className="calendar-top"/><span>THIS WEEK</span><strong>Good things<br />are happening.</strong><div className="calendar-dots"><i/><i/><i/><i/><i/></div></div><div className="art-spark">✦</div><div className="art-ring"/></div></div>
    <section className="events-section" id="event-list">
      <div className="section-heading"><div><p className="eyebrow">DISCOVER</p><h2>Campus events</h2><p className="muted">Explore what’s coming up and find your people.</p></div><span className="count-badge">{events === null ? 'Loading…' : `${visibleEvents.length} ${visibleEvents.length === 1 ? 'event' : 'events'}`}</span></div>
      <div className="filter-bar"><label className="search-box"><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search events, topics, venues…" /></label><label className="select-field"><span>Sort by</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="soonest">Soonest</option><option value="newest">Newest</option><option value="title">Title A–Z</option></select></label></div>
      {categories.length > 1 && <div className="category-row">{categories.map(item => <button key={item} className={`category-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}</div>}
      {error && <Notice type="error">Could not load events: {error}</Notice>}
      {events === null ? <LoadingState label="Loading events from your campus API…" /> : visibleEvents.length ? <div className="event-grid">{visibleEvents.map(event => <EventCard key={eventId(event)} event={event} />)}</div> : <EmptyState title={error ? 'Events are unavailable' : 'No events found'} body={error ? 'Check the backend configuration and try again.' : 'Try another search or category.'} />}
    </section>
  </>;
}

function EventCard({ event }) {
  const id = eventId(event);
  const capacity = Number(event.capacity);
  const available = Number.isFinite(capacity) && capacity > 0 ? `${capacity} spaces` : 'Open registration';
  return <article className="event-card">
    <div className="event-card-art"><span className="event-art-mark">✦</span><span className="event-category">{event.category || event.category_name || event.type || 'Campus event'}</span></div>
    <div className="event-card-body"><div className="event-meta"><span><Icon name="calendar" size={15} />{formatDate(eventDate(event))}</span><span><Icon name="pin" size={15} />{eventLocation(event)}</span></div><h3>{eventTitle(event)}</h3><p className="event-summary">{event.description || 'Open the event to see details and registration options.'}</p><div className="event-card-bottom"><span className="capacity-label">{available}</span><a className="text-link" href={`/event-details?id=${encodeURIComponent(id)}`}>View details <Icon name="arrow" size={15} /></a></div></div>
  </article>;
}

function EventDetails({ eventId: selectedId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tier, setTier] = useState('standard');
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [needs, setNeeds] = useState('');
  const [result, setResult] = useState('');
  const [resultType, setResultType] = useState('info');
  const [submitting, setSubmitting] = useState(false);
  const { session } = useSession();

  useEffect(() => {
    let active = true;
    if (!selectedId) {
      setError('Choose an event from Explore events to view its details.');
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    api(`/api/events/${encodeURIComponent(selectedId)}`).then(data => {
      if (active) { setEvent(data); setError(''); }
    }).catch(reason => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  async function register(eventSubmit) {
    eventSubmit.preventDefault();
    if (!session.accessToken) {
      setResult('Sign in above before submitting your registration.');
      setResultType('error');
      return;
    }
    if (!event) return;
    setSubmitting(true);
    setResult('Submitting your registration…');
    setResultType('info');
    try {
      const registration = await api('/api/registrations', {
        method: 'POST',
        auth: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId(event),
          ticket_tier: tier,
          attendee: {
            full_name: name.trim(),
            email: session.email,
            affiliation: affiliation.trim(),
            dietary_accessibility: needs.trim(),
          },
        }),
      });
      setResult(`Registration saved${registration.id ? ` (reference ${registration.id})` : ''}.`);
      setResultType('success');
    } catch (reason) {
      setResult(reason.status === 409 ? 'You are already registered for this event.' : reason.message);
      setResultType('error');
    } finally {
      setSubmitting(false);
    }
  }

  return <>
    <div className="breadcrumb"><a href="/">Explore events</a><span>/</span><span>Event details</span></div>
    {loading ? <LoadingState label="Loading event details…" /> : error ? <EmptyState title="Event details unavailable" body={error} /> : <>
      <section className="detail-hero"><div className="detail-glow"/><div className="detail-hero-copy"><span className="eyebrow">EVENT DETAILS</span><h1>{eventTitle(event)}</h1><p>{event.description || 'Join your campus community for this event. Check the information below and register to save your place.'}</p><div className="detail-meta"><span><Icon name="calendar" />{formatDate(eventDate(event))}</span><span><Icon name="pin" />{eventLocation(event)}</span></div></div><div className="detail-capacity"><span>CAPACITY</span><strong>{event.capacity ?? 'Open'}</strong><small>available spaces</small></div></section>
      <div className="detail-layout"><section className="panel registration-panel"><div className="panel-heading"><div><p className="eyebrow">SAVE YOUR PLACE</p><h2>Register for this event</h2></div><span className="method-badge">POST /api/registrations</span></div><AuthPanel /><form className="registration-form" onSubmit={register}><label className="field"><span>Full name *</span><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required maxLength={120} placeholder="Your name" /></label><label className="field"><span>Ticket tier</span><select value={tier} onChange={e => setTier(e.target.value)}><option value="standard">Standard pass</option><option value="vip_workshop">VIP workshop pass</option></select></label><label className="field"><span>Company or affiliation</span><input value={affiliation} onChange={e => setAffiliation(e.target.value)} maxLength={160} placeholder="Optional" /></label><label className="field"><span>Dietary or accessibility needs</span><textarea value={needs} onChange={e => setNeeds(e.target.value)} maxLength={500} rows={3} placeholder="Optional" /></label><button className="button button-primary button-wide" disabled={submitting || !event}>{submitting ? 'Submitting…' : 'Complete registration'} <Icon name="arrow" size={17} /></button>{result && <Notice type={resultType}>{result}</Notice>}</form></section><aside className="panel event-info-panel"><p className="eyebrow">GOOD TO KNOW</p><h2>Join the campus community</h2><p>Event information is loaded from the backend. Your registration will be associated with your signed-in Supabase account.</p><div className="info-divider"/><a href="/my-registrations" className="text-link">View my registrations <Icon name="arrow" size={15} /></a></aside></div>
    </>}
  </>;
}

function MyRegistrations() {
  const { session } = useSession();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('Sign in to see your event registrations.');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!session.accessToken) {
      setRows([]);
      setStatus('Sign in to see your event registrations.');
      return () => { active = false; };
    }
    setBusy(true);
    setStatus('Loading your registrations…');
    api('/api/me/registrations', { auth: true }).then(async registrations => {
      if (!Array.isArray(registrations)) throw new Error('The registrations API returned an unexpected response.');
      const hydrated = await Promise.all(registrations.map(async registration => {
        try {
          const event = await api(`/api/events/${encodeURIComponent(registration.event_id)}`);
          return { ...registration, event };
        } catch {
          return { ...registration, event: null };
        }
      }));
      if (active) {
        setRows(hydrated);
        setStatus(hydrated.length ? `${hydrated.length} registration${hydrated.length === 1 ? '' : 's'} found.` : 'You have no registrations yet.');
      }
    }).catch(reason => { if (active) { setRows([]); setStatus(reason.message); } })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [session.accessToken, refreshKey]);

  return <>
    <PageHeading eyebrow="YOUR CAMPUS ACTIVITY" title="My registrations" description="Keep track of the events you’ve signed up for." action={<button className="button button-light" disabled={busy} onClick={() => setRefreshKey(value => value + 1)}><Icon name="refresh" />Refresh</button>} />
    <AuthPanel />
    <Notice type={busy ? 'info' : (status.includes('401') || status.includes('required') ? 'info' : 'info')}>{status}</Notice>
    {rows.length ? <div className="registration-list">{rows.map(row => <article className="registration-row" key={row.id || `${row.event_id}-${row.createdAt}`}><div className="registration-icon"><Icon name="calendar" size={22} /></div><div className="registration-row-main"><span className="eyebrow">{row.ticket_tier || 'STANDARD PASS'}</span><h2>{row.event ? eventTitle(row.event) : `Event ${row.event_id}`}</h2><p>{row.event ? `${formatDate(eventDate(row.event))} · ${eventLocation(row.event)}` : 'Event details are no longer available.'}</p><small>Registered {formatDate(row.created_at || row.createdAt || row.registered_at)}</small></div>{row.event && <a className="button button-light button-small" href={`/event-details?id=${encodeURIComponent(row.event_id)}`}>View event <Icon name="arrow" size={15} /></a>}</article>)}</div> : session.accessToken && !busy ? <EmptyState title="No registrations yet" body="Explore campus events and register to see them listed here." action={<a className="button button-primary" href="/">Explore events <Icon name="arrow" size={16} /></a>} /> : null}
  </>;
}

function OrganizerAttendees() {
  const { session } = useSession();
  const [events, setEvents] = useState([]);
  const [eventKey, setEventKey] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Choose an event and sign in with its organizer account.');
  const [eventError, setEventError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    api('/api/events').then(result => {
      if (!Array.isArray(result)) throw new Error('The events API returned an unexpected response.');
      if (!active) return;
      setEvents(result);
      const requested = new URLSearchParams(window.location.search).get('event');
      const firstId = requested && result.some(item => String(eventId(item)) === requested) ? requested : (result[0] ? String(eventId(result[0])) : '');
      setEventKey(firstId);
    }).catch(reason => { if (active) setEventError(reason.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!eventKey) return () => { active = false; };
    if (!session.accessToken) {
      setAttendees([]);
      setStatus('Sign in with the event organizer account to load attendees.');
      return () => { active = false; };
    }
    setBusy(true);
    setStatus('Loading attendee list…');
    api(`/api/events/${encodeURIComponent(eventKey)}/registrations`, { auth: true }).then(result => {
      if (!Array.isArray(result)) throw new Error('The attendee API returned an unexpected response.');
      if (!active) return;
      setAttendees(result);
      setStatus(`${result.length} registrations for the selected event.`);
      window.history.replaceState(null, '', `/organizer-attendees?event=${encodeURIComponent(eventKey)}`);
    }).catch(reason => {
      if (!active) return;
      setAttendees([]);
      setStatus(reason.status === 403 ? 'Access denied. Sign in with the account that owns this event.' : reason.message);
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [eventKey, session.accessToken, refreshKey]);

  const visible = useMemo(() => attendees.filter(item => {
    const attendee = item.attendee && typeof item.attendee === 'object' ? item.attendee : {};
    const text = [attendee.full_name, attendee.email, attendee.affiliation, item.student_id].filter(Boolean).join(' ').toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }), [attendees, query]);

  function exportCsv() {
    const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const values = [['Name', 'Email', 'Ticket tier', 'Registered at'], ...visible.map(item => {
      const attendee = item.attendee && typeof item.attendee === 'object' ? item.attendee : {};
      return [attendee.full_name || 'Attendee', attendee.email || '', item.ticket_tier || 'standard', item.created_at || item.createdAt || ''];
    })];
    const file = new Blob([values.map(row => row.map(quote).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = 'campus-event-attendees.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return <>
    <PageHeading eyebrow="ORGANIZER TOOLS" title="Attendee management" description="Review registrations for events you organize." action={<button className="button button-light" disabled={busy || !eventKey} onClick={() => setRefreshKey(value => value + 1)}><Icon name="refresh" />Refresh list</button>} />
    <AuthPanel />
    <section className="panel roster-panel"><div className="roster-controls"><label className="field"><span>Select event</span><select value={eventKey} onChange={event => setEventKey(event.target.value)} disabled={!events.length}><option value="">{eventError ? 'Could not load events' : 'Choose an event'}</option>{events.map(item => <option key={eventId(item)} value={eventId(item)}>{eventTitle(item)}</option>)}</select></label><label className="field"><span>Search attendees</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, email, or student ID" /></label><button className="button button-light export-button" onClick={exportCsv} disabled={!attendees.length}><Icon name="download" />Export CSV</button></div>
      {eventError && <Notice type="error">Could not load events: {eventError}</Notice>}<Notice type={status.startsWith('Access denied') || status.includes('Authentication') ? 'error' : 'info'}>{status}</Notice>
      <div className="table-wrap"><table className="attendee-table"><thead><tr><th>Attendee</th><th>Email</th><th>Ticket</th><th>Registered</th></tr></thead><tbody>{visible.map((item, index) => {
        const attendee = item.attendee && typeof item.attendee === 'object' ? item.attendee : {};
        return <tr key={item.id || `${item.student_id}-${index}`}><td><strong>{attendee.full_name || 'Attendee'}</strong>{attendee.affiliation && <small>{attendee.affiliation}</small>}</td><td>{attendee.email || '—'}</td><td><span className="ticket-pill">{item.ticket_tier || 'standard'}</span></td><td>{formatDate(item.created_at || item.createdAt || item.registered_at)}</td></tr>;
      })}</tbody></table></div>
      {!!attendees.length && <p className="table-count">Showing {visible.length} of {attendees.length} attendees</p>}
    </section>
  </>;
}

function LoadingState({ label }) {
  return <div className="loading-state"><span className="spinner"/><p>{label}</p></div>;
}

function EmptyState({ title, body, action }) {
  return <div className="empty-state"><span className="empty-mark">✦</span><h2>{title}</h2><p>{body}</p>{action}</div>;
}

function PageNotFound() {
  return <EmptyState title="Page not found" body="That Campus Connect page doesn’t exist." action={<a className="button button-primary" href="/">Back to events</a>} />;
}

export default function App() {
  return <SessionProvider><CampusApp /></SessionProvider>;
}
