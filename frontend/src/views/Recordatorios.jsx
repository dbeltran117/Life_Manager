import { useState, useEffect } from 'react';

export default function Recordatorios() {
  const [recordatorios, setRecordatorios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para el formulario de nueva tarea
  const [nuevo, setNuevo] = useState({ titulo: "", descripcion: "", nivelPrioridad: 0, diasDeVida: 0 });

  const PUERTO = "5240";

  // 1. Cargar tareas desde el Backend
  const cargarTareas = () => {
    fetch(`http://localhost:${PUERTO}/api/recordatorios`)
      .then(res => res.json())
      .then(data => {
        setRecordatorios(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al sincronizar Kanban:", err);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  // 2. LÓGICA DRAG AND DROP (NATIVA)
  const manejarDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const manejarDragOver = (e) => {
    e.preventDefault();
  };

  const manejarDrop = (e, nuevoEstado) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    // Actualización optimista
    setRecordatorios(prev => prev.map(r => r.id === parseInt(id) ? { ...r, estado: nuevoEstado } : r));

    // Guardar cambio en DB
    fetch(`http://localhost:${PUERTO}/api/recordatorios/${id}/mover`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(res => {
      if (!res.ok) throw new Error("Error en servidor");
    })
    .catch(err => {
      console.error("No se pudo mover la tarea en la DB:", err);
      cargarTareas();
    });
  };

  // 3. CREAR NUEVO RECORDATORIO
  const crearTarea = (e) => {
    e.preventDefault();
    if (!nuevo.titulo.trim()) return;

    const tareaPost = {
      titulo: nuevo.titulo,
      descripcion: nuevo.descripcion,
      nivelPrioridad: parseInt(nuevo.nivelPrioridad),
      diasDeVida: nuevo.diasDeVida,
      estado: 0 
    };

    fetch(`http://localhost:${PUERTO}/api/recordatorios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tareaPost)
    })
    .then(res => res.json())
    .then(() => {
      setNuevo({ titulo: "", descripcion: "", nivelPrioridad: 0, diasDeVida: 0 });
      cargarTareas();
    })
    .catch(err => console.error("Error al inyectar recordatorio:", err));
  };

  // 4. ELIMINAR RECORDATORIO
  const eliminarTarea = (id) => {
    fetch(`http://localhost:${PUERTO}/api/recordatorios/${id}`, {
      method: 'DELETE'
    })
    .then(() => cargarTareas())
    .catch(err => console.error("Error al purgar tarea:", err));
  };

  // Helper para pintar prioridades
  const obtenerPrioridadStyle = (nivel) => {
    if (nivel === 2) return "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse border shadow-[0_0_8px_rgba(239,68,68,0.2)]";
    if (nivel === 1) return "bg-orange-500/10 text-orange-400 border-orange-500/30 border";
    return "bg-gray-800 text-gray-400 border border-gray-700";
  };

  // Validación de caducidad
  const tareaExpirada = (tarea) => {
    if (tarea.diasDeVida === 0) return false;
    
    const fechaLimite = new Date(tarea.fechaCreacion);
    fechaLimite.setDate(fechaLimite.getDate() + tarea.diasDeVida);
    
    return new Date() > fechaLimite;
  };

  // Columnas
  const columnas = [
    { id: 0, nombre: "📥 Pendientes", color: "border-purple-500/20" },
    { id: 1, nombre: "⚡ En Progreso", color: "border-blue-500/20" },
    { id: 2, nombre: "✅ Terminados", color: "border-green-500/20" }
  ];

  if (cargando) return <div className="p-8 text-purple-500 animate-pulse font-bold font-mono">Cargando Tablero de Control Mental...</div>;

  return (
    <div className="space-y-8 pb-10 text-white animate-fade-in">
      
      {/* HEADER */}
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase italic">
          Recordatorios
        </h2>
        <p className="text-gray-500 text-sm mt-1 font-mono">Gestión del Tiempo e Impulsos de la Voluntad</p>
      </header>

      {/* FORMULARIO DE CREACIÓN */}
      <form onSubmit={crearTarea} className="bg-gray-900 border border-gray-800 p-5 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-lg">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Título de la misión</label>
          <input type="text" value={nuevo.titulo} onChange={e => setNuevo({...nuevo, titulo: e.target.value})} placeholder="Ej: Validar tokens Core 64" className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-purple-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Descripción corta</label>
          <input type="text" value={nuevo.descripcion} onChange={e => setNuevo({...nuevo, descripcion: e.target.value})} placeholder="X=4 es correcto, X = 4 rompe" className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-purple-500 transition-colors" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Amenaza / Prioridad</label>
          <select value={nuevo.nivelPrioridad} onChange={e => setNuevo({...nuevo, nivelPrioridad: e.target.value})} className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-purple-500 transition-colors text-gray-300">
            <option value={0}>Baja (Rutina)</option>
            <option value={1}>Media (Alerta)</option>
            <option value={2}>Crítica (Peligro)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Tiempo de Vida</label>
            <select value={nuevo.diasDeVida} onChange={e => setNuevo({...nuevo, diasDeVida: parseInt(e.target.value)})} className="bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-purple-500 transition-colors text-gray-300">
                <option value={0}>Sin límite (Permanente)</option>
                <option value={1}>1 Día (Urgente)</option>
                <option value={7}>1 Semana (Proyecto)</option>
            </select>
        </div>
        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all font-mono uppercase text-sm h-[38px]">
          ➕ Desplegar
        </button>
      </form>

      {/* EL TABLERO KANBAN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columnas.map(col => {
          // Filtramos primero las tareas válidas
          const tareasColumna = recordatorios.filter(r => r.estado === col.id && !tareaExpirada(r));

          return (
            <div key={col.id} onDragOver={manejarDragOver} onDrop={(e) => manejarDrop(e, col.id)} className={`bg-[#0a0a0c]/80 border-t-4 ${col.color} border p-4 rounded-xl flex flex-col min-h-[450px] shadow-inner`}>
              
              <h3 className="text-gray-300 font-bold font-mono tracking-wide mb-4 border-b border-gray-900 pb-2 flex justify-between items-center">
                <span>{col.nombre}</span>
                <span className="text-xs bg-gray-900 px-2 py-0.5 rounded text-gray-500 font-normal">
                  {tareasColumna.length}
                </span>
              </h3>

              {/* CONTENEDOR DE TARJETAS */}
              <div className="flex-1 space-y-3">
                {tareasColumna.map(tarea => (
                  <div key={tarea.id} draggable onDragStart={(e) => manejarDragStart(e, tarea.id)} className="bg-gray-900 border border-gray-800 p-4 rounded-lg cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all shadow-md group relative overflow-hidden">
                    
                    <div className={`absolute left-0 top-0 h-full w-1 ${tarea.nivelPrioridad === 2 ? 'bg-red-500' : tarea.nivelPrioridad === 1 ? 'bg-orange-500' : 'bg-gray-700'}`}></div>

                    <div className="flex justify-between items-start gap-2 pl-1">
                      <h4 className="font-bold text-sm text-gray-200 tracking-wide">{tarea.titulo}</h4>
                      <button onClick={() => eliminarTarea(tarea.id)} className="text-gray-600 hover:text-red-400 text-xs font-bold transition-colors opacity-0 group-hover:opacity-100 font-mono px-1">
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 pl-1 italic font-sans">
                      {tarea.descripcion || "Sin detalles adicionales."}
                    </p>

                    <div className="mt-3 flex justify-between items-center pl-1">
                      <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-bold font-mono ${obtenerPrioridadStyle(tarea.nivelPrioridad)}`}>
                        {tarea.nivelPrioridad === 2 ? "💥 Crítica" : tarea.nivelPrioridad === 1 ? "⚠️ Media" : "☕ Baja"}
                      </span>
                      <span className="text-[9px] font-mono text-gray-700">ID: #{tarea.id}</span>
                    </div>

                  </div>
                ))}

                {tareasColumna.length === 0 && (
                  <div className="h-32 border border-dashed border-gray-900 rounded-lg flex items-center justify-center text-gray-700 italic text-xs font-mono">
                    Zona Vacía
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}