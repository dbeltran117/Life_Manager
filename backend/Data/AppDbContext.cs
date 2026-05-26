using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Transaccion> Transacciones { get; set; }
        public DbSet<Recordatorio> Recordatorios { get; set; }
        public DbSet<Hobby> Hobbies { get; set; }
    }
}