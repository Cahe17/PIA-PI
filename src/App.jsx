/**
 * ATLAS CRM Solar — Funcionalidades Principales
 * Proyecto Integrador 1 — FIME UANL
 */

import { useState } from "react";

// ─────────────────────────────────────────────────────────
//  DATOS CONSTANTES E INICIALES
// ─────────────────────────────────────────────────────────

const IRRADIACION = { Monterrey: 5.4, "Ciudad de México": 5.1, Guadalajara: 5.3, Tijuana: 5.8, Mérida: 5.6, Otra: 5.0 };

const INVENTARIO_INICIAL = [
  { id: 1, tipo: "Panel", modelo: "JA Solar 550W Mono", potencia_w: 550, precio: 3200, existencias: 80 },
  { id: 2, tipo: "Inversor", modelo: "Growatt 5kW String", potencia_kw: 5, precio: 14500, existencias: 12 },
  { id: 3, tipo: "Estructura", modelo: "Estructura aluminio", precio: 420, existencias: 200 },
  { id: 4, tipo: "Cableado", modelo: "Cableado + protecciones", precio: 3500, existencias: 999 },
  { id: 5, tipo: "Mano de obra", modelo: "Instalación estándar", precio: 8000, existencias: 999 },
];

const LEADS_INICIALES = [
  { id: 1, nombre: "Erik Aguilar Martínez", empresa: "Sunrise Energy", telefono: "81-1234-5678", consumo_kwh: 850, estado: "Nuevo" },
];

// NUEVO: Lista de clientes inactivos para reactivación
const CLIENTES_INACTIVOS_INICIALES = [
  { id: 101, nombre: "Industrias Alfa", ultima_compra: "2024-10-15", meses_inactivo: 18, estado_reactivacion: "Pendiente" },
  { id: 102, nombre: "Comercializadora del Norte", ultima_compra: "2025-05-20", meses_inactivo: 12, estado_reactivacion: "Pendiente" }
];

// NUEVO: Tickets de instalación/mantenimiento
const TICKETS_INICIALES = [
  { id: 501, cliente: "Sunrise Energy", tipo: "Instalación Nueva", estado: "Asignado", tecnico: "Juan Técnico", fecha: "2026-05-30" },
  { id: 502, cliente: "Residencial Las Cumbres", tipo: "Mantenimiento Preventivo", estado: "En Progreso", tecnico: "Juan Técnico", fecha: "2026-05-25" }
];

// NUEVO: ROLES COMPLETOS
const USUARIOS = [
  { email: "admin@atlas.com", password: "123", nombre: "Admin Master", rol: "Administrador" },
  { email: "ventas@atlas.com", password: "123", nombre: "Agente Ventas", rol: "Agente" },
  { email: "tecnico@atlas.com", password: "123", nombre: "Juan Técnico", rol: "Técnico" },
  { email: "cliente@atlas.com", password: "123", nombre: "Empresa Sunrise", rol: "Cliente" },
];

const ESTADOS_LEAD = ["Nuevo", "Contactado", "En seguimiento", "Cotizado", "Cerrado ganado", "Cerrado perdido"];
const ESTADOS_COTIZACION = ["Pendiente", "Aprobada", "Rechazada"];
const ESTADOS_REACTIVACION = ["Pendiente", "Renovó mantenimiento", "Solicitó ampliación", "No interesado", "Sin respuesta (3 intentos)"];

const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────────────────
//  COMPONENTE: LOGIN
// ─────────────────────────────────────────────────────────
function Login({ onLogin, usuarios }) { // <-- Recibe usuarios como propiedad
  const [email, setEmail] = useState("admin@atlas.com");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Busca en la lista dinámica de usuarios
    const user = usuarios.find(u => u.email === email && u.password === password);
    if (user) onLogin(user);
    else setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">ATLAS CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Acceso al sistema (v2.0)</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Correo electrónico</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg text-sm">Iniciar sesión</button>
        </form>
        <div className="mt-6 text-xs text-slate-500 text-center space-y-1">
          <p><b>Demos disponibles (Pass: 123)</b></p>
          <p>admin@atlas.com | ventas@atlas.com</p>
          <p>tecnico@atlas.com | cliente@atlas.com</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MÓDULO: PORTAL TÉCNICO
// ─────────────────────────────────────────────────────────
function PortalTecnico({ tickets, setTickets }) {
  
  const actualizarTicket = (id) => {
    // 1. Pedimos el nuevo estado
    const nuevoEstado = window.prompt("Ingresa el nuevo estado del ticket (ej. Completado, En Progreso, Detenido):");
    
    if (nuevoEstado) {
      // 2. Simulamos la subida de evidencia
      const evidencia = window.confirm("¿Deseas adjuntar una fotografía como evidencia de la visita técnica?");
      if (evidencia) {
        alert("Simulando apertura de explorador de archivos... \n\n¡Evidencia fotográfica subida con éxito al servidor!");
      }
      
      // 3. Actualizamos el arreglo global de tickets
      setTickets(tickets.map(t => 
        t.id === id ? { ...t, estado: nuevoEstado } : t
      ));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold">Mis Instalaciones y Tickets Asignados</h2>
      <div className="grid gap-4">
        {tickets.map(t => (
          <div key={t.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-800">Ticket #{t.id} - {t.cliente}</p>
              <p className="text-sm text-slate-500">Tipo: {t.tipo} | Fecha prog: {t.fecha}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                t.estado === 'Completado' ? 'bg-green-100 text-green-700' : 
                t.estado === 'Asignado' ? 'bg-blue-100 text-blue-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {t.estado}
              </span>
              <button 
                onClick={() => actualizarTicket(t.id)} 
                className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                Actualizar Estado / Subir Evidencia
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MÓDULO: PORTAL CLIENTE (Dinámico)
// ─────────────────────────────────────────────────────────
function PortalCliente({ tickets, setTickets, usuarioActual }) { // <-- Recibe usuarioActual
  
  const solicitarRevision = () => {
    const motivo = window.prompt("¿Cuál es el motivo de la revisión técnica? (Ej. Limpieza de paneles, Falla en inversor, Bajo rendimiento):");
    
    if (motivo) {
      const nuevoTicket = {
        id: Math.floor(Math.random() * 900) + 100,
        cliente: usuarioActual.nombre, // <-- Usa el nombre del cliente real
        tipo: motivo,
        estado: "Pendiente",
        tecnico: "Por asignar",
        fecha: new Date().toLocaleDateString()
      };
      
      setTickets([...tickets, nuevoTicket]);
      alert(`¡Solicitud enviada con éxito! Tu número de reporte es el #${nuevoTicket.id}.`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Muestra el nombre dinámico del cliente logueado */}
      <h2 className="text-xl font-semibold">Mi Sistema Solar — {usuarioActual.nombre}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl border border-green-200 border-l-4 border-l-green-500">
          <h3 className="text-sm text-slate-500 font-medium">Estado del Sistema</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">Operando Correctamente</p>
          <p className="text-sm text-slate-600 mt-2">Generación hoy: <b>14.2 kWh</b></p>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="text-sm text-slate-500 font-medium">Próximo Mantenimiento</h3>
          <p className="text-xl font-bold text-slate-800 mt-1">15 de Noviembre, 2026</p>
          <button 
            onClick={solicitarRevision} 
            className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800 hover:underline transition-colors"
          >
            Solicitar revisión técnica →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MÓDULO: REACTIVACIÓN COMERCIAL
// ─────────────────────────────────────────────────────────
function ReactivacionComercial({ clientes, setClientes }) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Campañas de Reactivación</h2>
      <p className="text-sm text-slate-500 mb-4">Clientes inactivos por más de 12 meses (Umbral configurable por admin).</p>
      
      <table className="w-full bg-white border rounded-xl text-sm overflow-hidden">
        <thead className="bg-slate-50"><tr><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Meses Inactivo</th><th className="p-3 text-left">Resultado de Contacto</th></tr></thead>
        <tbody>
          {clientes.map(c => (
            <tr key={c.id} className="border-t">
              <td className="p-3 font-medium">{c.nombre} <br/><span className="text-xs text-slate-400">Última compra: {c.ultima_compra}</span></td>
              <td className="p-3 text-red-600 font-bold">{c.meses_inactivo} meses</td>
              <td className="p-3">
                <select value={c.estado_reactivacion} onChange={(e) => setClientes(clientes.map(x => x.id === c.id ? {...x, estado_reactivacion: e.target.value} : x))} className="border bg-slate-50 rounded px-2 py-1 text-xs w-full">
                  {ESTADOS_REACTIVACION.map(e => <option key={e}>{e}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MÓDULO: INVENTARIO (Con justificación de bajas)
// ─────────────────────────────────────────────────────────
function GestionInventario({ inventario, setInventario, usuario }) {
  const [nuevoItem, setNuevoItem] = useState({ tipo: "Panel", modelo: "", precio: "", existencias: "" });
  const isAdmin = usuario.rol === "Administrador";

  const agregarItem = () => {
    if (!nuevoItem.modelo || !nuevoItem.precio) return;
    const nuevoId = inventario.length > 0 ? Math.max(...inventario.map(i => i.id)) + 1 : 1;
    setInventario([...inventario, { ...nuevoItem, id: nuevoId, precio: parseFloat(nuevoItem.precio), existencias: parseInt(nuevoItem.existencias) || 0 }]);
    setNuevoItem({ tipo: "Panel", modelo: "", precio: "", existencias: "" });
  };

  const eliminarItem = (id) => {
    const motivo = window.prompt("Requisito de auditoría: Especifique el motivo de la baja del artículo (ej. Daño, obsoleto, merma):");
    if (motivo) {
      alert(`Artículo dado de baja. Motivo registrado: "${motivo}"`);
      setInventario(inventario.filter(i => i.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Módulo de Inventario y Proveedores</h2>
        {isAdmin && <button className="text-sm bg-slate-800 text-white px-3 py-1.5 rounded">Gestionar Proveedores</button>}
      </div>
      
      {isAdmin && (
        <div className="bg-white rounded-xl border p-4 flex gap-4 items-end">
          <div className="flex-1"><label className="block text-xs mb-1">Tipo</label><select value={nuevoItem.tipo} onChange={(e) => setNuevoItem({...nuevoItem, tipo: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm"><option>Panel</option><option>Inversor</option><option>Estructura</option><option>Cableado</option></select></div>
          <div className="flex-[2]"><label className="block text-xs mb-1">Modelo</label><input value={nuevoItem.modelo} onChange={(e) => setNuevoItem({...nuevoItem, modelo: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
          <div className="flex-1"><label className="block text-xs mb-1">Costo Unit.</label><input type="number" value={nuevoItem.precio} onChange={(e) => setNuevoItem({...nuevoItem, precio: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
          <div className="flex-1"><label className="block text-xs mb-1">Stock</label><input type="number" value={nuevoItem.existencias} onChange={(e) => setNuevoItem({...nuevoItem, existencias: e.target.value})} className="w-full border rounded px-2 py-1.5 text-sm" /></div>
          <button onClick={agregarItem} className="bg-green-600 text-white px-4 py-1.5 rounded text-sm">Agregar</button>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b"><tr><th className="text-left p-3">ID</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Modelo</th><th className="text-left p-3">Costo Base</th><th className="text-left p-3">Stock</th>{isAdmin && <th className="text-left p-3">Acciones</th>}</tr></thead>
          <tbody className="divide-y">
            {inventario.map((item) => (
              <tr key={item.id}>
                <td className="p-3 text-slate-500">#{item.id}</td><td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.tipo}</span></td><td className="p-3">{item.modelo}</td><td className="p-3 font-medium">{fmt(item.precio)}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${item.existencias > 10 ? 'text-green-700' : 'text-red-600'}`}>{item.existencias} uds.</span></td>
                {isAdmin && <td className="p-3"><button onClick={() => eliminarItem(item.id)} className="text-red-500 hover:text-red-700 text-xs bg-red-50 px-2 py-1 rounded">Dar de baja</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  MÓDULOS: CALCULADORA, GENERADOR Y LEADS (Optimizados)
// ─────────────────────────────────────────────────────────

function CalculadoraSolar({ onCotizar, inventario }) {
  const [form, setForm] = useState({ consumo: "", ciudad: "Monterrey", perdidas: "80" });
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!form.consumo) return;
    const irr = IRRADIACION[form.ciudad];
    const kwp_necesarios = (form.consumo / 30) / (irr * (form.perdidas/100));
    const panel = inventario.find(c => c.tipo === "Panel");
    if(!panel) return alert("Error: No hay paneles registrados en el inventario.");
    
    const n_paneles = Math.ceil((kwp_necesarios * 1000) / panel.potencia_w);
    if(n_paneles > panel.existencias) return alert(`Stock insuficiente. Necesitas ${n_paneles} paneles, pero hay ${panel.existencias} disponibles.`);

    const inversor = inventario.find(c => c.tipo === "Inversor");
    setResultado({ panel, n_paneles, kwp_real: (n_paneles * panel.potencia_w) / 1000, inversor, produccion: (n_paneles * panel.potencia_w) / 1000 * irr * 365 * (form.perdidas/100) });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Calculadora de Dimensionamiento</h2>
      <div className="bg-white rounded-xl border p-6 grid grid-cols-2 gap-4">
        <div><label className="block text-sm mb-1">Consumo (kWh)</label><input type="number" className="w-full border rounded px-3 py-2 text-sm" onChange={(e) => setForm({ ...form, consumo: e.target.value })} /></div>
        <div><label className="block text-sm mb-1">Ciudad</label><select className="w-full border rounded px-3 py-2 text-sm" onChange={(e) => setForm({ ...form, ciudad: e.target.value })}>{Object.keys(IRRADIACION).map(c => <option key={c}>{c}</option>)}</select></div>
        <button onClick={calcular} className="col-span-2 bg-indigo-600 text-white py-2 rounded text-sm mt-2">Calcular sistema</button>
      </div>
      {resultado && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6">
          <h3 className="font-semibold text-green-800 mb-2">Sistema Sugerido ({resultado.kwp_real.toFixed(2)} kWp)</h3>
          <p className="text-sm">Paneles: {resultado.n_paneles}x {resultado.panel.modelo} | Inversor: 1x {resultado.inversor.modelo}</p>
          <button onClick={() => onCotizar(resultado)} className="w-full bg-green-600 text-white py-2 rounded text-sm mt-4">Generar Cotización Formal →</button>
        </div>
      )}
    </div>
  );
}

function GeneradorCotizacion({ lead, resultadoSolar, inventario, onGuardar }) {
  const [margen, setMargen] = useState(25);
  
  // Imprimir PDF usando el navegador
  const exportarPDF = () => {
    window.print();
  };

  if (!resultadoSolar) return <p className="p-6">Usa la calculadora primero.</p>;
  
  const items = [
    { ...resultadoSolar.panel, cantidad: resultadoSolar.n_paneles },
    { ...resultadoSolar.inversor, cantidad: 1 },
    { ...inventario.find(c => c.tipo === "Estructura"), cantidad: resultadoSolar.n_paneles },
    { ...inventario.find(c => c.tipo === "Cableado"), cantidad: 1 },
    { ...inventario.find(c => c.tipo === "Mano de obra"), cantidad: 1 },
  ].map(it => ({ ...it, subtotal: (it.precio || 0) * (it.cantidad || 1) }));
  
  const costoTotal = items.reduce((s, i) => s + i.subtotal, 0);
  const precioVenta = costoTotal * (1 + margen / 100);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-semibold">Propuesta Comercial</h2>
        <button onClick={exportarPDF} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          📄 Descargar PDF
        </button>
      </div>
      
      {/* Zona imprimible */}
      <div className="bg-white rounded-xl border p-8 print:border-none print:shadow-none" id="documento-pdf">
        <div className="border-b pb-4 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">ATLAS CRM Energy</h1>
            <p className="text-sm text-slate-500">Cotización formal de instalación fotovoltaica</p>
          </div>
          <div className="text-right text-sm">
            <p><b>Cliente:</b> {lead?.nombre || "Público General"}</p>
            <p><b>Fecha:</b> {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead><tr className="bg-slate-100 text-left"><th className="p-2">Concepto</th><th className="p-2">Cant.</th><th className="p-2 text-right">Subtotal</th></tr></thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b"><td className="p-2">{it.modelo}</td><td className="p-2">{it.cantidad}</td><td className="p-2 text-right">{fmt(it.subtotal)}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="print:hidden mb-6">
          <label className="block text-sm mb-1 font-medium">Ajuste de Margen Comercial ({margen}%)</label>
          <input type="range" min="10" max="50" value={margen} onChange={(e) => setMargen(Number(e.target.value))} className="w-full" />
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg text-right border border-indigo-100">
          <p className="text-sm text-slate-600">Subtotal Proyecto: {fmt(costoTotal)}</p>
          <p className="text-xl font-bold text-indigo-700 mt-2">INVERSIÓN TOTAL: {fmt(precioVenta)}</p>
          <p className="text-xs text-slate-500 mt-1">Precios expresados en MXN. Vigencia de 15 días.</p>
        </div>
      </div>

      <button onClick={() => onGuardar({ id: Date.now(), fecha: new Date().toLocaleDateString(), cliente: lead?.nombre||"Genérico", monto: precioVenta, estado: "Pendiente"})} className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl print:hidden">
        Guardar en Historial y Finalizar
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  APP PRINCIPAL — ENRUTADOR POR ROLES
// ─────────────────────────────────────────────────────────
export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // 1. AQUÍ ESTÁN LOS USUARIOS DINÁMICOS
  const [usuarios, setUsuarios] = useState([
    { email: "admin@atlas.com", password: "123", nombre: "Admin Master", rol: "Administrador" },
    { email: "ventas@atlas.com", password: "123", nombre: "Agente Ventas", rol: "Agente" },
    { email: "tecnico@atlas.com", password: "123", nombre: "Juan Técnico", rol: "Técnico" },
    { email: "cliente@atlas.com", password: "123", nombre: "Sunrise Energy", rol: "Cliente" },
  ]);

  const [pagina, setPagina] = useState("dashboard");
  const [inventario, setInventario] = useState(INVENTARIO_INICIAL);
  const [leads, setLeads] = useState(LEADS_INICIALES);
  const [inactivos, setInactivos] = useState(CLIENTES_INACTIVOS_INICIALES);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [tickets, setTickets] = useState(TICKETS_INICIALES);
  const [leadActivo, setLeadActivo] = useState(null);
  const [resultadoSolar, setResultadoSolar] = useState(null);
  
  // 2. ESTADO PARA CREAR NUEVOS CLIENTES
  const [nuevoLead, setNuevoLead] = useState({ nombre: "", telefono: "", consumo_kwh: "" });

  // 3. SE LE PASAN LOS USUARIOS AL LOGIN
  if (!usuarioActual) return <Login onLogin={(u) => { setUsuarioActual(u); setPagina(u.rol === 'Cliente' ? 'portal_cliente' : u.rol === 'Técnico' ? 'portal_tecnico' : 'dashboard'); }} usuarios={usuarios} />;

  // Filtrado de menú lateral según el rol
  const getNavItems = () => {
    const rol = usuarioActual.rol;
    if (rol === "Cliente") return [{ key: "portal_cliente", label: "Mi Instalación", icon: "🏠" }];
    if (rol === "Técnico") return [{ key: "portal_tecnico", label: "Mis Tickets", icon: "🔧" }];
    
    // Admin y Agentes de Venta
    const menu = [
      { key: "dashboard", label: "Dashboard", icon: "📊" },
      { key: "leads", label: "Leads y Cotizador", icon: "👥" },
      { key: "reactivacion", label: "Reactivación Comercial", icon: "📞" },
      { key: "historial", label: "Cotizaciones Emitidas", icon: "📄" },
      { key: "inventario", label: "Inventario Físico", icon: "📦" }
    ];
    return menu;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Menú lateral (oculto al imprimir) */}
      <aside className="w-64 bg-white border-r flex flex-col print:hidden">
        <div className="p-5 border-b">
          <p className="text-xl font-bold text-indigo-700">ATLAS CRM</p>
          <div className="mt-2 bg-slate-100 p-2 rounded text-xs">
            <span className="font-bold text-slate-700">{usuarioActual.rol}</span><br/>
            <span className="text-slate-500">{usuarioActual.nombre}</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {getNavItems().map((n) => (
            <button key={n.key} onClick={() => setPagina(n.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${pagina === n.key ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
              <span className="text-lg">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setUsuarioActual(null)} className="m-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 font-medium">Cerrar Sesión</button>
      </aside>

      {/* Contenedor principal */}
      <main className="flex-1 overflow-y-auto">
        {pagina === "dashboard" && <div className="p-6"><h2 className="text-xl font-semibold">Resumen Operativo</h2><p className="text-slate-500 mt-2">Bienvenido al sistema integrado.</p></div>}
        
        {/* 4. PANTALLA DE LEADS ACTUALIZADA CON FORMULARIO Y CREACIÓN AUTOMÁTICA DE CUENTA */}
        {pagina === "leads" && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold">Leads Activos y Registro</h2>
            
            <div className="bg-white p-4 border border-slate-200 rounded-xl flex gap-3 items-center">
              <input placeholder="Nombre del prospecto" className="border px-3 py-2 rounded-lg flex-1 text-sm" value={nuevoLead.nombre} onChange={e => setNuevoLead({...nuevoLead, nombre: e.target.value})} />
              <input placeholder="Teléfono" className="border px-3 py-2 rounded-lg w-32 text-sm" value={nuevoLead.telefono} onChange={e => setNuevoLead({...nuevoLead, telefono: e.target.value})} />
              <input type="number" placeholder="Consumo kWh" className="border px-3 py-2 rounded-lg w-32 text-sm" value={nuevoLead.consumo_kwh} onChange={e => setNuevoLead({...nuevoLead, consumo_kwh: e.target.value})} />
              <button 
                onClick={() => {
                  if(!nuevoLead.nombre) return alert("El nombre es obligatorio");
                  
                  // Agrega el cliente a la lista
                  setLeads([{ ...nuevoLead, id: Date.now(), estado: "Nuevo" }, ...leads]);
                  
                  // Crea su cuenta de acceso automáticamente
                  const correoFicticio = `${nuevoLead.nombre.toLowerCase().replace(/\s+/g, "")}@cliente.com`;
                  setUsuarios([...usuarios, { 
                    email: correoFicticio, 
                    password: "123", 
                    nombre: nuevoLead.nombre, 
                    rol: "Cliente" 
                  }]);
                  
                  alert(`¡Cliente registrado!\nCuenta de acceso creada:\nCorreo: ${correoFicticio}\nContraseña: 123`);
                  setNuevoLead({ nombre: "", telefono: "", consumo_kwh: "" });
                }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-3">
              {leads.map(l => (
                <div key={l.id} className="bg-white p-4 border rounded-xl flex justify-between items-center hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-bold text-slate-800">{l.nombre}</p>
                    <p className="text-sm text-slate-500">Tel: {l.telefono || "N/A"} | Consumo: <span className="font-medium text-slate-700">{l.consumo_kwh || 0} kWh</span></p>
                  </div>
                  <button onClick={()=>{ setLeadActivo(l); setPagina("calc"); }} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    Dimensionar Proyecto →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {pagina === "calc" && <CalculadoraSolar inventario={inventario} onCotizar={(res) => { setResultadoSolar(res); setPagina("cotizacion"); }} />}
        {pagina === "cotizacion" && <GeneradorCotizacion lead={leadActivo} resultadoSolar={resultadoSolar} inventario={inventario} onGuardar={(c) => { setCotizaciones([...cotizaciones, c]); setPagina("historial"); }} />}
        {pagina === "inventario" && <GestionInventario inventario={inventario} setInventario={setInventario} usuario={usuarioActual} />}
        {pagina === "reactivacion" && <ReactivacionComercial clientes={inactivos} setClientes={setInactivos} />}
        {pagina === "portal_tecnico" && <PortalTecnico tickets={tickets} setTickets={setTickets} />}
        
        {/* 5. PORTAL DEL CLIENTE RECIBE EL USUARIO ACTUAL */}
        {pagina === "portal_cliente" && <PortalCliente tickets={tickets} setTickets={setTickets} usuarioActual={usuarioActual} />}
        
        {pagina === "historial" && <div className="p-6 max-w-4xl mx-auto"><h2 className="text-xl font-semibold mb-4">Cotizaciones Generadas</h2>{cotizaciones.map(c=><div key={c.id} className="p-4 bg-white border rounded mb-2 flex justify-between"><p>{c.cliente}</p><p className="font-bold">{fmt(c.monto)}</p></div>)}</div>}
      </main>
    </div>
  );
}