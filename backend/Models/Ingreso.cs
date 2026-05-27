using System;

namespace backend.Models
{
    public enum OrigenIngreso {Trabajo, Mesada}

    public class Ingreso
    {
        public int Id { get; set; }
        public decimal Monto { get; set; }
        public OrigenIngreso Origen { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
    }
}