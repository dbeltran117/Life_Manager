using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization; // 👈 NECESARIO PARA EL JSONIGNORE

namespace backend.Models
{
    public class CitaLibro
    {
        public int Id { get; set; }
        
        // Nuestra llave foránea real
        public int LibroId { get; set; } 
        
        // 👈 MAGIA DE INGENIERÍA: Le decimos a EF Core que use "LibroId" para la relación
        [ForeignKey("LibroId")]
        [JsonIgnore] // 👈 EVITA QUE EL JSON HAGA UN CICLO INFINITO AL ENVIAR A REACT
        public LibroTracker? Libro { get; set; }

        public string TextoOriginal { get; set; } = string.Empty;
        public string ReflexionPersonal { get; set; } = string.Empty;
        public int? Pagina { get; set; } 
        
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}