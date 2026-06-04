using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Ingreso> Ingresos { get; set; }
        public DbSet<Gasto> Gastos { get; set; }
        public DbSet<Recordatorio> Recordatorios { get; set; }
        public DbSet<Hobby> Hobbies { get; set; }
        public DbSet<TarjetaCredito> TarjetasCredito { get; set; }
        public DbSet<Abono> Abonos { get; set; }
        public DbSet<Versiculo> Versiculos { get; set; }
        public DbSet<RegistroFisico> RegistrosFisicos { get; set; }
        public DbSet<EscritoMente> EscritosMente { get; set; }
        public DbSet<IdeaSandbox> Sandbox { get; set; }
        public DbSet<RegistroDiario> Diario { get; set; }
    }
}