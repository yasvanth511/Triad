using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserPhoto> UserPhotos => Set<UserPhoto>();
    public DbSet<UserInterest> UserInterests => Set<UserInterest>();
    public DbSet<Couple> Couples => Set<Couple>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<SavedProfile> SavedProfiles => Set<SavedProfile>();
    public DbSet<Match> Matches => Set<Match>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<SpamWarning> SpamWarnings => Set<SpamWarning>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventInterest> EventInterests => Set<EventInterest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
            e.HasOne(u => u.Couple)
                .WithMany(c => c.Members)
                .HasForeignKey(u => u.CoupleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Photos
        modelBuilder.Entity<UserPhoto>(e =>
        {
            e.Property(p => p.Url)
                .HasColumnType("text");

            e.HasOne(p => p.User)
                .WithMany(u => u.Photos)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Interests
        modelBuilder.Entity<UserInterest>(e =>
        {
            e.HasOne(i => i.User)
                .WithMany(u => u.Interests)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Likes
        modelBuilder.Entity<Like>(e =>
        {
            e.HasOne(l => l.FromUser)
                .WithMany(u => u.LikesSent)
                .HasForeignKey(l => l.FromUserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(l => l.ToUser)
                .WithMany(u => u.LikesReceived)
                .HasForeignKey(l => l.ToUserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(l => new { l.FromUserId, l.ToUserId }).IsUnique();
        });

        // Saved Profiles
        modelBuilder.Entity<SavedProfile>(e =>
        {
            e.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.SavedUser)
                .WithMany()
                .HasForeignKey(s => s.SavedUserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(s => new { s.UserId, s.SavedUserId }).IsUnique();
        });

        // Match
        modelBuilder.Entity<Match>(e =>
        {
            e.HasIndex(m => new { m.User1Id, m.User2Id }).IsUnique();
        });

        // Message
        modelBuilder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Match)
                .WithMany()
                .HasForeignKey(m => m.MatchId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(m => m.MatchId);
        });

        // Block
        modelBuilder.Entity<Block>(e =>
        {
            e.HasOne(b => b.BlockerUser)
                .WithMany(u => u.BlocksSent)
                .HasForeignKey(b => b.BlockerUserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(b => b.BlockedUser)
                .WithMany(u => u.BlocksReceived)
                .HasForeignKey(b => b.BlockedUserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(b => new { b.BlockerUserId, b.BlockedUserId }).IsUnique();
        });

        // Report
        modelBuilder.Entity<Report>(e =>
        {
            e.HasOne(r => r.ReporterUser)
                .WithMany(u => u.ReportsSent)
                .HasForeignKey(r => r.ReporterUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SpamWarning
        modelBuilder.Entity<SpamWarning>(e =>
        {
            e.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Round coordinates to ~1km grid for privacy
        modelBuilder.Entity<User>()
            .Property(u => u.Latitude)
            .HasPrecision(10, 2);

        modelBuilder.Entity<User>()
            .Property(u => u.Longitude)
            .HasPrecision(10, 2);

        // EventInterest unique constraint
        modelBuilder.Entity<EventInterest>(e =>
        {
            e.HasOne(ei => ei.User)
                .WithMany()
                .HasForeignKey(ei => ei.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ei => ei.Event)
                .WithMany(ev => ev.Interests)
                .HasForeignKey(ei => ei.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(ei => new { ei.UserId, ei.EventId }).IsUnique();
        });
    }
}
