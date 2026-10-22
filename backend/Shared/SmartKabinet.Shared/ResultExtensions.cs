namespace SmartKabinet.Shared;

using Microsoft.AspNetCore.Http;

public static class ResultExtensions
{
    public static IResult ToHttpResult(this Result result, Func<IResult>? onSuccess = null)
    {
        if (result.IsSuccess)
        {
            return onSuccess != null ? onSuccess() : Results.Ok();
        }

        return ToErrorHttpResult(result.Error);
    }

    public static IResult ToHttpResult<T>(this Result<T> result, Func<T, IResult>? onSuccess = null)
    {
        if (result.IsSuccess)
        {
            return onSuccess != null ? onSuccess(result.Value) : Results.Ok(result.Value);
        }

        return ToErrorHttpResult(result.Error);
    }

    private static IResult ToErrorHttpResult(Error error)
    {
        return error.Type switch
        {
            ErrorType.NotFound => Results.NotFound(new { code = error.Code, message = error.Message }),
            ErrorType.Validation => Results.BadRequest(new { code = error.Code, message = error.Message }),
            ErrorType.Conflict => Results.Conflict(new { code = error.Code, message = error.Message }),
            ErrorType.Unauthorized => Results.Json(new { code = error.Code, message = error.Message }, statusCode: StatusCodes.Status401Unauthorized),
            ErrorType.Forbidden => Results.Json(new { code = error.Code, message = error.Message }, statusCode: StatusCodes.Status403Forbidden),
            _ => Results.Problem(statusCode: StatusCodes.Status500InternalServerError, title: error.Code, detail: error.Message)
        };
    }
}
