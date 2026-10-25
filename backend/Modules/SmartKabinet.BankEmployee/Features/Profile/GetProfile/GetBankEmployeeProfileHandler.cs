using Microsoft.EntityFrameworkCore;
using SmartKabinet.BankEmployee.Domain;
using SmartKabinet.BankEmployee.Infrastructure.Persistence;
using SmartKabinet.Shared;

namespace SmartKabinet.BankEmployee.Features.Profile.GetProfile;

public class GetBankEmployeeProfileHandler(BankEmployeeDbContext dbContext)
{
    public async Task<Result<BankEmployeeProfile>> Handle(
        GetBankEmployeeProfileQuery query,
        CancellationToken ct = default)
    {
        if (!query.UserId.HasValue)
        {
            return Error.Unauthorized("Auth.Unauthorized", "Пользователь не авторизован.");
        }

        var profile = await dbContext.Employees.FirstOrDefaultAsync(e => e.UserId == query.UserId.Value, ct);
        if (profile is null)
        {
            return Error.NotFound("Employee.NotFound", "Профиль сотрудника не найден.");
        }

        return Result.Success(profile);
    }
}
