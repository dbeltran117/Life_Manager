import { useState, useEffect } from 'react';

function App() {
  // Estados para la lista de datos
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el nuevo formulario
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState(0); // 0 = Ingreso, 1 = Gasto
  const [categoria, setCategoria] = useState(3); // 3 = GastoNecesario por defecto

  // Función para traer los datos (GET)
  const cargarDatos = () => {
    // ¡CAMBIA EL PUERTO AQUÍ!
    fetch('http://localhost:5240/api/transacciones')
      .then(response => response.json())
      .then(data => {
        setTransacciones(data);
        setCargando(false);
      })
      .catch(error => console.error("Error al conectar:", error));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para enviar un nuevo dato (POST)
  const agregarTransaccion = (e) => {
    e.preventDefault(); // Evita que la página se recargue al dar clic en guardar

    const nuevaTransaccion = {
      descripcion: descripcion,
      monto: parseFloat(monto),
      tipo: parseInt(tipo),
      categoria: parseInt(categoria),
      fecha: new Date().toISOString()
    };

    // ¡CAMBIA EL PUERTO AQUÍ TAMBIÉN!
    fetch('http://localhost:5240/api/transacciones', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuevaTransaccion)
    })
    .then(response => {
      if (response.ok) {
        cargarDatos(); // Recargar la lista automáticamente
        setDescripcion(''); // Limpiar el formulario
        setMonto('');
      }
    });
  };

  return (
    <div className="min-h-screen p-8 font-sans bg-[#121212] text-white">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-purple-500 tracking-widest uppercase">
          Life Manager
        </h1>
        <p className="text-gray-400 mt-2 italic">Control total de la voluntad</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <main className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-purple-400">
            Nuevo Registro
          </h2>
          <form onSubmit={agregarTransaccion} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Descripción</label>
              <input 
                type="text" 
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="Ej. Limosnas o chucherías..." 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monto ($)</label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="0.00" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                <select 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={0}>Ingreso</option>
                  <option value={1}>Gasto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Categoría</label>
                <select 
                  value={categoria} 
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={0}>Trabajo</option>
                  <option value={1}>Mesada</option>
                  <option value={2}>Limosna</option>
                  <option value={3}>Gasto Necesario</option>
                  <option value={4}>Gasto Inecesario</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition-colors mt-4"
            >
              Registrar
            </button>
          </form>
        </main>

        {/* PANEL DERECHO: HISTORIAL */}
        <main className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-purple-400">
            Historial
          </h2>
          
          {cargando ? (
            <p className="text-purple-400 italic animate-pulse">Conectando...</p>
          ) : transacciones.length === 0 ? (
            <p className="text-gray-500 italic text-sm">No hay registros aún.</p>
          ) : (
            <ul className="space-y-3 mt-4 overflow-y-auto max-h-[400px] pr-2">
              {transacciones.slice().reverse().map((t) => (
                <li key={t.id} className="flex justify-between p-3 bg-gray-800 rounded border border-gray-600 hover:border-purple-500 transition-colors">
                  <div>
                    <span className="font-bold text-gray-200 block">{t.descripcion}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(t.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`font-bold self-center ${t.tipo === 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.tipo === 0 ? '+' : '-'}${t.monto}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>

      </div>
    </div>
  )
}

export default App;