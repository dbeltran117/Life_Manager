using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class TridenteModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EscritosMente",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Titulo = table.Column<string>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", nullable: false),
                    Contenido = table.Column<string>(type: "TEXT", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaModificacion = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EscritosMente", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RegistrosFisicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Fecha = table.Column<DateTime>(type: "TEXT", nullable: false),
                    GrupoMuscular = table.Column<string>(type: "TEXT", nullable: false),
                    Rutina = table.Column<string>(type: "TEXT", nullable: false),
                    TomoCreatina = table.Column<bool>(type: "INTEGER", nullable: false),
                    PesoCorporal = table.Column<decimal>(type: "TEXT", nullable: true),
                    NotasRecuperacion = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegistrosFisicos", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EscritosMente");

            migrationBuilder.DropTable(
                name: "RegistrosFisicos");
        }
    }
}
