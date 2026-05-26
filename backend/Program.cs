using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models; // Agregamos esto para que reconozca la clase Transaccion

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURACIÓN DE CORS (Permiso para React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
        // El puerto 5173 es donde corre tu Vite
        policy.WithOrigins("http://localhost:5173") 
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configuración de Base de Datos
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 2. APLICAR CORS (Debe ir antes de las rutas)
app.UseCors("PermitirReact");

// ==========================================
// 3. NUESTROS ENDPOINTS (Las puertas de la API)
// ==========================================

// Endpoint para LEER todas las transacciones (Tu historial de gastos/ingresos)
app.MapGet("/api/transacciones", async (AppDbContext db) =>
{
    var transacciones = await db.Transacciones.ToListAsync();
    return Results.Ok(transacciones);
});

// Endpoint para CREAR una nueva transacción (Tus limosnas o gastos hormiga)
app.MapPost("/api/transacciones", async (Transaccion nuevaTransaccion, AppDbContext db) =>
{
    db.Transacciones.Add(nuevaTransaccion);
    await db.SaveChangesAsync(); // Aquí se guarda en la base de datos mágicamente
    return Results.Created($"/api/transacciones/{nuevaTransaccion.Id}", nuevaTransaccion);
});

app.Run();