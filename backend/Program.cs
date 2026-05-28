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

// --- INGRESOS ---
app.MapGet("/api/ingresos", async (AppDbContext db) =>
    Results.Ok(await db.Ingresos.ToListAsync()));

app.MapPost("/api/ingresos", async (Ingreso nuevoIngreso, AppDbContext db) =>
{
    db.Ingresos.Add(nuevoIngreso);
    await db.SaveChangesAsync();
    return Results.Created($"/api/ingresos/{nuevoIngreso.Id}", nuevoIngreso);
});

// --- GASTOS ---
app.MapGet("/api/gastos", async (AppDbContext db) =>
    Results.Ok(await db.Gastos.ToListAsync()));

app.MapPost("/api/gastos", async (Gasto nuevoGasto, AppDbContext db) =>
{
    db.Gastos.Add(nuevoGasto);

    // MAGIA MULTI-TARJETA: Buscamos la tarjeta exacta que seleccionaste
    if (nuevoGasto.Metodo == MetodoPago.TarjetaCredito && nuevoGasto.TarjetaId.HasValue)
    {
        var tarjeta = await db.TarjetasCredito.FindAsync(nuevoGasto.TarjetaId.Value);
        if (tarjeta != null)
        {
            tarjeta.DeudaActual += nuevoGasto.Monto;
        }
    }

    await db.SaveChangesAsync();
    return Results.Created($"/api/gastos/{nuevoGasto.Id}", nuevoGasto);
});

// --- TARJETAS DE CRÉDITO ---
app.MapGet("/api/tarjetas", async (AppDbContext db) =>
    Results.Ok(await db.TarjetasCredito.ToListAsync()));

app.MapPost("/api/tarjetas", async (TarjetaCredito nuevaTarjeta, AppDbContext db) =>
{
    db.TarjetasCredito.Add(nuevaTarjeta);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tarjetas/{nuevaTarjeta.Id}", nuevaTarjeta);
});

// NUEVO: ENDPOINT PARA ABONAR A LA TARJETA
app.MapPost("/api/tarjetas/{id}/pagar", async (int id, PagoTarjetaDto pago, AppDbContext db) =>
{
    var tarjeta = await db.TarjetasCredito.FindAsync(id);
    if (tarjeta == null) return Results.NotFound();

    // 1. Bajamos la deuda de la tarjeta
    tarjeta.DeudaActual -= pago.Monto;
    if (tarjeta.DeudaActual < 0) tarjeta.DeudaActual = 0; // Evitar deudas negativas

    // 2. Registramos la salida de tu dinero real (Efectivo/Débito)
    var gastoPago = new Gasto {
        Descripcion = $"Abono a tarjeta: {tarjeta.Nombre}",
        Monto = pago.Monto,
        Categoria = CategoriaGasto.GastoFijo,
        Metodo = MetodoPago.Efectivo,
        Fecha = DateTime.Now
    };
    db.Gastos.Add(gastoPago);

    await db.SaveChangesAsync();
    return Results.Ok(tarjeta);
});

// --- HOBBIES (RACHAS) ---
app.MapGet("/api/hobbies", async (AppDbContext db) =>
    Results.Ok(await db.Hobbies.ToListAsync()));

app.MapPost("/api/hobbies", async (Hobby nuevoHobby, AppDbContext db) =>
{
    db.Hobbies.Add(nuevoHobby);
    await db.SaveChangesAsync();
    return Results.Created($"/api/hobbies/{nuevoHobby.Id}", nuevoHobby);
});

// NUEVO: ENDPOINT PARA ABONAR A LA TARJETA
app.MapPost("/api/tarjetas/{id}/pagar", async (int id, PagoTarjetaDto pago, AppDbContext db) =>
{
    var tarjeta = await db.TarjetasCredito.FindAsync(id);
    if (tarjeta == null) return Results.NotFound();

    // 1. Bajamos la deuda de la tarjeta directamente
    tarjeta.DeudaActual -= pago.Monto;
    if (tarjeta.DeudaActual < 0) tarjeta.DeudaActual = 0; 

    // (ELIMINAMOS LA CREACIÓN DEL GASTO EXTRA PARA EVITAR DOBLE CONTABILIDAD)

    await db.SaveChangesAsync();
    return Results.Ok(tarjeta);
});

app.Run();

public class PagoTarjetaDto { public decimal Monto { get; set; } }