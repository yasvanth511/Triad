using Microsoft.EntityFrameworkCore;
using ThirdWheel.API.DTOs;
using ThirdWheel.API.Models;
using ThirdWheel.API.Services;
using ThirdWheel.API.Tests;

namespace ThirdWheel.API.UnitTests;

public class BusinessServicesTests
{
    [Fact]
    public async Task CreateEventAsync_RejectsUnknownCategory()
    {
        await using var testDb = await SqliteTestDb.CreateAsync();
        await using var db = testDb.CreateContext();

        var owner = TestData.CreateUser("business-owner");
        var partner = new BusinessPartner
        {
            UserId = owner.Id,
            User = owner,
            Status = BusinessVerificationStatus.Approved
        };

        db.Users.Add(owner);
        db.BusinessPartners.Add(partner);
        await db.SaveChangesAsync();

        var service = new BusinessEventService(db);

        var action = () => service.CreateAsync(partner.Id, new CreateBusinessEventRequest(
            Title: "Spring Mixer",
            Description: "Meet new people.",
            Category: "not-a-real-category",
            Location: null,
            City: "Detroit",
            State: "MI",
            Latitude: null,
            Longitude: null,
            StartDate: DateTime.UtcNow.AddDays(3),
            EndDate: DateTime.UtcNow.AddDays(3).AddHours(2),
            Capacity: 30,
            Price: 0,
            ExternalTicketUrl: null));

        await Assert.ThrowsAsync<InvalidOperationException>(action);
    }

    [Fact]
    public async Task ClaimCouponAsync_RequiresOfferToBelongToRequestedEvent()
    {
        await using var testDb = await SqliteTestDb.CreateAsync();
        await using var db = testDb.CreateContext();

        var owner = TestData.CreateUser("offer-owner");
        var viewer = TestData.CreateUser("coupon-user");
        var partner = new BusinessPartner
        {
            UserId = owner.Id,
            User = owner,
            Status = BusinessVerificationStatus.Approved
        };

        var eventOne = new BusinessEvent
        {
            BusinessPartner = partner,
            Title = "Event One",
            Category = "events-experiences",
            Status = BusinessEventStatus.Published
        };

        var eventTwo = new BusinessEvent
        {
            BusinessPartner = partner,
            Title = "Event Two",
            Category = "events-experiences",
            Status = BusinessEventStatus.Published
        };

        var offer = new BusinessOffer
        {
            BusinessEvent = eventOne,
            Title = "VIP Coupon",
            OfferType = OfferType.Coupon,
            Status = BusinessOfferStatus.Active,
            CouponCode = "VIP20"
        };

        db.Users.AddRange(owner, viewer);
        db.BusinessPartners.Add(partner);
        db.BusinessEvents.AddRange(eventOne, eventTwo);
        db.BusinessOffers.Add(offer);
        await db.SaveChangesAsync();

        var service = new BusinessOfferService(db);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.ClaimCouponAsync(viewer.Id, eventTwo.Id, offer.Id));
    }

    [Fact]
    public async Task SubmitResponseAsync_AllowsOnlyOneResponsePerChallenge()
    {
        await using var testDb = await SqliteTestDb.CreateAsync();
        await using var db = testDb.CreateContext();

        var owner = TestData.CreateUser("challenge-owner");
        var responder = TestData.CreateUser("challenge-user");
        var partner = new BusinessPartner
        {
            UserId = owner.Id,
            User = owner,
            Status = BusinessVerificationStatus.Approved
        };

        var businessEvent = new BusinessEvent
        {
            BusinessPartner = partner,
            Title = "Challenge Event",
            Category = "events-experiences",
            Status = BusinessEventStatus.Published
        };

        var challenge = new EventChallenge
        {
            BusinessEvent = businessEvent,
            Prompt = "Tell us why you want to join.",
            Status = ChallengeStatus.Active,
            RewardType = RewardType.Coupon,
            ExpiryDate = DateTime.UtcNow.AddDays(2)
        };

        db.Users.AddRange(owner, responder);
        db.BusinessPartners.Add(partner);
        db.BusinessEvents.Add(businessEvent);
        db.EventChallenges.Add(challenge);
        db.ChallengeResponses.Add(new ChallengeResponse
        {
            User = responder,
            EventChallenge = challenge,
            ResponseText = "First entry"
        });
        await db.SaveChangesAsync();

        var service = new BusinessChallengeService(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitResponseAsync(responder.Id, businessEvent.Id, new SubmitChallengeResponseRequest("Second entry")));
    }
}
