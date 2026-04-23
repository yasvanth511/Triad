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
        Directory.CreateDirectory(Path.Combine(_uploadPath, "audio"));
        Directory.CreateDirectory(Path.Combine(_uploadPath, "video"));
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

    public async Task<string> SaveAudioBioAsync(Stream audioStream, string contentType, long sizeBytes)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("image.save_audio_bio");
        activity?.SetTag("triad.audio.content_type", contentType);
        activity?.SetTag("triad.audio.size_bytes", sizeBytes);

        try
        {
            if (!AppConstants.AllowedAudioMimeTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"Unsupported audio type '{contentType}'. Allowed types: mp3, mp4, m4a, aac, wav.");

            var maxBytes = AppConstants.MaxAudioBioSizeMb * 1024L * 1024L;
            if (sizeBytes > maxBytes)
                throw new InvalidOperationException(
                    $"Audio file exceeds the {AppConstants.MaxAudioBioSizeMb} MB limit.");

            var ext = contentType.ToLowerInvariant() switch
            {
                "audio/mpeg" => ".mp3",
                "audio/mp4" or "audio/mp4a-latm" => ".mp4",
                "audio/aac" => ".aac",
                "audio/wav" or "audio/x-wav" or "audio/wave" => ".wav",
                "audio/x-m4a" or "audio/m4a" => ".m4a",
                _ => ".audio"
            };

            var safeFileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(_uploadPath, "audio", safeFileName);

            using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
            await audioStream.CopyToAsync(fileStream);

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "save_audio_bio"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return $"/uploads/audio/{safeFileName}";
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "save_audio_bio"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public void DeleteAudioBio(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return;

        // relativeUrl is like /uploads/audio/guid.mp3
        var fileName = Path.GetFileName(relativeUrl);
        var filePath = Path.Combine(_uploadPath, "audio", fileName);
        if (File.Exists(filePath))
            File.Delete(filePath);
    }

    public void DeletePhoto(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl) || relativeUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            return;

        var fileName = Path.GetFileName(relativeUrl);
        var filePath = Path.Combine(_uploadPath, fileName);
        if (File.Exists(filePath))
            File.Delete(filePath);
    }

    public async Task<string> SaveVideoBioAsync(Stream videoStream, string contentType, long sizeBytes)
    {
        using var activity = Telemetry.ActivitySource.StartActivity("image.save_video_bio");
        activity?.SetTag("triad.video.content_type", contentType);
        activity?.SetTag("triad.video.size_bytes", sizeBytes);

        try
        {
            if (!AppConstants.AllowedVideoMimeTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"Unsupported video type '{contentType}'. Allowed types: mp4, mov, m4v, mpeg, webm.");

            var maxBytes = AppConstants.MaxVideoBioSizeMb * 1024L * 1024L;
            if (sizeBytes > maxBytes)
                throw new InvalidOperationException(
                    $"Video file exceeds the {AppConstants.MaxVideoBioSizeMb} MB limit.");

            var ext = contentType.ToLowerInvariant() switch
            {
                "video/mp4"       => ".mp4",
                "video/quicktime" => ".mov",
                "video/x-m4v"     => ".m4v",
                "video/mpeg"      => ".mpeg",
                "video/webm"      => ".webm",
                _                 => ".mp4"
            };

            var safeFileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(_uploadPath, "video", safeFileName);

            using var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
            await videoStream.CopyToAsync(fileStream);

            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "save_video_bio"),
                new KeyValuePair<string, object?>("outcome", "success"));
            Telemetry.MarkSuccess(activity);
            return $"/uploads/video/{safeFileName}";
        }
        catch (Exception ex)
        {
            Telemetry.ProfileOperations.Add(1,
                new KeyValuePair<string, object?>("operation", "save_video_bio"),
                new KeyValuePair<string, object?>("outcome", "error"),
                new KeyValuePair<string, object?>("exception.type", ex.GetType().Name));
            Telemetry.RecordException(activity, ex);
            throw;
        }
    }

    public void DeleteVideoBio(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl)) return;

        var fileName = Path.GetFileName(relativeUrl);
        var filePath = Path.Combine(_uploadPath, "video", fileName);
        if (File.Exists(filePath))
            File.Delete(filePath);
    }

    public void DeleteVideo(string? relativeUrl) => DeleteVideoBio(relativeUrl);
}
