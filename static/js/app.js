'use strict';

let adminSession = {
  username: '',
  password: '',
  role: ''
};

let adminTicketsData = [];

// ===== MAPA CIUDAD → JUZGADOS =====
const CITY_COURTS = {
  'Tunja': [
    'JUZGADO 01 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 02 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 03 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 04 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 05 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 06 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 07 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 08 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 09 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 10 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 11 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 12 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 13 ADMINISTRATIVO ORAL DE TUNJA',
    'JUZGADO 14 ADMINISTRATIVO ORAL DE TUNJA'
  ],
  'Duitama': [
    'JUZGADO 01 ADMINISTRATIVO ORAL DE DUITAMA',
    'JUZGADO 02 ADMINISTRATIVO ORAL DE DUITAMA',
    'JUZGADO 03 ADMINISTRATIVO ORAL DE DUITAMA'
  ],
  'Sogamoso': [
    'JUZGADO 01 ADMINISTRATIVO ORAL DE SOGAMOSO',
    'JUZGADO 02 ADMINISTRATIVO ORAL DE SOGAMOSO'
  ],
  'Otra': ['OTRO DESPACHO']
};

const COURT_PREFIX = {
  'JUZGADO 01 ADMINISTRATIVO ORAL DE TUNJA': '150013333001',
  'JUZGADO 02 ADMINISTRATIVO ORAL DE TUNJA': '150013333002',
  'JUZGADO 03 ADMINISTRATIVO ORAL DE TUNJA': '150013333003',
  'JUZGADO 04 ADMINISTRATIVO ORAL DE TUNJA': '150013333004',
  'JUZGADO 05 ADMINISTRATIVO ORAL DE TUNJA': '150013333005',
  'JUZGADO 06 ADMINISTRATIVO ORAL DE TUNJA': '150013333006',
  'JUZGADO 07 ADMINISTRATIVO ORAL DE TUNJA': '150013333007',
  'JUZGADO 08 ADMINISTRATIVO ORAL DE TUNJA': '150013333008',
  'JUZGADO 09 ADMINISTRATIVO ORAL DE TUNJA': '150013333009',
  'JUZGADO 10 ADMINISTRATIVO ORAL DE TUNJA': '150013333010',
  'JUZGADO 11 ADMINISTRATIVO ORAL DE TUNJA': '150013333011',
  'JUZGADO 12 ADMINISTRATIVO ORAL DE TUNJA': '150013333012',
  'JUZGADO 13 ADMINISTRATIVO ORAL DE TUNJA': '150013333013',
  'JUZGADO 14 ADMINISTRATIVO ORAL DE TUNJA': '150013333014',
  'JUZGADO 01 ADMINISTRATIVO ORAL DE DUITAMA': '152383333001',
  'JUZGADO 02 ADMINISTRATIVO ORAL DE DUITAMA': '152383333002',
  'JUZGADO 03 ADMINISTRATIVO ORAL DE DUITAMA': '152383333003',
  'JUZGADO 01 ADMINISTRATIVO ORAL DE SOGAMOSO': '157593333001',
  'JUZGADO 02 ADMINISTRATIVO ORAL DE SOGAMOSO': '157593333002'
};

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
    hamburger.setAttribute('aria-expanded', String(isOpen));

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
    '.help-ultra-card',
    '.info-util-card'
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
  const ciudadField = form.ciudad;
  const despachoField = form.despacho;
  const radicadoField = form.radicado;

  function fillDespachosByCity(city) {
    if (!despachoField) return;

    despachoField.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Seleccione despacho';
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    despachoField.appendChild(defaultOpt);

    (CITY_COURTS[city] || []).forEach(item => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      despachoField.appendChild(opt);
    });
  }

  function fillProcessPrefix() {
    if (!despachoField || !radicadoField) return;
    const selected = despachoField.value;
    if (COURT_PREFIX[selected]) {
      radicadoField.value = COURT_PREFIX[selected];
    } else if ((ciudadField?.value || '') === 'Otra') {
      radicadoField.value = '';
    }
  }

  if (ciudadField && despachoField) {
    ciudadField.addEventListener('change', () => {
      fillDespachosByCity(ciudadField.value);
      if (radicadoField) radicadoField.value = '';
    });

    despachoField.addEventListener('change', () => {
      fillProcessPrefix();
    });
  }

  // ===== TOGGLE MEMORIAL FIELDS =====
  const tipoSolicitudField = document.getElementById('tipo_solicitud');
  const memorialFields = document.getElementById('memorial-fields');
  const memorialWarning = document.getElementById('memorial-warning');

  function toggleMemorialFields() {
    const esMemorial = tipoSolicitudField && tipoSolicitudField.value === 'Envío de memorial';
    if (memorialFields) memorialFields.style.display = esMemorial ? 'block' : 'none';
    if (memorialWarning) memorialWarning.style.display = esMemorial ? 'block' : 'none';
  }

  if (tipoSolicitudField) {
    tipoSolicitudField.addEventListener('change', toggleMemorialFields);
    toggleMemorialFields();
  }


  form.addEventListener('submit', async (e) => {
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
      !formData.despacho ||
      !formData.tipo_usuario ||
      !formData.asunto ||
      !formData.descripcion
    ) {
      errorText.textContent = 'Por favor completa todos los campos obligatorios.';
      errorMsg.style.display = 'flex';
      errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // ===== VALIDACIÓN LINK MEMORIAL =====
    const tipoSol = form.tipo_solicitud ? form.tipo_solicitud.value : 'Solicitud general';
    const linkDrive = form.link_drive ? form.link_drive.value.trim() : '';

    if (tipoSol === 'Envío de memorial') {
      if (!linkDrive || (!linkDrive.startsWith('https://') && !linkDrive.startsWith('http://'))) {
        errorText.textContent = 'Debe ingresar un enlace válido de Google Drive u otro servicio (debe comenzar con https:// o http://).';
        errorMsg.style.display = 'flex';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Enviando solicitud...';

    try {
      const payload = {
        nombre: formData.nombre,
        correo: formData.correo,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
        despacho: formData.despacho,
        tipo_usuario: formData.tipo_usuario,
        asunto: formData.asunto,
        numero_proceso: formData.radicado,
        descripcion: formData.descripcion,
        tipo_solicitud: form.tipo_solicitud ? form.tipo_solicitud.value : 'Solicitud general',
        quien_radica: form.quien_radica ? form.quien_radica.value.trim() : '',
        tipo_memorial: form.tipo_memorial ? form.tipo_memorial.value : '',
        link_drive: form.link_drive ? form.link_drive.value.trim() : ''
      };

      const response = await fetch('/api/soporte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.status === 'ok') {
        form.reset();
        successMsg.style.display = 'block';
        successMsg.innerHTML = `
          <div class="success-icon">✅</div>
          <p class="success-title">Su solicitud fue enviada correctamente</p>
          <p class="success-msg">
            Número de ticket: <strong>${result.ticket}</strong><br>
            Pronto recibirá atención por parte del equipo de soporte.
          </p>
        `;
        if (despachoField) {
          despachoField.innerHTML = `<option value="" disabled selected>Seleccione despacho</option>`;
        }
        toggleMemorialFields();
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        throw new Error(result.message || 'No fue posible enviar la solicitud.');
      }
    } catch (err) {
      console.error(err);
      errorText.textContent = 'No fue posible enviar la solicitud. Intente nuevamente.';
      errorMsg.style.display = 'flex';
      errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      const response = await fetch('/api/tickets');
      const allTickets = await response.json();

      const data = allTickets.find(t => t.ticket === ticket);

      if (data) {
        let estadoTexto = '';
        if (data.estado === 'Pendiente') {
          estadoTexto = 'Su solicitud fue recibida y se encuentra pendiente de revisión.';
        } else if (data.estado === 'En proceso') {
          estadoTexto = 'Su solicitud ya fue revisada y se encuentra en proceso.';
        } else if (data.estado === 'Resuelto') {
          estadoTexto = 'Su solicitud ya fue atendida.';
        }

        ticketResult.innerHTML = `
          <div class="form-success" style="display:block;">
            <p class="success-title">Ticket encontrado</p>
            <p class="success-msg">
              <strong>Ticket:</strong> ${data.ticket}<br>
              <strong>Nombre:</strong> ${data.nombre}<br>
              <strong>Asunto:</strong> ${data.asunto}<br>
              <strong>Ciudad:</strong> ${data.ciudad || ''}<br>
              <strong>Despacho:</strong> ${data.despacho || ''}<br>
              <strong>Número de proceso:</strong> ${data.numero_proceso || ''}<br>
              <strong>Fecha:</strong> ${data.fecha_creacion || ''}<br>
              <strong>Estado:</strong> ${estadoBadge(data.estado)}<br><br>
              ${estadoTexto}
            </p>
          </div>
        `;
        ticketResult.style.display = 'block';
      } else {
        ticketError.textContent = 'No se encontró el ticket ingresado.';
        ticketError.style.display = 'flex';
      }
    } catch (error) {
      console.error(error);
      ticketError.textContent = 'Error consultando el ticket.';
      ticketError.style.display = 'flex';
    }
  });
}

// ===== PANEL ADMIN =====
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

  const response = await fetch('/api/admin', {
    method: 'POST',
    body: payload
  });

  return response.json();
}

function bindAdminButtons() {
  document.querySelectorAll('.admin-save-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const ticket = button.dataset.ticket;
      const select = document.querySelector(`.admin-estado-select[data-ticket="${ticket}"]`);
      if (!select) return;

      try {
        const result = await adminPost({
          action: 'update_ticket',
          username: adminSession.username,
          password: adminSession.password,
          ticket,
          estado: select.value
        });

        if (result.status === 'ok') {
          loadAdminDashboard();
        } else {
          alert(result.message || 'No fue posible actualizar el ticket.');
        }
      } catch (error) {
        console.error(error);
        alert('Error actualizando el ticket.');
      }
    });
  });
}

function renderAdminTable(data) {
  adminTicketsBody.innerHTML = '';

  data.forEach(item => {
    const canEdit = adminSession.role === 'admin';
    const tipoSol = item.tipo_solicitud || 'Solicitud general';
    const esMemorial = tipoSol === 'Envío de memorial';

    const tipoBadge = esMemorial
      ? '<span class="estado-badge estado-proceso" style="font-size:11px;gap:4px;">📂 Memorial</span>'
      : '<span class="estado-badge" style="font-size:11px;background:rgba(148,163,184,0.12);color:#94A3B8;border:1px solid rgba(148,163,184,0.2);">📋 Solicitud</span>';

    const tiempoColor = item.estado === 'Resuelto' ? '#4ADE80' : (item.estado === 'En proceso' ? '#60A5FA' : '#FBBF24');

    // Fila principal
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.style.transition = 'background 0.2s ease';
    if (esMemorial) tr.style.borderLeft = '3px solid rgba(59,130,246,0.4)';

    tr.innerHTML = `
      <td><span style="font-weight:700;color:#E2E8F0;font-size:13px;letter-spacing:0.5px;">${item.ticket}</span></td>
      <td>${tipoBadge}</td>
      <td>
        <div style="line-height:1.4;">
          <span style="font-weight:600;color:#E2E8F0;">${item.nombre}</span>
          <span style="display:block;font-size:11px;color:#64748B;">${item.ciudad || ''} · ${item.asunto || ''}</span>
        </div>
      </td>
      <td>${estadoBadge(item.estado)}</td>
      <td><span style="font-size:12px;font-weight:700;color:${tiempoColor};">${item.tiempo_atencion || '—'}</span></td>
      <td>
        <div style="display:flex;flex-direction:column;gap:4px;min-width:120px;">
          ${canEdit ? `
            <select class="admin-estado-select" data-ticket="${item.ticket}" style="font-size:12px;padding:6px 8px;">
              <option value="Pendiente" ${item.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="En proceso" ${item.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
              <option value="Resuelto" ${item.estado === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
            </select>
            <div style="display:flex;gap:4px;">
              <button class="admin-save-btn" data-ticket="${item.ticket}" style="font-size:11px;padding:5px 10px;flex:1;">Guardar</button>
              <button class="admin-historial-btn" data-ticket="${item.ticket}" style="font-size:11px;background:#334155;color:#CBD5E1;border:1px solid #475569;border-radius:6px;padding:5px 10px;cursor:pointer;flex:1;">📋</button>
            </div>
            ${item.link_drive ? `<a href="${item.link_drive}" target="_blank" rel="noopener" style="font-size:11px;color:#60A5FA;text-decoration:none;text-align:center;">📎 Ver documento</a>` : ''}
          ` : '<span class="estado-badge estado-proceso" style="font-size:11px;">Solo consulta</span>'}
        </div>
      </td>
    `;

    // Fila de detalle expandible
    const detailTr = document.createElement('tr');
    detailTr.style.display = 'none';
    detailTr.innerHTML = `
      <td colspan="6" style="padding:0;">
        <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin:4px 12px 12px;padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;">
          <div><span style="color:#64748B;">📌 Asunto:</span> <span style="color:#CBD5E1;">${item.asunto || '—'}</span></div>
          <div><span style="color:#64748B;">🏛️ Ciudad:</span> <span style="color:#CBD5E1;">${item.ciudad || '—'}</span></div>
          <div><span style="color:#64748B;">🏢 Despacho:</span> <span style="color:#CBD5E1;">${item.despacho || '—'}</span></div>
          <div><span style="color:#64748B;">📧 Correo:</span> <span style="color:#CBD5E1;">${item.correo || '—'}</span></div>
          <div><span style="color:#64748B;">📞 Teléfono:</span> <span style="color:#CBD5E1;">${item.telefono || '—'}</span></div>
          <div><span style="color:#64748B;">📁 Proceso:</span> <span style="color:#CBD5E1;">${item.numero_proceso || '—'}</span></div>
          ${esMemorial ? `
            <div><span style="color:#64748B;">🧑‍⚖️ Radica:</span> <span style="color:#CBD5E1;">${item.quien_radica || '—'}</span></div>
            <div><span style="color:#64748B;">📄 Tipo memorial:</span> <span style="color:#CBD5E1;">${item.tipo_memorial || '—'}</span></div>
          ` : ''}
          <div style="grid-column:1/-1;"><span style="color:#64748B;">📝 Descripción:</span> <span style="color:#CBD5E1;">${item.descripcion || '—'}</span></div>
          <div><span style="color:#64748B;">📅 Fecha:</span> <span style="color:#CBD5E1;">${item.fecha_creacion || '—'}</span></div>
        </div>
      </td>
    `;

    // Toggle expand on click
    tr.addEventListener('click', (e) => {
      if (e.target.closest('select, button, a')) return;
      detailTr.style.display = detailTr.style.display === 'none' ? 'table-row' : 'none';
      tr.style.background = detailTr.style.display === 'none' ? '' : 'rgba(59,130,246,0.04)';
    });

    adminTicketsBody.appendChild(tr);
    adminTicketsBody.appendChild(detailTr);
  });

  bindAdminButtons();
  bindHistorialButtons();
}

// ===== HISTORIAL DE ESTADOS =====
function bindHistorialButtons() {
  document.querySelectorAll('.admin-historial-btn').forEach(btn => {
    btn.addEventListener('click', () => verHistorial(btn.dataset.ticket));
  });
}

async function verHistorial(ticketId) {
  try {
    const resp = await fetch(`/api/historial/${ticketId}`);
    const data = await resp.json();

    if (!data.length) {
      alert(`Ticket ${ticketId}\n\nSin historial registrado.`);
      return;
    }

    let texto = `📋 HISTORIAL — ${ticketId}\n${'━'.repeat(32)}\n\n`;
    data.forEach((h, i) => {
      const icono = h.estado === 'Creado' ? '🟢'
        : h.estado === 'En proceso' ? '🔵'
        : h.estado === 'Resuelto' ? '✅'
        : '⏳';
      texto += `${icono}  ${h.estado}\n     ${h.fecha}\n\n`;
    });

    alert(texto);
  } catch (err) {
    console.error(err);
    alert('Error consultando historial.');
  }
}

function filterAdminTable() {
  const search = (adminSearch?.value || '').trim().toLowerCase();
  const estado = adminFilterStatus?.value || 'Todos';

  const filtered = adminTicketsData.filter(item => {
    const fullText = [
      item.ticket,
      item.nombre,
      item.asunto,
      item.numero_proceso,
      item.ciudad,
      item.despacho
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

// ===== CHARTS =====
let chartEstado = null;
let chartCiudad = null;

function renderCharts(data) {
  // --- Doughnut: Estado ---
  const ctxEstado = document.getElementById('chart-estado');
  if (ctxEstado) {
    if (chartEstado) chartEstado.destroy();
    chartEstado = new Chart(ctxEstado, {
      type: 'doughnut',
      data: {
        labels: ['Pendientes', 'En proceso', 'Resueltos'],
        datasets: [{
          data: [data.pendientes, data.enProceso, data.resueltos],
          backgroundColor: ['#F59E0B', '#3B82F6', '#22C55E'],
          borderColor: ['#D97706', '#2563EB', '#16A34A'],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#CBD5E1', font: { size: 12 }, padding: 16 }
          }
        }
      }
    });
  }

  // --- Bar: Ciudad ---
  const ctxCiudad = document.getElementById('chart-ciudad');
  if (ctxCiudad && data.porCiudad) {
    const ciudades = Object.keys(data.porCiudad);
    const valores = Object.values(data.porCiudad);

    if (chartCiudad) chartCiudad.destroy();
    chartCiudad = new Chart(ctxCiudad, {
      type: 'bar',
      data: {
        labels: ciudades,
        datasets: [{
          label: 'Tickets',
          data: valores,
          backgroundColor: 'rgba(59,130,246,0.6)',
          borderColor: '#3B82F6',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#94A3B8', stepSize: 1 },
            grid: { color: 'rgba(148,163,184,0.1)' }
          },
          x: {
            ticks: { color: '#CBD5E1', font: { size: 11 } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
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

    // ===== GRÁFICOS =====
    renderCharts(data);
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
  if (adminDashboard) adminDashboard.style.display = 'none';
  if (adminLoginMsg) {
    adminLoginMsg.style.display = 'none';
    adminLoginMsg.textContent = '';
  }
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

// ===== EXTENSIONES DINÁMICAS =====
let extensionesData = [];

async function cargarExtensiones() {
  const select = document.getElementById('ext-despacho-select');
  if (!select) return;

  try {
    const resp = await fetch('/api/extensiones');
    extensionesData = await resp.json();

    extensionesData.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.despacho;
      opt.textContent = item.despacho;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      const seleccionado = extensionesData.find(
        i => i.despacho === select.value
      );
      const resultado = document.getElementById('ext-resultado');
      const numero = document.getElementById('ext-resultado-number');

      if (seleccionado && resultado && numero) {
        numero.textContent = seleccionado.extension;
        resultado.style.display = 'flex';
        resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  } catch (err) {
    console.error('[EXTENSIONES] Error cargando:', err);
  }
}

function copiarExtension() {
  const numero = document.getElementById('ext-resultado-number');
  const btn = document.getElementById('btn-copiar-ext');
  if (!numero || !btn) return;

  const ext = numero.textContent.trim();

  navigator.clipboard.writeText(ext).then(() => {
    btn.textContent = '✅ Extensión copiada';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copiar';
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = ext;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);

    btn.textContent = '✅ Extensión copiada';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copiar';
      btn.classList.remove('copied');
    }, 2000);
  });
}

cargarExtensiones();

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