# Third Wheel - Seed Script
# Creates 15 single users + 5 couple pairs (10 users) = 25 total
# Profile photos are assigned by the API as a shared default image.

$BaseUrl = "http://localhost:5127/api"
$Pass    = "Password123!"
$rng     = New-Object System.Random
$SingleProfileCount = 15
$CouplePairCount    = 5
$SingleSeeds = @()
$CoupleSeeds = @()

$FirstNames = @(
    "Ava","Liam","Sofia","Noah","Maya","Theo","Ivy","Julian","Layla","Ezra",
    "Nora","Miles","Chloe","Asher","Ruby","Silas","Aria","Finn","Elena","Kai"
)

$LastNames = @("Monroe","Bennett","Hayes","Donovan","Sinclair")

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
    @{lat=47.6062;  lon=-122.3321; city="Seattle";    state="WA"; zip="98101"},
    @{lat=47.6101;  lon=-122.2015; city="Bellevue";   state="WA"; zip="98004"},
    @{lat=47.2529;  lon=-122.4443; city="Tacoma";     state="WA"; zip="98402"},
    @{lat=47.6588;  lon=-117.4260; city="Spokane";    state="WA"; zip="99201"},
    @{lat=47.0379;  lon=-122.9007; city="Olympia";    state="WA"; zip="98501"},
    @{lat=47.97898; lon=-122.20208; city="Everett";   state="WA"; zip="98201"},
    @{lat=48.7519;  lon=-122.4787; city="Bellingham"; state="WA"; zip="98225"},
    @{lat=45.6387;  lon=-122.6615; city="Vancouver";  state="WA"; zip="98660"},
    @{lat=47.6740;  lon=-122.1215; city="Redmond";    state="WA"; zip="98052"},
    @{lat=47.6769;  lon=-122.2060; city="Kirkland";   state="WA"; zip="98033"},
    @{lat=47.4829;  lon=-122.2171; city="Renton";     state="WA"; zip="98057"},
    @{lat=47.5301;  lon=-122.0326; city="Issaquah";   state="WA"; zip="98027"},
    @{lat=46.6021;  lon=-120.5059; city="Yakima";     state="WA"; zip="98901"},
    @{lat=47.4235;  lon=-120.3103; city="Wenatchee";  state="WA"; zip="98801"},
    @{lat=46.2112;  lon=-119.1372; city="Kennewick";  state="WA"; zip="99336"}
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

function GetSeedIdentity($index) {
    $first = $FirstNames[$index % $FirstNames.Count]
    $last  = $LastNames[[Math]::Floor($index / $FirstNames.Count)]
    $slug  = ($first + "." + $last).ToLowerInvariant()

    return @{
        username = "$first $last"
        email    = "$slug@triad.dev"
    }
}

function RegisterUser($adminToken, $username, $email) {
    $body = '{"username":"' + $username + '","email":"' + $email + '","password":"' + $Pass + '"}'
    return Invoke-RestMethod -Uri "$BaseUrl/admin/seed-user" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -ErrorAction Stop
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
Write-Host "=== Third Wheel Seed ===" -ForegroundColor Magenta
Write-Host ""

# ── PURGE EXISTING SEED DATA ─────────────────────────────────────
Write-Host "=== Purging previous seed data..." -ForegroundColor DarkCyan
try {
    $purgeLogin = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST `
        -Body '{"email":"yasvanth@live.in","password":"qwertyuiop"}' `
        -ContentType "application/json" -ErrorAction Stop
    $adminTok = $purgeLogin.token
    $yasId    = $purgeLogin.user.id
    $r1 = Invoke-RestMethod -Uri "$BaseUrl/admin/seed-users" -Method DELETE `
        -Headers @{Authorization="Bearer $adminTok"} -ErrorAction Stop
    Write-Host ("  Deleted users: " + $r1.deletedUsers) -ForegroundColor DarkCyan
    Write-Host ("  Deleted couples: " + $r1.deletedCouples) -ForegroundColor DarkCyan
    $r2 = Invoke-RestMethod -Uri "$BaseUrl/admin/seed-events" -Method DELETE `
        -Headers @{Authorization="Bearer $adminTok"} -ErrorAction Stop
    Write-Host ("  Deleted events: " + $r2.deleted) -ForegroundColor DarkCyan
} catch {
    Write-Host ("  Reset failed: " + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host ("Creating " + $SingleProfileCount + " single users...") -ForegroundColor Yellow

for ($i = 0; $i -lt $SingleProfileCount; $i++) {
    $identity = GetSeedIdentity $i
    try {
        $auth   = RegisterUser $adminTok $identity.username $identity.email
        $tok    = $auth.token
        $bio    = Pick $Bios
        $aMin   = $rng.Next(21, 32)
        $aMax   = $aMin + $rng.Next(4, 12)
        $intent = Pick $Intents
        $lfor   = if (($i + 1) % 4 -eq 0) { "couple" } else { "single" }
        $ints   = RandInterests
        $loc    = RandLoc
        $radius = Pick $RadiusChoices
        UpdateProfile $tok $bio $aMin $aMax $intent $lfor $ints $loc.lat $loc.lon $loc.city $loc.state $loc.zip $radius
        $SingleSeeds += @{
            username = $identity.username
            email    = $identity.email
            token    = $tok
            userId   = $auth.user.id
        }
        $created++
        Write-Host ("  [S " + ($i + 1) + "/" + $SingleProfileCount + "] " + $identity.username) -ForegroundColor Green
    } catch {
        $failed++
        Write-Host ("  [S " + ($i + 1) + "/" + $SingleProfileCount + "] FAILED " + $identity.username + " -- " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("Creating " + $CouplePairCount + " couple pairs...") -ForegroundColor Yellow

for ($i = 0; $i -lt $CouplePairCount; $i++) {
    $baseIndex = $SingleProfileCount + ($i * 2)
    $identityA = GetSeedIdentity $baseIndex
    $identityB = GetSeedIdentity ($baseIndex + 1)
    try {
        $authA  = RegisterUser $adminTok $identityA.username $identityA.email
        $tokA   = $authA.token
        $locA   = RandLoc
        $radA   = Pick $RadiusChoices
        $aMin   = $rng.Next(24, 36)
        $aMax   = $aMin + $rng.Next(3, 9)
        UpdateProfile $tokA (Pick $Bios) $aMin $aMax (Pick $Intents) "single" (RandInterests) $locA.lat $locA.lon $locA.city $locA.state $locA.zip $radA
        $code   = CreateCouple $tokA

        $authB  = RegisterUser $adminTok $identityB.username $identityB.email
        $tokB   = $authB.token
        $lat2   = [Math]::Round($locA.lat + ($rng.NextDouble() * 0.02 - 0.01), 6)
        $lon2   = [Math]::Round($locA.lon + ($rng.NextDouble() * 0.02 - 0.01), 6)
        $radB   = Pick $RadiusChoices
        $bMin   = $rng.Next(24, 36)
        $bMax   = $bMin + $rng.Next(3, 9)
        UpdateProfile $tokB (Pick $Bios) $bMin $bMax (Pick $Intents) "single" (RandInterests) $lat2 $lon2 $locA.city $locA.state $locA.zip $radB
        JoinCouple    $tokB $code

        $CoupleSeeds += @{
            memberA = @{
                username = $identityA.username
                email    = $identityA.email
                token    = $tokA
                userId   = $authA.user.id
            }
            memberB = @{
                username = $identityB.username
                email    = $identityB.email
                token    = $tokB
                userId   = $authB.user.id
            }
        }
        $created += 2
        Write-Host ("  [C " + ($i + 1) + "/" + $CouplePairCount + "] " + $identityA.username + " + " + $identityB.username) -ForegroundColor Cyan
    } catch {
        $failed++
        Write-Host ("  [C " + ($i + 1) + "/" + $CouplePairCount + "] FAILED pair " + ($i + 1) + " -- " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Magenta
Write-Host ("Created : " + $created + " users") -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ("Errors  : " + $failed) -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

# ── MATCHES FOR YASVANTH ─────────────────────────────────────────
# Reuses the admin token, then for each target seed user:
#   1) seed user likes yasvanth
#   2) yasvanth likes seed user back  --> mutual = match

Write-Host "=== Seeding matches for yasvanth ===" -ForegroundColor Magenta

function LikeUser($token, $targetId) {
    $body = '{"targetUserId":"' + $targetId + '"}'
    return Invoke-RestMethod -Uri "$BaseUrl/match/like" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
}

$yasTok = $adminTok
Write-Host ("  yasvanth id = " + $yasId) -ForegroundColor Gray

# Pick 12 singles + 3 couple first-partners to match with
$matchTargets = @()
$matchTargets += ($SingleSeeds | Select-Object -First 12)
$matchTargets += ($CoupleSeeds | Select-Object -First 3 | ForEach-Object { $_.memberA })

$matchCount = 0
foreach ($target in $matchTargets) {
    try {
        # Step 1: seed user likes yasvanth
        LikeUser $target.token $yasId | Out-Null

        # Step 2: yasvanth likes back -> triggers mutual match
        $result = LikeUser $yasTok $target.userId
        $status = if ($result.matched) { "MATCHED" } else { "liked (no mutual yet)" }
        $matchCount++
        Write-Host ("  [M " + $matchCount + "] " + $target.username + " -> " + $status) -ForegroundColor Green
    } catch {
        Write-Host ("  [M] FAILED " + $target.username + " -- " + $_.Exception.Message) -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("=== Matches seeded: " + $matchCount + " ===" ) -ForegroundColor Magenta
Write-Host ""

# ── SEED EVENTS ─────────────────────────────────────────────────
# Creates upcoming events around Washington State using real Unsplash banners
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
        title       = "Seattle Waterfront Sunset Mixer"
        description = "Golden-hour drinks, live acoustic sets, and an easygoing crowd right on the Seattle waterfront."
        bannerUrl   = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(5)).ToString("o")
        lat         = 47.6054
        lon         = -122.3405
        city        = "Seattle"
        state       = "WA"
        venue       = "Pier 62"
    },
    @{
        title       = "Bellevue Park Wine Walk"
        description = "Stroll downtown Bellevue with pop-up tastings, live music, and small bites from local favorites."
        bannerUrl   = "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(9)).ToString("o")
        lat         = 47.6103
        lon         = -122.2005
        city        = "Bellevue"
        state       = "WA"
        venue       = "Downtown Park"
    },
    @{
        title       = "Tacoma Art Walk & Harbor Night"
        description = "Gallery hopping, waterfront views, and a relaxed late-evening crowd around Tacoma's harbor."
        bannerUrl   = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(12)).ToString("o")
        lat         = 47.2555
        lon         = -122.4417
        city        = "Tacoma"
        state       = "WA"
        venue       = "Point Ruston Waterfront"
    },
    @{
        title       = "Spokane Riverfront 5K & Brunch"
        description = "A casual riverfront run followed by coffee, brunch, and post-race mingling in downtown Spokane."
        bannerUrl   = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(7)).ToString("o")
        lat         = 47.6605
        lon         = -117.4235
        city        = "Spokane"
        state       = "WA"
        venue       = "Riverfront Park"
    },
    @{
        title       = "Bellingham Brews & Boardwalk Meetup"
        description = "Craft pours, bay views, and an easy first-meet atmosphere near the Bellingham waterfront."
        bannerUrl   = "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(14)).ToString("o")
        lat         = 48.7491
        lon         = -122.4883
        city        = "Bellingham"
        state       = "WA"
        venue       = "Boulevard Park"
    },
    @{
        title       = "Olympia Market Social"
        description = "Fresh food, live buskers, and a laid-back community meetup near Olympia's waterfront district."
        bannerUrl   = "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(18)).ToString("o")
        lat         = 47.0497
        lon         = -122.9031
        city        = "Olympia"
        state       = "WA"
        venue       = "Olympia Farmers Market"
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
