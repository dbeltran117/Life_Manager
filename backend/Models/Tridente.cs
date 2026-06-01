namespace backend.Models;

// 1. Pilar de la Fe: Versículos y Devocionales
public class Versiculo 
{
    public int Id { get; set; }
    public string Texto { get; set; } = string.Empty; 
    public string Referencia { get; set; } = string.Empty; 
    public string Categoria { get; set; } = "General"; 
    public string Devocional { get; set; } = string.Empty; 
    public DateTime FechaCreacion { get; set; } = DateTime.Now; 
}

// 2. Pilar del Cuerpo: Disciplina Física y Nutrición
public class RegistroFisico
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.Now;
    
    public string GrupoMuscular { get; set; } = string.Empty; // Ej: Pecho, Espalda, Pierna
    public string Rutina { get; set; } = string.Empty; // Para detallar pesos y ejercicios
    
    public bool TomoCreatina { get; set; } = false; // Checkbox simple
    
    public decimal? PesoCorporal { get; set; } // Opcional (acepta valores nulos)
    
    public string NotasRecuperacion { get; set; } = string.Empty; // ¿Hubo fatiga? ¿Dolor?
}

// 3. Pilar de la Mente: Intelecto y Escritura
public class EscritoMente
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    
    public string Tipo { get; set; } = "Reflexión"; // Ej: Poesía, Capítulo de Libro, Idea suelta
    public string Contenido { get; set; } = string.Empty; 
    
    public DateTime FechaCreacion { get; set; } = DateTime.Now;
    public DateTime FechaModificacion { get; set; } = DateTime.Now;
}