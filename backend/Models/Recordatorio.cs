using System;

namespace backend.Models
{
    public class Recordatorio
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public DateTime FechaHora { get; set; }
        public bool Completado { get; set; } = false;
        public bool Notificado { get; set; } = false; // Para saber si ya se mandó el aviso
    }
}