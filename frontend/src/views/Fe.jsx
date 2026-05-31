import { useState, useEffect } from 'react';

export default function Fe() {
  const [versiculos, setVersiculos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estado del formulario
  const [formData, setFormData] = useState({
    referencia: '',
    categoria: '',
    texto: '',
    devocional: ''
  });

  const PUERTO = "5240"; // Ajusta esto si tu backend usa otro puerto

  // Cargar los datos desde el backend
  const cargarVersiculos = () => {
    fetch(`http://localhost:${PUERTO}/api/fe`)
      .then(res => {
        if (!res.ok) throw new Error('Error en la red');
        return res.json();
      })
      .then(data => {
        setVersiculos(data);
        setCargando(false);
      })
      .catch(error => {
        console.error("Error al cargar los versículos:", error);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarVersiculos();
  }, []);

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Enviar nuevo devocional
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`http://localhost:${PUERTO}/api/fe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        cargarVersiculos(); // Recargar la tabla
        setFormData({ referencia: '', categoria: '', texto: '', devocional: '' }); // Limpiar formulario
      })
      .catch(() => alert("Error al guardar el devocional. Verifica tu backend."));
  };

  // Eliminar devocional
  const handleEliminar = (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este registro?")) return;

    fetch(`http://localhost:${PUERTO}/api/fe/${id}`, {
      method: 'DELETE'
    })
      .then(res => {
        if (!res.ok) throw new Error();
        cargarVersiculos();
      })
      .catch(() => alert("Error al eliminar."));
  };

  if (cargando) return <p className="text-purple-500 animate-pulse p-8">Conectando con el registro de fe...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* HEADER DE LA VISTA */}
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase italic">Registro de Fe</h2>
        <p className="text-gray-500 text-sm mt-1 font-mono">Guarda tus versículos y reflexiones personales.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: FORMULARIO */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-blue-400 font-bold mb-4 uppercase">🕊️ Nuevo Devocional</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Referencia</label>
                <input type="text" name="referencia" placeholder="Ej. Juan 3:16" required value={formData.referencia} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-blue-500 transition-colors"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Categoría</label>
                <input type="text" name="categoria" placeholder="Ej. Promesa, Aliento" required value={formData.categoria} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-blue-500 transition-colors"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Versículo</label>
                <textarea name="texto" rows="3" placeholder="Texto bíblico..." required value={formData.texto} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-blue-500 transition-colors resize-none"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Reflexión</label>
                <textarea name="devocional" rows="4" placeholder="Lo que aprendiste hoy..." required value={formData.devocional} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-blue-500 transition-colors resize-none"/>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold uppercase tracking-wider transition-colors">
                Guardar Registro
              </button>
            </form>
          </div>
        </section>

        {/* COLUMNA 2 y 3: HISTORIAL (GRID DE TARJETAS) */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl min-h-[600px] flex flex-col">
            <h3 className="text-purple-400 font-bold mb-4 uppercase">📖 Tu Historial</h3>
            
            {versiculos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-mono italic">
                Aún no hay registros. ¿Acaso no has leído nada, baka?
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-2 max-h-[700px]">
                {versiculos.map(v => (
                  <div key={v.id} className="p-5 bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-900/40 rounded-xl relative overflow-hidden shadow-md group transition-all hover:border-purple-600">
                    
                    {/* Botón Eliminar (aparece al hacer hover) */}
                    <button onClick={() => handleEliminar(v.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Eliminar">
                      ✖
                    </button>

                    {/* Cabecera de la tarjeta */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-purple-300 font-black text-lg">{v.referencia}</span>
                      <span className="text-[10px] text-gray-400 uppercase bg-gray-800 px-2 py-1 rounded border border-gray-600">
                        {v.categoria}
                      </span>
                    </div>

                    {/* Contenido */}
                    <div className="mb-4">
                      <p className="text-gray-300 italic text-sm leading-relaxed border-l-2 border-purple-500 pl-3">
                        "{v.texto}"
                      </p>
                    </div>

                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-1">Reflexión:</p>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{v.devocional}</p>
                    </div>

                    {/* Pie de la tarjeta */}
                    <div className="mt-4 text-right">
                      <span className="text-[10px] text-gray-500 font-mono">
                        Registrado: {new Date(v.fechaCreacion).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}