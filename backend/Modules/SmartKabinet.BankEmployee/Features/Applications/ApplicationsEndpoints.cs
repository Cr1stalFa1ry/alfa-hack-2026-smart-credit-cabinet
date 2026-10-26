using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Auth.Infrastructure.Security;
using SmartKabinet.BankEmployee.Features.Applications.ApproveApplication;
using SmartKabinet.BankEmployee.Features.Applications.CloseApplication;
using SmartKabinet.BankEmployee.Features.Applications.DeleteApplication;
using SmartKabinet.BankEmployee.Features.Applications.DeclineApplication;
using SmartKabinet.BankEmployee.Features.Applications.GetApplicationById;
using SmartKabinet.BankEmployee.Features.Applications.GetQueue;
using SmartKabinet.BankEmployee.Features.Applications.RecheckApplication;
using SmartKabinet.BankEmployee.Features.Applications.RequestInfo;

namespace SmartKabinet.BankEmployee.Features.Applications;

public static class ApplicationsEndpoints
{
    public static IEndpointRouteBuilder MapBankEmployeeApplicationsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/employee/applications")
            .WithTags("Bank Employee Workplace")
            .RequireAuthorization(AuthPolicies.EmployeeOnly);

        group.MapGetEmployeeQueueEndpoint();
        group.MapGetEmployeeApplicationByIdEndpoint();
        group.MapApproveApplicationEndpoint();
        group.MapDeclineApplicationEndpoint();
        group.MapRequestInfoEndpoint();
        group.MapRecheckApplicationEndpoint();
        group.MapCloseApplicationEndpoint();
        group.MapDeleteApplicationEndpoint();

        return app;
    }
}
