using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using SmartKabinet.Application.Infrastructure.Persistence;
using SmartKabinet.Auth.Infrastructure.Security;

namespace SmartKabinet.BankEmployee.Features.Applications.DeleteApplication;

public static class DeleteApplicationEndpoint
{
    public static RouteGroupBuilder MapDeleteApplicationEndpoint(this RouteGroupBuilder group)
    {
        // DELETE /api/employee/applications/{id}
        group.MapDelete("/{id:guid}", async (
            Guid id,
            IUserContext userContext,
            ApplicationDbContext appDb,
            CancellationToken ct) =>
        {
            if (!userContext.UserId.HasValue) return Results.Unauthorized();
            if (!userContext.IsBankEmployee) return Results.Forbid();

            var app = await appDb.Applications
                .Include(a => a.CurrentOffer)
                .FirstOrDefaultAsync(a => a.Id == id, ct);
            if (app is null)
            {
                return Results.NotFound(new { error = "Заявка не найдена." });
            }

            // Каскадное удаление связанных записей
            var transitions = await appDb.TransitionHistory.Where(t => t.ApplicationId == id).ToListAsync(ct);
            if (transitions.Count > 0)
            {
                appDb.TransitionHistory.RemoveRange(transitions);
            }

            var docs = await appDb.ApplicationDocuments.Where(d => d.ApplicationId == id).ToListAsync(ct);
            if (docs.Count > 0)
            {
                appDb.ApplicationDocuments.RemoveRange(docs);
            }

            if (app.CurrentOffer != null)
            {
                appDb.Offers.Remove(app.CurrentOffer);
            }

            appDb.Applications.Remove(app);
            await appDb.SaveChangesAsync(ct);

            return Results.Ok(new { message = "Заявка успешно удалена", applicationId = id });
        })
        .RequireAuthorization(AuthPolicies.EmployeeOnly)
        .WithName("DeleteApplication")
        .WithSummary("Удаление анкеты/заявки сотрудником банка");

        return group;
    }
}
