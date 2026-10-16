namespace TopazErp_FrontEnd.Models;

public class AuditedEntity<TPrimaryKey>
{
    public TPrimaryKey Id { get; set; }
    public DateTime CreationTime { get; set; }
}