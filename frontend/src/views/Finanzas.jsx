import { useState, useEffect } from 'react';

export default function Finanzas() {
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Formularios
  const [formIngreso, setFormIngreso] = useState({ monto: '', origen: 0 });
  const [formGasto, setFormGasto] = useState({ monto: '', descripcion: '', categoria: 0, metodo: 0, tarjetaId: '' });
  const [formTarjeta, setFormTarjeta] = useState({ nombre: '', limite: '', deudaActual: 0 });
  const [formAbono, setFormAbono] = useState({ tarjetaId: '', monto: '' }); // NUEVO: Para pagar

  const PUERTO = "5240";
  const origenesIngreso = ['Trabajo', 'Mesada'];
  const categoriasGasto = ['Necesario', 'Innecesario', 'Fijo'];
  const metodosPago = ['💵 Efectivo', '💳 Tarjeta'];

  const cargarTodo = () => {
    Promise.all([
      fetch(`http://localhost:${PUERTO}/api/ingresos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/gastos`).then(res => res.json()),
      fetch(`http://localhost:${PUERTO}/api/tarjetas`).then(res => res.json())
    ]).then(([dIngresos, dGastos, dTarjetas]) => {
      setIngresos(dIngresos.reverse());
      setGastos(dGastos.reverse());
      setTarjetas(dTarjetas);
      
      // Auto-seleccionar la primera tarjeta si hay disponibles
      if (dTarjetas.length > 0) {
        setFormGasto(prev => ({ ...prev, tarjetaId: dTarjetas[0].id }));
        setFormAbono(prev => ({ ...prev, tarjetaId: dTarjetas[0].id }));
      }
      setCargando(false);
    }).catch(() => setCargando(false));
  };

  useEffect(() => { cargarTodo(); }, []);

  const handleIngreso = (e) => {
    e.preventDefault();
    fetch(`http://localhost:${PUERTO}/api/ingresos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: parseFloat(formIngreso.monto), origen: parseInt(formIngreso.origen) })
    })
    .then(res => { if (!res.ok) throw new Error(); cargarTodo(); setFormIngreso({ monto: '', origen: 0 }); })
    .catch(() => alert("Error al guardar ingreso."));
  };

  const handleGasto = (e) => {
    e.preventDefault();
    // Validar que si eligió tarjeta, tenga una tarjeta seleccionada
    if (parseInt(formGasto.metodo) === 1 && !formGasto.tarjetaId) {
      alert("Debes seleccionar una tarjeta de crédito.");
      return;
    }

    fetch(`http://localhost:${PUERTO}/api/gastos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        descripcion: formGasto.descripcion,
        monto: parseFloat(formGasto.monto), 
        categoria: parseInt(formGasto.categoria),
        metodo: parseInt(formGasto.metodo),
        tarjetaId: parseInt(formGasto.metodo) === 1 ? parseInt(formGasto.tarjetaId) : null
      })
    })
    .then(res => { if (!res.ok) throw new Error(); cargarTodo(); setFormGasto({ monto: '', descripcion: '', categoria: 0, metodo: 0, tarjetaId: tarjetas.length > 0 ? tarjetas[0].id : '' }); })
    .catch(() => alert("Error al registrar gasto."));
  };

  const handleTarjeta = (e) => {
    e.preventDefault();
    fetch(`http://localhost:${PUERTO}/api/tarjetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: formTarjeta.nombre, limite: parseFloat(formTarjeta.limite), deudaActual: parseFloat(formTarjeta.deudaActual) })
    })
    .then(res => { if (!res.ok) throw new Error(); cargarTodo(); setFormTarjeta({ nombre: '', limite: '', deudaActual: 0 }); })
    .catch(() => alert("Error al añadir tarjeta."));
  };

  // NUEVO: Procesar el pago de la tarjeta
  const handleAbono = (e) => {
    e.preventDefault();
    if (!formAbono.tarjetaId) return;

    fetch(`http://localhost:${PUERTO}/api/tarjetas/${formAbono.tarjetaId}/pagar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto: parseFloat(formAbono.monto) })
    })
    .then(res => { if (!res.ok) throw new Error(); cargarTodo(); setFormAbono({ ...formAbono, monto: '' }); })
    .catch(() => alert("Error al registrar el abono."));
  };

  if (cargando) return <p className="text-purple-500 animate-pulse p-8">Sincronizando bóveda...</p>;

  return (
    <div className="space-y-8 animate-fade-in text-white">
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-purple-400">Gestión de Finanzas</h2>
        <p className="text-gray-400">Administra tus recursos, deudas y abonos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA 1: INGRESOS */}
        <section className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-green-400 font-bold mb-4 uppercase">➕ Registrar Ingreso</h3>
            <form onSubmit={handleIngreso} className="space-y-4">
              <input type="number" step="0.01" placeholder="Monto $" required value={formIngreso.monto} onChange={e => setFormIngreso({...formIngreso, monto: e.target.value})} className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-green-500"/>
              <select value={formIngreso.origen} onChange={e => setFormIngreso({...formIngreso, origen: e.target.value})} className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none">
                <option value={0}>Trabajo</option>
                <option value={1}>Mesada</option>
              </select>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold">Guardar</button>
            </form>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 h-[300px] overflow-y-auto">
             <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Historial</h4>
             {ingresos.map(i => (
               <div key={i.id} className="border-b border-gray-800 py-2 text-sm flex justify-between">
                 <span className="text-gray-300">{new Date(i.fecha).toLocaleDateString()}</span>
                 <span className="text-green-400 font-mono">+${i.monto.toFixed(2)}</span>
                 <span className="text-[10px] text-gray-500 uppercase">{origenesIngreso[i.origen]}</span>
               </div>
               
             ))}
          </div>
        </section>

        {/* COLUMNA 2: GASTOS */}
        <section className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-red-400 font-bold mb-4 uppercase">➖ Registrar Gasto</h3>
            <form onSubmit={handleGasto} className="space-y-4">
              {/* 1. PRIMERO EL MONTO (Para que dejes de confundirte) */}
              <input type="number" step="0.01" placeholder="Monto $" required value={formGasto.monto} 
                onChange={e => setFormGasto({...formGasto, monto: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500"/>
              
              {/* 2. DESPUÉS LA DESCRIPCIÓN */}
              <input type="text" placeholder="¿En qué se fue?" required value={formGasto.descripcion} 
                onChange={e => setFormGasto({...formGasto, descripcion: e.target.value})} 
                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500"/>
              
              <div className="flex gap-2">
                <select value={formGasto.categoria} onChange={e => setFormGasto({...formGasto, categoria: e.target.value})} className="w-1/2 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500">
                  <option value={0}>Necesario</option>
                  <option value={1}>Innecesario</option>
                  <option value={2}>Fijo</option>
                </select>
                <select value={formGasto.metodo} onChange={e => setFormGasto({...formGasto, metodo: e.target.value})} className="w-1/2 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none focus:border-red-500">
                  <option value={0}>💵 Efectivo</option>
                  <option value={1}>💳 Tarjeta</option>
                </select>
              </div>

              {parseInt(formGasto.metodo) === 1 && (
                <select value={formGasto.tarjetaId} onChange={e => setFormGasto({...formGasto, tarjetaId: e.target.value})} className="w-full bg-blue-900/30 border border-blue-600 p-2 rounded text-blue-300 outline-none">
                  {tarjetas.length === 0 ? <option value="">No hay tarjetas</option> : tarjetas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}

              <button type="submit" className="w-full bg-red-600 hover:bg-red-500 py-2 rounded font-bold">Gastar</button>
            </form>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 h-[300px] overflow-y-auto">
             <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Historial</h4>
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

        {/* COLUMNA 3: TARJETAS Y ABONOS */}
        <section className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 shadow-xl">
            <h3 className="text-blue-400 font-bold mb-4 uppercase">💳 Tus Tarjetas</h3>
            
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {tarjetas.map(t => (
                <div key={t.id} className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-900/50 rounded-xl relative overflow-hidden shadow-inner">
                  <p className="text-blue-400 font-bold text-lg">{t.nombre}</p>
                  <p className="text-xs text-gray-500 uppercase mt-1">Deuda Actual</p>
                  <p className="text-2xl font-mono text-white font-bold">${t.deudaActual.toFixed(2)}</p>
                  <div className="mt-4 flex justify-between text-[10px] text-gray-400">
                    <span>Límite: ${t.limite.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* FORMULARIO DE ABONO (PAGAR TARJETA) */}
            {tarjetas.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h4 className="text-teal-400 font-bold mb-3 text-sm uppercase">✅ Abonar a Tarjeta</h4>
                <form onSubmit={handleAbono} className="flex flex-col gap-2">
                  <select value={formAbono.tarjetaId} onChange={e => setFormAbono({...formAbono, tarjetaId: e.target.value})} className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none">
                    {tarjetas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" step="0.01" placeholder="Monto a pagar $" required value={formAbono.monto} onChange={e => setFormAbono({...formAbono, monto: e.target.value})} className="w-2/3 bg-gray-800 border border-gray-600 p-2 rounded text-white outline-none"/>
                    <button type="submit" className="w-1/3 bg-teal-600 hover:bg-teal-500 rounded font-bold transition-colors">Abonar</button>
                  </div>
                </form>
              </div>
            )}

            {/* FORMULARIO AGREGAR NUEVA TARJETA */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-blue-400 font-bold mb-3 text-sm uppercase">➕ Nueva Tarjeta</h4>
              <form onSubmit={handleTarjeta} className="flex gap-2">
                <input type="text" placeholder="Nombre" required value={formTarjeta.nombre} onChange={e => setFormTarjeta({...formTarjeta, nombre: e.target.value})} className="w-1/2 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm outline-none"/>
                <input type="number" placeholder="Límite $" required value={formTarjeta.limite} onChange={e => setFormTarjeta({...formTarjeta, limite: e.target.value})} className="w-1/3 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm outline-none"/>
                <button type="submit" className="w-1/6 bg-blue-600 hover:bg-blue-500 rounded font-bold text-sm">+</button>
              </form>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}