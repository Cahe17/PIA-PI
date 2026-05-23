/**
 * ATLAS CRM Solar — Funcionalidades Principales
 * Proyecto Integrador 1 — FIME UANL — Brigada 003
 * 
 * Módulos implementados:
 *  1. CalculadoraSolar   — dimensionamiento automático (Obj. específico 2)
 *  2. GestionLeads       — captura y seguimiento de prospectos (Obj. específico 4)
 *  3. GeneradorCotizacion— cotización itemizada con PDF-preview (Obj. específico 5)
 *  4. App / Router       — navegación entre módulos con roles
 */


import { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────
//  DATOS CONSTANTES E INICIALES
// ─────────────────────────────────────────────────────────

const IRRADIACION = {
  Monterrey: 5.4,
  "Ciudad de México": 5.1,
  Guadalajara: 5.3,
  Tijuana: 5.8,
  Mérida: 5.6,
  Otra: 5.0,
};

const INVENTARIO_INICIAL = [
  { id: 1, tipo: "Panel",    modelo: "JA Solar 550W Mono",      potencia_w: 550,  precio: 3200,  existencias: 80 },
  { id: 2, tipo: "Panel",    modelo: "Longi 400W Half-cell",    potencia_w: 400,  precio: 2400,  existencias: 50 },
  { id: 3, tipo: "Inversor", modelo: "Growatt 5kW String",      potencia_kw: 5,   precio: 14500, existencias: 12 },
  { id: 4, tipo: "Inversor", modelo: "SMA Sunny Boy 10kW",      potencia_kw: 10,  precio: 28000, existencias: 6  },
  { id: 5, tipo: "Batería",  modelo: "Pylontech US3000C 3.5kWh",capacidad_kwh: 3.5, precio: 22000, existencias: 10 },
  { id: 6, tipo: "Estructura",modelo: "Estructura aluminio",    precio: 420,  existencias: 200 },
  { id: 7, tipo: "Cableado", modelo: "Cableado + protecciones", precio: 3500, existencias: 999 },
  { id: 8, tipo: "Mano de obra", modelo: "Instalación estándar",precio: 8000, existencias: 999 },
];

const LEADS_INICIALES = [
  { id: 1, nombre: "Erik Aguilar Martínez", empresa: "Sunrise Energy", telefono: "81-1234-5678", consumo_kwh: 850, estado: "Nuevo", agente: "Luis Millan" },
  { id: 2, nombre: "Martín Rivas", empresa: "Independiente", telefono: "81-9876-5432", consumo_kwh: 420, estado: "En seguimiento", agente: "Erick Aguilar" },
];

const USUARIOS = [
  { email: "admin@atlas.com", password: "123", nombre: "Admin Master", rol: "Administrador" },
  { email: "ventas@atlas.com", password: "123", nombre: "Agente Ventas", rol: "Agente" },
];

const ESTADOS_LEAD = ["Nuevo", "Contactado", "En seguimiento", "Cotizado", "Cerrado ganado", "Cerrado perdido"];
const ESTADOS_COTIZACION = ["Pendiente", "Aprobada", "Rechazada"];

const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────────────────
//  COMPONENTE: LOGIN
// ─────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@atlas.com");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const user = USUARIOS.find(u => u.email === email && u.password === password);
    if (user) onLogin(user);
    else setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-indigo-700">ATLAS CRM</h1>
          <p className="text-sm text-slate-500 mt-1">Acceso al sistema</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors mt-2">
            Iniciar sesión
          </button>
        </form>
        <div className="mt-6 text-xs text-slate-400 text-center">
          <p>Demos: admin@atlas.com / ventas@atlas.com (Pass: 123)</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  COMPONENTE: INVENTARIO
// ─────────────────────────────────────────────────────────
function GestionInventario({ inventario, setInventario, usuario }) {
  const [nuevoItem, setNuevoItem] = useState({ tipo: "Panel", modelo: "", precio: "", existencias: "" });

  const agregarItem = () => {
    if (!nuevoItem.modelo || !nuevoItem.precio) return;
    
    
    const nuevoId = inventario.length > 0 ? Math.max(...inventario.map(i => i.id)) + 1 : 1;

    setInventario([...inventario, { 
      ...nuevoItem, 
      id: nuevoId, // <-- Aquí usamos el nuevo ID ordenado
      precio: parseFloat(nuevoItem.precio), 
      existencias: parseInt(nuevoItem.existencias) || 0 
    }]);
    setNuevoItem({ tipo: "Panel", modelo: "", precio: "", existencias: "" });
  };
  const eliminarItem = (id) => setInventario(inventario.filter(i => i.id !== id));

  const isAdmin = usuario.rol === "Administrador";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Módulo de Inventario</h2>
      
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
            <select value={nuevoItem.tipo} onChange={(e) => setNuevoItem({...nuevoItem, tipo: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm">
              <option>Panel</option><option>Inversor</option><option>Batería</option><option>Estructura</option><option>Cableado</option>
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-xs font-medium text-slate-700 mb-1">Modelo / Descripción</label>
            <input value={nuevoItem.modelo} onChange={(e) => setNuevoItem({...nuevoItem, modelo: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" placeholder="Ej. Panel 600W" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Precio Unit.</label>
            <input type="number" value={nuevoItem.precio} onChange={(e) => setNuevoItem({...nuevoItem, precio: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">Stock</label>
            <input type="number" value={nuevoItem.existencias} onChange={(e) => setNuevoItem({...nuevoItem, existencias: e.target.value})} className="w-full border rounded-lg px-2 py-1.5 text-sm" />
          </div>
          <button onClick={agregarItem} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium">Agregar</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Modelo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Precio Base</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Stock</th>
              {isAdmin && <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventario.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">#{item.id}</td>
                <td className="px-4 py-3 font-medium"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.tipo}</span></td>
                <td className="px-4 py-3">{item.modelo}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{fmt(item.precio)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${item.existencias > 10 ? 'text-green-700' : 'text-red-600'}`}>{item.existencias} uds.</span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <button onClick={() => eliminarItem(item.id)} className="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  COMPONENTE: CALCULADORA SOLAR (Adaptada al estado global)
// ─────────────────────────────────────────────────────────
function CalculadoraSolar({ onCotizar, inventario }) {
  const [form, setForm] = useState({ consumo: "", ciudad: "Monterrey", perdidas: "80", bateria: false });
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!form.consumo || isNaN(form.consumo)) return;
    const irr = IRRADIACION[form.ciudad] ?? 5.0;
    const perdidas_pct = parseFloat(form.perdidas) / 100;
    const kwp_necesarios = (form.consumo / 30) / (irr * perdidas_pct);

    const paneles = inventario.filter((c) => c.tipo === "Panel" && c.existencias > 0).sort((a, b) => b.potencia_w - a.potencia_w);
    const panel = paneles[0] || inventario.find(c => c.tipo === "Panel");
    
    if(!panel) return alert("No hay paneles en inventario");
    
    const n_paneles = Math.ceil((kwp_necesarios * 1000) / panel.potencia_w);
    const kwp_real = (n_paneles * panel.potencia_w) / 1000;

    const inversores = inventario.filter((c) => c.tipo === "Inversor" && c.potencia_kw >= kwp_real * 0.8 && c.existencias > 0).sort((a, b) => a.potencia_kw - b.potencia_kw);
    const inversor = inversores[0] || inventario.find(c => c.tipo === "Inversor");

    setResultado({ panel, n_paneles, kwp_real, kwp_necesarios, inversor, produccion_kwh_anual: kwp_real * irr * 365 * perdidas_pct, irr });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Calculadora de dimensionamiento</h2>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {/* Mismo formulario que tenías... */}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm mb-1">Consumo (kWh)</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.consumo} onChange={(e) => setForm({ ...form, consumo: e.target.value })} /></div>
          <div><label className="block text-sm mb-1">Ciudad</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })}>{Object.keys(IRRADIACION).map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm mb-1">Factor pérdidas (%)</label><input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.perdidas} onChange={(e) => setForm({ ...form, perdidas: e.target.value })} /></div>
          <div className="flex items-center gap-2 pt-5"><input type="checkbox" id="bateria" checked={form.bateria} onChange={(e) => setForm({ ...form, bateria: e.target.checked })} /><label htmlFor="bateria" className="text-sm">Incluir baterías</label></div>
        </div>
        <button onClick={calcular} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm">Calcular sistema</button>
      </div>

      {resultado && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Resultado</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>Potencia: <b>{resultado.kwp_real.toFixed(2)} kWp</b></p>
            <p>Paneles: <b>{resultado.n_paneles}x {resultado.panel.modelo}</b></p>
            <p>Inversor: <b>{resultado.inversor.modelo}</b></p>
            <p>Producción: <b>{Math.round(resultado.produccion_kwh_anual).toLocaleString()} kWh/año</b></p>
          </div>
          <button onClick={() => onCotizar(resultado, form.bateria)} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm mt-4">
            Generar cotización →
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  COMPONENTE: GENERADOR DE COTIZACIÓN
// ─────────────────────────────────────────────────────────
function GeneradorCotizacion({ lead, resultadoSolar, conBateria, inventario, onGuardar, onVolver }) {
  const [margen, setMargen] = useState(25);
  
  if (!resultadoSolar) return <div className="p-6">Primero usa la calculadora.</div>;

  const items = [
    { ...resultadoSolar.panel, cantidad: resultadoSolar.n_paneles },
    { ...resultadoSolar.inversor, cantidad: 1 },
    { ...inventario.find(c => c.tipo === "Estructura"), cantidad: resultadoSolar.n_paneles },
    { ...inventario.find(c => c.tipo === "Cableado"), cantidad: 1 },
    { ...inventario.find(c => c.tipo === "Mano de obra"), cantidad: 1 },
  ];
  if (conBateria) items.push({ ...inventario.find(c => c.tipo === "Batería"), cantidad: 2 });
  
  const itemsConSubtotal = items.map(it => ({ ...it, subtotal: (it.precio || 0) * (it.cantidad || 1) }));
  const costoTotal = itemsConSubtotal.reduce((s, i) => s + i.subtotal, 0);
  const precioVenta = costoTotal * (1 + margen / 100);

  const guardar = () => {
    onGuardar({
      id: Date.now(),
      fecha: new Date().toLocaleDateString(),
      cliente: lead?.nombre || "Cliente Público",
      potencia: resultadoSolar.kwp_real.toFixed(2),
      monto: precioVenta,
      estado: "Pendiente"
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <button onClick={onVolver} className="text-slate-500 text-sm mb-4">← Volver</button>
      <h2 className="text-xl font-semibold">Cotización para {lead?.nombre ?? "Prospecto"}</h2>
      
      <div className="bg-white rounded-xl border p-4">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-left"><th className="p-2">Item</th><th className="p-2">Cant</th><th className="p-2">Total</th></tr></thead>
          <tbody>
            {itemsConSubtotal.map((it, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{it.modelo}</td><td className="p-2">{it.cantidad}</td><td className="p-2 font-medium">{fmt(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <label className="block text-sm mb-2">Margen de utilidad ({margen}%)</label>
        <input type="range" min="10" max="50" value={margen} onChange={(e) => setMargen(Number(e.target.value))} className="w-full" />
        <div className="mt-4 bg-indigo-50 p-4 rounded-lg flex justify-between items-center">
          <div><p className="text-sm text-slate-500">Costo Directo</p><p className="font-bold text-lg">{fmt(costoTotal)}</p></div>
          <div className="text-right"><p className="text-sm text-indigo-600 font-bold">Precio Venta (Cliente)</p><p className="font-bold text-2xl text-indigo-700">{fmt(precioVenta)}</p></div>
        </div>
      </div>

      <button onClick={guardar} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl">
        Guardar en Historial de Cotizaciones
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  COMPONENTE: GESTION DE LEADS (Se mantiene casi igual pero recibe estado)
// ─────────────────────────────────────────────────────────
function GestionLeads({ leads, setLeads, onCotizarLead }) {
  const [nuevo, setNuevo] = useState({ nombre: "", telefono: "", estado: "Nuevo" });
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Gestión de Leads</h2>
      <div className="bg-white p-4 border rounded-xl flex gap-4">
        <input placeholder="Nombre" value={nuevo.nombre} onChange={e=>setNuevo({...nuevo, nombre: e.target.value})} className="border px-2 py-1 rounded flex-1"/>
        <input placeholder="Teléfono" value={nuevo.telefono} onChange={e=>setNuevo({...nuevo, telefono: e.target.value})} className="border px-2 py-1 rounded flex-1"/>
        <button onClick={()=>{ setLeads([...leads, {...nuevo, id: Date.now()}]); setNuevo({nombre:"", telefono:"", estado:"Nuevo"})}} className="bg-indigo-600 text-white px-4 py-1 rounded">Agregar</button>
      </div>
      <table className="w-full bg-white border rounded-xl text-sm overflow-hidden">
        <thead className="bg-slate-50"><tr><th className="p-3 text-left">Nombre</th><th className="p-3 text-left">Estado</th><th className="p-3">Acción</th></tr></thead>
        <tbody>
          {leads.map(l => (
            <tr key={l.id} className="border-t">
              <td className="p-3 font-medium">{l.nombre}</td>
              <td className="p-3">
                <select value={l.estado} onChange={(e) => setLeads(leads.map(x => x.id === l.id ? {...x, estado: e.target.value} : x))} className="border-0 bg-slate-100 rounded px-2 py-1 text-xs">
                  {ESTADOS_LEAD.map(e => <option key={e}>{e}</option>)}
                </select>
              </td>
              <td className="p-3 text-center"><button onClick={()=>onCotizarLead(l)} className="text-indigo-600 font-medium">Cotizar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  COMPONENTE: SEGUIMIENTO DE COTIZACIONES (NUEVO)
// ─────────────────────────────────────────────────────────
function SeguimientoCotizaciones({ cotizaciones, setCotizaciones }) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Historial de Cotizaciones</h2>
      {cotizaciones.length === 0 ? <p className="text-slate-500">No hay cotizaciones generadas aún.</p> : (
        <table className="w-full bg-white border rounded-xl text-sm overflow-hidden">
          <thead className="bg-slate-50"><tr><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Cliente</th><th className="p-3 text-left">Monto</th><th className="p-3 text-left">Estado</th></tr></thead>
          <tbody>
            {cotizaciones.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 text-slate-500">{c.fecha}</td>
                <td className="p-3 font-medium">{c.cliente}</td>
                <td className="p-3 font-bold text-slate-800">{fmt(c.monto)}</td>
                <td className="p-3">
                  <select value={c.estado} onChange={(e) => setCotizaciones(cotizaciones.map(x => x.id === c.id ? {...x, estado: e.target.value} : x))} 
                    className={`border-0 rounded-full px-3 py-1 text-xs font-bold ${c.estado==='Aprobada'?'bg-green-100 text-green-700':c.estado==='Rechazada'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>
                    {ESTADOS_COTIZACION.map(e => <option key={e}>{e}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  APP PRINCIPAL — ESTADO GLOBAL Y RUTAS
// ─────────────────────────────────────────────────────────
export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // Estado global
  const [pagina, setPagina] = useState("dashboard");
  const [inventario, setInventario] = useState(INVENTARIO_INICIAL);
  const [leads, setLeads] = useState(LEADS_INICIALES);
  const [cotizaciones, setCotizaciones] = useState([]);
  
  // Estados para flujo de cotización
  const [leadActivo, setLeadActivo] = useState(null);
  const [resultadoSolar, setResultadoSolar] = useState(null);
  const [conBateria, setConBateria] = useState(false);

  // Si no hay usuario, mostrar Login
  if (!usuarioActual) return <Login onLogin={setUsuarioActual} />;

  const NAV = [
    { key: "dashboard", label: "Dashboard",    icon: "📊" },
    { key: "leads",     label: "Leads",        icon: "👥" },
    { key: "inventario",label: "Inventario",   icon: "📦" },
    { key: "calc",      label: "Calculadora",  icon: "⚡" },
    { key: "historial", label: "Cotizaciones", icon: "📄" },
  ];

  // KPIs Dinámicos
  const leadsActivos = leads.filter(l => l.estado !== "Cerrado ganado" && l.estado !== "Cerrado perdido").length;
  const ingresosProyectados = cotizaciones.filter(c => c.estado === "Aprobada").reduce((sum, c) => sum + c.monto, 0);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-5 border-b">
          <p className="text-lg font-bold text-indigo-700">ATLAS CRM</p>
          <p className="text-xs text-slate-500">{usuarioActual.rol}: {usuarioActual.nombre}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setPagina(n.key)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${pagina === n.key ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}>
              <span className="text-base">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setUsuarioActual(null)} className="m-4 text-xs text-red-500 hover:underline">Cerrar sesión</button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {pagina === "dashboard" && (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Dashboard Dinámico</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4"><p className="text-xs text-slate-500">Leads en proceso</p><p className="text-3xl font-bold text-blue-600 mt-1">{leadsActivos}</p></div>
              <div className="bg-indigo-50 rounded-xl p-4"><p className="text-xs text-slate-500">Cotizaciones Totales</p><p className="text-3xl font-bold text-indigo-600 mt-1">{cotizaciones.length}</p></div>
              <div className="bg-green-50 rounded-xl p-4"><p className="text-xs text-slate-500">Ingresos (Aprobadas)</p><p className="text-2xl font-bold text-green-600 mt-1">{fmt(ingresosProyectados)}</p></div>
            </div>
          </div>
        )}
        
        {pagina === "leads" && <GestionLeads leads={leads} setLeads={setLeads} onCotizarLead={(l) => { setLeadActivo(l); setPagina("calc"); }} />}
        
        {pagina === "inventario" && <GestionInventario inventario={inventario} setInventario={setInventario} usuario={usuarioActual} />}
        
        {pagina === "calc" && <CalculadoraSolar inventario={inventario} onCotizar={(res, bat) => { setResultadoSolar(res); setConBateria(bat); setPagina("cotizacion"); }} />}
        
        {pagina === "cotizacion" && <GeneradorCotizacion lead={leadActivo} resultadoSolar={resultadoSolar} conBateria={conBateria} inventario={inventario} onVolver={() => setPagina("calc")} onGuardar={(c) => { setCotizaciones([...cotizaciones, c]); setPagina("historial"); }} />}
        
        {pagina === "historial" && <SeguimientoCotizaciones cotizaciones={cotizaciones} setCotizaciones={setCotizaciones} />}
      </main>
    </div>
  );
}