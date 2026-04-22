# Third Wheel - Seed Script
# Creates 50 single users + 25 couple pairs (50 users) = 100 total
# Uses randomuser.me for realistic face photos

param(
    [string]$RunTag = (Get-Date -Format "MMddHHmm")
)

$BaseUrl = "http://localhost:5127/api"
$Pass    = "Password123!"
$rng     = New-Object System.Random

$Bios = @(
    "Coffee addict. Dog lover. Adventure seeker.",
    "Wanderer with a passion for good food and great company.",
    "Looking for my partner in crime and board games.",
    "Amateur chef, professional overthinker.",
    "Hiking trails by day, Netflix marathons by night.",
    "Bookworm who also hits the gym occasionally.",
    "Travel enthusiast. 37 countries and counting.",
    "Musician, artist, and chronic plant killer.",
    "Startup founder by day. Jazz pianist by night.",
    "Yoga teacher looking for someone grounded.",
    "PhD in overthinking, Masters in dad jokes.",
    "Rock climber. Foodie. Terrible at texting back.",
    "I make great pasta and better playlists.",
    "Photographer with an eye for beauty in everyday moments.",
    "Eternal optimist. Chronic adventurer.",
    "Software engineer who writes bugs and loves dogs.",
    "Just here to find a fellow sunset chaser.",
    "Craft beer enthusiast and weekend hiker.",
    "ENFJ. Brunch evangelist. Sushi snob.",
    "Looking for someone to explore the city with.",
    "Wine, cheese, and good conversation. In that order.",
    "I speak fluent sarcasm and three human languages.",
    "Gym rat who still orders dessert. Balance.",
    "Passionate about sunsets, street food, and spontaneous trips.",
    "I live for late-night talks and early morning runs."
)

$Intents = @("casual","serious","friendship","exploring")

$AllInterests = @(
    "hiking","cooking","travel","music","photography","reading","gym",
    "gaming","yoga","coffee","art","movies","dancing","cycling","dogs",
    "cats","sushi","wine","startups","meditation","surfing","tennis",
    "running","brunch","podcasts"
)

$Cities = @(
    @{lat=40.7128;  lon=-74.0060;  city="New York";      state="NY"; zip="10001"},
    @{lat=34.0522;  lon=-118.2437; city="Los Angeles";   state="CA"; zip="90001"},
    @{lat=51.5074;  lon=-0.1278;   city="London";        state="England"; zip="EC1A"},
    @{lat=48.8566;  lon=2.3522;    city="Paris";         state="Ile-de-France"; zip="75001"},
    @{lat=52.5200;  lon=13.4050;   city="Berlin";        state="Berlin"; zip="10115"},
    @{lat=35.6762;  lon=139.6503;  city="Tokyo";         state="Tokyo"; zip="100-0001"},
    @{lat=-33.8688; lon=151.2093;  city="Sydney";        state="NSW"; zip="2000"},
    @{lat=37.7749;  lon=-122.4194; city="San Francisco"; state="CA"; zip="94102"},
    @{lat=41.8781;  lon=-87.6298;  city="Chicago";       state="IL"; zip="60601"},
    @{lat=25.2048;  lon=55.2708;   city="Dubai";         state="Dubai"; zip="00000"},
    @{lat=55.7558;  lon=37.6173;   city="Moscow";        state="Moscow"; zip="101000"},
    @{lat=19.0760;  lon=72.8777;   city="Mumbai";        state="Maharashtra"; zip="400001"},
    @{lat=-23.5505; lon=-46.6333;  city="Sao Paulo";     state="SP"; zip="01310"},
    @{lat=1.3521;   lon=103.8198;  city="Singapore";     state="Singapore"; zip="018989"},
    @{lat=43.6532;  lon=-79.3832;  city="Toronto";       state="ON"; zip="M5H 2N2"}
)

function Pick($arr) { return $arr[$rng.Next($arr.Length)] }

function RandInterests {
    return ($AllInterests | Sort-Object { $rng.Next() } | Select-Object -First ($rng.Next(3, 8)))
}

$RadiusChoices = @(5, 10, 15, 20, 25, 30, 50)

function RandLoc {
    $c = $Cities[$rng.Next($Cities.Count)]
    return @{
        lat   = [Math]::Round($c.lat + ($rng.NextDouble() * 0.4 - 0.2), 6)
        lon   = [Math]::Round($c.lon + ($rng.NextDouble() * 0.4 - 0.2), 6)
        city  = $c.city
        state = $c.state
        zip   = $c.zip
    }
}

function RegisterUser($username, $email) {
    $body = '{"username":"' + $username + '","email":"' + $email + '","password":"' + $Pass + '"}'
    return Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
}

function UpdateProfile($token, $bio, $ageMin, $ageMax, $intent, $lookingFor, $interests, $lat, $lon, $city, $state, $zip, $radius) {
    $intArr = ($interests | ForEach-Object { '"' + $_ + '"' }) -join ","
    $body = '{"bio":"' + $bio + '","ageMin":' + $ageMin + ',"ageMax":' + $ageMax +
            ',"intent":"' + $intent + '","lookingFor":"' + $lookingFor +
            '","interests":[' + $intArr + '],"latitude":' + $lat + ',"longitude":' + $lon +
            ',"city":"' + $city + '","state":"' + $state + '","zipCode":"' + $zip +
            '","radiusMiles":' + $radius + '}'
    Invoke-RestMethod -Uri "$BaseUrl/profile" -Method PUT -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop | Out-Null
}

function UploadPhoto($token, $photoUrl) {
    $maxAttempts = 2
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        $tmp = $null
        try {
            $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [Guid]::NewGuid().ToString() + ".jpg")
            $wc = New-Object System.Net.WebClient
            $wc.DownloadFile($photoUrl, $tmp)
            $fileSize = (Get-Item $tmp -ErrorAction SilentlyContinue).Length
            if (-not $fileSize -or $fileSize -lt 1000) {
                Write-Warning "Downloaded file too small (${fileSize}B) from $photoUrl"
                return
            }
            $status = curl.exe -s -o NUL -w "%{http_code}" -X POST "$BaseUrl/profile/photos" `
                -H "Authorization: Bearer $token" `
                -F "file=@${tmp};type=image/jpeg"
            if ($status -match "^2") { return }  # success
            if ($attempt -lt $maxAttempts) {
                Write-Host "    Retry photo upload (HTTP $status)..." -ForegroundColor DarkYellow
            } else {
                Write-Warning "Photo upload HTTP $status for $photoUrl"
            }
        } catch {
            if ($attempt -ge $maxAttempts) {
                Write-Warning ("Photo upload failed: " + $_.Exception.Message)
            }
        } finally {
            if ($tmp) { Remove-Item $tmp -ErrorAction SilentlyContinue }
        }
    }
}

function CreateCouple($token) {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/couple" -Method POST -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    return $resp.inviteCode
}

function JoinCouple($token, $code) {
    $body = '{"inviteCode":"' + $code + '"}'
    Invoke-RestMethod -Uri "$BaseUrl/couple/join" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop | Out-Null
}

$created = 0
$failed  = 0

Write-Host ""
Write-Host ("=== Third Wheel Seed (tag=" + $RunTag + ") ===") -ForegroundColor Magenta
Write-Host ""

# ── PURGE EXISTING SEED DATA ─────────────────────────────────────
Write-Host "=== Purging previous seed data..." -ForegroundColor DarkCyan
try {
    $purgeLogin = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST `
        -Body '{"email":"yasvanth@live.in","password":"qwertyuiop"}' `
        -ContentType "application/json" -ErrorAction Stop
    $purgeTok = $purgeLogin.token
    $r1 = Invoke-RestMethod -Uri "$BaseUrl/admin/seed-users" -Method DELETE `
        -Headers @{Authorization="Bearer $purgeTok"} -ErrorAction Stop
    Write-Host ("  Deleted seed users: " + $r1.deleted) -ForegroundColor DarkCyan
    $r2 = Invoke-RestMethod -Uri "$BaseUrl/admin/seed-events" -Method DELETE `
        -Headers @{Authorization="Bearer $purgeTok"} -ErrorAction Stop
    Write-Host ("  Deleted events: " + $r2.deleted) -ForegroundColor DarkCyan
} catch {
    Write-Host ("  Purge skipped: " + $_.Exception.Message) -ForegroundColor DarkYellow
}
Write-Host ""

Write-Host "Creating 50 single users..." -ForegroundColor Yellow

for ($i = 1; $i -le 50; $i++) {
    $isMale = ($i % 2 -eq 0)
    $pIdx   = [Math]::Ceiling($i / 2)
    $pUrl   = if ($isMale) { "https://randomuser.me/api/portraits/men/" + $pIdx + ".jpg" } else { "https://randomuser.me/api/portraits/women/" + $pIdx + ".jpg" }
    $uname  = "s" + $i + "_" + $RunTag
    $email  = "s" + $i + "_" + $RunTag + "@triad.dev"
    try {
        $auth   = RegisterUser $uname $email
        $tok    = $auth.token
        $bio    = Pick $Bios
        $aMin   = $rng.Next(21, 32)
        $aMax   = $aMin + $rng.Next(5, 14)
        $intent = Pick $Intents
        $lfor   = if ($i % 3 -eq 0) { "couple" } else { "single" }
        $ints   = RandInterests
        $loc    = RandLoc
        $radius = Pick $RadiusChoices
        UpdateProfile $tok $bio $aMin $aMax $intent $lfor $ints $loc.lat $loc.lon $loc.city $loc.state $loc.zip $radius
        UploadPhoto   $tok $pUrl
        $created++
        Write-Host ("  [S " + $i + "/50] " + $uname) -ForegroundColor Green
    } catch {
        $failed++
        Write-Host ("  [S " + $i + "/50] FAILED " + $uname + " -- " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Creating 25 couple pairs..." -ForegroundColor Yellow

for ($i = 1; $i -le 25; $i++) {
    $pIdxM  = $i + 25
    $pIdxF  = $i + 25
    $pUrlA  = "https://randomuser.me/api/portraits/men/" + $pIdxM + ".jpg"
    $pUrlB  = "https://randomuser.me/api/portraits/women/" + $pIdxF + ".jpg"
    $unameA = "c" + $i + "a_" + $RunTag
    $unameB = "c" + $i + "b_" + $RunTag
    $emailA = "c" + $i + "a_" + $RunTag + "@triad.dev"
    $emailB = "c" + $i + "b_" + $RunTag + "@triad.dev"
    try {
        $authA  = RegisterUser $unameA $emailA
        $tokA   = $authA.token
        $locA   = RandLoc
        $radA   = Pick $RadiusChoices
        UpdateProfile $tokA (Pick $Bios) $rng.Next(23,36) ($rng.Next(23,36)+$rng.Next(5,10)) (Pick $Intents) "single" (RandInterests) $locA.lat $locA.lon $locA.city $locA.state $locA.zip $radA
        UploadPhoto   $tokA $pUrlA
        $code   = CreateCouple $tokA

        $authB  = RegisterUser $unameB $emailB
        $tokB   = $authB.token
        $lat2   = [Math]::Round($locA.lat + ($rng.NextDouble() * 0.02 - 0.01), 6)
        $lon2   = [Math]::Round($locA.lon + ($rng.NextDouble() * 0.02 - 0.01), 6)
        $radB   = Pick $RadiusChoices
        UpdateProfile $tokB (Pick $Bios) $rng.Next(23,36) ($rng.Next(23,36)+$rng.Next(5,10)) (Pick $Intents) "single" (RandInterests) $lat2 $lon2 $locA.city $locA.state $locA.zip $radB
        UploadPhoto   $tokB $pUrlB
        JoinCouple    $tokB $code

        $created += 2
        Write-Host ("  [C " + $i + "/25] " + $unameA + " + " + $unameB + "  invite=" + $code) -ForegroundColor Cyan
    } catch {
        $failed++
        Write-Host ("  [C " + $i + "/25] FAILED pair " + $i + " -- " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Magenta
Write-Host ("Created : " + $created + " users") -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ("Errors  : " + $failed) -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

# ── MATCHES FOR YASVANTH ─────────────────────────────────────────
# Logs in as yasvanth, then for each target seed user:
#   1) seed user likes yasvanth
#   2) yasvanth likes seed user back  --> mutual = match
# Uses the last RunTag batch (s1..s12, c1a..c3a)

Write-Host "=== Seeding matches for yasvanth ===" -ForegroundColor Magenta

function LoginUser($email, $password = $Pass) {
    $body = '{"email":"' + $email + '","password":"' + $password + '"}'
    $resp = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    return $resp.token
}

function LikeUser($token, $targetId) {
    $body = '{"targetUserId":"' + $targetId + '"}'
    return Invoke-RestMethod -Uri "$BaseUrl/match/like" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
}

function GetProfile($token) {
    return Invoke-RestMethod -Uri "$BaseUrl/profile" -Method GET -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
}

# Login as yasvanth
try {
    $yasTok = LoginUser "yasvanth@live.in" "qwertyuiop"
} catch {
    Write-Host "  FAILED to login as yasvanth -- " + $_.Exception.Message -ForegroundColor Red
    Write-Host "  Make sure yasvanth@live.in is registered first." -ForegroundColor Yellow
    exit 0
}
$yasProfile = GetProfile $yasTok
$yasId      = $yasProfile.id
Write-Host ("  yasvanth id = " + $yasId) -ForegroundColor Gray

# Pick 12 singles + 3 couple partners to match with
$matchTargets = @(
    @{email="s1_$RunTag@triad.dev"},
    @{email="s2_$RunTag@triad.dev"},
    @{email="s3_$RunTag@triad.dev"},
    @{email="s4_$RunTag@triad.dev"},
    @{email="s5_$RunTag@triad.dev"},
    @{email="s6_$RunTag@triad.dev"},
    @{email="s7_$RunTag@triad.dev"},
    @{email="s8_$RunTag@triad.dev"},
    @{email="s9_$RunTag@triad.dev"},
    @{email="s10_$RunTag@triad.dev"},
    @{email="s11_$RunTag@triad.dev"},
    @{email="s12_$RunTag@triad.dev"},
    @{email="c1a_$RunTag@triad.dev"},
    @{email="c2a_$RunTag@triad.dev"},
    @{email="c3a_$RunTag@triad.dev"}
)

$matchCount = 0
foreach ($target in $matchTargets) {
    try {
        # Step 1: seed user logs in and likes yasvanth
        $seedTok = LoginUser $target.email
        $seedProf = GetProfile $seedTok
        $seedId   = $seedProf.id
        LikeUser $seedTok $yasId | Out-Null

        # Step 2: yasvanth likes back -> triggers mutual match
        $result = LikeUser $yasTok $seedId
        $status = if ($result.matched) { "MATCHED" } else { "liked (no mutual yet)" }
        $matchCount++
        Write-Host ("  [M " + $matchCount + "] " + $target.email + " -> " + $status) -ForegroundColor Green
    } catch {
        Write-Host ("  [M] FAILED " + $target.email + " -- " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("=== Matches seeded: " + $matchCount + " ===" ) -ForegroundColor Magenta
Write-Host ""

# ── SEED EVENTS ─────────────────────────────────────────────────
# Creates upcoming events near major cities using real Unsplash banners
Write-Host "=== Seeding Events ===" -ForegroundColor Magenta

function CreateEvent($token, $title, $description, $bannerUrl, $eventDate, $lat, $lon, $city, $state, $venue) {
    $body = @{
        title       = $title
        description = $description
        bannerUrl   = $bannerUrl
        eventDate   = $eventDate
        latitude    = $lat
        longitude   = $lon
        city        = $city
        state       = $state
        venue       = $venue
    } | ConvertTo-Json
    return Invoke-RestMethod -Uri "$BaseUrl/event" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
}

# Use yasvanth token (already logged in above)
$SeedEvents = @(
    @{
        title       = "NYC Rooftop Music Festival"
        description = "A night of live indie and electronic music under the Manhattan skyline. Food trucks, craft cocktails, and unforgettable vibes."
        bannerUrl   = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(5)).ToString("o")
        lat         = 40.7484
        lon         = -73.9967
        city        = "New York"
        state       = "NY"
        venue       = "230 Fifth Rooftop Bar, Manhattan"
    },
    @{
        title       = "Brooklyn Night Market"
        description = "Over 100 food vendors, artisan crafts, and live performances at Brooklyn's most beloved outdoor market."
        bannerUrl   = "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(9)).ToString("o")
        lat         = 40.7081
        lon         = -73.9571
        city        = "Brooklyn"
        state       = "NY"
        venue       = "Williamsburg Waterfront"
    },
    @{
        title       = "Central Park Jazz in the Park"
        description = "Free outdoor jazz concert series featuring local legends and up-and-coming artists. Bring a blanket and enjoy."
        bannerUrl   = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(12)).ToString("o")
        lat         = 40.7812
        lon         = -73.9665
        city        = "New York"
        state       = "NY"
        venue       = "Central Park Summerstage"
    },
    @{
        title       = "LA Beach Bonfire Party"
        description = "Sunset bonfire on the beach with DJ sets, s'mores stations, and midnight fireworks. 21+ only."
        bannerUrl   = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(7)).ToString("o")
        lat         = 33.9850
        lon         = -118.4695
        city        = "Los Angeles"
        state       = "CA"
        venue       = "Santa Monica Beach"
    },
    @{
        title       = "SF Art Walk & Wine Night"
        description = "Explore Mission District galleries with a curated wine pairing at each stop. Meet the artists and mingle."
        bannerUrl   = "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(14)).ToString("o")
        lat         = 37.7599
        lon         = -122.4148
        city        = "San Francisco"
        state       = "CA"
        venue       = "Mission District Arts Corridor"
    },
    @{
        title       = "Chicago Lakefront 5K & After Party"
        description = "Run along the iconic lakefront trail then celebrate at the finish line festival with food, music, and awards."
        bannerUrl   = "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(18)).ToString("o")
        lat         = 41.8827
        lon         = -87.6158
        city        = "Chicago"
        state       = "IL"
        venue       = "Navy Pier Lakefront"
    }
)

$eventCount = 0
foreach ($e in $SeedEvents) {
    try {
        $result = CreateEvent $yasTok $e.title $e.description $e.bannerUrl $e.eventDate $e.lat $e.lon $e.city $e.state $e.venue
        $eventCount++
        Write-Host ("  [E " + $eventCount + "] " + $e.title + " (" + $e.city + ")") -ForegroundColor Green
    } catch {
        Write-Host ("  [E] FAILED " + $e.title + " -- " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("=== Events seeded: " + $eventCount + " ===") -ForegroundColor Magenta
Write-Host ""
