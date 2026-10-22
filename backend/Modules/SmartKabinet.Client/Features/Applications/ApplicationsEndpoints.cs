using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SmartKabinet.Client.Features.Applications.CreateDraft;
using SmartKabinet.Client.Features.Applications.GetApplicationById;
using SmartKabinet.Client.Features.Applications.GetApplications;
using SmartKabinet.Client.Features.Applications.GetExplanation;
using SmartKabinet.Client.Features.Applications.RespondRequestedInfoApplication;
using SmartKabinet.Client.Features.Applications.RetryApplicationCheck;
using SmartKabinet.Client.Features.Applications.SaveDraft;
using SmartKabinet.Client.Features.Applications.SubmitApplication;
using SmartKabinet.Client.Features.Applications.UploadAndAnalyzeStatement;
using SmartKabinet.Client.Features.Applications.WithdrawApplication;

namespace SmartKabinet.Client.Features.Applications;

public static class ApplicationsEndpoints
{
    public static IEndpointRouteBuilder MapApplicationsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/client/applications").WithTags("Client Applications");

        group.MapCreateDraftEndpoint();
        group.MapSaveDraftEndpoint();
        group.MapSubmitApplicationEndpoint();
        group.MapRetryApplicationCheckEndpoint();
        group.MapRespondRequestedInfoApplicationEndpoint();
        group.MapWithdrawApplicationEndpoint();
        group.MapUploadAndAnalyzeStatementEndpoint();
        group.MapGetApplicationByIdEndpoint();
        group.MapGetApplicationsEndpoint();
        group.MapGetExplanationEndpoint();

        return app;
    }
}
