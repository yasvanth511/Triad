FROM node:20-alpine AS ui-build
WORKDIR /ui
COPY nextjs-admin/package.json nextjs-admin/package-lock.json* ./
RUN npm install --frozen-lockfile 2>/dev/null || npm install
COPY nextjs-admin/ .
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Admin.Host/Admin.Host.csproj Admin.Host/
RUN dotnet restore Admin.Host/Admin.Host.csproj

COPY . .
COPY --from=ui-build /ui/out/ Admin.Host/wwwroot/
RUN dotnet publish Admin.Host/Admin.Host.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:80

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Admin.Host.dll"]
