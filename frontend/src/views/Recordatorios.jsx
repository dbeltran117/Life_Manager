import { useState, useEffect } from 'react';

export default function Recordatorios() {
  const [recordatorios, setRecordatorios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [verHistorial, setVerHistorial] = useState(false); // NUEVO: Alternar vistas
  
  const [nuevo, setNuevo] = useState({ titulo: "", descripcion: "", nivelPrioridad: 0, diasDeVida: 0, esDiario: false });

  const PUERTO = "5240";

  const cargarTareas = () => {
    fetch(`http://localhost:${PUERTO}/api/recordatorios`)
      .then(res => res.json())
      .then(data => { setRecordatorios(data); setCargando(false); })
      .catch(err => { console.error("Error al sincronizar:", err); setCargando(false); });
  };

  useEffect(() => { cargarTareas(); }, []);

  // Lógica Drag and Drop
  const manejarDragStart = (e, id) => e.dataTransfer.setData("text/plain", id);
  const manejarDragOver = (e) => e.preventDefault();
  const manejarDrop = (e, nuevoEstado) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    setRecordatorios(prev => prev.map(r => r.id === parseInt(id) ? { ...r, estado: nuevoEstado } : r));

    fetch(`http://localhost:${PUERTO}/api/recordatorios/${id}/mover`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    }).catch(() => cargarTareas());
  };

  // Crear Tarea
  const crearTarea = (e) => {
    e.preventDefault();
    if (!nuevo.titulo.trim()) return;

    const tareaPost = {
      titulo: nuevo.titulo,
      descripcion: nuevo.descripcion,
      nivelPrioridad: parseInt(nuevo.nivelPrioridad),
      diasDeVida: parseInt(nuevo.diasDeVida),
      estado: 0,
      esDiario: nuevo.esDiario
    };

    fetch(`http://localhost:${PUERTO}/api/recordatorios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tareaPost)
    })
    .then(() => {
      setNuevo({ titulo: "", descripcion: "", nivelPrioridad: 0, diasDeVida: 0, esDiario: false });
      cargarTareas();
    });
  };

  // Eliminar Tarea
  const eliminarTarea = (id) => {
    fetch(`http://localhost:${PUERTO}/api/recordatorios/${id}`, { method: 'DELETE' })
      .then(() => cargarTareas());
  };

  const toggleHabitoDiario = (tarea) => {
    fetch(`http://localhost:${PUERTO}/api/recordatorios/${tarea.id}/toggle-diario`, {
      method: 'PUT'
    })
    .then(() => cargarTareas()) // Refrescamos el tablero
    .catch(err => console.error("Error al mutar el estado del hábito:", err));
  };

  // Helpers de UI
  const obtenerPrioridadStyle = (nivel) => {
    if (nivel === 2) return "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse border shadow-[0_0_8px_rgba(239,68,68,0.2)]";
    if (nivel === 1) return "bg-orange-500/10 text-orange-400 border-orange-500/30 border";
    return "bg-gray-800 text-gray-400 border border-gray-700";
  };

  // NUEVO: Cálculo de Tiempo de Vida
  const calcularTiempoRestante = (tarea) => {
    if (tarea.diasDeVida === 0) return { texto: "♾️ Permanente", color: "text-gray-500" };
    
    const caducidad = new Date(tarea.fechaCreacion);
    caducidad.setDate(caducidad.getDate() + tarea.diasDeVida);
    const hoy = new Date();
    
    const diffTime = caducidad - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { texto: "💀 Expirada", color: "text-red-500 font-bold" };
    if (diffDays === 0) return { texto: "⚠️ Caduca hoy", color: "text-orange-400 font-bold animate-pulse" };
    return { texto: `⏳ Quedan ${diffDays} día(s)`, color: "text-blue-400" };
  };

  const tareaExpirada = (tarea) => {
    if (tarea.diasDeVida === 0) return false;
    const caducidad = new Date(tarea.fechaCreacion);
    caducidad.setDate(caducidad.getDate() + tarea.diasDeVida);
    return new Date() > caducidad;
  };

  // NUEVO: Filtros Inteligentes
  // En el Kanban: Solo tareas que NO están completadas (o que son Hábitos Diarios) y que NO han expirado.
  const tareasKanban = recordatorios.filter(r => (r.estado !== 2 || r.esDiario) && !tareaExpirada(r));
  
  // En el Historial: Tareas completadas que NO son diarios, O tareas que caducaron por flojo.
  const tareasHistorial = recordatorios.filter(r => (r.estado === 2 && !r.esDiario) || tareaExpirada(r));

  const columnas = [
    { id: 0, nombre: "📥 Pendientes", color: "border-purple-500/20" },
    { id: 1, nombre: "⚡ En Progreso", color: "border-blue-500/20" },
    { id: 2, nombre: "✅ Terminados", color: "border-green-500/20" }
  ];

  if (cargando) return <div className="p-8 text-purple-500 animate-pulse font-bold font-mono">Cargando Tablero...</div>;

  return (
    <div className="space-y-8 pb-10 text-white animate-fade-in">
      
      {/* HEADER */}
      <header className="border-b border-gray-700 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase italic">
            Recordatorios
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-mono">Gestión del Tiempo e Impulsos de la Voluntad</p>
        </div>
        
        {/* BOTÓN PARA ALTERNAR VISTAS */}
        <button 
          onClick={() => setVerHistorial(!verHistorial)}
          className={`px-4 py-2 rounded font-bold font-mono text-xs border transition-colors ${verHistorial ? 'bg-purple-900/40 border-purple-500 text-purple-300' : 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white'}`}
        >
          {verHistorial ? "⬅️ Volver al Kanban" : "🗄️ Ver Historial"}
        </button>
      </header>

      {/* VISTA 1: EL KANBAN ACTIVO */}
      {!verHistorial && (
        <>
          {/* FORMULARIO DE CREACIÓN */}
          <form onSubmit={crearTarea} className="bg-gray-900 border border-gray-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4 items-end shadow-lg">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Título de la misión</label>
              <input type="text" value={nuevo.titulo} onChange={e => setNuevo({...nuevo, titulo: e.target.value})} required className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-purple-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Descripción</label>
              <input type="text" value={nuevo.descripcion} onChange={e => setNuevo({...nuevo, descripcion: e.target.value})} className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-purple-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Prioridad</label>
              <select value={nuevo.nivelPrioridad} onChange={e => setNuevo({...nuevo, nivelPrioridad: e.target.value})} className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none text-gray-300 focus:border-purple-500">
                <option value={0}>Baja</option>
                <option value={1}>Media</option>
                <option value={2}>Crítica</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Tiempo de Vida</label>
                <select value={nuevo.diasDeVida} onChange={e => setNuevo({...nuevo, diasDeVida: parseInt(e.target.value)})} className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none text-gray-300 focus:border-purple-500">
                    <option value={0}>Permanente</option>
                    <option value={1}>1 Día</option>
                    <option value={7}>1 Semana</option>
                </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer border border-gray-700 bg-[#0a0a0c] p-1.5 rounded hover:border-purple-500">
                 <input type="checkbox" checked={nuevo.esDiario} onChange={e => setNuevo({...nuevo, esDiario: e.target.checked})} className="accent-purple-500 w-3 h-3" />
                 <span className="text-[10px] text-gray-400 font-mono uppercase font-bold">Hábito Diario 🔁</span>
              </label>
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-4 rounded shadow-[0_0_15px_rgba(168,85,247,0.4)] text-[11px] h-[32px] uppercase">
                ➕ Desplegar
              </button>
            </div>
          </form>

          {/* EL TABLERO KANBAN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columnas.map(col => {
              const tareasColumna = tareasKanban.filter(r => r.estado === col.id);

              return (
                <div key={col.id} onDragOver={manejarDragOver} onDrop={(e) => manejarDrop(e, col.id)} className={`bg-[#0a0a0c]/80 border-t-4 ${col.color} border p-4 rounded-xl flex flex-col min-h-[450px]`}>
                  <h3 className="text-gray-300 font-bold font-mono tracking-wide mb-4 border-b border-gray-900 pb-2 flex justify-between">
                    <span>{col.nombre}</span>
                    <span className="text-xs bg-gray-900 px-2 rounded text-gray-500">{tareasColumna.length}</span>
                  </h3>

                  <div className="flex-1 space-y-3">
                    {tareasColumna.map(tarea => {
                      const tiempo = calcularTiempoRestante(tarea);
                      return (
                      <div 
  key={tarea.id} 
  draggable 
  onDragStart={(e) => manejarDragStart(e, tarea.id)} 
  className="bg-gray-900 border border-gray-800 p-4 rounded-lg cursor-grab active:cursor-grabbing shadow-md group relative"
>
  <div className={`absolute left-0 top-0 h-full w-1 ${tarea.nivelPrioridad === 2 ? 'bg-red-500' : tarea.nivelPrioridad === 1 ? 'bg-orange-500' : 'bg-gray-700'}`}></div>

  {/* CABECERA DE LA TARJETA (Título, Botón Diario, Eliminar) */}
  <div className="flex justify-between items-start gap-2 pl-1 w-full">
    
    <div className="flex flex-col gap-1 items-start w-full">
      <h4 className="font-bold text-sm text-gray-200 flex items-center gap-1">
        {tarea.titulo}
      </h4>
      
      {/* BOTÓN INTERRUPTOR DE HÁBITO (Aislado del drag principal con onMouseDown) */}
      <button 
        onMouseDown={(e) => e.stopPropagation()} // ESTA ES LA MAGIA QUE ARREGLA TU ERROR
        onClick={() => toggleHabitoDiario(tarea)}
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
          tarea.esDiario 
            ? 'bg-purple-950/40 text-purple-400 border-purple-500/30 hover:bg-purple-900/50' 
            : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300 hover:border-gray-500'
        }`}
        title={tarea.esDiario ? "Quitar de hábitos diarios" : "Convertir en hábito diario"}
      >
        {tarea.esDiario ? "🔁 Diario" : "📌 Hacer Diario"}
      </button>
    </div>

    <button 
      onMouseDown={(e) => e.stopPropagation()} // También protegemos el botón de eliminar
      onClick={() => eliminarTarea(tarea.id)} 
      className="text-gray-600 hover:text-red-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity p-1"
    >
      ✕
    </button>
  </div>

  {/* DESCRIPCIÓN */}
  <p className="text-xs text-gray-500 mt-2 pl-1 italic">
    {tarea.descripcion || "Sin detalles."}
  </p>

  {/* PIE DE TARJETA (Prioridad y Tiempo) */}
  <div className="mt-3 flex justify-between items-center pl-1">
    <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold font-mono ${obtenerPrioridadStyle(tarea.nivelPrioridad)}`}>
      {tarea.nivelPrioridad === 2 ? "💥 Crítica" : tarea.nivelPrioridad === 1 ? "⚠️ Media" : "☕ Baja"}
    </span>
    
    <span className={`text-[10px] font-mono ${tiempo.color}`}>
      {tiempo.texto}
    </span>
  </div>
</div>
                    )})}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* VISTA 2: EL HISTORIAL DE TAREAS COMPLETADAS / EXPIRADAS */}
      {verHistorial && (
        <div className="bg-[#0a0a0c]/80 border border-gray-800 p-6 rounded-xl shadow-inner min-h-[500px]">
          <h3 className="text-xl font-bold text-gray-300 font-mono border-b border-gray-800 pb-3 mb-6">
            🗄️ Bóveda de Tareas Realizadas (y fracasadas)
          </h3>
          
          <div className="space-y-3">
            {tareasHistorial.map(tarea => (
              <div key={tarea.id} className="bg-gray-900/50 border border-gray-800 p-4 rounded flex justify-between items-center hover:bg-gray-800 transition-colors">
                <div>
                  <h4 className="font-bold text-sm text-gray-300 line-through decoration-gray-600">
                    {tarea.titulo}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">Creada el: {new Date(tarea.fechaCreacion).toLocaleDateString()}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {tareaExpirada(tarea) ? (
                    <span className="text-xs font-mono text-red-500 font-bold bg-red-900/20 px-2 py-1 rounded border border-red-900/50">💀 Expirada / No completada</span>
                  ) : (
                    <span className="text-xs font-mono text-green-500 font-bold bg-green-900/20 px-2 py-1 rounded border border-green-900/50">✅ Completada</span>
                  )}
                  
                  <button onClick={() => eliminarTarea(tarea.id)} className="text-gray-500 hover:text-red-500 font-bold text-xs p-2">
                    Purgar
                  </button>
                </div>
              </div>
            ))}

            {tareasHistorial.length === 0 && (
              <p className="text-gray-600 italic text-center py-10 font-mono text-sm">El historial está vacío. Aún no has completado (ni dejado morir) ninguna tarea única.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}