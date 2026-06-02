using Microsoft.EntityFrameworkCore;
using backend.Data;
using System.Text;
using System.Text.Json;

namespace backend.Services;

public class DiscordNotifierService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;

    public DiscordNotifierService(IServiceScopeFactory scopeFactory, IConfiguration config, HttpClient httpClient)
    {
        _scopeFactory = scopeFactory;
        _config = config;
        _httpClient = httpClient;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // El bucle infinito del servidor
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Extraemos la base de datos de forma segura para un servicio en segundo plano
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // 1. AHORA BUSCAMOS TODAS LAS TAREAS PENDIENTES (Sin importar prioridad)
                var tareasPendientes = await db.Recordatorios
                    .Where(r => r.Estado != 2)
                    .ToListAsync(stoppingToken);

                if (tareasPendientes.Any())
                {
                    var webhookUrl = _config["DiscordWebhookUrl"];
                    
                    if (!string.IsNullOrEmpty(webhookUrl))
                    {
                        // 2. Armamos el mensaje principal
                        var mensaje = $"📢 **¡Atención, baka-chan!** Tienes {tareasPendientes.Count} tarea(s) pendiente(s). ¡Deja de holgazaneear y ponte a trabajar!\n\n";
                        
                        // 3. Iteramos sobre todas las tareas y personalizamos el texto
                        foreach (var tarea in tareasPendientes)
                        {
                            // Etiqueta de Prioridad
                            string iconoPrioridad = tarea.NivelPrioridad switch
                            {
                                2 => "🚨 **[CRÍTICA]**",
                                1 => "⚠️ **[MEDIA]**",
                                _ => "☕ **[BAJA]**" // 0 o cualquier otro valor
                            };

                            // Etiqueta de Diario
                            string etiquetaDiaria = tarea.EsDiario ? " 🔁 *(Hábito Diario)*" : "";

                            // Control de descripción (por si te dio pereza escribir una)
                            string descripcion = string.IsNullOrWhiteSpace(tarea.Descripcion) 
                                ? "Sin detalles adicionales." 
                                : tarea.Descripcion;

                            // 4. Construimos la línea de la tarea (Sin ID, con descripción y tipo)
                            mensaje += $"{iconoPrioridad} **{tarea.Titulo}**{etiquetaDiaria}\n";
                            mensaje += $"      └ 📝 *{descripcion}*\n\n";
                        }

                        var payload = new { content = mensaje };
                        var jsonPayload = JsonSerializer.Serialize(payload);
                        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                        // Disparamos el misil a Discord
                        await _httpClient.PostAsync(webhookUrl, content, stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en el Vigía de Discord: {ex.Message}");
            }
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}