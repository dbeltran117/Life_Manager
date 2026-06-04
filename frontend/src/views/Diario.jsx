import { useState, useEffect } from 'react';

export default function Diario() {
  const [paginas, setPaginas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [verPortada, setVerPortada] = useState(true);
  const [paginaActiva, setPaginaActiva] = useState(null); // Para leer una página vieja

  // Estado para la nueva hoja que se va a escribir
  const [nuevaHoja, setNuevaHoja] = useState({
    emocionPredominante: 'Neutral',
    contenido: ''
  });

  const PUERTO = "5240";

  const cargarDiario = () => {
    fetch(`http://localhost:${PUERTO}/api/diario`)
      .then(res => res.json())
      .then(data => {
        setPaginas(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al abrir el diario:", err);
        setCargando(false);
      });
  };

  useEffect(() => { cargarDiario(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nuevaHoja.contenido.trim()) return;

    fetch(`http://localhost:${PUERTO}/api/diario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaHoja)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        setNuevaHoja({ emocionPredominante: 'Neutral', contenido: '' });
        cargarDiario();
      })
      .catch(() => alert("El diario se resiste a guardar tus secretos, baka."));
  };

  const eliminarPagina = (id, e) => {
    e.stopPropagation(); // Evita que se seleccione la página al querer borrarla
    if (!window.confirm("¿Arrancar esta página del diario permanentemente?")) return;

    fetch(`http://localhost:${PUERTO}/api/diario/${id}`, { method: 'DELETE' })
      .then(() => {
        if (paginaActiva?.id === id) setPaginaActiva(null);
        cargarDiario();
      })
      .catch(() => alert("No se pudo arrancar la página."));
  };

  // Helper para asignar emojis e iconos a las emociones
  const obtenerEmojiEmocion = (emocion) => {
    switch (emocion) {
      case 'Feliz': return '☀️';
      case 'Motivado': return '🔥';
      case 'Triste': return '🌧️';
      case 'Frustrado': return '⛈️';
      case 'Ansioso': return '🌪️';
      default: return '🍃';
    }
  };

  if (cargando) return <p className="text-amber-600 animate-pulse p-8 font-mono">Abriendo el candado del diario...</p>;

  return (
    <div className="space-y-6 pb-10 text-white min-h-[800px] flex flex-col justify-center items-center">
      
      {/* VISTA 1: LA PORTADA (DIARIO CERRADO) */}
      {verPortada ? (
        <div 
          onClick={() => setVerPortada(false)}
          className="w-[380px] h-[550px] bg-gradient-to-br from-amber-950 via-amber-900 to-stone-950 rounded-r-3xl rounded-l-md shadow-[15px_15px_30px_rgba(0,0,0,0.7),inset_5px_0_10px_rgba(255,255,255,0.1)] border-l-8 border-stone-900 cursor-pointer transform hover:scale-105 hover:-rotate-1 transition-all duration-500 flex flex-col justify-between p-8 border border-amber-800/30 group select-none"
        >
          {/* Detalles dorados de la portada */}
          <div className="border-4 border-double border-amber-600/40 rounded-xl h-full flex flex-col justify-between p-6 items-center">
            <div className="w-16 h-0.5 bg-amber-600/30 mt-4"></div>
            
            <div className="text-center space-y-3">
              <span className="text-4xl block opacity-80 group-hover:animate-bounce">📓</span>
              <h1 className="font-serif text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 uppercase">
                DIARIO
              </h1>
              <p className="text-[10px] uppercase font-mono tracking-[0.3em] text-amber-500/60">Bitácora del Alma</p>
            </div>

            <div className="text-center space-y-2">
              <p className="text-[10px] font-mono text-amber-600/40 uppercase tracking-widest">Diego</p>
              <span className="text-[11px] font-mono text-gray-500 bg-black/30 px-3 py-1 rounded-full border border-amber-900/40 animate-pulse">
                Click para abrir
              </span>
            </div>
          </div>
        </div>
      ) : (
        
        /* VISTA 2: EL CUADERNO ABIERTO (Estructura de dos páginas) */
        <div className="w-full max-w-6xl animate-fade-in flex flex-col space-y-4">
          
          {/* Botón superior para cerrar el diario */}
          <div className="flex justify-between items-center w-full px-4">
            <button 
              onClick={() => { setVerPortada(true); setPaginaActiva(null); }}
              className="bg-amber-900/40 hover:bg-amber-800/60 text-amber-400 font-mono text-xs px-4 py-2 rounded-lg border border-amber-800/30 transition-colors"
            >
              ⬅️ Cerrar y Guardar Cuaderno
            </button>
            <span className="text-xs text-gray-500 font-mono italic">Páginas totales escritas: {paginas.length}</span>
          </div>

          {/* EL LIBRO ABIERTO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#fdf6e3] text-stone-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] min-h-[600px] border-4 border-amber-950 overflow-hidden relative">
            
            {/* LÍNEA DIVISORIA CENTRAL (El lomo del libro) */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-4 bg-gradient-to-r from-stone-400/30 via-stone-500/50 to-stone-400/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)] -translate-x-1/2 z-10"></div>

            {/* ==========================================
                PÁGINA IZQUIERDA: ÍNDICE DE RECUERDOS 
               ========================================== */}
            <div className="p-8 border-b lg:border-b-0 lg:border-r border-stone-300 flex flex-col justify-between h-[600px] bg-[#faf3dd]">
              <div>
                <h3 className="font-serif text-xl font-bold border-b-2 border-stone-400 pb-2 text-stone-800 uppercase tracking-wide flex justify-between items-center">
                  <span>📜 Hojas Pasadas</span>
                  {paginaActiva && (
                    <button onClick={() => setPaginaActiva(null)} className="text-xs font-sans text-amber-800 hover:underline font-normal">
                      ✍️ Volver a Escribir
                    </button>
                  )}
                </h3>
                
                {/* Listado de páginas con scroll interno de cuaderno */}
                <div className="mt-4 space-y-2 overflow-y-auto max-h-[450px] pr-2 font-serif">
                  {paginas.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setPaginaActiva(p)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center group ${paginaActiva?.id === p.id ? 'bg-amber-200/60 border-amber-500' : 'bg-stone-100/50 border-stone-200 hover:bg-amber-100/40'}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-500 font-mono">
                          {new Date(p.fechaHora).toLocaleDateString()} - {new Date(p.fechaHora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className="text-sm font-bold text-stone-800 line-clamp-1 mt-0.5">
                          {p.contenido || "Página vacía."}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm bg-white/80 p-1 rounded border border-stone-200 shadow-sm" title={p.emocionPredominante}>
                          {obtenerEmojiEmocion(p.emocionPredominante)}
                        </span>
                        <button 
                          onClick={(e) => eliminarPagina(p.id, e)}
                          className="text-stone-400 hover:text-red-600 text-xs font-sans opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {paginas.length === 0 && (
                    <p className="text-stone-400 text-sm italic text-center pt-20">Este cuaderno aún no tiene historias. Empieza a escribir a la derecha.</p>
                  )}
                </div>
              </div>
              
              <div className="text-[10px] font-mono text-stone-400 text-center border-t border-stone-200 pt-2">
                LifeManager - Sección de Introspección
              </div>
            </div>

            {/* ==========================================
                PÁGINA DERECHA: PAPEL DE ESCRITURA / LECTURA
               ========================================== */}
            <div className="p-8 flex flex-col justify-between h-[600px] bg-[#fdf6e3] relative">
              
              {/* MODO LECTURA: Si hay una página vieja seleccionada */}
              {paginaActiva ? (
                <div className="flex flex-col h-full justify-between animate-fade-in font-serif">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-300 pb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-stone-500">FECHA DE REGISTRO</span>
                        <span className="text-sm font-bold text-stone-700">
                          {new Date(paginaActiva.fechaHora).toLocaleDateString()} a las {new Date(paginaActiva.fechaHora).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold text-amber-900 shadow-sm">
                        <span>{obtenerEmojiEmocion(paginaActiva.emocionPredominante)}</span>
                        <span>{paginaActiva.emocionPredominante.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    {/* El texto plasmado */}
                    <p className="text-stone-800 leading-relaxed text-base whitespace-pre-wrap italic pl-2 border-l border-stone-300">
                      "{paginaActiva.contenido}"
                    </p>
                  </div>

                  <button 
                    onClick={() => setPaginaActiva(null)}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-white font-sans font-bold py-2 rounded-xl text-xs transition-colors shadow"
                  >
                    ✍️ Volver a mi Pluma (Nueva Entrada)
                  </button>
                </div>
              ) : (
                
                /* MODO ESCRITURA: El formulario para redactar pensamientos */
                <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between font-serif">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-300 pb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-stone-500">HOJA ACTUAL</span>
                        <span className="text-sm font-bold text-stone-700">{new Date().toLocaleDateString()}</span>
                      </div>
                      
                      {/* Selector de Emociones */}
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] font-mono text-stone-500 uppercase font-bold">Estado:</label>
                        <select 
                          name="emocionPredominante" 
                          value={nuevaHoja.emocionPredominante}
                          onChange={(e) => setNuevaHoja({...nuevaHoja, emocionPredominante: e.target.value})}
                          className="bg-white border border-stone-300 text-xs rounded-md p-1 outline-none font-sans font-bold text-stone-700 focus:border-amber-600 shadow-sm"
                        >
                          <option value="Neutral">Neutral 🍃</option>
                          <option value="Feliz">Feliz ☀️</option>
                          <option value="Motivado">Motivado 🔥</option>
                          <option value="Triste">Triste 🌧️</option>
                          <option value="Frustrado">Frustrado ⛈️</option>
                          <option value="Ansioso">Ansioso 🌪️</option>
                        </select>
                      </div>
                    </div>

                    {/* El Textarea estilizado como hojas con renglones de cuaderno */}
                    <div>
                      <label className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Escribe sin filtros tu mente...</label>
                      <textarea 
                        value={nuevaHoja.contenido}
                        onChange={(e) => setNuevaHoja({...nuevaHoja, contenido: e.target.value})}
                        placeholder="Escribe aqui tus pensamientos"
                        rows="12"
                        required
                        className="w-full bg-transparent text-stone-800 leading-[2rem] text-base outline-none resize-none font-serif border-none focus:ring-0 placeholder-stone-400"
                        style={{ 
                          backgroundImage: 'linear-gradient(transparent 31px, rgba(214, 211, 209, 0.5) 31px)',
                          backgroundSize: '100% 2rem',
                          backgroundAttachment: 'local' 
                        }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-amber-800 hover:bg-amber-700 text-white font-sans font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-amber-950/20"
                  >
                    ✒️ Sellar Página del Día
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}