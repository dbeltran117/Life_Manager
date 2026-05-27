import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({ ingresos: 0, gastos: 0, balance: 0 });
  const [tarjeta, setTarjeta] = useState({ limite: 0, deuda: 0, disponible: 0, existe: false });
  const [hobbies, setHobbies] = useState([]); // Nuevo estado para tus rachas
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Disparamos 4 peticiones al mismo tiempo
    Promise.all([
      fetch('http://localhost:5240/api/ingresos').then(res => res.json()),
      fetch('http://localhost:5240/api/gastos').then(res => res.json()),
      fetch('http://localhost:5240/api/tarjetas').then(res => res.json()),
      fetch('http://localhost:5240/api/hobbies').then(res => res.json()) // Traemos las rachas
    ])
    .then(([dataIngresos, dataGastos, dataTarjetas, dataHobbies]) => {
      const totalIngresos = dataIngresos.reduce((suma, item) => suma + item.monto, 0);
      const totalGastos = dataGastos.reduce((suma, item) => suma + item.monto, 0);
      
      setMetricas({
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance: totalIngresos - totalGastos
      });

      if (dataTarjetas.length > 0) {
        const miTarjeta = dataTarjetas[0];
        setTarjeta({
          limite: miTarjeta.limite,
          deuda: miTarjeta.deudaActual,
          disponible: miTarjeta.disponible,
          existe: true
        });
      }

      // Guardamos las rachas en el estado
      setHobbies(dataHobbies);
      setCargando(false);
    })
    .catch(error => {
      console.error("Error al cargar métricas:", error);
      setCargando(false);
    });
  }, []);

  return (
    <div className="text-white animate-fade-in">
      <header className="mb-8 border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-purple-400 tracking-wide">Panel de Control</h2>
        <p className="text-gray-400 mt-1">Resumen general de tu voluntad y recursos.</p>
      </header>

      {cargando ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-purple-500 animate-pulse font-semibold">Calculando estado...</p>
        </div>
      ) : (
        <>
          {/* Fila 1: Dinero Real */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
              <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Ingresos Totales</h3>
              <p className="text-3xl font-bold text-green-400">${metricas.ingresos.toFixed(2)}</p>
            </div>

            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Gastos Totales</h3>
              <p className="text-3xl font-bold text-red-400">${metricas.gastos.toFixed(2)}</p>
            </div>

            <div className={`bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg relative overflow-hidden ${metricas.balance < 0 ? 'ring-1 ring-red-500/50' : ''}`}>
              <div className={`absolute top-0 left-0 w-1 h-full ${metricas.balance >= 0 ? 'bg-purple-500' : 'bg-red-600'}`}></div>
              <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Balance Actual</h3>
              <p className={`text-3xl font-bold ${metricas.balance >= 0 ? 'text-white' : 'text-red-500'}`}>${metricas.balance.toFixed(2)}</p>
            </div>
          </div>

          {/* Fila 2: Crédito */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Deuda de Tarjeta</h3>
              {tarjeta.existe ? (
                <div>
                  <p className="text-3xl font-bold text-blue-400 mb-2">${tarjeta.deuda.toFixed(2)}</p>
                  <div className="w-full bg-gray-800 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(tarjeta.deuda / tarjeta.limite) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">Límite: ${tarjeta.limite}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic text-sm">No hay tarjetas registradas.</p>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
              <h3 className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">Crédito Disponible</h3>
              {tarjeta.existe ? (
                <p className="text-3xl font-bold text-teal-400">${tarjeta.disponible.toFixed(2)}</p>
              ) : (
                <p className="text-gray-500 italic text-sm">No hay tarjetas registradas.</p>
              )}
            </div>
          </div>

          {/* Fila 3: Rachas y Disciplina */}
          <section className="bg-gray-900 border border-gray-700 rounded-lg p-6 min-h-[200px] mb-10">
            <h3 className="text-xl font-bold text-purple-400 mb-4 uppercase tracking-wider border-b border-gray-700 pb-2">Rachas Activas y Disciplina</h3>
            {hobbies.length === 0 ? (
              <p className="text-gray-500 italic text-sm mt-4">Aún no hay datos de disciplina. ¡Registra tus proyectos en el módulo de Hobbies!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {hobbies.map(hobby => (
                  <div key={hobby.id} className="bg-[#1a1a1a] border border-gray-600 p-4 rounded flex flex-col items-center justify-center hover:border-purple-500 transition-colors shadow-inner">
                    <span className="text-gray-300 font-semibold mb-2 text-center">{hobby.nombre}</span>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-purple-500">{hobby.horasInvertidas}</span>
                      <span className="text-sm text-gray-400 mb-1">hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}