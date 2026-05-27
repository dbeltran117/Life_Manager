import { useState, useEffect } from 'react';

export default function Finanzas() {
  // Estados para los datos de la API
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados para los formularios
  const [formIngreso, setFormIngreso] = useState({ monto: '', origen: 0 });
  const [formGasto, setFormGasto] = useState({ monto: '', descripcion: '', categoria: 0, metodo: 0 });
  const [formTarjeta, setFormTarjeta] = useState({ nombre: '', limite: '', deudaActual: 0 });

  const PUERTO = "5240";

  // Traductores de Enums de C# (Índices numéricos a Texto)
  const origenesIngreso = ['Trabajo', 'Mesada'];
  const categoriasGasto = ['Necesario', 'Innecesario', 'Fijo'];
  const metodosPago = ['💵 Efectivo', '💳 Tarjeta'];

  const cargarTodo = () => {
    Promise.all([
      fetch(`http://localhost:${PUERTO}/api/ingresos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/gastos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/tarjetas`).then(res => res.json())
    ])
    .then(([dIngresos, dGastos, dTarjetas]) => {
      setIngresos(dIngresos.reverse());
      setGastos(dGastos.reverse());
      setTarjetas(dTarjetas);
      setCargando(false);
    })
    .catch(error => {
      console.error("Error en la carga de datos locales:", error);
      setCargando(false);
    });
  };

  useEffect(() => { 
    cargarTodo(); 
  }, []);

  // Handlers de envío con validación robusta de errores
  const handleIngreso = (e) => {
    e.preventDefault();
    fetch(`http://localhost:${PUERTO}/api/ingresos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        monto: parseFloat(formIngreso.monto), 
        origen: parseInt(formIngreso.origen) 
      })
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      cargarTodo(); 
      setFormIngreso({ monto: '', origen: 0 }); 
    })
    .catch(() => alert("Error al guardar ingreso. Revisa tu backend."));
  };

  const handleGasto = (e) => {
    e.preventDefault();
    fetch(`http://localhost:${PUERTO}/api/gastos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        descripcion: formGasto.descripcion,
        monto: parseFloat(formGasto.monto), 
        categoria: parseInt(formGasto.categoria),
        metodo: parseInt(formGasto.metodo) 
      })
    })
    .then(res => {
      if (!res.ok) throw new Error(`Código de rechazo del servidor: ${res.status}`);
      cargarTodo(); 
      setFormGasto({ monto: '', descripcion: '', categoria: 0, metodo: 0 }); 
    })
    .catch(() => {
      alert(`No se pudo registrar el gasto.\nRazones posibles:\n1. Olvidaste correr las migraciones en C#.\n2. El backend está apagado.\n\nDetalle: Revisa la consola para más info.`);
    });
  };

  const handleTarjeta = (e) => {
    e.preventDefault();
    fetch(`http://localhost:${PUERTO}/api/tarjetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nombre: formTarjeta.nombre, 
        limite: parseFloat(formTarjeta.limite), 
        deudaActual: parseFloat(formTarjeta.deudaActual) 
      })
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      cargarTodo(); 
      setFormTarjeta({ nombre: '', limite: '', deudaActual: 0 }); 
    })
    .catch(() => alert("Error al añadir tarjeta."));
  };

  if (cargando) return <p className="text-purple-500 animate-pulse p-8 font-semibold">Sincronizando bóveda...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-purple-400">Gestión de Finanzas</h2>
        <p className="text-gray-400">Administra tus recursos y deudas con precisión quirúrgica.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: INGRESOS */}
        <section className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-green-400 font-bold mb-4 uppercase tracking-tighter">➕ Registrar Ingreso</h3>
            <form onSubmit={handleIngreso} className="space-y-4">
              <input type="number" step="0.01" placeholder="Monto $" required value={formIngreso.monto}
                onChange={e => setFormIngreso({...formIngreso, monto: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-green-500"/>
              <select value={formIngreso.origen} onChange={e => setFormIngreso({...formIngreso, origen: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-green-500">
                <option value={0}>Trabajo</option>
                <option value={1}>Mesada</option>
              </select>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold transition-colors">Guardar</button>
            </form>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 h-[300px] overflow-y-auto">
             <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Historial de Ingresos</h4>
             {ingresos.map(i => (
               <div key={i.id} className="border-b border-gray-800 py-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-300">{new Date(i.fecha).toLocaleDateString()}</span>
                   <span className="text-green-400 font-mono font-bold">+${i.monto.toFixed(2)}</span>
                 </div>
                 <span className="text-[10px] text-gray-500 uppercase">{origenesIngreso[i.origen]}</span>
               </div>
             ))}
          </div>
        </section>

        {/* COLUMNA 2: GASTOS */}
        <section className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-red-400 font-bold mb-4 uppercase tracking-tighter">➖ Registrar Gasto</h3>
            <form onSubmit={handleGasto} className="space-y-4">
              <input type="text" placeholder="¿En qué se fue?" required value={formGasto.descripcion}
                onChange={e => setFormGasto({...formGasto, descripcion: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500"/>
              
              <input type="number" step="0.01" placeholder="Monto $" required value={formGasto.monto}
                onChange={e => setFormGasto({...formGasto, monto: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500"/>
              
              <select value={formGasto.categoria} onChange={e => setFormGasto({...formGasto, categoria: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500">
                <option value={0}>Gasto Necesario</option>
                <option value={1}>Gasto Innecesario</option>
                <option value={2}>Gasto Fijo</option>
              </select>

              <select value={formGasto.metodo} onChange={e => setFormGasto({...formGasto, metodo: e.target.value})}
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500">
                <option value={0}>💵 Efectivo / Débito</option>
                <option value={1}>💳 Tarjeta de Crédito</option>
              </select>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 py-2 rounded font-bold transition-colors">
                Gastar
              </button>
            </form>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 h-[300px] overflow-y-auto">
             <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Historial de Gastos</h4>
             {gastos.map(g => (
               <div key={g.id} className="border-b border-gray-800 py-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-200 font-semibold">{g.descripcion}</span>
                   <span className="text-red-400 font-mono font-bold">-${g.monto.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-[10px] text-gray-500 uppercase mt-0.5">
                   <span>{categoriasGasto[g.categoria]}</span>
                   <span>{metodosPago[g.metodo]}</span>
                 </div>
               </div>
             ))}
          </div>
        </section>

        {/* COLUMNA 3: TARJETAS */}
        <section className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-blue-400 font-bold mb-4 uppercase tracking-tighter">💳 Tarjetas de Crédito</h3>
            {tarjetas.length === 0 ? (
              <form onSubmit={handleTarjeta} className="space-y-4">
                <input type="text" placeholder="Nombre (Ej. Nu, BBVA...)" required value={formTarjeta.nombre}
                  onChange={e => setFormTarjeta({...formTarjeta, nombre: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-blue-500"/>
                <input type="number" placeholder="Límite Total $" required value={formTarjeta.limite}
                  onChange={e => setFormTarjeta({...formTarjeta, limite: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-blue-500"/>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition-colors">Añadir Tarjeta</button>
              </form>
            ) : (
              <div className="space-y-4">
                {tarjetas.map(t => (
                  <div key={t.id} className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-900/50 rounded-xl relative overflow-hidden shadow-inner">
                    <p className="text-blue-400 font-bold text-lg">{t.nombre}</p>
                    <p className="text-xs text-gray-500 uppercase mt-1">Deuda Actual</p>
                    <p className="text-2xl font-mono text-white font-bold">${t.deudaActual.toFixed(2)}</p>
                    <div className="mt-4 flex justify-between text-[10px] text-gray-400">
                      <span>Disponible: ${(t.limite - t.deudaActual).toFixed(2)}</span>
                      <span>Límite: ${t.limite.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-gray-500 italic text-center mt-2">
                  Los gastos con tarjeta aumentarán la deuda automáticamente.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}