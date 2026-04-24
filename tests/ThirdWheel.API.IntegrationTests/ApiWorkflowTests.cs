using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Helpers;
using ThirdWheel.API.IntegrationTests.Infrastructure;
using ThirdWheel.API.Models;

namespace ThirdWheel.API.IntegrationTests;

public class ApiWorkflowTests : IClassFixture<TestApiFactory>
{
    private static readonly byte[] TinyPng =
        Convert.FromBase64String(DefaultProfilePhoto.DataUrl["data:image/png;base64,".Length..]);

    private readonly TestApiFactory _factory;

    public ApiWorkflowTests(TestApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task BusinessPartner_Event_Offer_Challenge_And_Analytics_Flow_Works()
    {
        await _factory.ResetStateAsync();

        var business = await RegisterBusinessAsync("venueboss");
        var fan = await RegisterUserAsync("eventfan");

        var profileResponse = await business.Client.PutAsJsonAsync("/api/business/profile", new UpsertBusinessProfileRequest(
            BusinessName: "Velvet Social Club",
            Category: "events-experiences",
            Description: "Curated events for Detroit singles.",
            Website: "https://velvet.example.com",
            ContactEmail: "hello@velvet.example.com",
            ContactPhone: "313-555-0100",
            Address: "100 Main St",
            City: "Detroit",
            State: "MI"));
        profileResponse.EnsureSuccessStatusCode();

        await _factory.WithDbContextAsync(async db =>
        {
            var partner = await db.BusinessPartners.SingleAsync(item => item.UserId == business.User.Id);
            partner.Status = BusinessVerificationStatus.Approved;
            await db.SaveChangesAsync();
            return 0;
        });

        var createdEvent = await PostAndReadAsync<BusinessEventResponse>(business.Client, "/api/business/events", new CreateBusinessEventRequest(
            Title: "Friday Night Match Mixer",
            Description: "A social night with conversation prompts.",
            Category: "events-experiences",
            Location: "Velvet Social Club",
            City: "Detroit",
            State: "MI",
            Latitude: 42.3314,
            Longitude: -83.0458,
            StartDate: DateTime.UtcNow.AddDays(7),
            EndDate: DateTime.UtcNow.AddDays(7).AddHours(3),
            Capacity: 120,
            Price: 15,
            ExternalTicketUrl: "https://tickets.example.com/mixer"));

        Assert.Equal(BusinessEventStatus.Draft, createdEvent.Status);
        Assert.Equal(HttpStatusCode.NoContent, (await business.Client.PostAsync($"/api/business/events/{createdEvent.Id}/submit", null)).StatusCode);

        await _factory.WithDbContextAsync(async db =>
        {
            var businessEvent = await db.BusinessEvents.SingleAsync(item => item.Id == createdEvent.Id);
            businessEvent.Status = BusinessEventStatus.Published;
            await db.SaveChangesAsync();
            return 0;
        });

        var publicEvents = await fan.Client.GetFromJsonAsync<List<BusinessEventResponse>>("/api/business-events", TestJson.Default);
        Assert.NotNull(publicEvents);
        Assert.Contains(publicEvents, item => item.Id == createdEvent.Id);

        Assert.Equal(HttpStatusCode.NoContent, (await fan.Client.PostAsync($"/api/business-events/{createdEvent.Id}/like", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await fan.Client.PostAsync($"/api/business-events/{createdEvent.Id}/save", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await fan.Client.PostAsync($"/api/business-events/{createdEvent.Id}/register", null)).StatusCode);

        var createdOffer = await PostAndReadAsync<BusinessOfferResponse>(business.Client, $"/api/business/events/{createdEvent.Id}/offers", new CreateBusinessOfferRequest(
            OfferType: OfferType.Coupon,
            Title: "Welcome Drink",
            Description: "One free welcome drink.",
            CouponCode: "VELVET1",
            ClaimLimit: 25,
            ExpiryDate: DateTime.UtcNow.AddDays(10),
            RedemptionInstructions: "Show the coupon at check-in."));
        Assert.Equal(BusinessOfferStatus.Draft, createdOffer.Status);
        Assert.Equal(HttpStatusCode.NoContent, (await business.Client.PostAsync($"/api/business/offers/{createdOffer.Id}/submit", null)).StatusCode);

        await _factory.WithDbContextAsync(async db =>
        {
            var offer = await db.BusinessOffers.SingleAsync(item => item.Id == createdOffer.Id);
            offer.Status = BusinessOfferStatus.Active;
            await db.SaveChangesAsync();
            return 0;
        });

        var createdChallenge = await PostAndReadAsync<EventChallengeResponse>(business.Client, $"/api/business/events/{createdEvent.Id}/challenge", new CreateEventChallengeRequest(
            Prompt: "What would make this your ideal night out?",
            RewardType: RewardType.Coupon,
            RewardDescription: "VIP lounge access",
            MaxWinners: 1,
            ExpiryDate: DateTime.UtcNow.AddDays(9)));
        Assert.Equal(ChallengeStatus.Draft, createdChallenge.Status);
        Assert.Equal(HttpStatusCode.NoContent, (await business.Client.PostAsync($"/api/business/challenges/{createdChallenge.Id}/submit", null)).StatusCode);

        await _factory.WithDbContextAsync(async db =>
        {
            var challenge = await db.EventChallenges.SingleAsync(item => item.Id == createdChallenge.Id);
            challenge.Status = ChallengeStatus.Active;
            await db.SaveChangesAsync();
            return 0;
        });

        var claimResponse = await fan.Client.PostAsync($"/api/business-events/{createdEvent.Id}/offers/{createdOffer.Id}/claim", null);
        claimResponse.EnsureSuccessStatusCode();

        var challengeResponse = await fan.Client.PostAsJsonAsync(
            $"/api/business-events/{createdEvent.Id}/challenge/respond",
            new SubmitChallengeResponseRequest("A playful crowd, good music, and easy ways to connect."));
        challengeResponse.EnsureSuccessStatusCode();

        var responses = await business.Client.GetFromJsonAsync<List<ChallengeResponseItem>>(
            $"/api/business/challenges/{createdChallenge.Id}/responses",
            TestJson.Default);
        Assert.NotNull(responses);
        Assert.Single(responses);

        Assert.Equal(HttpStatusCode.NoContent, (await business.Client.PostAsJsonAsync(
            $"/api/business/challenges/{createdChallenge.Id}/responses/{responses[0].Id}/win",
            new MarkWinnerRequest("VIP-WIN", "See host at check-in"))).StatusCode);

        var analytics = await business.Client.GetFromJsonAsync<BusinessAnalyticsResponse>("/api/business/analytics", TestJson.Default);
        Assert.NotNull(analytics);
        Assert.Equal(1, analytics.TotalEvents);
        Assert.Equal(1, analytics.PublishedEvents);
        Assert.Equal(1, analytics.TotalLikes);
        Assert.Equal(1, analytics.TotalSaves);
        Assert.Equal(1, analytics.TotalRegistrations);
        Assert.Equal(1, analytics.TotalCouponClaims);
        Assert.Equal(1, analytics.TotalChallengeResponses);
        Assert.Equal(1, analytics.TotalWinners);
        Assert.Single(analytics.EventBreakdown);
        Assert.Equal(createdEvent.Id, analytics.EventBreakdown[0].EventId);
    }

    [Fact]
    public async Task Auth_Profile_Media_And_DeleteAccount_Flow_Works()
    {
        await _factory.ResetStateAsync();

        var ava = await RegisterUserAsync("ava");

        var initialProfile = await ava.Client.GetFromJsonAsync<UserProfileResponse>("/api/profile", TestJson.Default);
        Assert.NotNull(initialProfile);
        Assert.Single(initialProfile.Photos);
        Assert.Equal(DefaultProfilePhoto.DataUrl, initialProfile.Photos[0].Url);

        var updateResponse = await ava.Client.PutAsJsonAsync("/api/profile", new UpdateProfileRequest(
            Bio: "Detroit foodie and hiker.",
            AgeMin: 27,
            AgeMax: 38,
            Intent: "Long-term",
            LookingFor: "single",
            Interests: ["hiking", "coffee"],
            Latitude: 42.33141,
            Longitude: -83.04575,
            City: "Detroit",
            State: "MI",
            ZipCode: "48201",
            RadiusMiles: 30,
            RedFlags: ["smoking"],
            InterestedIn: "Women",
            Neighborhood: "Midtown",
            Ethnicity: null,
            Religion: null,
            RelationshipType: "Monogamous",
            Height: null,
            Children: null,
            FamilyPlans: null,
            Drugs: null,
            Smoking: "",
            Marijuana: null,
            Drinking: "Socially",
            Politics: null,
            EducationLevel: null,
            Weight: null,
            Physique: null,
            SexualPreference: null,
            ComfortWithIntimacy: "Slow burn"));

        updateResponse.EnsureSuccessStatusCode();

        var photo = await UploadAsync<PhotoResponse>(ava.Client, "/api/profile/photos", "ava.png", "image/png", TinyPng);
        var audio = await UploadAsync<UploadAudioBioResponse>(ava.Client, "/api/profile/audio-bio", "intro.mp3", "audio/mpeg", Encoding.UTF8.GetBytes("audio-bio"));
        var videoBio = await UploadAsync<UploadVideoBioResponse>(ava.Client, "/api/profile/video-bio", "intro.mp4", "video/mp4", Encoding.UTF8.GetBytes("video-bio"));
        var highlight = await UploadAsync<VideoResponse>(ava.Client, "/api/profile/videos", "highlight.mp4", "video/mp4", Encoding.UTF8.GetBytes("video-highlight"));

        var updatedProfile = await ava.Client.GetFromJsonAsync<UserProfileResponse>("/api/profile", TestJson.Default);
        Assert.NotNull(updatedProfile);
        Assert.Equal("Detroit foodie and hiker.", updatedProfile.Bio);
        Assert.Equal(
            ["coffee", "hiking"],
            updatedProfile.Interests.OrderBy(interest => interest).ToList());
        Assert.Equal(["smoking"], updatedProfile.RedFlags);
        Assert.Equal("Women", updatedProfile.InterestedIn);
        Assert.Null(updatedProfile.Smoking);
        Assert.Equal(audio.Url, updatedProfile.AudioBioUrl);
        Assert.Equal(videoBio.Url, updatedProfile.VideoBioUrl);
        Assert.Single(updatedProfile.Photos);
        Assert.Equal(photo.Id, updatedProfile.Photos[0].Id);
        Assert.Equal(2, updatedProfile.Videos.Count);

        var dbUser = await _factory.WithDbContextAsync(db => db.Users.SingleAsync(u => u.Id == ava.User.Id));
        Assert.Equal(42.33, dbUser.Latitude);
        Assert.Equal(-83.05, dbUser.Longitude);

        Assert.Equal(HttpStatusCode.NoContent, (await ava.Client.DeleteAsync($"/api/profile/videos/{highlight.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await ava.Client.DeleteAsync($"/api/profile/photos/{photo.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await ava.Client.DeleteAsync("/api/profile/audio-bio")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await ava.Client.DeleteAsync("/api/profile/video-bio")).StatusCode);

        var cleanedProfile = await ava.Client.GetFromJsonAsync<UserProfileResponse>("/api/profile", TestJson.Default);
        Assert.NotNull(cleanedProfile);
        Assert.Single(cleanedProfile.Photos);
        Assert.Equal(DefaultProfilePhoto.DataUrl, cleanedProfile.Photos[0].Url);
        Assert.Null(cleanedProfile.AudioBioUrl);
        Assert.Null(cleanedProfile.VideoBioUrl);
        Assert.Empty(cleanedProfile.Videos);

        Assert.Equal(HttpStatusCode.NoContent, (await ava.Client.DeleteAsync("/api/profile")).StatusCode);
        Assert.Equal(0, await _factory.WithDbContextAsync(db => db.Users.CountAsync()));
    }

    [Fact]
    public async Task Couple_Discovery_And_SavedProfiles_Flow_Works()
    {
        await _factory.ResetStateAsync();

        var morgan = await RegisterUserAsync("morgan");
        var riley = await RegisterUserAsync("riley");
        var casey = await RegisterUserAsync("casey");
        var drew = await RegisterUserAsync("drew");

        await CompleteProfileAsync(morgan.Client, "Morgan profile");
        await CompleteProfileAsync(riley.Client, "Riley profile");
        await CompleteProfileAsync(casey.Client, "Casey profile");
        await CompleteProfileAsync(drew.Client, "Drew profile");

        var createdCouple = await PostAndReadAsync<CreateCoupleResponse>(morgan.Client, "/api/couple", new { });
        var joinedCouple = await PostAndReadAsync<CreateCoupleResponse>(riley.Client, "/api/couple/join", new JoinCoupleRequest(createdCouple.InviteCode));
        Assert.Equal(createdCouple.CoupleId, joinedCouple.CoupleId);

        var discovery = await morgan.Client.GetFromJsonAsync<List<DiscoveryCardResponse>>("/api/discovery?userType=single&take=50", TestJson.Default);
        Assert.NotNull(discovery);
        Assert.Equal(
            new[] { casey.User.Id, drew.User.Id }.OrderBy(id => id),
            discovery.Select(card => card.UserId).OrderBy(id => id));

        Assert.Equal(HttpStatusCode.NoContent, (await morgan.Client.PostAsJsonAsync("/api/saved", new SaveProfileRequest(casey.User.Id))).StatusCode);

        var saved = await morgan.Client.GetFromJsonAsync<List<SavedProfileResponse>>("/api/saved", TestJson.Default);
        Assert.NotNull(saved);
        Assert.Single(saved);
        Assert.Equal(casey.User.Id, saved[0].UserId);

        var afterSave = await morgan.Client.GetFromJsonAsync<List<DiscoveryCardResponse>>("/api/discovery?userType=single&take=50", TestJson.Default);
        Assert.NotNull(afterSave);
        Assert.Single(afterSave);
        Assert.Equal(drew.User.Id, afterSave[0].UserId);

        Assert.Equal(HttpStatusCode.NoContent, (await morgan.Client.DeleteAsync($"/api/saved/{casey.User.Id}")).StatusCode);

        var afterRemove = await morgan.Client.GetFromJsonAsync<List<DiscoveryCardResponse>>("/api/discovery?userType=single&take=50", TestJson.Default);
        Assert.NotNull(afterRemove);
        Assert.Equal(
            new[] { casey.User.Id, drew.User.Id }.OrderBy(id => id),
            afterRemove.Select(card => card.UserId).OrderBy(id => id));

        Assert.Equal(HttpStatusCode.NoContent, (await riley.Client.DeleteAsync("/api/couple")).StatusCode);

        var coupleState = await _factory.WithDbContextAsync(db =>
            db.Couples.SingleAsync(c => c.Id == createdCouple.CoupleId));
        Assert.False(coupleState.IsComplete);
    }

    [Fact]
    public async Task GroupMatching_Messaging_And_Notification_Endpoints_Work()
    {
        await _factory.ResetStateAsync();

        var jordan = await RegisterUserAsync("jordan");
        var taylor = await RegisterUserAsync("taylor");
        var alex = await RegisterUserAsync("alex");

        await CompleteProfileAsync(jordan.Client, "Jordan profile");
        await CompleteProfileAsync(taylor.Client, "Taylor profile");
        await CompleteProfileAsync(alex.Client, "Alex profile");

        var couple = await PostAndReadAsync<CreateCoupleResponse>(jordan.Client, "/api/couple", new { });
        await PostAndReadAsync<CreateCoupleResponse>(taylor.Client, "/api/couple/join", new JoinCoupleRequest(couple.InviteCode));

        var firstLike = await LikeUserAsync(alex.Client, jordan.User.Id);
        Assert.False(firstLike.Matched);
        Assert.Null(firstLike.Match);

        var secondLike = await LikeUserAsync(jordan.Client, alex.User.Id);
        Assert.True(secondLike.Matched);
        Assert.NotNull(secondLike.Match);
        Assert.True(secondLike.Match.IsGroupChat);
        Assert.Equal(2, secondLike.Match.Participants.Count);

        var taylorMatches = await taylor.Client.GetFromJsonAsync<List<MatchResponse>>("/api/match", TestJson.Default);
        Assert.NotNull(taylorMatches);
        Assert.Single(taylorMatches);
        Assert.True(taylorMatches[0].IsGroupChat);

        var message = await PostAndReadAsync<MessageResponse>(alex.Client, $"/api/message/{secondLike.Match.MatchId}", new SendMessageRequest("Hey both!"));
        Assert.Equal("Hey both!", message.Content);

        var thread = await taylor.Client.GetFromJsonAsync<List<MessageResponse>>($"/api/message/{secondLike.Match.MatchId}", TestJson.Default);
        Assert.NotNull(thread);
        Assert.Single(thread);
        Assert.Equal("Hey both!", thread[0].Content);
        Assert.True(thread[0].IsRead);

        var notifications = await jordan.Client.GetFromJsonAsync<NotificationListResponse>("/api/notifications", TestJson.Default);
        Assert.NotNull(notifications);
        Assert.NotEmpty(notifications.Notifications);
        Assert.True(notifications.UnreadCount > 0);

        Assert.Equal(HttpStatusCode.NoContent, (await jordan.Client.PostAsync($"/api/notifications/{notifications.Notifications[0].Id}/read", null)).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await jordan.Client.PostAsync("/api/notifications/read-all", null)).StatusCode);

        var clearedNotifications = await jordan.Client.GetFromJsonAsync<NotificationListResponse>("/api/notifications", TestJson.Default);
        Assert.NotNull(clearedNotifications);
        Assert.Equal(0, clearedNotifications.UnreadCount);

        Assert.Equal(HttpStatusCode.NoContent, (await taylor.Client.DeleteAsync($"/api/match/{secondLike.Match.MatchId}")).StatusCode);

        var blockedSend = await alex.Client.PostAsJsonAsync($"/api/message/{secondLike.Match.MatchId}", new SendMessageRequest("Still there?"));
        Assert.Equal(HttpStatusCode.BadRequest, blockedSend.StatusCode);
    }

    [Fact]
    public async Task Safety_And_Events_Flows_Work()
    {
        await _factory.ResetStateAsync();

        var june = await RegisterUserAsync("june");
        var blake = await RegisterUserAsync("blake");

        await CompleteProfileAsync(june.Client, "June profile", latitude: 42.3314, longitude: -83.0458, radiusMiles: 20);
        await CompleteProfileAsync(blake.Client, "Blake profile", latitude: 42.3350, longitude: -83.0500, radiusMiles: 20);

        await LikeUserAsync(june.Client, blake.User.Id);
        await LikeUserAsync(blake.Client, june.User.Id);

        Assert.Equal(HttpStatusCode.OK, (await june.Client.PostAsJsonAsync("/api/safety/report",
            new ReportRequest(blake.User.Id, "Spam", "Sent inappropriate content"))).StatusCode);

        Assert.Equal(HttpStatusCode.OK, (await june.Client.PostAsJsonAsync("/api/safety/block", new BlockRequest(blake.User.Id))).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await blake.Client.GetAsync($"/api/profile/{june.User.Id}")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await june.Client.DeleteAsync($"/api/safety/block/{blake.User.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await blake.Client.GetAsync($"/api/profile/{june.User.Id}")).StatusCode);

        var createdEvent = await PostAndReadAsync<EventResponse>(june.Client, "/api/event", new CreateEventRequest(
            Title: "Detroit Rooftop Mixer",
            Description: "Meet people downtown.",
            BannerUrl: "https://example.com/banner.jpg",
            EventDate: DateTime.UtcNow.AddDays(7),
            Latitude: 42.3320,
            Longitude: -83.0400,
            City: "Detroit",
            State: "MI",
            Venue: "Monarch Club"));

        var events = await june.Client.GetFromJsonAsync<List<EventResponse>>("/api/event", TestJson.Default);
        Assert.NotNull(events);
        Assert.Single(events);
        Assert.Equal(createdEvent.Id, events[0].Id);

        var interested = await PostAndReadAsync<EventInterestToggleResponse>(june.Client, $"/api/event/{createdEvent.Id}/interest", new { });
        Assert.True(interested.IsInterested);
        Assert.Equal(1, interested.InterestedCount);

        var uninterested = await PostAndReadAsync<EventInterestToggleResponse>(june.Client, $"/api/event/{createdEvent.Id}/interest", new { });
        Assert.False(uninterested.IsInterested);
        Assert.Equal(0, uninterested.InterestedCount);

        Assert.Equal(HttpStatusCode.OK, (await june.Client.DeleteAsync($"/api/event/{createdEvent.Id}")).StatusCode);
        var afterDelete = await june.Client.GetFromJsonAsync<List<EventResponse>>("/api/event", TestJson.Default);
        Assert.NotNull(afterDelete);
        Assert.Empty(afterDelete);
    }

    [Fact]
    public async Task ImpressMe_PreMatch_Flow_CreatesMatch_And_UpdatesSummary()
    {
        await _factory.ResetStateAsync();

        var sam = await RegisterUserAsync("sam");
        var lee = await RegisterUserAsync("lee");

        await CompleteProfileAsync(sam.Client, "Sam profile");
        await CompleteProfileAsync(lee.Client, "Lee profile", interests: ["hiking"]);

        var signal = await PostAndReadAsync<ImpressMeSignalResponse>(sam.Client, "/api/impress-me", new SendImpressMeRequest(lee.User.Id, null));
        Assert.Equal("PreMatch", signal.Flow);
        Assert.Equal("Sent", signal.Status);
        Assert.Equal("Outdoors", signal.Prompt.Category);

        var leeSummary = await lee.Client.GetFromJsonAsync<ImpressMeSummaryResponse>("/api/impress-me/summary", TestJson.Default);
        Assert.NotNull(leeSummary);
        Assert.Equal(1, leeSummary.ReceivedUnreadCount);

        var leeNotifications = await lee.Client.GetFromJsonAsync<NotificationListResponse>("/api/notifications", TestJson.Default);
        Assert.NotNull(leeNotifications);
        Assert.Contains(leeNotifications.Notifications, notification => notification.Type == NotificationType.ImpressMeReceived.ToString());

        var viewedSignal = await lee.Client.GetFromJsonAsync<ImpressMeSignalResponse>($"/api/impress-me/{signal.Id}", TestJson.Default);
        Assert.NotNull(viewedSignal);
        Assert.NotNull(viewedSignal.ViewedAt);

        var afterViewSummary = await lee.Client.GetFromJsonAsync<ImpressMeSummaryResponse>("/api/impress-me/summary", TestJson.Default);
        Assert.NotNull(afterViewSummary);
        Assert.Equal(0, afterViewSummary.ReceivedUnreadCount);

        var responded = await PostAndReadAsync<ImpressMeSignalResponse>(lee.Client, $"/api/impress-me/{signal.Id}/respond", new ImpressMeRespondRequest("Sunrise hikes and post-trail coffee."));
        Assert.Equal("Responded", responded.Status);

        var samSummary = await sam.Client.GetFromJsonAsync<ImpressMeSummaryResponse>("/api/impress-me/summary", TestJson.Default);
        Assert.NotNull(samSummary);
        Assert.Equal(1, samSummary.SentNeedsReviewCount);

        var reviewed = await PostAndReadAsync<ImpressMeSignalResponse>(sam.Client, $"/api/impress-me/{signal.Id}/review", new { });
        Assert.Equal("Viewed", reviewed.Status);

        var accepted = await PostAndReadAsync<ImpressMeSignalResponse>(sam.Client, $"/api/impress-me/{signal.Id}/accept", new { });
        Assert.Equal("Accepted", accepted.Status);

        var matches = await sam.Client.GetFromJsonAsync<List<MatchResponse>>("/api/match", TestJson.Default);
        Assert.NotNull(matches);
        Assert.Single(matches);
    }

    private async Task<TestSession> RegisterUserAsync(string username)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            Username: username,
            Email: $"{username}@example.com",
            Password: "Password123!"));

        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(TestJson.Default);
        Assert.NotNull(auth);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return new TestSession(client, auth.User);
    }

    private async Task<TestSession> RegisterBusinessAsync(string username)
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/business/register", new RegisterBusinessRequest(
            Username: username,
            Email: $"{username}@example.com",
            Password: "Password123!"));

        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(TestJson.Default);
        Assert.NotNull(auth);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return new TestSession(client, auth.User);
    }

    private static async Task CompleteProfileAsync(
        HttpClient client,
        string bio,
        List<string>? interests = null,
        double? latitude = 42.3314,
        double? longitude = -83.0458,
        int? radiusMiles = 25)
    {
        var response = await client.PutAsJsonAsync("/api/profile", new UpdateProfileRequest(
            Bio: bio,
            AgeMin: 25,
            AgeMax: 35,
            Intent: "Dating",
            LookingFor: "single",
            Interests: interests ?? ["music"],
            Latitude: latitude,
            Longitude: longitude,
            City: "Detroit",
            State: "MI",
            ZipCode: "48201",
            RadiusMiles: radiusMiles,
            RedFlags: null,
            InterestedIn: null,
            Neighborhood: null,
            Ethnicity: null,
            Religion: null,
            RelationshipType: null,
            Height: null,
            Children: null,
            FamilyPlans: null,
            Drugs: null,
            Smoking: null,
            Marijuana: null,
            Drinking: null,
            Politics: null,
            EducationLevel: null,
            Weight: null,
            Physique: null,
            SexualPreference: null,
            ComfortWithIntimacy: null));

        response.EnsureSuccessStatusCode();
    }

    private static async Task<LikeResult> LikeUserAsync(HttpClient client, Guid targetUserId)
    {
        var response = await client.PostAsJsonAsync("/api/match/like", new LikeRequest(targetUserId));
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<LikeResult>(TestJson.Default);
        Assert.NotNull(payload);
        return payload;
    }

    private static async Task<T> PostAndReadAsync<T>(HttpClient client, string uri, object body)
    {
        var response = await client.PostAsJsonAsync(uri, body);
        response.EnsureSuccessStatusCode();

        var value = await response.Content.ReadFromJsonAsync<T>(TestJson.Default);
        Assert.NotNull(value);
        return value;
    }

    private static async Task<T> UploadAsync<T>(HttpClient client, string uri, string fileName, string contentType, byte[] bytes)
    {
        using var form = new MultipartFormDataContent();
        using var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        form.Add(content, "file", fileName);

        var response = await client.PostAsync(uri, form);
        response.EnsureSuccessStatusCode();

        var value = await response.Content.ReadFromJsonAsync<T>(TestJson.Default);
        Assert.NotNull(value);
        return value;
    }

    private sealed record LikeResult(bool Matched, MatchResponse? Match);

    private sealed record TestSession(HttpClient Client, UserProfileResponse User);
}
