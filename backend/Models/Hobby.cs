namespace backend.Models
{
    public class Hobby
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public int HorasInvertidas { get; set; } = 0;
    }
}