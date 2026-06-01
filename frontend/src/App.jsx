import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import Finanzas from './views/Finanzas';
import Recordatorios from './views/Recordatorios';
import GemiChat from './components/GemiChat';
import Fe from './views/Fe';
import Tridente from './views/Tridente'; 
import Cuerpo from './views/Cuerpo';
import Mente from './views/Mente';

function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 p-6 flex flex-col h-screen sticky top-0">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-purple-500 tracking-widest uppercase">
         LifeManager
        </h1>
        <p className="text-xs text-gray-500 mt-1 italic">Control de la voluntad</p>
      </div>
      
      <nav className="flex flex-col gap-4">
        <Link to="/" className="text-gray-300 hover:text-purple-400 hover:bg-gray-800 p-2 rounded transition-colors font-semibold">
          📊 Dashboard
        </Link>
        <Link to="/finanzas" className="text-gray-300 hover:text-purple-400 hover:bg-gray-800 p-2 rounded transition-colors font-semibold">
          💰 Finanzas
        </Link>
        <Link to="/recordatorios" className="text-gray-300 hover:text-purple-400 hover:bg-gray-800 p-2 rounded transition-colors font-semibold">
          ⏰ Recordatorios
        </Link>
        {/* REEMPLAZAMOS HOBBIES Y FE POR ESTO */}
        <Link to="/tridente" className="text-gray-300 hover:text-purple-400 hover:bg-gray-800 p-2 rounded transition-colors font-semibold">
          🔱 Tridente
        </Link>
      </nav>
    </aside>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#121212] font-sans relative">
        <Sidebar />

        <main className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/finanzas" element={<Finanzas />} />
            <Route path="/recordatorios" element={<Recordatorios />} />
            <Route path="/tridente" element={<Tridente />} />
            <Route path="/fe" element={<Fe />} />
            <Route path="/cuerpo" element={<Cuerpo />} />
            <Route path="/mente" element={<Mente />} />
          </Routes>
        </main>

        <GemiChat />
      </div>
    </Router>
  );
}

export default App;