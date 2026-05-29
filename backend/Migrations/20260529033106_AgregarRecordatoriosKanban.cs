using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRecordatoriosKanban : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Notificado",
                table: "Recordatorios",
                newName: "NivelPrioridad");

            migrationBuilder.RenameColumn(
                name: "FechaHora",
                table: "Recordatorios",
                newName: "FechaCreacion");

            migrationBuilder.RenameColumn(
                name: "Completado",
                table: "Recordatorios",
                newName: "Estado");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "NivelPrioridad",
                table: "Recordatorios",
                newName: "Notificado");

            migrationBuilder.RenameColumn(
                name: "FechaCreacion",
                table: "Recordatorios",
                newName: "FechaHora");

            migrationBuilder.RenameColumn(
                name: "Estado",
                table: "Recordatorios",
                newName: "Completado");
        }
    }
}
