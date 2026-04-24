using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserPhoto> UserPhotos => Set<UserPhoto>();
    public DbSet<UserVideo> UserVideos => Set<UserVideo>();
    public DbSet<UserInterest> UserInterests => Set<UserInterest>();
    public DbSet<UserRedFlag> UserRedFlags => Set<UserRedFlag>();
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
    public DbSet<ImpressMeSignal> ImpressMeSignals => Set<ImpressMeSignal>();
    public DbSet<ImpressMePrompt> ImpressMePrompts => Set<ImpressMePrompt>();
    public DbSet<ImpressMeResponse> ImpressMeResponses => Set<ImpressMeResponse>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<UserVerification> UserVerifications => Set<UserVerification>();
    public DbSet<VerificationAttempt> VerificationAttempts => Set<VerificationAttempt>();
    public DbSet<VerificationEvent> VerificationEvents => Set<VerificationEvent>();

    // Business Partner
    public DbSet<BusinessCategory> BusinessCategories => Set<BusinessCategory>();
    public DbSet<BusinessPartner> BusinessPartners => Set<BusinessPartner>();
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<BusinessEvent> BusinessEvents => Set<BusinessEvent>();
    public DbSet<BusinessEventImage> BusinessEventImages => Set<BusinessEventImage>();
    public DbSet<BusinessOffer> BusinessOffers => Set<BusinessOffer>();
    public DbSet<EventChallenge> EventChallenges => Set<EventChallenge>();
    public DbSet<ChallengeResponse> ChallengeResponses => Set<ChallengeResponse>();
    public DbSet<EventLike> EventLikes => Set<EventLike>();
    public DbSet<EventSave> EventSaves => Set<EventSave>();
    public DbSet<EventRegistration> EventRegistrations => Set<EventRegistration>();
    public DbSet<CouponClaim> CouponClaims => Set<CouponClaim>();
    public DbSet<RewardClaim> RewardClaims => Set<RewardClaim>();
    public DbSet<BusinessAuditLog> BusinessAuditLogs => Set<BusinessAuditLog>();

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

        // Videos
        modelBuilder.Entity<UserVideo>(e =>
        {
            e.Property(v => v.Url)
                .HasColumnType("text");

            e.HasOne(v => v.User)
                .WithMany(u => u.Videos)
                .HasForeignKey(v => v.UserId)
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

        // Red Flags
        modelBuilder.Entity<UserRedFlag>(e =>
        {
            e.HasOne(r => r.User)
                .WithMany(u => u.RedFlags)
                .HasForeignKey(r => r.UserId)
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
            e.HasIndex(l => new { l.FromUserId, l.CreatedAt });
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
            e.HasIndex(s => new { s.UserId, s.CreatedAt });
        });

        // Match
        modelBuilder.Entity<Match>(e =>
        {
            e.HasIndex(m => new { m.User1Id, m.User2Id }).IsUnique();
            e.HasIndex(m => new { m.User1Id, m.CreatedAt });
            e.HasIndex(m => new { m.User2Id, m.CreatedAt });
            e.HasIndex(m => new { m.Couple1Id, m.CreatedAt });
            e.HasIndex(m => new { m.Couple2Id, m.CreatedAt });
        });

        // Message
        modelBuilder.Entity<Message>(e =>
        {
            e.HasOne(m => m.Match)
                .WithMany()
                .HasForeignKey(m => m.MatchId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(m => m.MatchId);
            e.HasIndex(m => new { m.MatchId, m.SentAt });
            e.HasIndex(m => new { m.SenderId, m.SentAt });
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

        modelBuilder.Entity<Event>()
            .HasIndex(e => e.EventDate);

        // ImpressMe
        modelBuilder.Entity<ImpressMeSignal>(e =>
        {
            e.HasOne(s => s.Sender)
                .WithMany()
                .HasForeignKey(s => s.SenderId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.Receiver)
                .WithMany()
                .HasForeignKey(s => s.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(s => s.Prompt)
                .WithOne(p => p.Signal)
                .HasForeignKey<ImpressMePrompt>(p => p.SignalId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.Response)
                .WithOne(r => r.Signal)
                .HasForeignKey<ImpressMeResponse>(r => r.SignalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Efficient lookups for inbox, sent, and expiry sweeps
            e.HasIndex(s => new { s.ReceiverId, s.CreatedAt });
            e.HasIndex(s => new { s.SenderId,   s.CreatedAt });
            e.HasIndex(s => new { s.SenderId, s.ReceiverId, s.Status });
            e.HasIndex(s => s.ExpiresAt);
        });

        // Notifications
        modelBuilder.Entity<Notification>(e =>
        {
            e.HasIndex(n => new { n.RecipientId, n.CreatedAt });
            e.HasIndex(n => new { n.RecipientId, n.IsRead });
        });

        modelBuilder.Entity<UserVerification>(e =>
        {
            e.Property(v => v.StateJson).HasColumnType("text");
            e.HasIndex(v => new { v.UserId, v.MethodKey }).IsUnique();
            e.HasIndex(v => new { v.UserId, v.Status });
        });

        modelBuilder.Entity<VerificationAttempt>(e =>
        {
            e.Property(a => a.RequestJson).HasColumnType("text");
            e.Property(a => a.ResultJson).HasColumnType("text");
            e.HasIndex(a => new { a.UserId, a.MethodKey, a.IdempotencyKey }).IsUnique();
            e.HasIndex(a => new { a.VerificationId, a.StartedAt });
            e.HasIndex(a => new { a.UserId, a.MethodKey, a.StartedAt });
        });

        modelBuilder.Entity<VerificationEvent>(e =>
        {
            e.Property(v => v.DataJson).HasColumnType("text");
            e.HasIndex(v => new { v.VerificationId, v.CreatedAt });
            e.HasIndex(v => new { v.UserId, v.MethodKey, v.CreatedAt });
        });

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

        // BusinessPartner
        modelBuilder.Entity<BusinessCategory>(e =>
        {
            e.HasIndex(c => c.Key).IsUnique();
            e.HasIndex(c => new { c.IsActive, c.SortOrder });

            e.HasData(
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a01"), Key = "bar-nightclub", DisplayName = "Bar / Nightclub", SortOrder = 10, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a02"), Key = "restaurant-cafe", DisplayName = "Restaurant / Cafe", SortOrder = 20, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a03"), Key = "fitness-wellness", DisplayName = "Fitness / Wellness", SortOrder = 30, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a04"), Key = "entertainment", DisplayName = "Entertainment", SortOrder = 40, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a05"), Key = "retail", DisplayName = "Retail", SortOrder = 50, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a06"), Key = "events-experiences", DisplayName = "Events & Experiences", SortOrder = 60, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a07"), Key = "beauty-spa", DisplayName = "Beauty & Spa", SortOrder = 70, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a08"), Key = "travel-hospitality", DisplayName = "Travel & Hospitality", SortOrder = 80, IsActive = true },
                new BusinessCategory { Id = Guid.Parse("1d0c0a0b-3627-4f35-9208-cf0e13a89a09"), Key = "other", DisplayName = "Other", SortOrder = 90, IsActive = true }
            );
        });

        modelBuilder.Entity<BusinessPartner>(e =>
        {
            e.HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(b => b.Profile)
                .WithOne(p => p.BusinessPartner)
                .HasForeignKey<BusinessProfile>(p => p.BusinessPartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(b => b.UserId).IsUnique();
            e.HasIndex(b => b.Status);
        });

        // BusinessEvent
        modelBuilder.Entity<BusinessEvent>(e =>
        {
            e.HasOne(ev => ev.BusinessPartner)
                .WithMany(b => b.Events)
                .HasForeignKey(ev => ev.BusinessPartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(ev => ev.BusinessPartnerId);
            e.HasIndex(ev => ev.Status);
            e.HasIndex(ev => ev.StartDate);
        });

        // BusinessEventImage
        modelBuilder.Entity<BusinessEventImage>(e =>
        {
            e.Property(i => i.Url).HasColumnType("text");

            e.HasOne(i => i.BusinessEvent)
                .WithMany(ev => ev.Images)
                .HasForeignKey(i => i.BusinessEventId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BusinessOffer
        modelBuilder.Entity<BusinessOffer>(e =>
        {
            e.HasOne(o => o.BusinessEvent)
                .WithMany(ev => ev.Offers)
                .HasForeignKey(o => o.BusinessEventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(o => o.BusinessEventId);
            e.HasIndex(o => o.Status);
        });

        // EventChallenge
        modelBuilder.Entity<EventChallenge>(e =>
        {
            e.HasOne(c => c.BusinessEvent)
                .WithOne(ev => ev.Challenge)
                .HasForeignKey<EventChallenge>(c => c.BusinessEventId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ChallengeResponse
        modelBuilder.Entity<ChallengeResponse>(e =>
        {
            e.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.EventChallenge)
                .WithMany(c => c.Responses)
                .HasForeignKey(r => r.EventChallengeId)
                .OnDelete(DeleteBehavior.Cascade);

            // One response per user per challenge
            e.HasIndex(r => new { r.UserId, r.EventChallengeId }).IsUnique();
            e.HasIndex(r => new { r.EventChallengeId, r.Status });
        });

        // EventLike
        modelBuilder.Entity<EventLike>(e =>
        {
            e.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(l => l.BusinessEvent)
                .WithMany(ev => ev.Likes)
                .HasForeignKey(l => l.BusinessEventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(l => new { l.UserId, l.BusinessEventId }).IsUnique();
        });

        // EventSave
        modelBuilder.Entity<EventSave>(e =>
        {
            e.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(s => s.BusinessEvent)
                .WithMany(ev => ev.Saves)
                .HasForeignKey(s => s.BusinessEventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(s => new { s.UserId, s.BusinessEventId }).IsUnique();
        });

        // EventRegistration
        modelBuilder.Entity<EventRegistration>(e =>
        {
            e.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.BusinessEvent)
                .WithMany(ev => ev.Registrations)
                .HasForeignKey(r => r.BusinessEventId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(r => new { r.UserId, r.BusinessEventId }).IsUnique();
        });

        // CouponClaim
        modelBuilder.Entity<CouponClaim>(e =>
        {
            e.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(c => c.BusinessOffer)
                .WithMany(o => o.Claims)
                .HasForeignKey(c => c.BusinessOfferId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(c => new { c.UserId, c.BusinessOfferId }).IsUnique();
        });

        // RewardClaim
        modelBuilder.Entity<RewardClaim>(e =>
        {
            e.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.EventChallenge)
                .WithMany(c => c.RewardClaims)
                .HasForeignKey(r => r.EventChallengeId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(r => r.ChallengeResponse)
                .WithMany()
                .HasForeignKey(r => r.ChallengeResponseId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(r => new { r.UserId, r.EventChallengeId }).IsUnique();
        });

        // BusinessAuditLog
        modelBuilder.Entity<BusinessAuditLog>(e =>
        {
            e.HasIndex(a => a.CreatedAt);
            e.HasIndex(a => a.TargetPartnerId);
            e.HasIndex(a => a.TargetEventId);
        });
    }
}
