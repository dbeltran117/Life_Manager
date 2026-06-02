using System;

namespace backend.Models
{
    public class IdeaSandbox
    {
        public int Id { get; set; }
        
        public string Titulo { get; set; } = string.Empty;
        
        // Aquí puedes explayarte sobre qué trata la idea
        public string Descripcion { get; set; } = string.Empty; 
        
        // Ej: "LifeManager", "App Escritorio", "Proyecto Random", "Viaje"
        public string Categoria { get; set; } = "General"; 
        
        // 0 = Nueva (Sin clasificar)
        // 1 = Buena Idea (Aprobada para el futuro)
        // 2 = Mala Idea (Descartada, pero guardada para no repetirla)
        // 3 = Implementada (Ya la programaste o la hiciste)
        public int EstadoEvaluacion { get; set; } = 0; 
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}