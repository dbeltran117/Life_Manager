import { useState, useEffect, useRef } from 'react';

export default function Mente() {
  const [escritos, setEscritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(null);

  // Nuevo estado para manejar el archivo físico seleccionado por el usuario
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  
  // Referencia para ocultar el feo input nativo de archivos de HTML
  const fileInputRef = useRef(null);

  // El estado del formulario se expande para incluir la nueva CategoriaTema
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Reflexión',
    categoriaTema: 'General',
    contenido: ''
  });

  const PUERTO = "5240";

  const cargarEscritos = () => {
    fetch(`http://localhost:${PUERTO}/api/mente`)
      .then(res => res.json())
      .then(data => { setEscritos(data); setCargando(false); })
      .catch(() => setCargando(false));
  };

  useEffect(() => { cargarEscritos(); }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Función para atrapar el archivo cuando el usuario lo selecciona
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoSeleccionado(e.target.files[0]);
    }
  };

  // La bestia: Enviar FormData real al backend en lugar de JSON
  // Función combinada corregida para respetar los tipos de datos del servidor
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const url = modoEdicion 
      ? `http://localhost:${PUERTO}/api/mente/${modoEdicion}` 
      : `http://localhost:${PUERTO}/api/mente`;
    
    const method = modoEdicion ? 'PUT' : 'POST';
    
    // Contenedor dinámico para la configuración de la petición
    let opcionesFetch;
    if (modoEdicion) {
      // 1. MODO EDICIÓN (PUT): El backend espera JSON estrictamente
      opcionesFetch = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modoEdicion, // Pasamos el ID para el mapeo correcto
          titulo: formData.titulo,
          tipo: formData.tipo,
          categoriaTema: formData.categoriaTema,
          contenido: formData.contenido
        })
      };
    } else {
      // 2. MODO CREACIÓN (POST): Usamos FormData por si hay un archivo físico
      const payload = new FormData();
      payload.append('titulo', formData.titulo);
      payload.append('tipo', formData.tipo);
      payload.append('categoriaTema', formData.categoriaTema);
      payload.append('contenido', formData.contenido);

      if (archivoSeleccionado) {
        payload.append('archivoFisico', archivoSeleccionado);
      }

      opcionesFetch = {
        method: method,
        body: payload // El navegador infiere el 'multipart/form-data' automáticamente
      };
    }

    // Disparamos la petición configurada correctamente
    fetch(url, opcionesFetch)
      .then(res => {
        if (!res.ok) throw new Error();
        cargarEscritos();
        cancelarEdicion(); // Limpiamos el formulario tras guardar
      })
      .catch(() => alert(`Error al ${modoEdicion ? 'actualizar' : 'guardar'} el escrito.`));
  };

  const handleEliminar = (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este escrito? (El archivo físico seguirá en el servidor por seguridad).")) return;
    fetch(`http://localhost:${PUERTO}/api/mente/${id}`, { method: 'DELETE' })
      .then(() => cargarEscritos())
      .catch(() => alert("Error al eliminar."));
  };

  const iniciarEdicion = (escrito) => {
    setModoEdicion(escrito.id);
    setArchivoSeleccionado(null); // Limpiamos selección de archivo por seguridad
    setFormData({
      titulo: escrito.titulo,
      tipo: escrito.tipo,
      categoriaTema: escrito.categoriaTema || 'General',
      contenido: escrito.contenido
    });
  };

  const cancelarEdicion = () => {
    setModoEdicion(null);
    setArchivoSeleccionado(null);
    if(fileInputRef.current) fileInputRef.current.value = ""; // Resetea el input oculto
    setFormData({ titulo: '', tipo: 'Reflexión', categoriaTema: 'General', contenido: '' });
  };

  if (cargando) return <p className="text-purple-500 animate-pulse p-8 font-mono">Cargando la bóveda intelectual...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white pb-10">
      
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 uppercase italic">Taller Mental</h2>
        <p className="text-gray-500 text-sm mt-1 font-mono">El archivo maestro de tu intelecto y tus sentimientos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ==========================================
            FORMULARIO DE CAPTURA 
           ========================================== */}
        <section className="lg:col-span-1 sticky top-6">
          <div className={`p-6 rounded-xl border shadow-2xl transition-colors ${modoEdicion ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-[#0a0a0c]/80 border-purple-900/40 backdrop-blur-md'}`}>
            
            <h3 className={`${modoEdicion ? 'text-indigo-400' : 'text-purple-400'} font-bold mb-6 uppercase flex justify-between tracking-widest text-sm border-b border-gray-800 pb-2`}>
              <span>{modoEdicion ? '✏️ Reestructurando...' : '✍️ Forjar Escrito'}</span>
              {modoEdicion && <button type="button" onClick={cancelarEdicion} className="text-xs text-gray-500 hover:text-red-400 underline decoration-dotted">Cancelar</button>}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-widest block mb-1">Título de la Obra</label>
                <input type="text" name="titulo" placeholder="Ej: Tratado sobre la Voluntad III" required value={formData.titulo} onChange={handleChange} 
                  className="w-full bg-gray-900/80 border border-gray-700 p-2.5 rounded-lg text-white outline-none focus:border-purple-500 transition-colors text-sm shadow-inner"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-mono tracking-widest block mb-1">Estructura</label>
                  <select name="tipo" required value={formData.tipo} onChange={handleChange} 
                    className="w-full bg-gray-900/80 border border-gray-700 p-2.5 rounded-lg text-gray-300 outline-none focus:border-purple-500 transition-colors text-xs font-bold">
                    <option value="Reflexión">Reflexión</option>
                    <option value="Libro">Libro</option>
                    <option value="Poesía">Poesía</option>
                    <option value="Idea">Idea Abstracta</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-mono tracking-widest block mb-1">Materia</label>
                  <select name="categoriaTema" required value={formData.categoriaTema} onChange={handleChange} 
                    className="w-full bg-gray-900/80 border border-gray-700 p-2.5 rounded-lg text-gray-300 outline-none focus:border-purple-500 transition-colors text-xs font-bold">
                    <option value="General">General</option>
                    <option value="Filosofía">Filosofía</option>
                    <option value="Disciplina">Disciplina</option>
                    <option value="Amor">Amor</option>
                  </select>
                </div>
              </div>

              {/* CARGA DE ARCHIVOS FÍSICOS (Solo visible si NO estamos editando) */}
              {!modoEdicion && (
                <div className="pt-2">
                  <label className="text-[10px] text-gray-400 uppercase font-mono tracking-widest block mb-2">Documento Físico (Opcional)</label>
                  
                  {/* El input real es feo, lo ocultamos y lo activamos con un botón bonito */}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                  
                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current.click()}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 px-3 py-2 rounded text-xs font-bold transition-colors shadow-sm"
                    >
                      📎 Adjuntar Archivo
                    </button>
                    
                    <span className="text-xs text-gray-500 font-mono italic truncate max-w-[150px]">
                      {archivoSeleccionado ? archivoSeleccionado.name : "Ningún documento..."}
                    </span>
                    
                    {archivoSeleccionado && (
                      <button type="button" onClick={() => {setArchivoSeleccionado(null); fileInputRef.current.value = "";}} className="text-red-400 hover:text-red-300 font-bold text-xs p-1">✕</button>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="text-[10px] text-gray-400 uppercase font-mono tracking-widest block mb-1">Contenido Manual</label>
                <textarea name="contenido" rows="12" placeholder="Desarrolla tus ideas" value={formData.contenido} onChange={handleChange} 
                  className="w-full bg-gray-900/80 border border-gray-700 p-3 rounded-lg text-gray-200 outline-none focus:border-purple-500 transition-colors resize-none font-serif text-sm shadow-inner leading-relaxed"/>
              </div>

              <button type="submit" className={`w-full py-3.5 rounded-lg font-black uppercase tracking-widest text-sm transition-all shadow-lg ${modoEdicion ? 'bg-indigo-700 hover:bg-indigo-600 shadow-indigo-900/50' : 'bg-purple-700 hover:bg-purple-600 shadow-purple-900/50'}`}>
                {modoEdicion ? 'Actualizar Registro' : 'Archivar en Memoria'}
              </button>
            </form>
          </div>
        </section>

        {/* ==========================================
            EL ARCHIVO / GALERÍA DE ESCRITOS
           ========================================== */}
        <section className="lg:col-span-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {escritos.map(e => (
              <div key={e.id} className="bg-[#0a0a0c]/60 border border-gray-800 hover:border-purple-500/50 rounded-xl p-5 relative group transition-all shadow-md flex flex-col justify-between min-h-[250px]">
                
                {/* Botones Flotantes (Edit / Delete) */}
                <div className="absolute top-4 right-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm p-1.5 rounded-lg border border-gray-700">
                  <button onClick={() => iniciarEdicion(e)} className="text-gray-400 hover:text-indigo-400 text-xs font-bold px-1" title="Editar">✏️</button>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <button onClick={() => handleEliminar(e.id)} className="text-gray-400 hover:text-red-500 text-xs font-bold px-1" title="Eliminar">🗑️</button>
                </div>

                {/* Etiquetas Superiores */}
                <div>
                  <div className="flex gap-2 mb-3">
                    <span className="text-[9px] text-purple-300 uppercase font-bold border border-purple-800/50 bg-purple-900/20 px-2 py-0.5 rounded shadow-sm">
                      {e.tipo}
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase font-mono font-bold border border-gray-700 bg-gray-800/50 px-2 py-0.5 rounded">
                      {e.categoriaTema}
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-100 mb-2 leading-tight">{e.titulo}</h4>
                  
                  {/* Visor del texto manual (Si es que hay) */}
                  {e.contenido && (
                    <p className="text-gray-400 text-sm font-serif line-clamp-4 italic border-l-2 border-purple-900/30 pl-3">
                      "{e.contenido}"
                    </p>
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  
                  {/* Botón de Descarga si existe un archivo físico */}
                  {e.rutaArchivoFisico && (
                    <a 
                      href={`http://localhost:${PUERTO}${e.rutaArchivoFisico}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-center text-xs text-gray-300 font-bold py-2 rounded transition-colors"
                    >
                      📄 Ver Documento Adjunto
                    </a>
                  )}

                  <div className="flex justify-between text-[9px] text-gray-600 font-mono pt-3 border-t border-gray-800">
                    <span>Modificado: {new Date(e.fechaModificacion).toLocaleDateString()}</span>
                    <span>ID: #{e.id}</span>
                  </div>
                </div>

              </div>
            ))}

            {escritos.length === 0 && (
              <div className="md:col-span-2 text-center py-20 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-500 font-mono italic">La biblioteca mental está vacía.</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}