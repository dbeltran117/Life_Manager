import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';

export default function Dashboard() {
  const [db, setDb] = useState({ ingresos: [], gastos: [], tarjetas: [], hobbies: [], abonos: [], recordatorios: [], fe: [] });
  const [cargando, setCargando] = useState(true);
  
  // Estado para el filtro de tiempo (Por defecto: Todo)
  const [filtroTiempo, setFiltroTiempo] = useState('todo');

  const PUERTO = "5240";

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:${PUERTO}/api/ingresos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/gastos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/tarjetas`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/hobbies`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/abonos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/recordatorios`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/fe`).then(res => res.json()), 
      fetch(`http://localhost:${PUERTO}/api/cuerpo`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/mente`).then(res => res.json()) 
    ])
    .then(([dIngresos, dGastos, dTarjetas, dHobbies, dAbonos, dRecordatorios, dFe, dCuerpo, dMente]) => {
      setDb({ ingresos: dIngresos, gastos: dGastos, tarjetas: dTarjetas, hobbies: dHobbies, abonos: dAbonos, recordatorios: dRecordatorios, fe: dFe, cuerpo: dCuerpo, mente: dMente }); // AGREGAMOS fe AL ESTADO CENTRAL
      setCargando(false);
    })
    .catch(err => {
      console.error("Error cargando Bóveda:", err);
      setCargando(false);
    });
  }, []);

  // Cálculo de métricas dinámicas usando useMemo (se recalcula solo si cambia db o el filtro)
  const metricas = useMemo(() => {
    
    // MOVIMOS LA FUNCIÓN AQUÍ ADENTRO
    const filtrarPorFecha = (items) => {
      if (filtroTiempo === 'todo') return items;
      const ahora = new Date();
      const limite = new Date();
      
      if (filtroTiempo === 'semana') limite.setDate(ahora.getDate() - 7);
      if (filtroTiempo === 'mes') limite.setMonth(ahora.getMonth() - 1);
      if (filtroTiempo === 'ano') limite.setFullYear(ahora.getFullYear() - 1);

      return items.filter(item => new Date(item.fecha) >= limite);
    };

    // Y luego el código sigue normal
    const ingresosFiltrados = filtrarPorFecha(db.ingresos);
    const gastosFiltrados = filtrarPorFecha(db.gastos);
    const abonosFiltrados = filtrarPorFecha(db.abonos);

    const totalIngresos = ingresosFiltrados.reduce((s, i) => s + i.monto, 0);
    const totalGastosVisual = gastosFiltrados.reduce((s, i) => s + i.monto, 0);
    
    // Desglose de Gastos
    const gNecesarios = gastosFiltrados.filter(g => g.categoria === 0).reduce((s, i) => s + i.monto, 0);
    const gInnecesarios = gastosFiltrados.filter(g => g.categoria === 1).reduce((s, i) => s + i.monto, 0);
    const gFijos = gastosFiltrados.filter(g => g.categoria === 2).reduce((s, i) => s + i.monto, 0);

    const gastosEfectivo = gastosFiltrados.filter(g => g.metodo === 0).reduce((s, i) => s + i.monto, 0);
    const totalAbonos = abonosFiltrados.reduce((s, i) => s + i.monto, 0);
    const dineroFisico = totalIngresos - gastosEfectivo - totalAbonos;

    // Procesar datos para la gráfica de tendencias con los gastos filtrados
    const tendencia = gastosFiltrados.map(g => ({
      fecha: new Date(g.fecha).toLocaleDateString('es-MX', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}),
      gasto: g.monto,
      descripcion: g.descripcion,
      metodo: g.metodo === 0 ? '💵 Efectivo' : '💳 Crédito'
    }));
  
    return { 
      ingresos: totalIngresos, 
      gastosTotales: totalGastosVisual, 
      liquidez: dineroFisico,
      desglose: { necesarios: gNecesarios, innecesarios: gInnecesarios, fijos: gFijos },
      graficaTendencia: tendencia
    };
  }, [db, filtroTiempo]);

// 1. Calculamos el versículo de forma inteligente sin usar estados extra
  const versiculoDelDia = useMemo(() => {
    if (db.fe.length === 0) return null;
    
    const hoy = new Date().toLocaleDateString();
    const fechaGuardada = localStorage.getItem('fechaVersiculo');
    const versiculoGuardado = localStorage.getItem('versiculoDia');

    // Si ya tenemos uno guardado de hoy, lo devolvemos directamente
    if (versiculoGuardado && fechaGuardada === hoy) {
      return JSON.parse(versiculoGuardado);
    }

    // Si es un día nuevo, hacemos la matemática
    const diaDelAnio = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const indice = diaDelAnio % db.fe.length;
    return db.fe[indice];
  }, [db.fe]); // Solo se recalcula si db.fe cambia

  // 2. Este efecto SOLO guarda en memoria, sin alterar los estados de React
  useEffect(() => {
    if (versiculoDelDia) {
      const hoy = new Date().toLocaleDateString();
      localStorage.setItem('versiculoDia', JSON.stringify(versiculoDelDia));
      localStorage.setItem('fechaVersiculo', hoy);
    }
  }, [versiculoDelDia]);


  // Función para filtrar por tiempo
  const obtenerConteoFiltrado = (lista, campoFecha) => {
    if (!lista || lista.length === 0) return 0;
    if (filtroTiempo === 'todo') return lista.length;

    const limite = new Date();
    if (filtroTiempo === 'semana') limite.setDate(limite.getDate() - 7);
    else if (filtroTiempo === 'mes') limite.setMonth(limite.getMonth() - 1);
    else if (filtroTiempo === 'ano') limite.setFullYear(limite.getFullYear() - 1);

    // Filtramos comparando fechas
    return lista.filter(item => new Date(item[campoFecha]) >= limite).length;
  };

   // Calculamos los contadores dinámicos usando los nombres correctos de tus propiedades
  const stats = {
    fe: obtenerConteoFiltrado(db.fe, 'fechaCreacion'),
    cuerpo: obtenerConteoFiltrado(db.cuerpo, 'fecha'),
    mente: obtenerConteoFiltrado(db.mente, 'fechaCreacion')
  };
const tarjeta = db.tarjetas.length > 0 
    ? { limite: db.tarjetas[0].limite, deuda: db.tarjetas[0].deudaActual, disponible: db.tarjetas[0].limite - db.tarjetas[0].deudaActual, existe: true, nombre: db.tarjetas[0].nombre } 
    : { limite: 0, deuda: 0, disponible: 0, existe: false };

  const ingresosRecientes = [...db.ingresos].reverse().slice(0, 4);
  const recordatoriosCriticos = db.recordatorios.filter(r => r.nivelPrioridad === 2 && r.estado !== 2).slice(0, 3);

 const fmt = (num) => (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });



  if (cargando) return <div className="p-8 text-purple-500 animate-pulse font-bold">Sincronizando Sistema de Control...</div>;

  return (
    <div className="space-y-6 text-white animate-fade-in pb-10">
      
      {/* HEADER CON FILTROS Y VERSÍCULO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-700 pb-4 gap-4">
        
        {/* 1. SECCIÓN IZQUIERDA: Títulos */}
        <div className="flex-shrink-0">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase italic">Control de Mando</h2>
          <p className="text-gray-500 text-sm mt-1 font-mono">Status: Online | User: Diego</p>
        </div>

        {/* 2. SECCIÓN CENTRAL: Versículo del día (Compacto) */}
        {versiculoDelDia && (
          <div className="flex-1 max-w-lg bg-gray-900/40 border border-purple-500/20 rounded-md p-2 hidden md:block shadow-sm">
            <p className="text-gray-300 italic text-xs text-center line-clamp-2">
              "{versiculoDelDia.texto}"
            </p>
            <p className="text-blue-400 font-bold text-[10px] text-right mt-1">
              {versiculoDelDia.referencia}
            </p>
          </div>
        )}
        
        {/* 3. SECCIÓN DERECHA: Filtros de Tiempo */}
        <div className="flex bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
          {['semana', 'mes', 'ano', 'todo'].map(filtro => (
            <button key={filtro} onClick={() => setFiltroTiempo(filtro)}
              className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${filtroTiempo === filtro ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
              {filtro === 'ano' ? 'Año' : filtro}
            </button>
          ))}
        </div>
      </header>
      {/* FILA 1: MÉTRICAS Y RECORDATORIOS CRÍTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Liquidez Real" value={`$${fmt(metricas.liquidez)}`} color="bg-purple-600" />
          
          {/* TARJETA DE CONSUMO TOTAL PERSONALIZADA CON DESGLOSE */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden shadow-lg group hover:border-gray-600 transition-all flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
            <div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Consumo Total</h3>
              <p className="text-3xl font-black tracking-tight text-white">${fmt(metricas.gastosTotales)}</p>
            </div>
            
            {/* El desglose en letras pequeñas */}
            <div className="mt-4 pt-3 border-t border-gray-800 grid grid-cols-3 gap-2 text-[10px] uppercase font-bold">
              <div>
                <p className="text-gray-500 mb-0.5">Necesario</p>
                <p className="text-green-400">${fmt(metricas.desglose.necesarios)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Fijo</p>
                <p className="text-blue-400">${fmt(metricas.desglose.fijos)}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Basura</p>
                <p className="text-red-400">${fmt(metricas.desglose.innecesarios)}</p>
              </div>
            </div>
          </div>

          <StatCard title="Deuda Actual" value={`$${fmt(tarjeta.deuda)}`} color="bg-blue-600" />
        </div>
        
        <div className="bg-gray-900/50 border border-red-900/30 p-4 rounded-xl shadow-inner backdrop-blur-sm">
          <h4 className="text-red-500 text-xs font-bold uppercase mb-3 flex items-center gap-2">
            <span className="animate-ping w-2 h-2 rounded-full bg-red-500"></span> Prioridad Crítica
          </h4>
          <div className="space-y-3">
            {recordatoriosCriticos.length > 0 ? recordatoriosCriticos.map(r => (
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-300">Flujo de Gastos</h3>
            <span className="text-[10px] font-mono text-gray-500 uppercase px-2 py-1 bg-gray-800 rounded">Modo: {filtroTiempo}</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricas.graficaTendencia}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="fecha" stroke="#444" fontSize={10} hide />
                <YAxis stroke="#444" fontSize={10} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<TooltipOscuro />} cursor={{stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '4 4'}} />
                <Area type="monotone" dataKey="gasto" stroke="#ef4444" fillOpacity={1} fill="url(#colorGasto)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estadísticas del Tridente (Reemplaza a la gráfica de Hobbies) */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-300 uppercase tracking-wider">Inversión en Disciplina</h3>
            {/* Pequeño badge para mostrar qué filtro está activo */}
            <span className="text-xs font-mono text-purple-400 bg-purple-900/30 px-2 py-1 rounded border border-purple-800">
              {filtroTiempo.toUpperCase()}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
            {/* Fe */}
            <div className="bg-gray-800/50 border border-blue-900/50 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-colors hover:border-blue-500">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
              <span className="text-2xl mb-1">🕊️</span>
              <span className="text-4xl font-black text-blue-400 font-mono">{stats.fe}</span>
              <span className="text-[10px] text-gray-500 uppercase mt-1 font-bold">Registros</span>
            </div>

            {/* Cuerpo */}
            <div className="bg-gray-800/50 border border-green-900/50 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-colors hover:border-green-500">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-full blur-xl group-hover:bg-green-500/20 transition-all"></div>
              <span className="text-2xl mb-1">🏋️‍♂️</span>
              <span className="text-4xl font-black text-green-400 font-mono">{stats.cuerpo}</span>
              <span className="text-[10px] text-gray-500 uppercase mt-1 font-bold">Sesiones</span>
            </div>

            {/* Mente */}
            <div className="bg-gray-800/50 border border-purple-900/50 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden group transition-colors hover:border-purple-500">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
              <span className="text-2xl mb-1">🧠</span>
              <span className="text-4xl font-black text-purple-400 font-mono">{stats.mente}</span>
              <span className="text-[10px] text-gray-500 uppercase mt-1 font-bold">Escritos</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* FILA 3: ESTADO DE CRÉDITO E INGRESOS RECIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {tarjeta.existe ? (
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-400 font-bold uppercase text-sm tracking-widest">Estado de Crédito: {tarjeta.nombre}</h3>
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

// Componente Tarjeta Estadística Normal
function StatCard({ title, value, color }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl relative overflow-hidden shadow-lg group hover:border-gray-600 transition-all flex flex-col justify-center">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-3xl font-black tracking-tight text-white">{value}</p>
    </div>
  );
}

// Componente del Tooltip Oscuro de la Gráfica
function TooltipOscuro({ active, payload, label }) {
  if (active && payload && payload.length) {
    const datosDelPunto = payload[0].payload;
    return (
      <div className="bg-[#0a0a0a] border border-red-900/80 p-3 rounded shadow-[0_0_15px_rgba(220,38,38,0.4)] backdrop-blur-md">
        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest border-b border-gray-800 pb-1 mb-2">
          {label}
        </p>
        <p className="text-gray-200 text-sm font-semibold italic">"{datosDelPunto.descripcion}"</p>
        <p className="text-gray-400 text-xs mb-1 font-mono">{datosDelPunto.metodo}</p>
        <p className="text-red-500 font-bold text-lg drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
          ⚔️ Gasto: ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}