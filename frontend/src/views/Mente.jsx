import { useState, useEffect } from 'react';

export default function Mente() {
  const [escritos, setEscritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(null); // Guardará el ID del texto a editar

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Reflexión',
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

  // Función combinada: Sirve para POST (nuevo) y PUT (editar)
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const url = modoEdicion 
      ? `http://localhost:${PUERTO}/api/mente/${modoEdicion}` 
      : `http://localhost:${PUERTO}/api/mente`;
    
    const method = modoEdicion ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        cargarEscritos();
        cancelarEdicion(); // Limpiamos el formulario tras guardar
      })
      .catch(() => alert(`Error al ${modoEdicion ? 'actualizar' : 'guardar'} el escrito.`));
  };

  const handleEliminar = (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este escrito? No hay vuelta atrás.")) return;
    fetch(`http://localhost:${PUERTO}/api/mente/${id}`, { method: 'DELETE' })
      .then(() => cargarEscritos())
      .catch(() => alert("Error al eliminar."));
  };

  const iniciarEdicion = (escrito) => {
    setModoEdicion(escrito.id);
    setFormData({
      titulo: escrito.titulo,
      tipo: escrito.tipo,
      contenido: escrito.contenido
    });
  };

  const cancelarEdicion = () => {
    setModoEdicion(null);
    setFormData({ titulo: '', tipo: 'Reflexión', contenido: '' });
  };

  if (cargando) return <p className="text-purple-500 animate-pulse p-8 font-mono">Cargando borradores neuronales...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 uppercase italic">Taller Mental</h2>
        <p className="text-gray-500 text-sm mt-1 font-mono">Borradores literarios, poesía y pensamientos estructurados.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORMULARIO DE ESCRITURA */}
        <section className="lg:col-span-1">
          <div className={`p-6 rounded-lg border shadow-xl transition-colors ${modoEdicion ? 'bg-indigo-900/30 border-indigo-500' : 'bg-gray-900 border-gray-700'}`}>
            <h3 className={`${modoEdicion ? 'text-indigo-400' : 'text-purple-400'} font-bold mb-4 uppercase flex justify-between`}>
              <span>{modoEdicion ? '✏️ Modo Edición' : '✍️ Nuevo Escrito'}</span>
              {modoEdicion && <button type="button" onClick={cancelarEdicion} className="text-xs text-gray-400 hover:text-white">Cancelar</button>}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Título</label>
                <input type="text" name="titulo" placeholder="Ej. Capítulo 4: La Voluntad" required value={formData.titulo} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-purple-500 transition-colors"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Categoría Literaria</label>
                <select name="tipo" required value={formData.tipo} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-purple-500 transition-colors">
                  <option value="Reflexión">Reflexión</option>
                  <option value="Libro">Borrador de Libro</option>
                  <option value="Poesía">Poesía</option>
                  <option value="Idea">Idea Suelta</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Contenido</label>
                <textarea name="contenido" rows="10" placeholder="Escribe aquí tus ideas..." required value={formData.contenido} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-purple-500 transition-colors resize-none font-serif text-sm"/>
              </div>

              <button type="submit" className={`w-full py-3 rounded font-bold uppercase tracking-wider transition-colors ${modoEdicion ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-purple-600 hover:bg-purple-500'}`}>
                {modoEdicion ? 'Actualizar Texto' : 'Guardar en el Archivo'}
              </button>
            </form>
          </div>
        </section>

        {/* ARCHIVO MENTAL (HISTORIAL) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl min-h-[600px] flex flex-col">
            <h3 className="text-fuchsia-400 font-bold mb-4 uppercase">🗂️ Archivo Mental</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2">
              {escritos.map(e => (
                <div key={e.id} className="p-5 bg-gradient-to-b from-gray-800 to-gray-900 border border-purple-900/30 rounded-xl relative group shadow-md hover:border-purple-500 transition-colors flex flex-col justify-between min-h-[200px]">
                  
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => iniciarEdicion(e)} className="text-gray-400 hover:text-indigo-400" title="Editar">✏️</button>
                    <button onClick={() => handleEliminar(e.id)} className="text-gray-400 hover:text-red-500" title="Eliminar">✖</button>
                  </div>

                  <div>
                    <span className="text-[10px] text-fuchsia-400 uppercase font-bold border border-fuchsia-900/50 bg-fuchsia-900/20 px-2 py-0.5 rounded">
                      {e.tipo}
                    </span>
                    <h4 className="text-xl font-bold text-gray-200 mt-2 mb-3 leading-tight">{e.titulo}</h4>
                    <p className="text-gray-400 text-sm font-serif line-clamp-4 italic">
                      {e.contenido}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-700 flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>Modificado: {new Date(e.fechaModificacion).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}