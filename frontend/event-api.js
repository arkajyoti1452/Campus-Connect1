(function () {
  const API_BASE_URL = (window.EVENT_API_BASE_URL || 'https://zero5nov-workshop.onrender.com').replace(/\/+$/, '');
  const TOKEN_KEY = 'campusConnectAccessToken';
  const EMAIL_KEY = 'campusConnectEmail';

  function apiUrl(path) {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async function readJson(response) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || body.msg || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return body;
  }

  async function request(path, options = {}) {
    const { auth = false, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers || {});
    if (auth) {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) {
        const error = new Error('Sign in with your Supabase account to continue.');
        error.status = 401;
        throw error;
      }
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(apiUrl(path), { ...fetchOptions, headers });
    if (response.status === 401 && auth) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
      window.dispatchEvent(new Event('eventhub-auth-changed'));
    }
    return readJson(response);
  }

  async function authRequest(path, email, password) {
    const config = await request('/api/config');
    const response = await fetch(`${config.supabase_url.replace(/\/+$/, '')}/auth/v1/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.supabase_key
      },
      body: JSON.stringify({ email, password })
    });
    return readJson(response);
  }

  function saveSession(session, email) {
    if (!session.access_token) {
      throw new Error('Supabase did not return an access token. Confirm your account, then sign in.');
    }
    sessionStorage.setItem(TOKEN_KEY, session.access_token);
    sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
    window.dispatchEvent(new Event('eventhub-auth-changed'));
  }

  function currentEmail() {
    return sessionStorage.getItem(EMAIL_KEY) || '';
  }

  function mountAuthPanel(target = document.querySelector('main')) {
    if (!target || document.getElementById('eventhub-auth-panel')) return;
    const panel = document.createElement('section');
    panel.id = 'eventhub-auth-panel';
    panel.className = 'mx-auto my-4 w-[min(100%-2rem,1280px)] rounded-xl bg-surface-container-lowest p-space-md shadow-sm';
    panel.innerHTML = `
      <div class="flex flex-col gap-space-sm md:flex-row md:items-end">
        <div class="flex-1">
          <label class="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant" for="eventhub-email">Supabase account email</label>
          <input id="eventhub-email" type="email" autocomplete="email" required class="h-10 w-full rounded-lg bg-surface-container-low px-space-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" placeholder="you@example.com" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant" for="eventhub-password">Password</label>
          <input id="eventhub-password" type="password" autocomplete="current-password" required class="h-10 w-full rounded-lg bg-surface-container-low px-space-sm text-on-surface outline-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary" placeholder="Your password" />
        </div>
        <button id="eventhub-sign-in" class="rounded-lg bg-primary px-space-md py-2.5 font-label-md text-label-md text-on-primary" type="button">Sign in</button>
        <button id="eventhub-sign-up" class="rounded-lg bg-surface-container-high px-space-md py-2.5 font-label-md text-label-md text-on-surface" type="button">Create account</button>
        <button id="eventhub-sign-out" class="hidden rounded-lg bg-surface-container-high px-space-md py-2.5 font-label-md text-label-md text-on-surface" type="button">Sign out</button>
      </div>
      <p id="eventhub-auth-status" class="mt-2 font-body-sm text-body-sm text-on-surface-variant" role="status">Sign in is required for registrations and private attendee lists.</p>`;
    target.insertBefore(panel, target.firstChild);

    const emailInput = panel.querySelector('#eventhub-email');
    const passwordInput = panel.querySelector('#eventhub-password');
    const signInButton = panel.querySelector('#eventhub-sign-in');
    const signUpButton = panel.querySelector('#eventhub-sign-up');
    const signOutButton = panel.querySelector('#eventhub-sign-out');
    const status = panel.querySelector('#eventhub-auth-status');

    function showSession() {
      const email = currentEmail();
      if (email) {
        emailInput.value = email;
        passwordInput.value = '';
        passwordInput.required = false;
        signInButton.classList.add('hidden');
        signUpButton.classList.add('hidden');
        signOutButton.classList.remove('hidden');
        status.textContent = `Signed in as ${email}.`;
      } else {
        passwordInput.required = true;
        signInButton.classList.remove('hidden');
        signUpButton.classList.remove('hidden');
        signOutButton.classList.add('hidden');
      }
    }

    async function authenticate(action) {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        status.textContent = 'Enter your email and password.';
        return;
      }
      signInButton.disabled = true;
      signUpButton.disabled = true;
      status.textContent = action === 'signup' ? 'Creating account…' : 'Signing in…';
      try {
        const session = await authRequest(
          action === 'signup' ? 'signup' : 'token?grant_type=password',
          email,
          password
        );
        if (session.access_token) {
          saveSession(session, email);
          showSession();
          status.textContent = `Signed in as ${email}.`;
        } else {
          status.textContent = 'Account created. Confirm your email, then sign in.';
        }
      } catch (error) {
        status.textContent = error.message;
      } finally {
        signInButton.disabled = false;
        signUpButton.disabled = false;
      }
    }

    signInButton.addEventListener('click', () => authenticate('signin'));
    signUpButton.addEventListener('click', () => authenticate('signup'));
    signOutButton.addEventListener('click', () => {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
      showSession();
      status.textContent = 'Signed out.';
      window.dispatchEvent(new Event('eventhub-auth-changed'));
    });
    window.addEventListener('eventhub-auth-changed', showSession);
    showSession();
  }

  window.EventHubApi = {
    API_BASE_URL,
    apiUrl,
    request,
    currentEmail,
    mountAuthPanel,
    get accessToken() {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    }
  };
})();
