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
//  DATOS CONSTANTES (simulan consultas a DB / inventario)
// ─────────────────────────────────────────────────────────

// Irradiación solar promedio por ciudad (kWh/m²/día)
const IRRADIACION = {
  Monterrey: 5.4,
  "Ciudad de México": 5.1,
  Guadalajara: 5.3,
  Tijuana: 5.8,
  Mérida: 5.6,
  Otra: 5.0,
};

// Inventario de componentes (en producción viene de la BD)
const INVENTARIO = [
  { id: 1, tipo: "Panel",    modelo: "JA Solar 550W Mono",      potencia_w: 550,  precio: 3200,  existencias: 80 },
  { id: 2, tipo: "Panel",    modelo: "Longi 400W Half-cell",     potencia_w: 400,  precio: 2400,  existencias: 50 },
  { id: 3, tipo: "Inversor", modelo: "Growatt 5kW String",       potencia_kw: 5,   precio: 14500, existencias: 12 },
  { id: 4, tipo: "Inversor", modelo: "SMA Sunny Boy 10kW",       potencia_kw: 10,  precio: 28000, existencias: 6  },
  { id: 5, tipo: "Inversor", modelo: "Huawei SUN2000 15kW",      potencia_kw: 15,  precio: 38000, existencias: 4  },
  { id: 6, tipo: "Batería",  modelo: "Pylontech US3000C 3.5kWh", capacidad_kwh: 3.5, precio: 22000, existencias: 10 },
  { id: 7, tipo: "Estructura",modelo: "Estructura aluminio/panel",precio_unidad: 420, existencias: 200 },
  { id: 8, tipo: "Cableado", modelo: "Cableado + protecciones",  precio_unidad: 3500, existencias: 999 },
  { id: 9, tipo: "Mano de obra", modelo: "Instalación completa (fija)", precio_unidad: 8000, existencias: 999 },
];

// Leads de ejemplo (en producción vienen de la BD)
const LEADS_INICIALES = [
  { id: 1, nombre: "Erik Aguilar Martínez", empresa: "Sunrise Energy",       telefono: "81-1234-5678", consumo_kwh: 850, estado: "Nuevo",         agente: "Luis Millan" },
  { id: 2, nombre: "Martín Rivas",          empresa: "Independiente",        telefono: "81-9876-5432", consumo_kwh: 420, estado: "En seguimiento", agente: "Erick Aguilar" },
  { id: 3, nombre: "Erardo Alanis",         empresa: "Solar Solutions",      telefono: "81-5555-0000", consumo_kwh: 1200, estado: "Cotizado",      agente: "Pedro Canizales" },
];

const ESTADOS_LEAD = ["Nuevo", "Contactado", "En seguimiento", "Cotizado", "Cerrado ganado", "Cerrado perdido"];

const BADGE_COLOR = {
  "Nuevo":            "bg-blue-100 text-blue-800",
  "Contactado":       "bg-yellow-100 text-yellow-800",
  "En seguimiento":   "bg-purple-100 text-purple-800",
  "Cotizado":         "bg-indigo-100 text-indigo-800",
  "Cerrado ganado":   "bg-green-100 text-green-800",
  "Cerrado perdido":  "bg-red-100 text-red-800",
};

// ─────────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────────

/** Dimensionamiento solar básico */
function calcularSistema({ consumo_kwh_mes, ciudad, perdidas_pct = 0.8 }) {
  const irr = IRRADIACION[ciudad] ?? 5.0;
  const energia_dia = consumo_kwh_mes / 30;
  const kwp_necesarios = energia_dia / (irr * perdidas_pct);

  // Seleccionar panel (preferimos el de mayor potencia disponible)
  const paneles = INVENTARIO.filter((c) => c.tipo === "Panel" && c.existencias > 0)
    .sort((a, b) => b.potencia_w - a.potencia_w);
  const panel = paneles[0];
  const n_paneles = Math.ceil((kwp_necesarios * 1000) / panel.potencia_w);
  const kwp_real = (n_paneles * panel.potencia_w) / 1000;

  // Seleccionar inversor (capacidad >= 80% del sistema)
  const inversores = INVENTARIO.filter(
    (c) => c.tipo === "Inversor" && c.potencia_kw >= kwp_real * 0.8 && c.existencias > 0
  ).sort((a, b) => a.potencia_kw - b.potencia_kw);
  const inversor = inversores[0] ?? INVENTARIO.find((c) => c.tipo === "Inversor");

  // Estimación producción anual
  const produccion_kwh_anual = kwp_real * irr * 365 * perdidas_pct;

  return { panel, n_paneles, kwp_real, kwp_necesarios, inversor, produccion_kwh_anual, irr };
}

/** Genera ítems de cotización a partir del resultado del dimensionamiento */
function generarItems(resultado, incluyeBateria = false) {
  const { panel, n_paneles, inversor } = resultado;
  const items = [
    { ...panel,       cantidad: n_paneles, precio_unitario: panel.precio },
    { ...inversor,    cantidad: 1,         precio_unitario: inversor.precio },
    { ...INVENTARIO.find((c) => c.tipo === "Estructura"), cantidad: n_paneles, precio_unitario: 420 },
    { ...INVENTARIO.find((c) => c.tipo === "Cableado"),   cantidad: 1,         precio_unitario: 3500 },
    { ...INVENTARIO.find((c) => c.tipo === "Mano de obra"), cantidad: 1,       precio_unitario: 8000 },
  ];
  if (incluyeBateria) {
    const bat = INVENTARIO.find((c) => c.tipo === "Batería");
    items.push({ ...bat, cantidad: 2, precio_unitario: bat.precio });
  }
  return items.map((it) => ({ ...it, subtotal: it.cantidad * it.precio_unitario }));
}

const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────────────────
//  COMPONENTE: CALCULADORA SOLAR
// ─────────────────────────────────────────────────────────

function CalculadoraSolar({ onCotizar }) {
  const [form, setForm] = useState({ consumo: "", ciudad: "Monterrey", perdidas: "80", bateria: false });
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    if (!form.consumo || isNaN(form.consumo)) return;
    const r = calcularSistema({
      consumo_kwh_mes: parseFloat(form.consumo),
      ciudad: form.ciudad,
      perdidas_pct: parseFloat(form.perdidas) / 100,
    });
    setResultado(r);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">Calculadora de dimensionamiento solar</h2>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Consumo mensual (kWh)</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ej. 850"
              value={form.consumo}
              onChange={(e) => setForm({ ...form, consumo: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
            >
              {Object.keys(IRRADIACION).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Factor de pérdidas (%)</label>
            <input
              type="number"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.perdidas}
              onChange={(e) => setForm({ ...form, perdidas: e.target.value })}
            />
            <p className="text-xs text-slate-400 mt-1">Típico: 80 % (incluye sombreado, temperatura, inversor)</p>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="bateria"
              checked={form.bateria}
              onChange={(e) => setForm({ ...form, bateria: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <label htmlFor="bateria" className="text-sm font-medium text-slate-700">Incluir banco de baterías</label>
          </div>
        </div>
        <button
          onClick={calcular}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
        >
          Calcular sistema
        </button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Resultado del dimensionamiento</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Potencia del sistema", value: `${resultado.kwp_real.toFixed(2)} kWp` },
              { label: "Número de paneles",    value: `${resultado.n_paneles} unidades` },
              { label: "Irradiación local",    value: `${resultado.irr} kWh/m²/día` },
              { label: "Producción estimada",  value: `${Math.round(resultado.produccion_kwh_anual).toLocaleString()} kWh/año` },
              { label: "Panel seleccionado",   value: resultado.panel.modelo },
              { label: "Inversor seleccionado",value: resultado.inversor.modelo },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">{kpi.label}</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onCotizar(resultado, form.bateria)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
          >
            Generar cotización con este sistema →
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  COMPONENTE: GESTIÓN DE LEADS
// ─────────────────────────────────────────────────────────

function GestionLeads({ onNuevaCotizacion }) {
  const [leads, setLeads] = useState(LEADS_INICIALES);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtro, setFiltro] = useState("Todos");
  const [nuevo, setNuevo] = useState({ nombre: "", empresa: "", telefono: "", consumo_kwh: "", estado: "Nuevo", agente: "" });

  const leadsFiltrados = useMemo(
    () => (filtro === "Todos" ? leads : leads.filter((l) => l.estado === filtro)),
    [leads, filtro]
  );

  const agregarLead = () => {
    if (!nuevo.nombre || !nuevo.telefono) return;
    setLeads([...leads, { ...nuevo, id: Date.now(), consumo_kwh: parseFloat(nuevo.consumo_kwh) || 0 }]);
    setNuevo({ nombre: "", empresa: "", telefono: "", consumo_kwh: "", estado: "Nuevo", agente: "" });
    setMostrarForm(false);
  };

  const cambiarEstado = (id, estado) =>
    setLeads(leads.map((l) => (l.id === id ? { ...l, estado } : l)));

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Gestión de leads</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo lead
        </button>
      </div>

      {/* Formulario nuevo lead */}
      {mostrarForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-medium text-slate-900 mb-4">Registrar prospecto</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "nombre", label: "Nombre completo", placeholder: "Carlos Rodríguez" },
              { key: "empresa", label: "Empresa", placeholder: "Solar Noreste" },
              { key: "telefono", label: "Teléfono", placeholder: "81-xxxx-xxxx" },
              { key: "consumo_kwh", label: "Consumo mensual (kWh)", placeholder: "850" },
              { key: "agente", label: "Agente asignado", placeholder: "Nombre del agente" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={placeholder}
                  value={nuevo[key]}
                  onChange={(e) => setNuevo({ ...nuevo, [key]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado inicial</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={nuevo.estado}
                onChange={(e) => setNuevo({ ...nuevo, estado: e.target.value })}
              >
                {ESTADOS_LEAD.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={agregarLead} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Guardar lead
            </button>
            <button onClick={() => setMostrarForm(false)} className="text-slate-600 text-sm px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Filtros por estado */}
      <div className="flex gap-2 flex-wrap">
        {["Todos", ...ESTADOS_LEAD].map((e) => (
          <button
            key={e}
            onClick={() => setFiltro(e)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filtro === e ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Tabla de leads */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Nombre", "Empresa", "Consumo kWh", "Agente", "Estado", "Acciones"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leadsFiltrados.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{lead.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{lead.empresa}</td>
                <td className="px-4 py-3 text-slate-600">{lead.consumo_kwh?.toLocaleString() ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{lead.agente || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${BADGE_COLOR[lead.estado] || "bg-gray-100 text-gray-700"}`}
                    value={lead.estado}
                    onChange={(e) => cambiarEstado(lead.id, e.target.value)}
                  >
                    {ESTADOS_LEAD.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onNuevaCotizacion(lead)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Cotizar →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leadsFiltrados.length === 0 && (
          <p className="text-center text-slate-400 py-8 text-sm">No hay leads con este filtro</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  COMPONENTE: GENERADOR DE COTIZACIÓN
// ─────────────────────────────────────────────────────────

function GeneradorCotizacion({ lead, resultadoSolar, conBateria, onVolver }) {
  const [margen, setMargen] = useState(25);
  const [vigencia, setVigencia] = useState(30);

  const items = useMemo(
    () => (resultadoSolar ? generarItems(resultadoSolar, conBateria) : []),
    [resultadoSolar, conBateria]
  );

  const costoTotal = items.reduce((s, i) => s + i.subtotal, 0);
  const precioVenta = costoTotal * (1 + margen / 100);
  const utilidad = precioVenta - costoTotal;

  const hoy = new Date();
  const fechaVigencia = new Date(hoy);
  fechaVigencia.setDate(hoy.getDate() + vigencia);

  const folio = `ATL-${hoy.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onVolver} className="text-slate-500 hover:text-slate-700 text-sm">← Volver</button>
        <h2 className="text-xl font-semibold text-slate-900">Cotización — {lead?.nombre ?? "Cliente nuevo"}</h2>
        <span className="ml-auto text-xs text-slate-400 font-mono">{folio}</span>
      </div>

      {!resultadoSolar && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Primero usa la Calculadora Solar para dimensionar el sistema, luego regresa aquí para generar la cotización.
        </div>
      )}

      {resultadoSolar && (
        <>
          {/* KPIs del sistema */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Sistema",        value: `${resultadoSolar.kwp_real.toFixed(2)} kWp` },
              { label: "Paneles",        value: `${resultadoSolar.n_paneles} × ${resultadoSolar.panel.modelo.split(" ")[0]}` },
              { label: "Producción est.", value: `${Math.round(resultadoSolar.produccion_kwh_anual / 1000)} MWh/año` },
              { label: "Vigencia",       value: `${vigencia} días` },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-indigo-50 rounded-xl p-4 text-center">
                <p className="text-xs text-indigo-500 font-medium">{kpi.label}</p>
                <p className="text-base font-bold text-indigo-900 mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Tabla de ítems */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Descripción", "Tipo", "Cant.", "Precio unit.", "Subtotal"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{it.modelo}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{it.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{it.cantidad}</td>
                    <td className="px-4 py-3 text-slate-700">{fmt(it.precio_unitario)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-slate-700">Costo directo total</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{fmt(costoTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Controles de precio */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Margen de utilidad: <span className="text-indigo-600 font-bold">{margen}%</span>
              </label>
              <input
                type="range" min="5" max="60" value={margen}
                onChange={(e) => setMargen(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5%</span><span>60%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vigencia de oferta: <span className="text-indigo-600 font-bold">{vigencia} días</span>
              </label>
              <input
                type="range" min="7" max="90" step="7" value={vigencia}
                onChange={(e) => setVigencia(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-xs text-slate-400 mt-1">Válida hasta: {fechaVigencia.toLocaleDateString("es-MX")}</p>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white grid grid-cols-3 gap-6">
            <div>
              <p className="text-indigo-200 text-sm">Costo directo</p>
              <p className="text-2xl font-bold mt-1">{fmt(costoTotal)}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Precio de venta sugerido</p>
              <p className="text-2xl font-bold mt-1">{fmt(precioVenta)}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Utilidad estimada</p>
              <p className="text-2xl font-bold mt-1">{fmt(utilidad)}</p>
              <p className="text-indigo-300 text-xs mt-1">{margen}% del precio de venta</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
              Guardar cotización
            </button>
            <button className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl text-sm transition-colors">
              Descargar PDF
            </button>
            <button className="flex-1 border border-green-300 hover:bg-green-50 text-green-700 font-medium py-3 rounded-xl text-sm transition-colors">
              Enviar por correo
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  APP PRINCIPAL — navegación entre módulos
// ─────────────────────────────────────────────────────────

const NAV = [
  { key: "dashboard", label: "Dashboard",    icon: "📊" },
  { key: "leads",     label: "Leads",        icon: "👥" },
  { key: "calc",      label: "Calculadora",  icon: "⚡" },
  { key: "cotizacion",label: "Cotización",   icon: "📄" },
];

export default function App() {
  const [pagina, setPagina] = useState("leads");
  const [leadActivo, setLeadActivo] = useState(null);
  const [resultadoSolar, setResultadoSolar] = useState(null);
  const [conBateria, setConBateria] = useState(false);

  const irACotizacion = (resultado, bateria) => {
    setResultadoSolar(resultado);
    setConBateria(bateria);
    setPagina("cotizacion");
  };

  const cotizarDesdeLeads = (lead) => {
    setLeadActivo(lead);
    setPagina("calc");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-100">
          <p className="text-lg font-bold text-indigo-700 tracking-tight">ATLAS CRM</p>
          <p className="text-xs text-slate-400">Sector fotovoltaico</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setPagina(n.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                pagina === n.key
                  ? "bg-indigo-50 text-indigo-700 font-medium border-l-2 border-indigo-600"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">Brigada 003 — PI1</p>
          <p className="text-xs text-slate-400">FIME UANL · Enero–Junio 2026</p>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto">
        {pagina === "dashboard" && (
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Leads activos",    value: "3",   color: "text-blue-600",  bg: "bg-blue-50"  },
                { label: "Cotizaciones",      value: "1",   color: "text-indigo-600",bg: "bg-indigo-50"},
                { label: "Instalaciones",     value: "0",   color: "text-teal-600",  bg: "bg-teal-50"  },
                { label: "Tickets abiertos",  value: "0",   color: "text-red-600",   bg: "bg-red-50"   },
              ].map((kpi) => (
                <div key={kpi.label} className={`${kpi.bg} rounded-xl p-4`}>
                  <p className="text-xs text-slate-500">{kpi.label}</p>
                  <p className={`text-3xl font-bold ${kpi.color} mt-1`}>{kpi.value}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">Selecciona un módulo en el menú lateral para comenzar.</p>
          </div>
        )}
        {pagina === "leads" && <GestionLeads onNuevaCotizacion={cotizarDesdeLeads} />}
        {pagina === "calc" && (
          <CalculadoraSolar onCotizar={irACotizacion} />
        )}
        {pagina === "cotizacion" && (
          <GeneradorCotizacion
            lead={leadActivo}
            resultadoSolar={resultadoSolar}
            conBateria={conBateria}
            onVolver={() => setPagina("calc")}
          />
        )}
      </main>
    </div>
  );
}
