using System;

namespace backend.Models
{
    public enum CategoriaGasto { GastoNecesario, GastoInnecesario, GastoFijo }
    
    // NUEVO: Agregamos las opciones de pago
    public enum MetodoPago { Efectivo, TarjetaCredito }

    public class Gasto
    {
        public int Id { get; set; }
        public decimal Monto { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public CategoriaGasto Categoria { get; set; }
        
        // NUEVO: El enlace para saber cómo pagaste
        public MetodoPago Metodo { get; set; } 
        
        public DateTime Fecha { get; set; } = DateTime.Now;
    }
}