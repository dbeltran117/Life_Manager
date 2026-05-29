using System;

namespace backend.Models
{
    public class Abono
    {
        public int Id { get; set; }
        public decimal Monto { get; set; }
        public int TarjetaId { get; set; } 
        
        public DateTime Fecha { get; set; } = DateTime.Now;
    }
}