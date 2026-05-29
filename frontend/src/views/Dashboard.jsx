import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({ ingresos: 0, gastosTotales: 0, liquidez: 0 });
  const [tarjeta, setTarjeta] = useState({ limite: 0, deuda: 0, disponible: 0, existe: false });
  const [hobbies, setHobbies] = useState([]);
  const [recordatorios, setRecordatorios] = useState([]);
  const [ingresosRecientes, setIngresosRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [datosFinanzas, setDatosFinanzas] = useState([]);
  const PUERTO = "5240";

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:${PUERTO}/api/ingresos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/gastos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/tarjetas`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/hobbies`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/abonos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/recordatorios`).then(res => res.json())
    ])
    .then(([dIngresos, dGastos, dTarjetas, dHobbies, dAbonos, dRecordatorios]) => {
      
      const totalIngresos = dIngresos.reduce((s, i) => s + i.monto, 0);
      const totalGastosVisual = dGastos.reduce((s, i) => s + i.monto, 0);
      const gastosEfectivo = dGastos.filter(g => g.metodo === 0).reduce((s, i) => s + i.monto, 0);
      const totalAbonos = dAbonos.reduce((s, i) => s + i.monto, 0);
      const dineroFisico = totalIngresos - gastosEfectivo - totalAbonos;

      setMetricas({ ingresos: totalIngresos, gastosTotales: totalGastosVisual, liquidez: dineroFisico });

      if (dTarjetas.length > 0) {
        setTarjeta({ limite: dTarjetas[0].limite, deuda: dTarjetas[0].deudaActual, disponible: dTarjetas[0].limite - dTarjetas[0].deudaActual, existe: true });
      }

      setHobbies(dHobbies);
      
      // Guardamos los últimos 4 ingresos para mostrarlos
      setIngresosRecientes(dIngresos.slice(-4).reverse());

      setRecordatorios(dRecordatorios.filter(r => r.nivelPrioridad === 2 && r.estado !== 2).slice(0, 3));

      const mockTendencia = dGastos.slice(-7).map(g => ({
        // Le añadimos la hora para que distingas compras del mismo día
        fecha: new Date(g.fecha).toLocaleDateString('es-MX', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
        gasto: g.monto,
        descripcion: g.descripcion,
        // Traducimos el número del método a un texto legible
        metodo: g.metodo === 0 ? '💵 Efectivo' : '💳 Crédito'
      }));
      setDatosFinanzas(mockTendencia);

      setCargando(false);
    })
    .catch(() => setCargando(false));
  }, []);

  const fmt = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (cargando) return <div className="p-8 text-purple-500 animate-pulse font-bold">Sincronizando Sistema de Control...</div>;

  return (
    <div className="space-y-6 text-white animate-fade-in pb-10">
      <header className="flex justify-between items-end border-b border-gray-700 pb-4">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase italic">Control de Mando</h2>
          <p className="text-gray-500 text-sm mt-1 font-mono">Status: Online | User: Diego</p>
        </div>
      </header>

      {/* FILA 1: MÉTRICAS Y RECORDATORIOS CRÍTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Liquidez Real" value={`$${fmt(metricas.liquidez)}`} color="bg-purple-600" />
          <StatCard title="Consumo Total" value={`$${fmt(metricas.gastosTotales)}`} color="bg-red-600" />
          <StatCard title="Deuda Actual" value={`$${fmt(tarjeta.deuda)}`} color="bg-blue-600" />
        </div>
        
        <div className="bg-gray-900/50 border border-red-900/30 p-4 rounded-xl shadow-inner backdrop-blur-sm">
          <h4 className="text-red-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
            <span className="animate-ping w-2 h-2 rounded-full bg-red-500"></span> Prioridad Crítica
          </h4>
          <div className="space-y-3">
            {recordatorios.length > 0 ? recordatorios.map(r => (
              <div key={r.id} className="text-xs bg-red-500/10 border-l-2 border-red-500 p-2 rounded">
                <p className="font-bold text-gray-200">{r.titulo}</p>
                <p className="text-gray-500 truncate">{r.descripcion}</p>
              </div>
            )) : <p className="text-gray-600 text-[10px] italic">Sin amenazas detectadas.</p>}
          </div>
        </div>
      </div>

      {/* FILA 2: GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Tendencia Financiera */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl">
          <h3 className="text-lg font-bold mb-6 text-gray-300">Flujo de Gastos</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosFinanzas}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="fecha" stroke="#444" fontSize={10} />
                <YAxis stroke="#444" fontSize={10} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<TooltipOscuro />} cursor={{stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4'}} />
                <Area type="monotone" dataKey="gasto" stroke="#ef4444" fillOpacity={1} fill="url(#colorGasto)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Hobbies */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl">
          <h3 className="text-lg font-bold mb-6 text-gray-300">Inversión en Disciplina (hrs)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hobbies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="nombre" stroke="#444" fontSize={10} />
                <YAxis stroke="#444" fontSize={10} />
                <Tooltip cursor={{fill: '#222'}} contentStyle={{backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px'}} />
                <Bar dataKey="horasInvertidas" radius={[5, 5, 0, 0]}>
                  {hobbies.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#a855f7' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* FILA 3: ESTADO DE CRÉDITO E INGRESOS RECIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tarjeta de Crédito Visual */}
        {tarjeta.existe ? (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-400 font-bold uppercase text-sm tracking-widest">Estado de Crédito</h3>
                <span className="text-blue-400 font-mono text-xl">${fmt(tarjeta.deuda)} / ${fmt(tarjeta.limite)}</span>
             </div>
             <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                     style={{ width: `${(tarjeta.deuda / tarjeta.limite) * 100}%` }}></div>
             </div>
          </div>
        ) : (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 flex items-center justify-center">
            <p className="text-gray-600 italic">No hay tarjetas de crédito en la bóveda.</p>
          </div>
        )}

        {/* Historial Corto de Ingresos */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-gray-400 font-bold uppercase text-sm tracking-widest mb-4">Últimos Ingresos</h3>
          <div className="space-y-3">
            {ingresosRecientes.length > 0 ? ingresosRecientes.map(ing => (
              <div key={ing.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
                <div>
                  <p className="text-sm text-gray-300 font-semibold">{ing.origen === 0 ? 'Trabajo' : 'Mesada'}</p>
                  <p className="text-[10px] text-gray-500">{new Date(ing.fecha).toLocaleDateString()}</p>
                </div>
                <span className="text-green-400 font-mono font-bold">+${fmt(ing.monto)}</span>
              </div>
            )) : (
              <p className="text-gray-600 italic text-sm text-center mt-4">Sin ingresos registrados.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden group hover:border-gray-600 transition-all">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

// NUEVO COMPONENTE: Tooltip con estilo Dark Fantasy / Neón
function TooltipOscuro({ active, payload, label }) {
  if (active && payload && payload.length) {
    const datosDelPunto = payload[0].payload;
    
    return (
      <div className="bg-[#0a0a0a] border border-red-900/80 p-3 rounded shadow-[0_0_15px_rgba(220,38,38,0.4)] backdrop-blur-md">
        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest border-b border-gray-800 pb-1 mb-2">
          {label}
        </p>
        
        <p className="text-gray-200 text-sm font-semibold italic">
          "{datosDelPunto.descripcion}"
        </p>
        
        {/* AQUÍ IMPRIMIMOS EL MÉTODO DE PAGO */}
        <p className="text-gray-400 text-xs mb-1 font-mono">
          {datosDelPunto.metodo}
        </p>
        
        <p className="text-red-500 font-bold text-lg drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
          ⚔️ Gasto: ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}