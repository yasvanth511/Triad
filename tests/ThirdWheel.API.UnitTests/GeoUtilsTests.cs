using ThirdWheel.API.Helpers;

namespace ThirdWheel.API.UnitTests;

public class GeoUtilsTests
{
    [Fact]
    public void DistanceKm_ReturnsZero_ForSameCoordinates()
    {
        var distance = GeoUtils.DistanceKm(42.3314, -83.0458, 42.3314, -83.0458);

        Assert.Equal(0, distance, precision: 6);
    }

    [Fact]
    public void MilesToKilometres_ConvertsExpectedValue()
    {
        var kilometres = GeoUtils.MilesToKilometres(10);

        Assert.Equal(16.0934, kilometres, precision: 4);
    }
}
