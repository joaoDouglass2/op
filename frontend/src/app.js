const API_BASE = '/api';
let token = null;

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const taskForm = document.getElementById('task-form');
const appError = document.getElementById('app-error');

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
function hideError(el) {
  el.classList.add('hidden');
}

function showApp() {
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  loadTasks();
}
function showLogin() {
  appScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}


loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(loginError);

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(loginError, data.error || 'Falha no login');
      return;
    }

    token = data.token;
    sessionStorage.setItem('token', token);
    showApp();
  } catch (err) {
    showError(loginError, 'Não foi possível conectar ao servidor');
  }
});

logoutBtn.addEventListener('click', () => {
  token = null;
  sessionStorage.removeItem('token');
  showLogin();
});


async function authFetch(url, options = {}) {
  options.headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  const res = await fetch(url, options);

  if (res.status === 401) {
    token = null;
    sessionStorage.removeItem('token');
    showLogin();
    showError(loginError, 'Sessão expirada, faça login novamente');
  }
  return res;
}

// ---------- CRIAR TAREFA ----------
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(appError);

  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  if (!title) return;

  try {
    const res = await authFetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError(appError, data.error || 'Erro ao criar tarefa');
      return;
    }

    taskForm.reset();
    loadTasks();
  } catch (err) {
    showError(appError, 'Não foi possível conectar ao servidor');
  }
});


async function loadTasks() {
  hideError(appError);
  try {
    const res = await authFetch(`${API_BASE}/tasks`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError(appError, data.error || 'Erro ao carregar tarefas');
      return;
    }
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    showError(appError, 'Não foi possível carregar as tarefas');
  }
}

function renderTasks(tasks) {
  const cols = {
    todo: document.getElementById('col-todo'),
    doing: document.getElementById('col-doing'),
    done: document.getElementById('col-done'),
  };
  Object.values(cols).forEach((c) => (c.innerHTML = ''));

  tasks.forEach((task) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.id = task.id;

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = task.title;
    card.appendChild(title);

    if (task.description) {
      const desc = document.createElement('div');
      desc.className = 'card-desc';
      desc.textContent = task.description;
      card.appendChild(desc);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', async () => {
      hideError(appError);
      try {
        const res = await authFetch(`${API_BASE}/tasks/${task.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showError(appError, data.error || 'Erro ao remover tarefa');
          return;
        }
        loadTasks();
      } catch (err) {
        showError(appError, 'Não foi possível conectar ao servidor');
      }
    });
    card.appendChild(delBtn);

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(task.id));
    });

    cols[task.status].appendChild(card);
  });
}


document.querySelectorAll('.cards').forEach((col) => {
  col.addEventListener('dragover', (e) => e.preventDefault());
  col.addEventListener('drop', async (e) => {
    e.preventDefault();
    hideError(appError);

    const id = e.dataTransfer.getData('text/plain');
    const status = col.parentElement.dataset.status;

    try {
      const res = await authFetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError(appError, data.error || 'Erro ao mover tarefa');
      }
    } catch (err) {
      showError(appError, 'Não foi possível conectar ao servidor');
    } finally {
      loadTasks();
    }
  });
});


window.addEventListener('load', () => {
  const saved = sessionStorage.getItem('token');
  if (saved) {
    token = saved;
    showApp();
  }
});
