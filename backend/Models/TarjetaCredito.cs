using System;

namespace backend.Models
{
    public class TarjetaCredito
    {
        public int Id { get; set; }
        public string Nombre { get; set; } 
        public decimal Limite { get; set; }
        public decimal DeudaActual { get; set; }
        public decimal Disponible => Limite - DeudaActual; 
    }
}