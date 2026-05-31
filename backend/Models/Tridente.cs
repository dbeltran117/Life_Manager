namespace backend.Models;

// 1. Pilar de la Fe: Versículos y Devocionales
public class Versiculo 
{
    public int Id { get; set; }
    public string Texto { get; set; } = string.Empty; // El versículo en sí
    public string Referencia { get; set; } = string.Empty; // Ej: "Juan 3:16"
    public string Categoria { get; set; } = "General"; // Paz, Fortaleza, etc.
    public string Devocional { get; set; } = string.Empty; 
    // Siempre es buena práctica de ingeniería saber cuándo lo escribiste
    public DateTime FechaCreacion { get; set; } = DateTime.Now; 
}