import { useState, useEffect } from 'react';

export default function Libros() {
  // Enrutador interno: 'menu', 'libros', 'citas'
  const [vistaActiva, setVistaActiva] = useState('menu');
  
  const [libros, setLibros] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para Formularios
  const [nuevoLibro, setNuevoLibro] = useState({ titulo: '', autor: '', estadoLectura: 0 });
  
  const [libroIdCita, setLibroIdCita] = useState(''); // Qué libro está seleccionado en el dropdown
  const [nuevaCita, setNuevaCita] = useState({ textoOriginal: '', reflexionPersonal: '', pagina: '' });

  const PUERTO = "5240";

  // ==========================================
  // LÓGICA DE DATOS
  // ==========================================
  const cargarBiblioteca = () => {
    fetch(`http://localhost:${PUERTO}/api/libros`)
      .then(res => res.json())
      .then(data => { setLibros(data); setCargando(false); })
      .catch(() => setCargando(false));
  };

  useEffect(() => { cargarBiblioteca(); }, []);

  // Funciones de Libros
  const handleCrearLibro = (e) => {
    e.preventDefault();
    if (!nuevoLibro.titulo.trim()) return;

    fetch(`http://localhost:${PUERTO}/api/libros`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: nuevoLibro.titulo,
        autor: nuevoLibro.autor,
        estadoLectura: parseInt(nuevoLibro.estadoLectura)
      })
    }).then(() => {
      setNuevoLibro({ titulo: '', autor: '', estadoLectura: 0 });
      cargarBiblioteca();
    });
  };

  const handleCambiarEstado = (id, nuevoEstado) => {
    fetch(`http://localhost:${PUERTO}/api/libros/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estadoLectura: nuevoEstado })
    }).then(() => cargarBiblioteca());
  };

  const handleEliminarLibro = (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este libro y TODAS sus citas?")) return;
    fetch(`http://localhost:${PUERTO}/api/libros/${id}`, { method: 'DELETE' })
      .then(() => {
        if (parseInt(libroIdCita) === id) setLibroIdCita('');
        cargarBiblioteca();
      });
  };

  // Funciones de Citas
  const handleAgregarCita = (e) => {
    e.preventDefault();
    if (!nuevaCita.textoOriginal.trim() || !libroIdCita) return;

    fetch(`http://localhost:${PUERTO}/api/libros/${libroIdCita}/citas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libroId: parseInt(libroIdCita),
        textoOriginal: nuevaCita.textoOriginal,
        reflexionPersonal: nuevaCita.reflexionPersonal,
        pagina: nuevaCita.pagina ? parseInt(nuevaCita.pagina) : null
      })
    }).then(() => {
      setNuevaCita({ textoOriginal: '', reflexionPersonal: '', pagina: '' });
      cargarBiblioteca(); 
    }).catch(() => alert("Error al guardar la cita en el backend."));
  };

  // Ayudante para encontrar el libro activo en la vista de citas
  const libroSeleccionado = libros.find(l => l.id === parseInt(libroIdCita)) || null;

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================
  if (cargando) return <p className="text-emerald-500 animate-pulse p-8 font-mono">Cargando módulos de lectura...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white pb-10">
      
      {/* HEADER GLOBAL */}
      <header className="border-b border-gray-700 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 uppercase italic">
            El Archivo Literario
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-mono">Gestión de volúmenes y fragmentos filosóficos.</p>
        </div>
        {vistaActiva !== 'menu' && (
          <button onClick={() => setVistaActiva('menu')} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-4 py-2 rounded text-xs font-bold transition-colors">
            ⬅️ Volver al Menú
          </button>
        )}
      </header>

      {/* ==========================================
          VISTA 1: MENÚ PRINCIPAL
          ========================================== */}
      {vistaActiva === 'menu' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
          
          <button onClick={() => setVistaActiva('libros')} className="group bg-[#0a0a0c]/60 border border-gray-800 hover:border-emerald-500 rounded-2xl p-10 flex flex-col items-center justify-center transition-all shadow-xl hover:shadow-emerald-900/20 h-[300px]">
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">📚</span>
            <h3 className="text-2xl font-bold text-emerald-400 uppercase tracking-widest mb-2">Gestión de Libros</h3>
            <p className="text-sm text-gray-500 font-mono text-center">Registra nuevas lecturas, cambia estados y organiza tu biblioteca.</p>
            <span className="mt-6 text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-400 group-hover:bg-emerald-900/50 group-hover:text-emerald-300">
              {libros.length} volúmenes registrados
            </span>
          </button>

          <button onClick={() => setVistaActiva('citas')} className="group bg-[#0a0a0c]/60 border border-gray-800 hover:border-teal-500 rounded-2xl p-10 flex flex-col items-center justify-center transition-all shadow-xl hover:shadow-teal-900/20 h-[300px]">
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform">✒️</span>
            <h3 className="text-2xl font-bold text-teal-400 uppercase tracking-widest mb-2">Cuaderno de Citas</h3>
            <p className="text-sm text-gray-500 font-mono text-center">Extrae fragmentos importantes y anota tus reflexiones analíticas.</p>
            <span className="mt-6 text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-400 group-hover:bg-teal-900/50 group-hover:text-teal-300">
              Entrar al taller mental
            </span>
          </button>

        </div>
      )}

      {/* ==========================================
          VISTA 2: GESTIÓN DE LIBROS
          ========================================== */}
      {vistaActiva === 'libros' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Formulario de Alta */}
          <form onSubmit={handleCrearLibro} className="bg-gray-900 border border-emerald-900/30 p-5 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-lg">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Título del Libro</label>
              <input type="text" value={nuevoLibro.titulo} onChange={e => setNuevoLibro({...nuevoLibro, titulo: e.target.value})} required className="w-full mt-1 bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Autor</label>
              <input type="text" value={nuevoLibro.autor} onChange={e => setNuevoLibro({...nuevoLibro, autor: e.target.value})} required className="w-full mt-1 bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-widest">Estado Inicial</label>
              <select value={nuevoLibro.estadoLectura} onChange={e => setNuevoLibro({...nuevoLibro, estadoLectura: e.target.value})} className="w-full mt-1 bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm text-gray-300 outline-none focus:border-emerald-500">
                <option value={0}>📚 Lectura Deseada</option>
                <option value={1}>⚡ Leyendo Actualmente</option>
                <option value={2}>✅ Completado (Leído)</option>
              </select>
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-gray-900 font-black py-2 rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-wider text-xs h-[38px]">
              Adquirir Libro
            </button>
          </form>

          {/* Cuadrículas de Estados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* LEYENDO (Destacado) */}
            <div className="md:col-span-3 bg-[#0a0a0c]/40 border border-teal-900/30 p-5 rounded-xl">
              <h3 className="text-teal-400 font-mono font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="animate-ping w-2 h-2 rounded-full bg-teal-400"></span>
                ⚡ En Progreso ({libros.filter(l => l.estadoLectura === 1).length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {libros.filter(l => l.estadoLectura === 1).map(l => (
                  <div key={l.id} className="p-4 bg-gray-900 border border-gray-800 rounded-xl relative group">
                    <button onClick={() => handleEliminarLibro(l.id)} className="absolute top-2 right-2 text-gray-600 hover:text-red-500 font-bold p-1 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    <h4 className="font-bold text-gray-200">{l.titulo}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">Autor: {l.autor}</p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleCambiarEstado(l.id, 2)} className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded hover:bg-emerald-900/40 w-full">✅ Finalizar</button>
                      <button onClick={() => handleCambiarEstado(l.id, 0)} className="bg-gray-800 border border-gray-700 text-gray-400 text-[10px] uppercase font-bold px-2 py-1 rounded hover:text-white w-full">⏸ Pausar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DESEADOS */}
            <div className="md:col-span-1 bg-[#0a0a0c]/40 border border-gray-800 p-5 rounded-xl">
              <h3 className="text-amber-500 font-mono font-bold text-xs uppercase tracking-widest mb-4">📌 Deseados</h3>
              <div className="space-y-3">
                {libros.filter(l => l.estadoLectura === 0).map(l => (
                  <div key={l.id} className="p-3 bg-gray-900 border border-gray-800 rounded-lg flex justify-between items-center group relative overflow-hidden">
                    <div className="z-10">
                      <h4 className="text-sm font-bold text-gray-300">{l.titulo}</h4>
                      <p className="text-[11px] text-gray-500">{l.autor}</p>
                    </div>
                    <div className="flex gap-2 z-10">
                      <button onClick={() => handleEliminarLibro(l.id)} className="text-gray-600 hover:text-red-500 text-xs font-bold px-1 opacity-0 group-hover:opacity-100">✕</button>
                      <button onClick={() => handleCambiarEstado(l.id, 1)} className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-1 rounded hover:bg-amber-500/20">🚀 Leer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEÍDOS */}
            <div className="md:col-span-2 bg-[#0a0a0c]/40 border border-gray-800 p-5 rounded-xl">
              <h3 className="text-emerald-400 font-mono font-bold text-xs uppercase tracking-widest mb-4">🏆 Bóveda de Leídos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {libros.filter(l => l.estadoLectura === 2).map(l => (
                  <div key={l.id} className="p-3 bg-gray-900/40 border border-emerald-900/20 rounded-lg flex justify-between items-center group relative">
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 line-through decoration-gray-600">{l.titulo}</h4>
                      <p className="text-[11px] text-gray-600">{l.autor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">Leído</span>
                      <button onClick={() => handleEliminarLibro(l.id)} className="text-gray-600 hover:text-red-500 text-xs font-bold px-1 opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          VISTA 3: CUADERNO DE CITAS
          ========================================== */}
      {vistaActiva === 'citas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* PANEL IZQUIERDO: SELECCIÓN Y FORMULARIO */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-gray-900 border border-teal-900/50 rounded-xl p-5 shadow-lg">
              <label className="text-[10px] uppercase font-bold text-teal-400 font-mono tracking-widest mb-2 block">1. Selecciona el Volumen</label>
              <select value={libroIdCita} onChange={(e) => setLibroIdCita(e.target.value)} className="w-full bg-[#0a0a0c] border border-gray-700 rounded p-2 text-sm text-gray-200 outline-none focus:border-teal-500">
                <option value="">-- Elige un libro de la biblioteca --</option>
                {libros.map(l => (
                  <option key={l.id} value={l.id}>{l.titulo} ({l.estadoLectura === 1 ? 'Leyendo' : l.estadoLectura === 2 ? 'Leído' : 'Deseado'})</option>
                ))}
              </select>
            </div>

            {libroIdCita && (
              <form onSubmit={handleAgregarCita} className="space-y-4 bg-gray-900 border border-gray-800 p-5 rounded-xl shadow-lg">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block border-b border-gray-800 pb-2">2. ✒️ Capturar Fragmento</span>
                
                <input type="number" placeholder="Página (Opcional)" value={nuevaCita.pagina} onChange={e => setNuevaCita({...nuevaCita, pagina: e.target.value})} className="w-full bg-[#0a0a0c] border border-gray-700 rounded p-2 text-xs outline-none text-white focus:border-teal-500" />
                
                <textarea placeholder="Escribe aquí el pasaje exacto del autor..." required value={nuevaCita.textoOriginal} onChange={e => setNuevaCita({...nuevaCita, textoOriginal: e.target.value})} rows="4" className="w-full bg-[#0a0a0c] border border-gray-700 rounded p-2 text-xs outline-none text-gray-200 focus:border-teal-500 font-serif resize-none" />
                
                <textarea placeholder="Escribe aquí tu reflexión filosófica personal..." value={nuevaCita.reflexionPersonal} onChange={e => setNuevaCita({...nuevaCita, reflexionPersonal: e.target.value})} rows="4" className="w-full bg-[#0a0a0c] border border-gray-700 rounded p-2 text-xs outline-none text-gray-300 focus:border-teal-500 resize-none" />
                
                <button type="submit" className="w-full bg-teal-600 hover:bg-teal-500 text-gray-900 font-bold py-2 rounded text-xs uppercase tracking-wide shadow-[0_0_10px_rgba(20,184,166,0.3)]">
                  Guardar Anotación
                </button>
              </form>
            )}
          </div>

          {/* PANEL DERECHO: EL VISOR DE CITAS */}
          <div className="lg:col-span-2">
            <div className="bg-[#0a0a0c]/60 border border-gray-800 rounded-xl p-6 shadow-inner min-h-[500px]">
              
              {!libroSeleccionado ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                  <span className="text-4xl opacity-50">📖</span>
                  <p className="text-gray-500 font-mono text-sm">Selecciona un libro en el panel izquierdo <br/>para abrir su bitácora.</p>
                </div>
              ) : (
                <>
                  <header className="border-b border-gray-800 pb-4 mb-6">
                    <h3 className="text-2xl font-bold text-gray-100">{libroSeleccionado.titulo}</h3>
                    <p className="text-xs text-gray-500 font-mono">Notas y extractos guardados</p>
                  </header>

                  <div className="space-y-5 font-serif pr-2 max-h-[600px] overflow-y-auto">
                    {(() => {
                      // EL ESCUDO CONTRA EL JSON ROTO
                      const citasSeguras = libroSeleccionado.citas || libroSeleccionado.Citas || [];
                      
                      if (citasSeguras.length === 0) {
                        return <p className="text-sm text-gray-600 italic text-center py-10">El cuaderno está en blanco. Aún no extraes ninguna cita.</p>;
                      }

                      return citasSeguras.map(c => (
                        <div key={c.id} className="p-5 bg-gray-900/50 border-l-2 border-teal-500 rounded-r-lg space-y-3 relative group">
                          <p className="text-sm text-gray-300 italic leading-relaxed">
                            "{c.textoOriginal || c.TextoOriginal}"
                          </p>
                          {(c.reflexionPersonal || c.ReflexionPersonal) && (
                            <p className="text-sm text-teal-400 font-sans pl-3 border-l-2 border-gray-800 bg-gray-900 p-2 rounded">
                              💡 {c.reflexionPersonal || c.ReflexionPersonal}
                            </p>
                          )}
                          <div className="text-[10px] font-mono text-gray-500 text-right pt-2 border-t border-gray-800/50">
                            {c.pagina || c.Pagina ? `Página ${c.pagina || c.Pagina}` : 'Sin página'}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}