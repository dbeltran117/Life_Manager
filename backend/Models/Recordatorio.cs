using System;

namespace backend.Models
{
    // Las 3 columnas de tu Kanban
    public enum EstadoRecordatorio { Pendiente, EnProceso, Completado }
    // Para darles colores distintos
    public enum Prioridad { Baja, Normal, Critica }

    public class Recordatorio
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public Prioridad NivelPrioridad { get; set; }
        public EstadoRecordatorio Estado { get; set; } = EstadoRecordatorio.Pendiente;
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}