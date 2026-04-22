using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;

namespace ThirdWheel.API.Services;

public class ImageService
{
    private readonly string _uploadPath;

    public ImageService(IWebHostEnvironment env)
    {
        _uploadPath = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> SavePhotoAsync(Stream imageStream, string fileName)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("image.save_photo");
        activity?.SetTag("triad.photo.file_name", Path.GetFileName(fileName));

        try
        {
            using var image = await Image.LoadAsync(imageStream);
            activity?.SetTag("triad.photo.original_width", image.Width);
            activity?.SetTag("triad.photo.original_height", image.Height);

            image.Metadata.ExifProfile = null;
            image.Metadata.IptcProfile = null;
            image.Metadata.XmpProfile = null;

            if (image.Width > AppConstants.MaxImageWidthPx)
            {
                var ratio = (double)AppConstants.MaxImageWidthPx / image.Width;
                var newHeight = (int)(image.Height * ratio);
                image.Mutate(x => x.Resize(AppConstants.MaxImageWidthPx, newHeight));
                activity?.SetTag("triad.photo.resized", true);
            }

            var safeFileName = $"{Guid.NewGuid()}.jpg";
            var filePath = Path.Combine(_uploadPath, safeFileName);

            await image.SaveAsJpegAsync(filePath);

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "process_photo"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return $"/uploads/{safeFileName}";
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "process_photo"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }
}
