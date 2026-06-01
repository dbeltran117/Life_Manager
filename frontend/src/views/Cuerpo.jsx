import { useState, useEffect } from 'react';

export default function Cuerpo() {
  const [entrenamientos, setEntrenamientos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [formData, setFormData] = useState({
    grupoMuscular: '',
    rutina: '',
    tomoCreatina: false,
    pesoCorporal: ''
  });

  const PUERTO = "5240";

  const cargarEntrenamientos = () => {
    fetch(`http://localhost:${PUERTO}/api/cuerpo`)
      .then(res => res.json())
      .then(data => {
        setEntrenamientos(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al cargar:", err);
        setCargando(false);
      });
  };

  useEffect(() => { cargarEntrenamientos(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Parseo seguro del peso por si lo dejó vacío
    const payload = {
      ...formData,
      pesoCorporal: formData.pesoCorporal ? parseFloat(formData.pesoCorporal) : null
    };

    fetch(`http://localhost:${PUERTO}/api/cuerpo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        cargarEntrenamientos();
        setFormData({ grupoMuscular: '', rutina: '', tomoCreatina: false, pesoCorporal: '' });
      })
      .catch(() => alert("Error al registrar el entrenamiento."));
  };

  const handleEliminar = (id) => {
    if (!window.confirm("¿Seguro que quieres borrar este registro físico?")) return;
    fetch(`http://localhost:${PUERTO}/api/cuerpo/${id}`, { method: 'DELETE' })
      .then(() => cargarEntrenamientos())
      .catch(() => alert("Error al eliminar."));
  };

  if (cargando) return <p className="text-green-500 animate-pulse p-8 font-mono">Sincronizando métricas corporales...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500 uppercase italic">Registro Físico</h2>
        <p className="text-gray-500 text-sm mt-1 font-mono">Forja tu cuerpo, controla tu progreso.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORMULARIO */}
        <section className="lg:col-span-1">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-green-400 font-bold mb-4 uppercase">🏋️‍♂️ Nuevo Entrenamiento</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Grupo Muscular</label>
                <input type="text" name="grupoMuscular" placeholder="Ej. Pecho y Tríceps" required value={formData.grupoMuscular} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-green-500 transition-colors"/>
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="text-xs text-gray-400 uppercase font-bold">Peso (kg)</label>
                  <input type="number" step="0.1" name="pesoCorporal" placeholder="Opcional" value={formData.pesoCorporal} onChange={handleChange} 
                    className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-green-500 transition-colors"/>
                </div>
                <div className="w-1/2 flex items-center justify-center bg-gray-800 border border-gray-600 rounded mt-5 cursor-pointer hover:border-green-500 transition-colors">
                  <label className="flex items-center gap-2 cursor-pointer w-full h-full p-2 justify-center">
                    <input type="checkbox" name="tomoCreatina" checked={formData.tomoCreatina} onChange={handleChange} className="w-4 h-4 accent-green-500 cursor-pointer" />
                    <span className="text-xs font-bold uppercase text-gray-300">Creatina</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Rutina y Notas</label>
                <textarea name="rutina" rows="5" placeholder="Ej. Press banca: 4x10 con 60kg..." required value={formData.rutina} onChange={handleChange} 
                  className="w-full mt-1 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-green-500 transition-colors resize-none"/>
              </div>

              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold uppercase tracking-wider transition-colors">
                Guardar Progreso
              </button>
            </form>
          </div>
        </section>

        {/* HISTORIAL */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl min-h-[500px]">
            <h3 className="text-teal-400 font-bold mb-4 uppercase">📈 Historial de Entrenamientos</h3>
            <div className="space-y-4 overflow-y-auto pr-2 max-h-[600px]">
              {entrenamientos.map(e => (
                <div key={e.id} className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-green-900/40 rounded-xl relative overflow-hidden group shadow-md hover:border-green-600 transition-colors">
                  <button onClick={() => handleEliminar(e.id)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                  
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-green-300 font-black text-lg uppercase">{e.grupoMuscular}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{new Date(e.fecha).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-4 mb-3 text-xs font-mono text-gray-400">
                    <span className={`px-2 py-1 rounded border ${e.tomoCreatina ? 'border-green-500 text-green-400' : 'border-gray-600'}`}>
                      {e.tomoCreatina ? '✓ Creatina Ingerida' : '✖ Sin Creatina'}
                    </span>
                    {e.pesoCorporal && <span className="px-2 py-1 rounded border border-gray-600">⚖️ {e.pesoCorporal} kg</span>}
                  </div>

                  <p className="text-gray-300 text-sm whitespace-pre-wrap border-l-2 border-teal-500 pl-3">{e.rutina}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}