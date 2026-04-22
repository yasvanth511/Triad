namespace ThirdWheel.API.Helpers;

public static class GeoUtils
{
    private const double EarthRadiusKm = 6371;
    private const double MilesToKm = 1.60934;

    /// <summary>Haversine distance in kilometres between two lat/lon points.</summary>
    public static double DistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    public static double MilesToKilometres(int miles) => miles * MilesToKm;

    private static double ToRad(double deg) => deg * Math.PI / 180;
}
