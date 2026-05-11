'use strict';

const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyZElC3cHXufHaeBKHnsKCYXhgr1jG7weHsQOksJSxtJYb28vfd1FLrHS93hXKQIytE/exec';

let adminSession = {
  username: '',
  password: '',
  role: ''
};

let adminTicketsData = [];

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');

if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }, { passive: true });
}

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

function setActiveNavLink() {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (window.scrollY >= sectionTop) current = section.getAttribute('id');
  });

  navLinks.forEach(link => {
    link.style.color = '';
    if (link.getAttribute('href') === `#${current}`) {
      link.style.color = '#60A5FA';
    }
  });
}
window.addEventListener('scroll', setActiveNavLink, { passive: true });

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const navLinksMenu = document.getElementById('nav-links');

if (hamburger && navLinksMenu && navbar) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinksMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);

    const spans = hamburger.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  navLinksMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinksMenu.classList.remove('open');
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target)) {
      navLinksMenu.classList.remove('open');
      const spans = hamburger.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== REVEAL =====
function revealOnScroll() {
  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) el.classList.add('visible');
  });
}

function initRevealElements() {
  const selectors = [
    '.service-card',
    '.coverage-card',
    '.section-header',
    '.schedule-card',
    '.schedule-left',
    '.contact-info',
    '.contact-form-wrap',
    '.cta-content',
    '.process-card',
    '.trust-card',
    '.faq-item',
    '.admin-card',
    '.help-ultra-card'
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${index * 80}ms`;
    });
  });
}

initRevealElements();
window.addEventListener('scroll', revealOnScroll, { passive: true });
revealOnScroll();

// ===== ESTADOS =====
function estadoBadge(estado) {
  const e = String(estado || '').toLowerCase();
  if (e === 'resuelto') return '<span class="estado-badge estado-resuelto">Resuelto</span>';
  if (e === 'en proceso') return '<span class="estado-badge estado-proceso">En proceso</span>';
  return '<span class="estado-badge estado-pendiente">Pendiente</span>';
}

// ===== FORMULARIO SOPORTE =====
const form = document.getElementById('support-form');
const successMsg = document.getElementById('form-success');
const errorMsg = document.getElementById('form-error');
const errorText = document.getElementById('form-error-msg');
const submitBtn = document.getElementById('form-submit-btn');

if (form && successMsg && errorMsg && errorText && submitBtn) {
  form.addEventListener('submit', async (e) => {
    console.log('submit soporte disparado');

    e.preventDefault();

    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    const formData = {
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim(),
      telefono: form.telefono.value.trim(),
      ciudad: form.ciudad.value,
      despacho: form.despacho.value.trim(),
      tipo_usuario: form.tipo_usuario.value,
      asunto: form.asunto.value.trim(),
      radicado: form.radicado ? form.radicado.value.trim() : '',
      descripcion: form.descripcion.value.trim(),
    };

    if (
      !formData.nombre ||
      !formData.correo ||
      !formData.telefono ||
      !formData.ciudad ||
      !formData.tipo_usuario ||
      !formData.asunto ||
      !formData.descripcion
    ) {
      errorText.textContent = 'Por favor completa todos los campos obligatorios.';
      errorMsg.style.display = 'flex';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Enviando solicitud...';

    try {
      const payload = {
        nombre: formData.nombre,
        correo: formData.correo,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
        tipo_usuario: formData.tipo_usuario,
        asunto: formData.asunto,
        numero_proceso: formData.radicado,
        descripcion: formData.descripcion
      };

      const response = await fetch('/api/soporte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        form.reset();
        successMsg.style.display = 'block'; JPÑ
        successMsg.innerHTML = `
          <div class="success-icon">✅</div>
          <p class="success-title">Solicitud enviada correctamente</p>
        `;
      } else {
        throw new Error('No fue posible enviar la solicitud. Intente nuevamente.');
      }
    } catch (err) {
      console.error(err);
      errorText.textContent = 'No fue posible enviar la solicitud. Intente nuevamente.';
      errorMsg.style.display = 'flex';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Enviar solicitud de soporte';
    }
  });
}

// ===== CONSULTA DE TICKET =====
const ticketForm = document.getElementById('ticket-form');
const ticketInput = document.getElementById('ticket-input');
const ticketResult = document.getElementById('ticket-result');
const ticketError = document.getElementById('ticket-error');

if (ticketForm && ticketInput && ticketResult && ticketError) {
  ticketForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const ticket = ticketInput.value.trim();

    ticketResult.style.display = 'none';
    ticketError.style.display = 'none';
    ticketResult.innerHTML = '';
    ticketError.innerHTML = '';

    if (!ticket) {
      ticketError.textContent = 'Ingresa un número de ticket.';
      ticketError.style.display = 'flex';
      return;
    }

    try {
      const response = await fetch(`${WEBHOOK_URL}?ticket=${encodeURIComponent(ticket)}`);
      const data = await response.json();

      if (data.status === 'ok') {
        ticketResult.innerHTML = `
          <div class="form-success" style="display:block;">
            <p class="success-title">Ticket encontrado</p>
            <p class="success-msg">
              <strong>Ticket:</strong> ${data.ticket}<br>
              <strong>Nombre:</strong> ${data.nombre}<br>
              <strong>Asunto:</strong> ${data.asunto}<br>
              <strong>Estado:</strong> ${estadoBadge(data.estado)}
            </p>
          </div>
        `;
        ticketResult.style.display = 'block';
      } else if (data.status === 'not_found') {
        ticketError.textContent = 'No se encontró el ticket ingresado.';
        ticketError.style.display = 'flex';
      } else {
        ticketError.textContent = 'No fue posible consultar el ticket.';
        ticketError.style.display = 'flex';
      }
    } catch (error) {
      console.error(error);
      ticketError.textContent = 'Error consultando el ticket.';
      ticketError.style.display = 'flex';
    }
  });
}

// ===== PANEL ADMIN EMPRESA =====
const adminLoginForm = document.getElementById('admin-login-form');
const adminUsernameInput = document.getElementById('admin-username');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginMsg = document.getElementById('admin-login-msg');
const adminDashboard = document.getElementById('admin-dashboard');
const adminRoleBadge = document.getElementById('admin-role-badge');

const statTotal = document.getElementById('stat-total');
const statPendientes = document.getElementById('stat-pendientes');
const statProceso = document.getElementById('stat-proceso');
const statResueltos = document.getElementById('stat-resueltos');
const statResolucion = document.getElementById('stat-resolucion');
const adminCityStats = document.getElementById('admin-city-stats');
const adminUsertypeStats = document.getElementById('admin-usertype-stats');
const adminTicketsBody = document.getElementById('admin-tickets-body');

const adminSearch = document.getElementById('admin-search');
const adminFilterStatus = document.getElementById('admin-filter-status');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const adminClosePanelBtn = document.getElementById('admin-close-panel-btn');

async function adminPost(payloadObj) {
  const payload = new URLSearchParams();
  Object.keys(payloadObj).forEach(key => payload.append(key, payloadObj[key]));

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    body: payload
  });

  return response.json();
}

function renderAdminTable(data) {
  adminTicketsBody.innerHTML = '';

  data.forEach(item => {
    const canEdit = adminSession.role === 'admin';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.ticket}</td>
      <td>${item.nombre}</td>
      <td>${item.ciudad || ''}</td>
      <td>${item.radicado || ''}</td>
      <td>${item.asunto}</td>
      <td>${estadoBadge(item.estado)}</td>
      <td>
        ${canEdit
        ? `
          <select class="admin-estado-select" data-ticket="${item.ticket}">
            <option value="Pendiente" ${item.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="En proceso" ${item.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
            <option value="Resuelto" ${item.estado === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
          </select>
          <button class="admin-save-btn" data-ticket="${item.ticket}">Guardar</button>
        `
        : `<span class="estado-badge estado-proceso">Solo consulta</span>`
      }
      </td>
    `;
    adminTicketsBody.appendChild(tr);
  });

  bindAdminButtons();
}

function filterAdminTable() {
  const search = (adminSearch?.value || '').trim().toLowerCase();
  const estado = adminFilterStatus?.value || 'Todos';

  const filtered = adminTicketsData.filter(item => {
    const fullText = [
      item.ticket,
      item.nombre,
      item.asunto,
      item.radicado,
      item.ciudad
    ].join(' ').toLowerCase();

    const matchSearch = fullText.includes(search);
    const matchEstado = estado === 'Todos' ? true : item.estado === estado;

    return matchSearch && matchEstado;
  });

  renderAdminTable(filtered);
}
function renderStatList(container, dataObj) {
  if (!container) return;

  const entries = Object.entries(dataObj || {});
  if (entries.length === 0) {
    container.innerHTML = '<div class="admin-report-item"><span class="admin-report-name">Sin registros</span><span class="admin-report-value">0</span></div>';
    return;
  }

  container.innerHTML = entries
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => `
      <div class="admin-report-item">
        <span class="admin-report-name">${name}</span>
        <span class="admin-report-value">${value}</span>
      </div>
    `)
    .join('');
}
async function loadAdminDashboard() {
  if (!adminSession.username || !adminSession.password) return;

  try {
    const data = await adminPost({
      action: 'get_stats',
      username: adminSession.username,
      password: adminSession.password
    });

    if (data.status !== 'ok') {
      throw new Error(data.message || 'No autorizado');
    }

    statTotal.textContent = data.total;
    statPendientes.textContent = data.pendientes;
    statProceso.textContent = data.enProceso;
    statResueltos.textContent = data.resueltos;
    statResolucion.textContent = `${data.porcentajeResolucion || 0}%`;

    renderStatList(adminCityStats, data.porCiudad);
    renderStatList(adminUsertypeStats, data.porTipoUsuario);

    adminRoleBadge.textContent = data.role === 'admin' ? 'Administrador' : 'Consulta';
    adminRoleBadge.className = data.role === 'admin'
      ? 'estado-badge estado-resuelto'
      : 'estado-badge estado-proceso';

    adminTicketsData = data.tickets || [];
    adminSession.role = data.role;
    filterAdminTable();
  } catch (error) {
    console.error(error);
    adminLoginMsg.textContent = 'Error cargando dashboard.';
    adminLoginMsg.style.display = 'flex';
  }
}

function logoutAdmin() {
  adminSession = { username: '', password: '', role: '' };
  adminTicketsData = [];

  if (adminDashboard) adminDashboard.style.display = 'none';
  if (adminLoginMsg) {
    adminLoginMsg.style.display = 'none';
    adminLoginMsg.textContent = '';
  }

  if (adminUsernameInput) adminUsernameInput.value = '';
  if (adminPasswordInput) adminPasswordInput.value = '';
  if (adminSearch) adminSearch.value = '';
  if (adminFilterStatus) adminFilterStatus.value = 'Todos';
  if (adminTicketsBody) adminTicketsBody.innerHTML = '';

  if (statTotal) statTotal.textContent = '0';
  if (statPendientes) statPendientes.textContent = '0';
  if (statProceso) statProceso.textContent = '0';
  if (statResueltos) statResueltos.textContent = '0';
  if (statResolucion) statResolucion.textContent = '0%';

  if (adminCityStats) adminCityStats.innerHTML = '';
  if (adminUsertypeStats) adminUsertypeStats.innerHTML = '';
}

function closeAdminPanelOnly() {
  adminDashboard.style.display = 'none';
  adminLoginMsg.style.display = 'none';
  adminLoginMsg.textContent = '';
}

if (adminSearch) adminSearch.addEventListener('input', filterAdminTable);
if (adminFilterStatus) adminFilterStatus.addEventListener('change', filterAdminTable);
if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logoutAdmin);
if (adminClosePanelBtn) adminClosePanelBtn.addEventListener('click', closeAdminPanelOnly);

if (adminLoginForm && adminUsernameInput && adminPasswordInput && adminLoginMsg && adminDashboard) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    adminLoginMsg.style.display = 'none';
    adminLoginMsg.textContent = '';

    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();

    if (!username || !password) {
      adminLoginMsg.textContent = 'Ingresa usuario y contraseña.';
      adminLoginMsg.style.display = 'flex';
      return;
    }

    try {
      const result = await adminPost({
        action: 'admin_login',
        username,
        password
      });

      if (result.status === 'ok') {
        adminSession = {
          username,
          password,
          role: result.role
        };
        adminDashboard.style.display = 'block';
        loadAdminDashboard();
      } else {
        adminLoginMsg.textContent = 'Credenciales incorrectas.';
        adminLoginMsg.style.display = 'flex';
      }
    } catch (error) {
      console.error(error);
      adminLoginMsg.textContent = 'No fue posible ingresar al panel.';
      adminLoginMsg.style.display = 'flex';
    }
  });
}

// ===== TEAMS STATUS =====
function actualizarEstadoSoporte() {
  const btn = document.getElementById('btn-teams');
  if (!btn) return;

  const ahora = new Date();
  const hora = ahora.getHours();
  const dia = ahora.getDay();

  const esLaboral = dia >= 1 && dia <= 5;
  const enHorario = hora >= 8 && hora < 18;

  if (esLaboral && enHorario) {
    btn.textContent = '🟢 Atención en línea ahora';
    btn.style.background = 'rgba(34,197,94,0.15)';
    btn.style.border = '1px solid #22C55E';
    btn.style.color = '#22C55E';
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
  } else {
    btn.textContent = '🔴 Fuera de horario';
    btn.style.background = 'rgba(239,68,68,0.12)';
    btn.style.border = '1px solid #EF4444';
    btn.style.color = '#FCA5A5';
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.7';
  }
}
actualizarEstadoSoporte();

console.log('SAMAI Empresa cargado correctamente');

// ===== AYUDAS ULTRA PRO MODAL =====
const helpUltraModal = document.getElementById('help-ultra-modal');
const helpUltraBackdrop = document.getElementById('help-ultra-backdrop');
const helpUltraClose = document.getElementById('help-ultra-close');
const helpUltraContent = document.getElementById('help-ultra-content');
const helpUltraTitle = document.getElementById('help-ultra-modal-title');
const helpUltraExternalLink = document.getElementById('help-ultra-external-link');

function openHelpUltraModal(type, src, title) {
  if (!helpUltraModal || !helpUltraContent || !helpUltraTitle || !helpUltraExternalLink) return;

  helpUltraTitle.textContent = title || 'Video de ayuda';
  helpUltraExternalLink.href = src || '#';

  let content = '';

  if (type === 'mp4') {
    content = `
      <video controls controlsList="nodownload">
        <source src="${src}" type="video/mp4">
        Tu navegador no soporta video HTML5.
      </video>
    `;
  } else {
    content = `
      <iframe
        src="${src}"
        title="${title || 'Video de ayuda'}"
        frameborder="0"
        allowfullscreen>
      </iframe>
    `;
  }

  helpUltraContent.innerHTML = content;
  helpUltraModal.classList.add('active');
  helpUltraModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('help-modal-open');
}

function closeHelpUltraModal() {
  if (!helpUltraModal || !helpUltraContent) return;

  helpUltraModal.classList.remove('active');
  helpUltraModal.setAttribute('aria-hidden', 'true');
  helpUltraContent.innerHTML = '';
  document.body.classList.remove('help-modal-open');
}

document.querySelectorAll('.open-help-modal').forEach(button => {
  button.addEventListener('click', () => {
    const type = button.dataset.modalType || 'iframe';
    const src = button.dataset.modalSrc || '';
    const title = button.dataset.modalTitle || 'Video de ayuda';
    openHelpUltraModal(type, src, title);
  });
});

if (helpUltraClose) {
  helpUltraClose.addEventListener('click', closeHelpUltraModal);
}

if (helpUltraBackdrop) {
  helpUltraBackdrop.addEventListener('click', closeHelpUltraModal);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeHelpUltraModal();
  }
});

const uploadBtn = document.getElementById('upload-btn');

if (uploadBtn) {
  uploadBtn.addEventListener('click', async () => {
    const ticket = document.getElementById('upload-ticket').value;
    const fileInput = document.getElementById('upload-file');
    const msg = document.getElementById('upload-msg');

    if (!ticket || !fileInput.files.length) {
      msg.textContent = 'Debe ingresar ticket y seleccionar archivo';
      return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('ticket', ticket);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.status === 'ok') {
        msg.textContent = '✅ Archivo cargado correctamente';
      } else {
        msg.textContent = '❌ Error al subir archivo';
      }
    } catch (err) {
      console.error(err);
      msg.textContent = '❌ Error en la carga';
    }
  });
}