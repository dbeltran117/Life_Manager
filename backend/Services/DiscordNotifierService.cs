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

                // Buscamos tareas que NO estén terminadas (Estado != 2) y que sean CRÍTICAS (Prioridad == 2)
                var tareasCriticas = await db.Recordatorios
                    .Where(r => r.Estado != 2 && r.NivelPrioridad == 2)
                    .ToListAsync(stoppingToken);

                if (tareasCriticas.Any())
                {
                    var webhookUrl = _config["DiscordWebhookUrl"];
                    
                    if (!string.IsNullOrEmpty(webhookUrl))
                    {
                        // Armamos el mensaje para Discord
                        var mensaje = $"🚨 **¡Agh! ¡Despierta, baka-chan!** Tienes {tareasCriticas.Count} tarea(s) crítica(s) acumulando polvo. ¡Hazlas de una vez!\n";
                        foreach (var tarea in tareasCriticas)
                        {
                            mensaje += $"- ⚠️ **{tarea.Titulo}** (ID: {tarea.Id})\n";
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

            // Esperar antes de volver a revisar. 
            // AHORA ESTÁ EN 1 MINUTO PARA QUE PUEDAS PROBARLO. 
            // Cuando veas que funciona, cámbialo a TimeSpan.FromHours(1)
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}