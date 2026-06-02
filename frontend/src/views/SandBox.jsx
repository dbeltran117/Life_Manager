import { useState, useEffect } from 'react';

export default function Sandbox() {
  const [ideas, setIdeas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Formulario rápido para el caos mental
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'General'
  });

  const PUERTO = "5240";

  const cargarIdeas = () => {
    fetch(`http://localhost:${PUERTO}/api/sandbox`)
      .then(res => res.json())
      .then(data => { setIdeas(data); setCargando(false); })
      .catch(err => { console.error("Error al cargar ideas:", err); setCargando(false); });
  };

  useEffect(() => { cargarIdeas(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return;

    fetch(`http://localhost:${PUERTO}/api/sandbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        setForm({ titulo: '', descripcion: '', categoria: 'General' });
        cargarIdeas();
      })
      .catch(() => alert("Error al atrapar la idea. El caos ganó esta vez."));
  };

  const evaluarIdea = (id, nuevoEstado) => {
    // Si la aprueba (estado 1), le avisamos para que no se asuste cuando aparezca en su Kanban
    if (nuevoEstado === 1) {
      alert("¡Idea Aprobada! Se ha enviado automáticamente a tus Recordatorios como prioridad media.");
    }

    fetch(`http://localhost:${PUERTO}/api/sandbox/${id}/evaluar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      // Enviamos el objeto con el campo exacto que espera C#
      body: JSON.stringify({ estadoEvaluacion: nuevoEstado }) 
    })
      .then(() => cargarIdeas())
      .catch(() => alert("Error al evaluar la idea."));
  };

  const eliminarIdea = (id) => {
    if (!window.confirm("¿Seguro que quieres borrar esto? No se puede recuperar.")) return;
    fetch(`http://localhost:${PUERTO}/api/sandbox/${id}`, { method: 'DELETE' })
      .then(() => cargarIdeas())
      .catch(() => alert("Error al eliminar."));
  };

  // Helper para pintar el post-it según su estado
  const obtenerEstiloPostit = (estado) => {
    switch (estado) {
      case 1: return "bg-green-900/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]"; // Buena
      case 2: return "bg-red-900/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"; // Mala
      case 3: return "bg-blue-900/20 border-blue-500/50 opacity-70"; // Implementada
      default: return "bg-yellow-900/20 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]"; // Nueva (0)
    }
  };

  if (cargando) return <p className="text-yellow-500 animate-pulse p-8 font-mono">Sincronizando el caos mental...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white pb-10">
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 uppercase italic">Sandbox de Ideas</h2>
        <p className="text-gray-500 text-sm mt-1 font-mono">El caos estructurado. Atrapa tus ideas antes de que escapen.</p>
      </header>

      {/* FORMULARIO RÁPIDO (Caja de captura) */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-yellow-600/30 p-6 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          <div className="md:col-span-1 space-y-4">
            <div>
              <label className="text-xs uppercase font-bold text-gray-400 font-mono tracking-widest">Concepto</label>
              <input type="text" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ej: Módulo de Viajes" required 
                className="w-full mt-1 bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-yellow-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-gray-400 font-mono tracking-widest">Categoría</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} 
                className="w-full mt-1 bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-yellow-500 transition-colors text-gray-300">
                <option value="General">General</option>
                <option value="LifeManager">LifeManager</option>
                <option value="Finanzas">Inversiones</option>
                <option value="Hardware">Robótica/Hardware</option>
              </select>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="text-xs uppercase font-bold text-gray-400 font-mono tracking-widest">Desarrollo de la idea</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows="4" placeholder="Volca el caos aquí..." 
              className="w-full mt-1 bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm outline-none focus:border-yellow-500 transition-colors resize-none" />
          </div>

          <div className="md:col-span-1 h-full flex items-end">
            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-black py-3 px-4 rounded shadow-[0_0_15px_rgba(202,138,4,0.4)] transition-all font-mono uppercase text-sm">
              💡 Atrapar Idea
            </button>
          </div>
        </div>
      </form>

      {/* MURO DE POST-ITS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {ideas.map(idea => (
          <div key={idea.id} className={`flex flex-col border-t-4 p-5 rounded-lg relative group transition-colors min-h-[220px] ${obtenerEstiloPostit(idea.estadoEvaluacion)}`}>
            
            {/* Botón Eliminar Oculto */}
            <button onClick={() => eliminarIdea(idea.id)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">✕</button>
            
            <div className="mb-2 pr-4">
              <span className="text-[9px] uppercase tracking-widest bg-gray-900/50 border border-gray-700 px-2 py-0.5 rounded text-gray-400 font-mono">
                {idea.categoria}
              </span>
            </div>
            
            <h4 className="font-bold text-lg text-gray-200 leading-tight mb-2">{idea.titulo}</h4>
            <p className="text-sm text-gray-400 italic flex-1 whitespace-pre-wrap line-clamp-5">
              {idea.descripcion || "Sin detalles."}
            </p>

            {/* BOTONES DE EVALUACIÓN (Solo si está en estado 0 "Nueva") */}
            {idea.estadoEvaluacion === 0 && (
              <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between gap-2">
                <button onClick={() => evaluarIdea(idea.id, 1)} className="flex-1 bg-green-900/40 hover:bg-green-800/60 text-green-400 text-xs py-1.5 rounded border border-green-700/50 transition-colors font-bold" title="Aprobar (Creará recordatorio)">
                  ✅ Aprobar
                </button>
                <button onClick={() => evaluarIdea(idea.id, 2)} className="flex-1 bg-red-900/40 hover:bg-red-800/60 text-red-400 text-xs py-1.5 rounded border border-red-700/50 transition-colors font-bold" title="Descartar">
                  ❌ Descartar
                </button>
              </div>
            )}

            {/* ETIQUETAS DE ESTADO (Si ya fue evaluada) */}
            {idea.estadoEvaluacion === 1 && <div className="mt-4 pt-3 border-t border-gray-700/50 text-center text-xs font-bold text-green-500 font-mono">✅ IDEA APROBADA</div>}
            {idea.estadoEvaluacion === 2 && <div className="mt-4 pt-3 border-t border-gray-700/50 text-center text-xs font-bold text-red-500 font-mono">❌ IDEA DESCARTADA</div>}
            {idea.estadoEvaluacion === 3 && <div className="mt-4 pt-3 border-t border-gray-700/50 text-center text-xs font-bold text-blue-500 font-mono">🚀 IMPLEMENTADA</div>}
          </div>
        ))}
        
        {ideas.length === 0 && (
          <div className="col-span-full h-40 border border-dashed border-yellow-900/50 rounded-lg flex items-center justify-center text-yellow-700/50 italic text-sm font-mono">
            El vacío absoluto. No hay ideas registradas.
          </div>
        )}
      </div>
    </div>
  );
}