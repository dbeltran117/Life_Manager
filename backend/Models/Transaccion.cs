using System;

namespace backend.Models
{
    public enum TipoTransaccion{Ingreso,Egreso}

    public enum CategoriaTransaccion {Trabajo,Mesada,GastoNecesario,GastoInnecesario}

    public class Transaccion
    {
        public int Id { get; set; }
        public string Descripcion { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public TipoTransaccion Tipo { get; set; }
        public CategoriaTransaccion Categoria { get; set; }
        public DateTime Fecha { get; set; } = DateTime.Now;
    }
}