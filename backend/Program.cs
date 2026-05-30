using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Text;
using System.Text.Json;

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
builder.Services.AddHostedService<backend.Services.DiscordNotifierService>();
builder.Services.AddHttpClient(); // Permiso para que C# hable con Gemini

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

// --- ABONOS A TARJETAS ---
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

app.MapPut("/api/recordatorios/{id}/mover", async (int id, Recordatorio updateParams, AppDbContext db) =>
{
    var rec = await db.Recordatorios.FindAsync(id);
    if (rec == null) return Results.NotFound();

    rec.Estado = updateParams.Estado;
    await db.SaveChangesAsync();
    return Results.Ok(rec);
});

app.MapDelete("/api/recordatorios/{id}", async (int id, AppDbContext db) =>
{
    var rec = await db.Recordatorios.FindAsync(id);
    if (rec == null) return Results.NotFound();

    db.Recordatorios.Remove(rec);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapPost("/api/chat", async (ConsultaFinanciera req, AppDbContext db, HttpClient httpClient, IConfiguration config) =>
{
    var totalIngresos = await db.Ingresos.SumAsync(i => i.Monto);
    var gastosEfectivo = await db.Gastos.Where(g => g.Metodo == MetodoPago.Efectivo).SumAsync(g => g.Monto);
    var abonos = await db.Abonos.SumAsync(a => a.Monto);
    var liquidez = totalIngresos - gastosEfectivo - abonos;

    var tarjeta = await db.TarjetasCredito.FirstOrDefaultAsync();
    var deuda = tarjeta != null ? tarjeta.DeudaActual : 0;

    var prompt = $"Eres Gemi-chan, una asistente virtual tsundere experta en finanzas. " +
                 $"El usuario tiene de Liquidez Real: ${liquidez} y de Deuda en Tarjeta: ${deuda}. " +
                 $"Pregunta del usuario: {req.Mensaje}. " +
                 $"Responde corto (máximo 3-4 líneas), con actitud tsundere, y dale un consejo lógico y directo basado estrictamente en sus números actuales.";

    // 2. LEEMOS LA LLAVE DESDE EL ARCHIVO PROTEGIDO
    var apiKey = config["GeminiApiKey"]; 
    
    // Verificamos que no esté vacía
    if (string.IsNullOrEmpty(apiKey)) return Results.Problem("Gemi-chan está apagada. Falta la API Key en appsettings.");

    // Usamos el modelo 2.5-flash que corregimos antes
    var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}";

    var body = new { contents = new[] { new { parts = new[] { new { text = prompt } } } } };
    var jsonBody = JsonSerializer.Serialize(body);
    var content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

    var response = await httpClient.PostAsync(url, content);
    
    var jsonResponse = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode) 
    {
        Console.WriteLine($"====== ERRORES DE GEMI-CHAN ======");
        Console.WriteLine($"Código de Estado: {response.StatusCode}");
        Console.WriteLine($"Respuesta de Google: {jsonResponse}");
        Console.WriteLine($"====================================");

        return Results.Problem("Gemi-chan no responde. Revisa la terminal del backend para ver el error real.");
    }

    using var doc = JsonDocument.Parse(jsonResponse);
    var respuestaGemi = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

    return Results.Ok(new { respuesta = respuestaGemi });
});

app.Run();

// Clases auxiliares
public class ConsultaFinanciera { public string Mensaje { get; set; } = string.Empty; }