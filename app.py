import os
import sqlite3
import datetime
import smtplib
import requests
import io
import pandas as pd
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, render_template, request, jsonify, send_file
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "tickets.db")

# ===== CONFIG CORREO =====
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() == "true"
MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME)
ADMIN_NOTIFICATION_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL", MAIL_USERNAME)

# ===== CONFIG ADMIN =====
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASS = os.getenv("ADMIN_PASS", "admin123")

# ===== CONFIG WHATSAPP (CallMeBot) =====
WHATSAPP_PHONE = os.getenv("WHATSAPP_PHONE", "")
WHATSAPP_APIKEY = os.getenv("WHATSAPP_APIKEY", "")

# ===== CONFIG TELEGRAM =====
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")
# ===== DB =====
DATABASE_URL = os.getenv("DATABASE_URL", "")
USE_PG = bool(DATABASE_URL)

if USE_PG:
    import psycopg2
    import psycopg2.extras


def get_conn():
    if USE_PG:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn


def db_cursor(conn):
    """Devuelve cursor con soporte dict para ambos motores."""
    if USE_PG:
        return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return conn.cursor()


def init_db():
    conn = get_conn()
    cur = db_cursor(conn)

    if USE_PG:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id SERIAL PRIMARY KEY,
                ticket TEXT UNIQUE NOT NULL,
                nombre TEXT,
                correo TEXT,
                telefono TEXT,
                ciudad TEXT,
                despacho TEXT,
                tipo_usuario TEXT,
                asunto TEXT,
                numero_proceso TEXT,
                descripcion TEXT,
                estado TEXT DEFAULT 'Pendiente',
                fecha_creacion TEXT,
                tipo_solicitud TEXT,
                quien_radica TEXT,
                tipo_memorial TEXT,
                link_drive TEXT
            )
        """)
        conn.commit()

        # Migrar columnas nuevas (PostgreSQL)
        for col in ["tipo_solicitud", "quien_radica", "tipo_memorial", "link_drive"]:
            try:
                cur.execute(f"ALTER TABLE tickets ADD COLUMN {col} TEXT")
                conn.commit()
            except Exception:
                conn.rollback()

        # Tabla historial
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ticket_historial (
                id SERIAL PRIMARY KEY,
                ticket_id TEXT NOT NULL,
                estado TEXT NOT NULL,
                fecha TEXT NOT NULL
            )
        """)
        conn.commit()
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket TEXT UNIQUE NOT NULL,
                nombre TEXT,
                correo TEXT,
                telefono TEXT,
                ciudad TEXT,
                despacho TEXT,
                tipo_usuario TEXT,
                asunto TEXT,
                numero_proceso TEXT,
                descripcion TEXT,
                estado TEXT DEFAULT 'Pendiente',
                fecha_creacion TEXT,
                tipo_solicitud TEXT,
                quien_radica TEXT,
                tipo_memorial TEXT,
                link_drive TEXT
            )
        """)
        conn.commit()

        # Migrar columnas nuevas (SQLite)
        for col in ["tipo_solicitud", "quien_radica", "tipo_memorial", "link_drive"]:
            try:
                cur.execute(f"ALTER TABLE tickets ADD COLUMN {col} TEXT")
                conn.commit()
            except Exception:
                pass

        # Tabla historial
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ticket_historial (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                estado TEXT NOT NULL,
                fecha TEXT NOT NULL
            )
        """)
        conn.commit()

    conn.close()


def generate_ticket():
    today_str = datetime.datetime.now().strftime('%Y%m%d')
    prefix = f"SAMAI-{today_str}-"

    conn = get_conn()
    cur = db_cursor(conn)
    cur.execute("""
        SELECT ticket FROM tickets
        WHERE ticket LIKE %s
        ORDER BY id DESC
        LIMIT 1
    """, (f"{prefix}%",))
    row = cur.fetchone()
    conn.close()

    if not row:
        count = 1
    else:
        last_ticket = row["ticket"]
        try:
            count = int(last_ticket.split("-")[-1]) + 1
        except Exception:
            count = 1

    return f"{prefix}{count:04d}"


def guardar_historial(ticket_id, estado):
    """Registra un cambio de estado en el historial."""
    fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        conn = get_conn()
        cur = db_cursor(conn)
        cur.execute(
            "INSERT INTO ticket_historial (ticket_id, estado, fecha) VALUES (%s, %s, %s)",
            (ticket_id, estado, fecha)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[HISTORIAL ERROR] {e}")


# ===== CORREO =====
def send_email(to_email, subject, html_body, text_body=None):
    if not MAIL_USERNAME or not MAIL_PASSWORD or not to_email:
        print("[MAIL] Config incompleta")
        return False, "Config incompleta"

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = MAIL_DEFAULT_SENDER
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.ehlo()

        if MAIL_USE_TLS:
            server.starttls()
            server.ehlo()

        server.login(MAIL_USERNAME, MAIL_PASSWORD)
        server.sendmail(MAIL_DEFAULT_SENDER, [to_email], msg.as_string())
        server.quit()

        return True, None
    except Exception as e:
        print(f"[MAIL ERROR] {e}")
        return False, str(e)


# ===== WHATSAPP =====
def send_whatsapp(ticket_data):
    if not WHATSAPP_PHONE or not WHATSAPP_APIKEY:
        print("[WHATSAPP] Config incompleta, se omite envío")
        return False

    try:
        mensaje = (
            f"📋 *NUEVO TICKET SAMAI*\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"🔖 *Ticket:* {ticket_data['ticket']}\n"
            f"👤 *Nombre:* {ticket_data['nombre']}\n"
            f"📧 *Correo:* {ticket_data['correo']}\n"
            f"📞 *Teléfono:* {ticket_data.get('telefono', '')}\n"
            f"🏛️ *Ciudad:* {ticket_data.get('ciudad', '')}\n"
            f"🏢 *Despacho:* {ticket_data.get('despacho', '')}\n"
            f"📌 *Asunto:* {ticket_data['asunto']}\n"
            f"📝 *Descripción:* {ticket_data['descripcion']}\n"
            f"━━━━━━━━━━━━━━━━━━━━\n"
            f"📅 {ticket_data.get('fecha_creacion', '')}\n"
            f"⏳ Estado: Pendiente"
        )

        url = "https://api.callmebot.com/whatsapp.php"
        params = {
            "phone": WHATSAPP_PHONE,
            "text": mensaje,
            "apikey": WHATSAPP_APIKEY
        }

        resp = requests.get(url, params=params, timeout=10)
        print(f"[WHATSAPP] Enviado: {resp.status_code}")
        return resp.status_code == 200
    except Exception as e:
        print(f"[WHATSAPP ERROR] {e}")
        return False


# ===== TELEGRAM =====
def enviar_telegram(ticket_data):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("[TELEGRAM] Config incompleta, se omite envío")
        return False

    try:
        es_memorial = ticket_data.get('tipo_solicitud') == 'Envío de memorial'

        if es_memorial:
            mensaje = (
                f"📂 NUEVO MEMORIAL\n\n"
                f"🎫 Ticket: {ticket_data['ticket']}\n"
                f"👤 Usuario: {ticket_data['nombre']}\n"
                f"⚖️ Proceso: {ticket_data.get('numero_proceso', '')}\n"
                f"🧑‍⚖️ Radica: {ticket_data.get('quien_radica', '')}\n"
                f"📄 Tipo: {ticket_data.get('tipo_memorial', '')}\n"
                f"📎 Archivos: {ticket_data.get('link_drive', 'Sin enlace')}"
            )
        else:
            mensaje = (
                f"🚨 NUEVA SOLICITUD\n\n"
                f"🎫 Ticket: {ticket_data['ticket']}\n"
                f"👤 Usuario: {ticket_data['nombre']}\n"
                f"📌 Asunto: {ticket_data['asunto']}\n"
                f"📝 Descripción: {ticket_data.get('descripcion', '')}"
            )

        ticket_url = f"http://127.0.0.1:10000/trazabilidad/{ticket_data['ticket']}"
        mensaje += f"\n\n🔗 Ver ticket:\n{ticket_url}"

        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": mensaje,
            "parse_mode": "HTML"
        }

        resp = requests.post(url, json=payload, timeout=10)
        print(f"[TELEGRAM] Enviado: {resp.status_code}")
        return resp.status_code == 200
    except Exception as e:
        print(f"[TELEGRAM ERROR] {e}")
        return False


# ===== HTML CORREOS =====
def _email_base(content):
    """Plantilla base profesional institucional para todos los correos."""
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:30px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <!-- HEADER -->
            <tr>
              <td style="background:linear-gradient(135deg,#0B2A4A 0%,#1E5A7A 100%);padding:28px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:1.5px;">SAMAI</h1>
                <p style="margin:4px 0 0;color:#93C5FD;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Sistema de Soporte Técnico</p>
              </td>
            </tr>
            <tr>
              <td style="background:#1E3A5F;padding:8px 40px;text-align:center;">
                <p style="margin:0;color:#93C5FD;font-size:11px;letter-spacing:1px;">Juzgados Administrativos · Rama Judicial · Boyacá</p>
              </td>
            </tr>
            <!-- CONTENT -->
            <tr>
              <td style="padding:35px 40px;">
                {content}
              </td>
            </tr>
            <!-- FOOTER -->
            <tr>
              <td style="background:#0B2A4A;padding:24px 40px;text-align:center;">
                <p style="margin:0;color:#93C5FD;font-size:12px;font-weight:600;">Sistema de Soporte SAMAI</p>
                <p style="margin:4px 0 0;color:#64748B;font-size:11px;">Ing. Miguel Ángel Gutiérrez Roa · Soporte Técnico</p>
                <p style="margin:8px 0 0;color:#475569;font-size:10px;">Este es un correo automático. Por favor no responda a este mensaje.</p>
                <p style="margin:4px 0 0;color:#475569;font-size:10px;">© {datetime.datetime.now().year} SAMAI · Todos los derechos reservados</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


def _ticket_row(label, value, icon=""):
    """Fila de tabla para datos del ticket."""
    return f"""
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;font-weight:600;white-space:nowrap;">{icon} {label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;color:#1E293B;font-size:14px;">{value or '—'}</td>
    </tr>
    """


def _link_row(label, url, icon="📎"):
    """Fila con enlace clickeable."""
    if not url:
        return _ticket_row(label, "—", icon)
    return f"""
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;color:#64748B;font-size:13px;font-weight:600;white-space:nowrap;">{icon} {label}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #F1F5F9;"><a href="{url}" target="_blank" style="color:#2563EB;font-size:14px;text-decoration:underline;">Ver archivos adjuntos</a></td>
    </tr>
    """


def admin_email_html(t):
    es_memorial = t.get('tipo_solicitud') == 'Envío de memorial'

    tipo_badge = 'MEMORIAL RECIBIDO' if es_memorial else 'NUEVA SOLICITUD RECIBIDA'
    badge_bg = '#DBEAFE' if es_memorial else '#FEF3C7'
    badge_color = '#1E40AF' if es_memorial else '#92400E'

    rows = (
        _ticket_row("Nombre", t['nombre'], "👤") +
        _ticket_row("Correo", t['correo'], "📧") +
        _ticket_row("Teléfono", t.get('telefono', ''), "📞") +
        _ticket_row("Ciudad", t.get('ciudad', ''), "🏛️") +
        _ticket_row("Despacho", t.get('despacho', ''), "🏢") +
        _ticket_row("Tipo usuario", t.get('tipo_usuario', ''), "👥") +
        _ticket_row("Asunto", t['asunto'], "📌") +
        _ticket_row("Nro. proceso", t.get('numero_proceso', ''), "📁") +
        _ticket_row("Descripción", t.get('descripcion', ''), "📝")
    )

    if es_memorial:
        rows += (
            _ticket_row("Quien radica", t.get('quien_radica', ''), "🧑‍⚖️") +
            _ticket_row("Tipo memorial", t.get('tipo_memorial', ''), "📄") +
            _link_row("Archivos adjuntos", t.get('link_drive', ''))
        )

    rows += (
        _ticket_row("Fecha", t.get('fecha_creacion', ''), "📅") +
        _ticket_row("Estado", "Pendiente", "⏳")
    )

    content = f"""
    <div style="text-align:center;margin-bottom:25px;">
      <span style="display:inline-block;background:{badge_bg};color:{badge_color};padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">{tipo_badge}</span>
    </div>
    <div style="background:#EFF6FF;border:2px solid #3B82F6;border-radius:10px;padding:20px;text-align:center;margin-bottom:25px;">
      <p style="margin:0 0 4px;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Número de ticket</p>
      <p style="margin:0;color:#1E40AF;font-size:28px;font-weight:800;letter-spacing:2px;">{t['ticket']}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
      {rows}
    </table>
    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;border-left:4px solid #3B82F6;margin-top:20px;">
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">Ingrese al panel de administración para gestionar este ticket.</p>
    </div>
    """

    return _email_base(content)


def user_email_html(t):
    es_memorial = t.get('tipo_solicitud') == 'Envío de memorial'
    badge_text = 'MEMORIAL RECIBIDO ✓' if es_memorial else 'SOLICITUD RECIBIDA ✓'

    if es_memorial:
        intro_text = 'Hemos recibido su memorial correctamente. A continuación encontrará el resumen de la información registrada:'
    else:
        intro_text = 'Hemos recibido su solicitud de soporte técnico. A continuación encontrará los detalles de su registro:'

    # Filas comunes
    rows = (
        _ticket_row("Nombre", t['nombre'], "👤") +
        _ticket_row("Correo", t['correo'], "📧") +
        _ticket_row("Teléfono", t.get('telefono', ''), "📞") +
        _ticket_row("Asunto", t['asunto'], "📌") +
        _ticket_row("Ciudad", t.get('ciudad', ''), "🏛️") +
        _ticket_row("Despacho", t.get('despacho', ''), "🏢") +
        _ticket_row("Descripción", t.get('descripcion', ''), "📝")
    )

    # Filas extra para memorial
    if es_memorial:
        rows += (
            _ticket_row("Quien radica", t.get('quien_radica', ''), "🧑‍⚖️") +
            _ticket_row("Tipo memorial", t.get('tipo_memorial', ''), "📄") +
            _ticket_row("Nro. proceso", t.get('numero_proceso', ''), "📁") +
            _link_row("Archivos adjuntos", t.get('link_drive', ''))
        )

    rows += (
        _ticket_row("Fecha", t.get('fecha_creacion', ''), "📅") +
        _ticket_row("Estado", "Pendiente", "⏳")
    )

    content = f"""
    <div style="text-align:center;margin-bottom:25px;">
      <span style="display:inline-block;background:#DCFCE7;color:#166534;padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">{badge_text}</span>
    </div>
    <p style="color:#334155;font-size:15px;line-height:1.6;">Estimado/a <strong>{t['nombre']}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">{intro_text}</p>
    <div style="background:#EFF6FF;border:2px solid #3B82F6;border-radius:10px;padding:24px;text-align:center;margin:25px 0;">
      <p style="margin:0 0 4px;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Su número de ticket</p>
      <p style="margin:0;color:#1E40AF;font-size:32px;font-weight:800;letter-spacing:2px;">{t['ticket']}</p>
      <p style="margin:8px 0 0;color:#64748B;font-size:12px;">Guarde este número para consultar el estado de su solicitud</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      {rows}
    </table>
    <div style="background:#F8FAFC;border-radius:8px;padding:16px 20px;border-left:4px solid #3B82F6;">
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;"><strong>¿Qué sigue?</strong> Nuestro equipo revisará su solicitud y le notificaremos cualquier cambio de estado por correo electrónico.</p>
    </div>
    """

    return _email_base(content)


def status_email_html(t):
    estado = t.get('estado', 'Pendiente')

    if estado == 'Resuelto':
        badge_bg = '#DCFCE7'
        badge_color = '#166534'
        badge_icon = '✅'
        mensaje = 'Su solicitud ha sido <strong>resuelta</strong> por nuestro equipo de soporte técnico. Si tiene alguna duda adicional o requiere asistencia, no dude en crear un nuevo ticket.'
    elif estado == 'En proceso':
        badge_bg = '#FEF3C7'
        badge_color = '#92400E'
        badge_icon = '🔄'
        mensaje = 'Su solicitud está siendo <strong>atendida</strong> por nuestro equipo técnico. Le notificaremos por correo electrónico cuando haya novedades o se resuelva.'
    else:
        badge_bg = '#FEE2E2'
        badge_color = '#991B1B'
        badge_icon = '⏳'
        mensaje = 'Su solicitud se encuentra <strong>pendiente</strong> de revisión por nuestro equipo.'

    content = f"""
    <div style="text-align:center;margin-bottom:25px;">
      <span style="display:inline-block;background:{badge_bg};color:{badge_color};padding:6px 18px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:1px;">ACTUALIZACIÓN DE SOLICITUD</span>
    </div>
    <p style="color:#334155;font-size:15px;line-height:1.6;">Estimado/a <strong>{t.get('nombre', '')}</strong>,</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">Le informamos que el estado de su solicitud ha sido actualizado:</p>
    <div style="background:#EFF6FF;border:2px solid #3B82F6;border-radius:10px;padding:24px;text-align:center;margin:25px 0;">
      <p style="margin:0 0 4px;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Ticket</p>
      <p style="margin:0 0 16px;color:#1E40AF;font-size:24px;font-weight:800;letter-spacing:2px;">{t['ticket']}</p>
      <span style="display:inline-block;background:{badge_bg};color:{badge_color};padding:10px 28px;border-radius:25px;font-size:16px;font-weight:700;">{badge_icon} {estado}</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      {_ticket_row("Nombre", t.get('nombre', ''), "👤")}
      {_ticket_row("Asunto", t.get('asunto', ''), "📌")}
      {_ticket_row("Despacho", t.get('despacho', ''), "🏢")}
      {_ticket_row("Nuevo estado", estado, badge_icon)}
    </table>
    <div style="background:#F8FAFC;border-radius:8px;padding:16px 20px;border-left:4px solid #3B82F6;">
      <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">{mensaje}</p>
    </div>
    """

    return _email_base(content)


# ===== RUTAS =====
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/soporte', methods=['POST'])
def soporte():
    data = request.get_json(silent=True) or {}

    required = ["nombre", "correo", "telefono", "ciudad", "tipo_usuario", "asunto", "descripcion"]
    for field in required:
        if not str(data.get(field, "")).strip():
            return jsonify({"status": "error", "message": f"Falta {field}"}), 400

    # Validar link obligatorio para memoriales
    tipo_solicitud = data.get("tipo_solicitud", "Solicitud general")
    link_drive = str(data.get("link_drive", "")).strip()

    if tipo_solicitud == "Envío de memorial":
        if not link_drive or not (link_drive.startswith("https://") or link_drive.startswith("http://")):
            return jsonify({"status": "error", "message": "Debe ingresar un enlace válido para el memorial"}), 400

    ticket_id = generate_ticket()
    fecha = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    ticket_data = {
        "ticket": ticket_id,
        "nombre": data.get("nombre"),
        "correo": data.get("correo"),
        "telefono": data.get("telefono"),
        "ciudad": data.get("ciudad"),
        "despacho": data.get("despacho"),
        "tipo_usuario": data.get("tipo_usuario"),
        "asunto": data.get("asunto"),
        "numero_proceso": data.get("numero_proceso"),
        "descripcion": data.get("descripcion"),
        "estado": "Pendiente",
        "fecha_creacion": fecha,
        "tipo_solicitud": data.get("tipo_solicitud", "Solicitud general"),
        "quien_radica": data.get("quien_radica"),
        "tipo_memorial": data.get("tipo_memorial"),
        "link_drive": data.get("link_drive")
    }

    conn = get_conn()
    cur = db_cursor(conn)
    cur.execute("""
        INSERT INTO tickets (
            ticket,nombre,correo,telefono,ciudad,despacho,
            tipo_usuario,asunto,numero_proceso,descripcion,
            estado,fecha_creacion,tipo_solicitud,quien_radica,tipo_memorial,link_drive
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        ticket_data["ticket"],
        ticket_data["nombre"],
        ticket_data["correo"],
        ticket_data["telefono"],
        ticket_data["ciudad"],
        ticket_data["despacho"],
        ticket_data["tipo_usuario"],
        ticket_data["asunto"],
        ticket_data["numero_proceso"],
        ticket_data["descripcion"],
        ticket_data["estado"],
        ticket_data["fecha_creacion"],
        ticket_data["tipo_solicitud"],
        ticket_data["quien_radica"],
        ticket_data["tipo_memorial"],
        ticket_data["link_drive"]
    ))
    conn.commit()
    conn.close()

    # ===== HISTORIAL: CREADO =====
    guardar_historial(ticket_id, "Creado")

    # ===== CORREOS DIFERENCIADOS =====
    es_memorial = ticket_data.get('tipo_solicitud') == 'Envío de memorial'

    admin_subject = f"Memorial recibido - {ticket_id}" if es_memorial else f"Solicitud recibida - {ticket_id}"
    user_subject = f"Memorial recibido - {ticket_id}" if es_memorial else f"Confirmación solicitud - {ticket_id}"

    send_email(
        ADMIN_NOTIFICATION_EMAIL,
        admin_subject,
        admin_email_html(ticket_data)
    )

    send_email(
        ticket_data["correo"],
        user_subject,
        user_email_html(ticket_data)
    )

    # ===== WHATSAPP AL ADMIN =====
    try:
        send_whatsapp(ticket_data)
    except Exception as e:
        print(f"[WHATSAPP] Error no crítico: {e}")

    # ===== TELEGRAM AL ADMIN =====
    try:
        enviar_telegram(ticket_data)
    except Exception as e:
        print(f"[TELEGRAM] Error no crítico: {e}")

    return jsonify({"status": "ok", "ticket": ticket_id})



@app.route('/exportar_tickets')
def exportar_tickets():
    conn = get_conn()
    cur = db_cursor(conn)
    cur.execute("SELECT * FROM tickets ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()

    tickets = [dict(r) for r in rows]

    df = pd.DataFrame(tickets, columns=[
        'ticket', 'tipo_solicitud', 'nombre', 'correo', 'telefono',
        'ciudad', 'despacho', 'tipo_usuario', 'asunto', 'numero_proceso',
        'descripcion', 'estado', 'fecha_creacion', 'quien_radica',
        'tipo_memorial', 'link_drive'
    ])

    df.columns = [
        'Ticket', 'Tipo solicitud', 'Nombre', 'Correo', 'Teléfono',
        'Ciudad', 'Despacho', 'Tipo usuario', 'Asunto', 'Nro. proceso',
        'Descripción', 'Estado', 'Fecha creación', 'Quien radica',
        'Tipo memorial', 'Enlace archivos'
    ]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Tickets')
    output.seek(0)

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='tickets.xlsx'
    )


@app.route('/api/admin', methods=['POST'])
def admin_panel():
    user = request.form.get('username')
    pwd = request.form.get('password')
    action = request.form.get('action')

    if user != ADMIN_USER or pwd != ADMIN_PASS:
        return jsonify({"status": "error", "message": "Credenciales incorrectas"}), 403

    role = "admin"

    # ===== LOGIN =====
    if action == 'admin_login':
        return jsonify({"status": "ok", "role": role})

    # ===== ESTADÍSTICAS =====
    if action == 'get_stats':
        conn = get_conn()
        cur = db_cursor(conn)
        cur.execute("SELECT * FROM tickets ORDER BY id DESC")
        rows = cur.fetchall()
        conn.close()

        tickets = [dict(r) for r in rows]
        total = len(tickets)
        pendientes = sum(1 for t in tickets if t["estado"] == "Pendiente")
        enProceso = sum(1 for t in tickets if t["estado"] == "En proceso")
        resueltos = sum(1 for t in tickets if t["estado"] == "Resuelto")
        porcentaje = round((resueltos / total * 100) if total > 0 else 0, 1)

        porCiudad = {}
        for t in tickets:
            c = t.get("ciudad") or "Sin ciudad"
            porCiudad[c] = porCiudad.get(c, 0) + 1

        porTipoUsuario = {}
        for t in tickets:
            tu = t.get("tipo_usuario") or "Sin tipo"
            porTipoUsuario[tu] = porTipoUsuario.get(tu, 0) + 1

        return jsonify({
            "status": "ok",
            "role": role,
            "total": total,
            "pendientes": pendientes,
            "enProceso": enProceso,
            "resueltos": resueltos,
            "porcentajeResolucion": porcentaje,
            "porCiudad": porCiudad,
            "porTipoUsuario": porTipoUsuario,
            "tickets": tickets
        })

    # ===== ACTUALIZAR TICKET =====
    if action == 'update_ticket':
        ticket_id = request.form.get('ticket')
        nuevo_estado = request.form.get('estado')

        if not ticket_id or not nuevo_estado:
            return jsonify({"status": "error", "message": "Faltan datos"}), 400

        conn = get_conn()
        cur = db_cursor(conn)
        cur.execute("UPDATE tickets SET estado = %s WHERE ticket = %s", (nuevo_estado, ticket_id))
        conn.commit()

        # ===== HISTORIAL: CAMBIO DE ESTADO =====
        cur.execute(
            "INSERT INTO ticket_historial (ticket_id, estado, fecha) VALUES (%s, %s, %s)",
            (ticket_id, nuevo_estado, datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        )
        conn.commit()

        cur.execute("SELECT * FROM tickets WHERE ticket = %s", (ticket_id,))
        row = cur.fetchone()
        conn.close()

        if row:
            ticket_data = dict(row)
            if ticket_data.get("correo"):
                send_email(
                    ticket_data["correo"],
                    f"Estado actualizado - {ticket_id}",
                    status_email_html(ticket_data)
                )

        return jsonify({"status": "ok"})

    return jsonify({"status": "error", "message": "Acción no válida"}), 400


@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    conn = get_conn()
    cur = db_cursor(conn)
    cur.execute("SELECT * FROM tickets ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()

    data = [dict(r) for r in rows]
    return jsonify(data)


@app.route('/api/historial/<ticket>', methods=['GET'])
def get_historial(ticket):
    conn = get_conn()
    cur = db_cursor(conn)
    cur.execute(
        "SELECT estado, fecha FROM ticket_historial WHERE ticket_id = %s ORDER BY id ASC",
        (ticket,)
    )
    rows = cur.fetchall()
    conn.close()

    data = [dict(r) for r in rows]
    return jsonify(data)



# ===== INIT =====
init_db()

# ===== START =====
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
    