using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;


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

app.UseStaticFiles(); 

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "ArchivosMente")),
    RequestPath = "/ArchivosMente"
});

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
{
    // Obtenemos solo la fecha de hoy (sin horas ni minutos)
    var hoy = DateTime.Now.Date; 
    var recordatorios = await db.Recordatorios.ToListAsync();
    bool huboCambios = false;

    // Revisamos si algún hábito diario necesita reiniciarse
    foreach (var rec in recordatorios)
    {
        if (rec.EsDiario && rec.Estado == 2)
        {
            // Si no tiene fecha, o la fecha es anterior a hoy, lo reiniciamos
            if (!rec.UltimaVezCompletado.HasValue || rec.UltimaVezCompletado.Value.Date < hoy)
            {
                rec.Estado = 0; // Lo devolvemos a "Pendiente"
                huboCambios = true;
            }
        }
    }

    // Si el servidor movió tarjetas por ti, guardamos los cambios en la BD
    if (huboCambios)
    {
        await db.SaveChangesAsync();
    }

    return Results.Ok(recordatorios);
});

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

    // LÓGICA NUEVA: Si lo acabas de terminar, sellamos la fecha de hoy
    if (rec.Estado == 2)
    {
        rec.UltimaVezCompletado = DateTime.Now;
    }

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

app.MapPut("/api/recordatorios/{id}/toggle-diario", async (int id, AppDbContext db) =>
{
    var rec = await db.Recordatorios.FindAsync(id);
    if (rec == null) return Results.NotFound();

    // Invierte el valor booleano (si era true pasa a false, y viceversa)
    rec.EsDiario = !rec.EsDiario; 
    
    await db.SaveChangesAsync();
    return Results.Ok(rec);
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

// ==========================================
// PILAR DE LA FE: VERSÍCULOS Y DEVOCIONALES
// ==========================================

// 1. Obtener todos los devocionales (ordenados del más reciente al más antiguo)
app.MapGet("/api/fe", async (AppDbContext db) => 
{
    var historial = await db.Versiculos
        .OrderByDescending(v => v.FechaCreacion)
        .ToListAsync();
    return Results.Ok(historial);
});

// 2. Guardar un nuevo devocional
app.MapPost("/api/fe", async (AppDbContext db, Versiculo nuevoDevocional) => 
{
    // Nos aseguramos de que la fecha sea exacta al momento de guardarlo
    nuevoDevocional.FechaCreacion = DateTime.Now;
    
    db.Versiculos.Add(nuevoDevocional);
    await db.SaveChangesAsync();
    
    return Results.Created($"/api/fe/{nuevoDevocional.Id}", nuevoDevocional);
});

// 3. Eliminar un devocional (por si te equivocas o quieres purgar algo)
app.MapDelete("/api/fe/{id}", async (int id, AppDbContext db) => 
{
    var devocional = await db.Versiculos.FindAsync(id);
    if (devocional is null) return Results.NotFound("Ese devocional no existe en los registros, baka-chan.");
    
    db.Versiculos.Remove(devocional);
    await db.SaveChangesAsync();
    
    return Results.Ok("Devocional purgado de la base de datos.");
});

// ==========================================
// 🏋️‍♂️ MÓDULO: CUERPO (RegistroFisico)
// ==========================================

// GET: Obtener historial físico (ordenado por los más recientes)
app.MapGet("/api/cuerpo", async (AppDbContext db) =>
{
    return await db.RegistrosFisicos.OrderByDescending(c => c.Fecha).ToListAsync();
});

// POST: Registrar un nuevo entrenamiento
app.MapPost("/api/cuerpo", async (RegistroFisico registro, AppDbContext db) =>
{
    // Forzamos la fecha del servidor por seguridad
    registro.Fecha = DateTime.Now; 
    
    db.RegistrosFisicos.Add(registro);
    await db.SaveChangesAsync();
    
    return Results.Created($"/api/cuerpo/{registro.Id}", registro);
});

// DELETE: Borrar un registro físico por si te equivocaste
app.MapDelete("/api/cuerpo/{id}", async (int id, AppDbContext db) =>
{
    var registro = await db.RegistrosFisicos.FindAsync(id);
    if (registro is null) return Results.NotFound(new { mensaje = "Registro no encontrado, baka." });

    db.RegistrosFisicos.Remove(registro);
    await db.SaveChangesAsync();
    
    return Results.Ok();
});


// ==========================================
// 🧠 MÓDULO: MENTE (EscritoMente)
// ==========================================

// GET: Obtener todos los borradores y escritos (ordenados por última modificación)
app.MapGet("/api/mente", async (AppDbContext db) =>
{
    return await db.EscritosMente.OrderByDescending(m => m.FechaModificacion).ToListAsync();
});

// POST: Crear un nuevo escrito (Soporta texto directo o archivos físicos)
app.MapPost("/api/mente", async (
    [FromForm] string titulo,
    [FromForm] string tipo,
    [FromForm] string categoriaTema,
    [FromForm] string? contenido,
    IFormFile? archivoFisico, // Opcional, por si solo quieres escribir texto plano
    AppDbContext db) =>
{
    string rutaFinal = "";

    // Si decidiste adjuntar un archivo físico (PDF, TXT, etc.)
    if (archivoFisico != null && archivoFisico.Length > 0)
    {
        // Creamos la carpeta en la raíz del backend si no existe
        var carpetaDestino = Path.Combine(Directory.GetCurrentDirectory(), "ArchivosMente");
        if (!Directory.Exists(carpetaDestino)) 
        {
            Directory.CreateDirectory(carpetaDestino);
        }

        // Renombramos con un GUID para evitar colisiones de archivos con el mismo nombre
        var nombreUnico = Guid.NewGuid().ToString() + "_" + archivoFisico.FileName;
        var rutaCompleta = Path.Combine(carpetaDestino, nombreUnico);

        // Guardamos el flujo del archivo en el disco
        using (var stream = new FileStream(rutaCompleta, FileMode.Create))
        {
            await archivoFisico.CopyToAsync(stream);
        }

        // Guardamos la ruta que usará el frontend para descargarlo
        rutaFinal = $"/ArchivosMente/{nombreUnico}";
    }

    var nuevoEscrito = new EscritoMente
    {
        Titulo = titulo,
        Tipo = tipo,
        CategoriaTema = categoriaTema,
        Contenido = contenido ?? "", 
        RutaArchivoFisico = rutaFinal,
        FechaCreacion = DateTime.Now,
        FechaModificacion = DateTime.Now
    };

    db.EscritosMente.Add(nuevoEscrito);
    await db.SaveChangesAsync();
    
    return Results.Created($"/api/mente/{nuevoEscrito.Id}", nuevoEscrito);
}).DisableAntiforgery(); // Crucial para que React pueda enviar formularios multipart sin bloqueos

// PUT: Actualizar/Editar un texto existente
app.MapPut("/api/mente/{id}", async (int id, EscritoMente escritoActualizado, AppDbContext db) =>
{
    var escrito = await db.EscritosMente.FindAsync(id);
    if (escrito is null) return Results.NotFound();

    // Actualizamos los campos de texto y la nueva categoría
    escrito.Titulo = escritoActualizado.Titulo;
    escrito.Tipo = escritoActualizado.Tipo;
    escrito.CategoriaTema = escritoActualizado.CategoriaTema; // ¡NUEVO CAMBIO!
    escrito.Contenido = escritoActualizado.Contenido;
    
    // Forzamos la actualización de la estampa de tiempo
    escrito.FechaModificacion = DateTime.Now; 

    await db.SaveChangesAsync();
    return Results.NoContent();
});

// DELETE: Eliminar un escrito permanentemente
app.MapDelete("/api/mente/{id}", async (int id, AppDbContext db) =>
{
    var escrito = await db.EscritosMente.FindAsync(id);
    if (escrito is null) return Results.NotFound();

    db.EscritosMente.Remove(escrito);
    await db.SaveChangesAsync();
    
    return Results.Ok();
});

// ==========================================
// 💡 MÓDULO: SANDBOX DE IDEAS
// ==========================================

// GET: Obtener todas las ideas del caos mental
app.MapGet("/api/sandbox", async (AppDbContext db) =>
{
    // Ordenamos para que las nuevas (Estado 0) salgan primero
    return await db.Sandbox.OrderBy(i => i.EstadoEvaluacion).ThenByDescending(i => i.FechaCreacion).ToListAsync();
});

// POST: Aventar una idea rápida al sistema
app.MapPost("/api/sandbox", async (IdeaSandbox idea, AppDbContext db) =>
{
    idea.FechaCreacion = DateTime.Now;
    idea.EstadoEvaluacion = 0; // Siempre entran como "Nueva"
    
    db.Sandbox.Add(idea);
    await db.SaveChangesAsync();
    
    return Results.Created($"/api/sandbox/{idea.Id}", idea);
});

// PUT: Evaluar la idea (AQUÍ ESTÁ TU LÓGICA DE INGENIERO)
app.MapPut("/api/sandbox/{id}/evaluar", async (int id, IdeaSandbox updateParams, AppDbContext db) =>
{
    var idea = await db.Sandbox.FindAsync(id);
    if (idea == null) return Results.NotFound();

    // Si la estamos marcando como "Buena Idea" (1) y no lo era antes
    if (updateParams.EstadoEvaluacion == 1 && idea.EstadoEvaluacion != 1)
    {
        // AUTOMATIZACIÓN: Creamos el recordatorio
        var nuevoRecordatorio = new Recordatorio
        {
            Titulo = $"💡 [IDEA] {idea.Titulo}",
            Descripcion = idea.Descripcion,
            NivelPrioridad = 1, // 1 = Media
            DiasDeVida = 0, // 0 = Permanente
            Estado = 0, // 0 = Pendiente en Kanban
            EsDiario = false,
            FechaCreacion = DateTime.Now
        };
        
        // Lo inyectamos en la tabla del Kanban
        db.Recordatorios.Add(nuevoRecordatorio);
    }

    // Actualizamos el estado de la idea (Ej. a Aprobada, Rechazada, etc.)
    idea.EstadoEvaluacion = updateParams.EstadoEvaluacion;
    
    // Guardamos ambos cambios en una sola transacción
    await db.SaveChangesAsync();
    return Results.Ok(idea);
});

// DELETE: Por si escribiste una tontería y quieres borrarla
app.MapDelete("/api/sandbox/{id}", async (int id, AppDbContext db) =>
{
    var idea = await db.Sandbox.FindAsync(id);
    if (idea == null) return Results.NotFound();

    db.Sandbox.Remove(idea);
    await db.SaveChangesAsync();
    
    return Results.NoContent();
});

// ==========================================
// 📓 MÓDULO: DIARIO PERSONAL
// ==========================================

// GET: Obtener todas las páginas del diario (ordenadas de la más reciente a la más antigua)
app.MapGet("/api/diario", async (AppDbContext db) =>
{
    return await db.Diario.OrderByDescending(d => d.FechaHora).ToListAsync();
});

// POST: Escribir una nueva página
app.MapPost("/api/diario", async (RegistroDiario pagina, AppDbContext db) =>
{
    // Forzamos la fecha y hora exacta del servidor en el momento de creación
    pagina.FechaHora = DateTime.Now; 
    
    db.Diario.Add(pagina);
    await db.SaveChangesAsync();
    
    return Results.Created($"/api/diario/{pagina.Id}", pagina);
});

// PUT: Editar una página existente (Por si el caos mental te hizo tener faltas de ortografía)
app.MapPut("/api/diario/{id}", async (int id, RegistroDiario paginaActualizada, AppDbContext db) =>
{
    var pagina = await db.Diario.FindAsync(id);
    if (pagina == null) return Results.NotFound();

    // Solo actualizamos el texto y la emoción, la fecha original se respeta
    pagina.EmocionPredominante = paginaActualizada.EmocionPredominante;
    pagina.Contenido = paginaActualizada.Contenido;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

// DELETE: Arrancar una página del diario
app.MapDelete("/api/diario/{id}", async (int id, AppDbContext db) =>
{
    var pagina = await db.Diario.FindAsync(id);
    if (pagina == null) return Results.NotFound();

    db.Diario.Remove(pagina);
    await db.SaveChangesAsync();
    
    return Results.Ok();
});

// ==========================================
// 📚 MÓDULO: BIBLIOTECA Y CITAS (LibroTracker)
// ==========================================

// GET: Obtener todos los libros (¡Con sus citas incluidas!)
app.MapGet("/api/libros", async (AppDbContext db) =>
{
    // IMPORTANTE: Requiere "using Microsoft.EntityFrameworkCore;" arriba en tu archivo
    return await db.Libros
                   .Include(l => l.Citas) // Hacemos el JOIN automático
                   .OrderByDescending(l => l.Id)
                   .ToListAsync();
});

// POST: Registrar un nuevo libro en los casilleros (Corregido)
app.MapPost("/api/libros", async (LibroTracker libro, AppDbContext db) =>
{
    // EL TOQUE TÉCNICO: Si el baka-chan inicia el libro directamente en estado 1 (Leyendo)
    // sellamos la estampa de tiempo de inicio inmediatamente de forma nativa.
    if (libro.EstadoLectura == 1)
    {
        libro.FechaInicio = DateTime.Now;
    }

    db.Libros.Add(libro);
    await db.SaveChangesAsync();
    return Results.Created($"/api/libros/{libro.Id}", libro);
});
// PUT: Cambiar el estado de lectura de un libro
app.MapPut("/api/libros/{id}/estado", async (int id, LibroTracker dataFront, AppDbContext db) =>
{
    var libro = await db.Libros.FindAsync(id);
    if (libro is null) return Results.NotFound();

    libro.EstadoLectura = dataFront.EstadoLectura;

    // Lógica automática: Control de tiempos
    if (libro.EstadoLectura == 1 && libro.FechaInicio == null) 
    {
        // Si lo pasas a "Leyendo" y no tenía fecha, le ponemos la de hoy
        libro.FechaInicio = DateTime.Now; 
    }
    else if (libro.EstadoLectura == 2) 
    {
        // Si lo pasas a "Terminado", sellamos la fecha final
        libro.FechaFin = DateTime.Now; 
    }

    await db.SaveChangesAsync();
    return Results.NoContent();
});

// POST: Guardar una nueva cita/reflexión dentro de un libro
app.MapPost("/api/libros/{id}/citas", async (int id, CitaLibro cita, AppDbContext db) =>
{
    // Verificamos que el libro realmente exista antes de meterle citas
    var libroExistente = await db.Libros.AnyAsync(l => l.Id == id);
    if (!libroExistente) return Results.NotFound("El libro no existe.");

    // Forzamos las llaves para que no haya errores
    cita.LibroId = id;
    cita.FechaCreacion = DateTime.Now;

    db.CitasLibros.Add(cita);
    await db.SaveChangesAsync();

    return Results.Created($"/api/libros/{id}/citas/{cita.Id}", cita);
});

// DELETE: Eliminar un libro permanentemente junto con sus citas asociadas
app.MapDelete("/api/libros/{id}", async (int id, AppDbContext db) =>
{
    // Buscamos el libro incluyendo sus citas para asegurar el rastreo completo
    var libro = await db.Libros.Include(l => l.Citas).FirstOrDefaultAsync(l => l.Id == id);
    if (libro is null) return Results.NotFound();

    db.Libros.Remove(libro);
    await db.SaveChangesAsync();
    
    return Results.Ok();
});

app.Run();

// Clases auxiliares
public class ConsultaFinanciera { public string Mensaje { get; set; } = string.Empty; }