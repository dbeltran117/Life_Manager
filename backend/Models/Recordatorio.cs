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
        public int NivelPrioridad { get; set; } // 0 = Baja, 1 = Media, 2 = Crítica
        public int Estado { get; set; } // 0 = Pendiente, 1 = Progreso, 2 = Terminado
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
        public int DiasDeVida { get; set; } = 0; // 0 = Sin límite, 1 = Un día, 7 = Una semana
        // Define si la tarea debe reiniciarse todos los días (true = Hábito, false = Tarea única)
        public bool EsDiario { get; set; } = false; 
        
        // Registro exacto para calcular si ya pasó el día y debemos devolverla a Pendiente
        public DateTime? UltimaVezCompletado { get; set; } 
    }
}