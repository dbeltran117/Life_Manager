using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InicialLibrosCorregido : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CitasLibros_Libros_LibroTrackerId",
                table: "CitasLibros");

            migrationBuilder.DropIndex(
                name: "IX_CitasLibros_LibroTrackerId",
                table: "CitasLibros");

            migrationBuilder.DropColumn(
                name: "LibroTrackerId",
                table: "CitasLibros");

            migrationBuilder.CreateIndex(
                name: "IX_CitasLibros_LibroId",
                table: "CitasLibros",
                column: "LibroId");

            migrationBuilder.AddForeignKey(
                name: "FK_CitasLibros_Libros_LibroId",
                table: "CitasLibros",
                column: "LibroId",
                principalTable: "Libros",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CitasLibros_Libros_LibroId",
                table: "CitasLibros");

            migrationBuilder.DropIndex(
                name: "IX_CitasLibros_LibroId",
                table: "CitasLibros");

            migrationBuilder.AddColumn<int>(
                name: "LibroTrackerId",
                table: "CitasLibros",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CitasLibros_LibroTrackerId",
                table: "CitasLibros",
                column: "LibroTrackerId");

            migrationBuilder.AddForeignKey(
                name: "FK_CitasLibros_Libros_LibroTrackerId",
                table: "CitasLibros",
                column: "LibroTrackerId",
                principalTable: "Libros",
                principalColumn: "Id");
        }
    }
}
