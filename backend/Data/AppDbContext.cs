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
    }
}