using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ThirdWheel.API.Data;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Helpers;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("auth.register");
        activity?.SetTag("enduser.alias", req.Username);

        try
        {
            if (await _db.Users.AnyAsync(u => u.Email == req.Email))
                throw new InvalidOperationException("Email already registered.");

            if (await _db.Users.AnyAsync(u => u.Username == req.Username))
                throw new InvalidOperationException("Username already taken.");

            var user = new User
            {
                Email = req.Email.ToLowerInvariant(),
                Username = req.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
            };

            user.Photos.Add(DefaultProfilePhoto.Create(user.Id));

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var token = GenerateToken(user);
            Telemetry.AuthOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "register"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return new AuthResponse(token, UserMapper.ToProfileResponse(user));
        }
        catch (Exception ex)
        {
            Telemetry.AuthOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "register"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("auth.login");

        try
        {
            var user = await _db.Users
                .Include(u => u.Photos)
                .Include(u => u.Interests)
                .Include(u => u.Couple)
                    .ThenInclude(c => c!.Members)
                .FirstOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant());

            if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

            if (user.IsBanned)
                throw new UnauthorizedAccessException("Account has been suspended.");

            activity?.SetTag("enduser.id", user.Id);
            var token = GenerateToken(user);
            Telemetry.AuthOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "login"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return new AuthResponse(token, UserMapper.ToProfileResponse(user));
        }
        catch (Exception ex)
        {
            Telemetry.AuthOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "login"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    private string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("username", user.Username)
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(AppConstants.TokenExpiryDays),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

}
