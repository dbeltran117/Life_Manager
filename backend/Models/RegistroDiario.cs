using System;

namespace backend.Models
{
    public class RegistroDiario
    {
        public int Id { get; set; }
        public DateTime FechaHora { get; set; } = DateTime.Now; 

        public string EmocionPredominante { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty; 
    }
}