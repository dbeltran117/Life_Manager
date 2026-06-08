using System;
using System.Collections.Generic;

namespace backend.Models
{
    public class LibroTracker
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Autor { get; set; } = string.Empty;
        
        // 0 = Lectura Deseada, 1 = Leyendo, 2 = Leído
        public int EstadoLectura { get; set; } = 0; 
        
        // Para que sepas cuándo lo empezaste y cuándo lo acabaste
        public DateTime? FechaInicio { get; set; } 
        public DateTime? FechaFin { get; set; }

        // La magia de EF Core: La lista de citas que le pertenecen a este libro
        public List<CitaLibro> Citas { get; set; } = new();
    }
}