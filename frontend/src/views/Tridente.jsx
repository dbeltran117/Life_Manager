import { Link } from 'react-router-dom';

export default function Tridente() {
  return (
    <div className="space-y-8 animate-fade-in text-white">
      <header className="border-b border-gray-700 pb-4">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 uppercase italic">
          El Tridente de Disciplina
        </h2>
        <p className="text-gray-500 text-sm mt-1 font-mono">Forja tu voluntad a través del equilibrio.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        
        {/* TARJETA 1: FE */}
        <Link to="/fe" className="group p-8 bg-gray-900 border border-gray-700 rounded-xl hover:border-blue-500 transition-all hover:-translate-y-2 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
          <h3 className="text-3xl mb-4">🕊️</h3>
          <h4 className="text-2xl font-bold text-gray-200 group-hover:text-blue-400 transition-colors uppercase italic mb-2">Fe</h4>
          <p className="text-gray-500 text-sm font-mono">Devocionales, versículos y reflexión espiritual.</p>
        </Link>

        {/* TARJETA 2: CUERPO */}
        <Link to="/cuerpo" className="group p-8 bg-gray-900 border border-gray-700 rounded-xl hover:border-green-500 transition-all hover:-translate-y-2 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all"></div>
          <h3 className="text-3xl mb-4">🏋️‍♂️</h3>
          <h4 className="text-2xl font-bold text-gray-200 group-hover:text-green-400 transition-colors uppercase italic mb-2">Cuerpo</h4>
          <p className="text-gray-500 text-sm font-mono">Rutinas de gimnasio, nutrición y suplementación.</p>
        </Link>

        {/* TARJETA 3: MENTE */}
        <Link to="/mente" className="group p-8 bg-gray-900 border border-gray-700 rounded-xl hover:border-purple-500 transition-all hover:-translate-y-2 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
          <h3 className="text-3xl mb-4">🧠</h3>
          <h4 className="text-2xl font-bold text-gray-200 group-hover:text-purple-400 transition-colors uppercase italic mb-2">Mente</h4>
          <p className="text-gray-500 text-sm font-mono">Escritura, borradores literarios y poesía.</p>
        </Link>

      </div>
    </div>
  );
}