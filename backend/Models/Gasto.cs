using System;

namespace backend.Models
{
    public enum CategoriaGasto { GastoNecesario, GastoInnecesario, GastoFijo }
    public enum MetodoPago { Efectivo, TarjetaCredito }

    public class Gasto
    {
        public int Id { get; set; }
        public decimal Monto { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public CategoriaGasto Categoria { get; set; }
        public MetodoPago Metodo { get; set; } 
        
        // NUEVO: El ID de la tarjeta que usaste (es anulable '?' por si pagas en efectivo)
        public int? TarjetaId { get; set; }

        public DateTime Fecha { get; set; } = DateTime.Now;
    }
}