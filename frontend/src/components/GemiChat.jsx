import { useState } from 'react';

export default function GemiChat() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [chat, setChat] = useState([{ rol: 'gemi', texto: '¿Qué quieres ahora? Habla rápido, estoy analizando tus finanzas.' }]);
  const [escribiendo, setEscribiendo] = useState(false);

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const msjUsuario = mensaje;
    setChat(prev => [...prev, { rol: 'user', texto: msjUsuario }]);
    setMensaje("");
    setEscribiendo(true);

    fetch('http://localhost:5240/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: msjUsuario })
    })
    .then(res => res.json())
    .then(data => {
      setChat(prev => [...prev, { rol: 'gemi', texto: data.respuesta || data.detail }]);
      setEscribiendo(false);
    })
    .catch(() => {
      setChat(prev => [...prev, { rol: 'gemi', texto: "Error de red. Asegúrate de que el backend esté encendido, baka." }]);
      setEscribiendo(false);
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!abierto && (
        <button onClick={() => setAbierto(true)} className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-transform hover:scale-110 border-2 border-purple-400 font-bold text-lg">
          ✨ Chat
        </button>
      )}

      {abierto && (
       <div className="bg-[#0f0f13] border border-purple-500/50 rounded-lg shadow-2xl w-[90vw] sm:w-[400px] md:w-[500px] flex flex-col h-[600px] max-h-[85vh] overflow-hidden animate-fade-in relative">
          <div className="bg-gradient-to-r from-purple-900 to-[#0f0f13] border-b border-purple-500/30 p-3 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <h3 className="font-bold text-purple-300 tracking-wider">Gemi-chan</h3>
             </div>
             <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-white font-bold px-2 hover:bg-red-500/20 rounded">X</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0c]">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.rol === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-md ${msg.rol === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 border border-purple-500/30 text-gray-200 rounded-bl-none'}`}>
                  {msg.texto}
                </div>
              </div>
            ))}
            {escribiendo && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-purple-500/30 p-3 rounded-lg rounded-bl-none">
                  <span className="text-purple-400 animate-pulse text-xs font-bold">Analizando...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={enviarMensaje} className="p-3 border-t border-purple-500/30 bg-[#0f0f13] flex gap-2">
            <input type="text" value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Pregúntame algo..." className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm outline-none focus:border-purple-500 transition-colors"/>
            <button type="submit" className="bg-purple-600 hover:bg-purple-500 px-4 rounded text-white font-bold transition-colors">➔</button>
          </form>
        </div>
      )}
    </div>
  );
}