using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURACIÓN DE CORS (Permiso para React)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirReact", policy =>
    {
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

// 2. APLICAR CORS
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

// --- HOBBIES (RACHAS) ---
app.MapGet("/api/hobbies", async (AppDbContext db) =>
    Results.Ok(await db.Hobbies.ToListAsync()));

app.MapPost("/api/hobbies", async (Hobby nuevoHobby, AppDbContext db) =>
{
    db.Hobbies.Add(nuevoHobby);
    await db.SaveChangesAsync();
    return Results.Created($"/api/hobbies/{nuevoHobby.Id}", nuevoHobby);
});

// --- ABONOS A TARJETAS (LA VERSIÓN CORRECTA Y ÚNICA) ---
app.MapGet("/api/abonos", async (AppDbContext db) =>
    Results.Ok(await db.Abonos.ToListAsync()));

app.MapPost("/api/tarjetas/{id}/pagar", async (int id, Abono nuevoAbono, AppDbContext db) =>
{
    var tarjeta = await db.TarjetasCredito.FindAsync(id);
    if (tarjeta == null) return Results.NotFound();

    // 1. Bajamos la deuda de la tarjeta
    tarjeta.DeudaActual -= nuevoAbono.Monto;
    if (tarjeta.DeudaActual < 0) tarjeta.DeudaActual = 0; 

    // 2. Guardamos el historial del abono
    nuevoAbono.TarjetaId = id;
    db.Abonos.Add(nuevoAbono);

    await db.SaveChangesAsync();
    return Results.Ok(tarjeta);
});

// --- RECORDATORIOS (KANBAN) ---
app.MapGet("/api/recordatorios", async (AppDbContext db) =>
    Results.Ok(await db.Recordatorios.ToListAsync()));

app.MapPost("/api/recordatorios", async (Recordatorio nuevo, AppDbContext db) =>
{
    db.Recordatorios.Add(nuevo);
    await db.SaveChangesAsync();
    return Results.Created($"/api/recordatorios/{nuevo.Id}", nuevo);
});

// Este endpoint se dispara cuando arrastras la tarjeta a otra columna
app.MapPut("/api/recordatorios/{id}/mover", async (int id, Recordatorio updateParams, AppDbContext db) =>
{
    var rec = await db.Recordatorios.FindAsync(id);
    if (rec == null) return Results.NotFound();

    rec.Estado = updateParams.Estado;
    await db.SaveChangesAsync();
    return Results.Ok(rec);
});

// Este endpoint es por si quieres borrar la tarea
app.MapDelete("/api/recordatorios/{id}", async (int id, AppDbContext db) =>
{
    var rec = await db.Recordatorios.FindAsync(id);
    if (rec == null) return Results.NotFound();

    db.Recordatorios.Remove(rec);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();