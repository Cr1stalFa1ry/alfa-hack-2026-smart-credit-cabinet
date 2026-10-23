FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Копирование csproj файлов для кэширования слоев restore
COPY ["AlphaHack2026.sln", "./"]
COPY ["SmartKabinet.Host/SmartKabinet.Host.csproj", "SmartKabinet.Host/"]
COPY ["Shared/SmartKabinet.Shared/SmartKabinet.Shared.csproj", "Shared/SmartKabinet.Shared/"]
COPY ["Modules/SmartKabinet.Application /SmartKabinet.Application.csproj", "Modules/SmartKabinet.Application /"]
COPY ["Modules/SmartKabinet.Auth/SmartKabinet.Auth.csproj", "Modules/SmartKabinet.Auth/"]
COPY ["Modules/SmartKabinet.BankEmployee/SmartKabinet.BankEmployee.csproj", "Modules/SmartKabinet.BankEmployee/"]
COPY ["Modules/SmartKabinet.Checking/SmartKabinet.Checking.csproj", "Modules/SmartKabinet.Checking/"]
COPY ["Modules/SmartKabinet.Client/SmartKabinet.Client.csproj", "Modules/SmartKabinet.Client/"]
COPY ["Modules/SmartKabinet.Infrastructure/SmartKabinet.Infrastructure.csproj", "Modules/SmartKabinet.Infrastructure/"]
COPY ["Modules/SmartKabinet.Intergrations/SmartKabinet.Intergrations.csproj", "Modules/SmartKabinet.Intergrations/"]
COPY ["Tests/SmartKabinet.Infrastructure.Tests/SmartKabinet.Infrastructure.Tests.csproj", "Tests/SmartKabinet.Infrastructure.Tests/"]

RUN dotnet restore "AlphaHack2026.sln"

# Копирование исходников и сборка Release
COPY . .
RUN dotnet publish "SmartKabinet.Host/SmartKabinet.Host.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "SmartKabinet.Host.dll"]
