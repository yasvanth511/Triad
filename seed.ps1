# Third Wheel - Seed Script
# Creates 850 single users + 75 couple pairs (150 users) = 1000 total
# Covers WA, CA, NY. Profile photos assigned by API as shared default image.

$BaseUrl = if ($env:TRIAD_API_BASE_URL) { $env:TRIAD_API_BASE_URL.TrimEnd("/") } else { "http://localhost:5127/api" }
$AdminEmail = if ($env:TRIAD_ADMIN_EMAIL) { $env:TRIAD_ADMIN_EMAIL } else { "yasvanth@live.in" }
$AdminPassword = if ($env:TRIAD_ADMIN_PASSWORD) { $env:TRIAD_ADMIN_PASSWORD } else { "qwertyuiop" }
$Pass    = "Password123!"
$rng     = New-Object System.Random
$SingleProfileCount = 850
$CouplePairCount    = 75
$SingleSeeds = @()
$CoupleSeeds = @()

$FirstNames = @(
    "Ava","Liam","Sofia","Noah","Maya","Theo","Ivy","Julian","Layla","Ezra",
    "Nora","Miles","Chloe","Asher","Ruby","Silas","Aria","Finn","Elena","Kai",
    "Zoe","Caleb","Penelope","Owen","Naomi","Marcus","Isla","Declan","Hazel","Remy",
    "Luna","Jasper","Stella","Felix","Violet","Hugo","Aurora","Leo","Scarlett","Axel",
    "Willow","Eli","Freya","Rowan","Cora","Blake","Amber","Nolan","Clara","Jude",
    "Phoebe","Reid","Ingrid","Soren","Daphne","Matteo","Celeste","Quinn","Petra","Archer"
)

$LastNames = @(
    "Monroe","Bennett","Hayes","Donovan","Sinclair",
    "Fletcher","Caldwell","Ramsey","Thornton","Weston",
    "Hargrove","Vance","Pemberton","Langley","Sutton",
    "Mercer","Holloway","Aldridge","Fairfax","Quincy",
    "Drake","Wolfe","Lennox","Ashford","Davenport"
)

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
    # Washington
    @{lat=47.6062;  lon=-122.3321; city="Seattle";       state="WA"; zip="98101"},
    @{lat=47.6101;  lon=-122.2015; city="Bellevue";      state="WA"; zip="98004"},
    @{lat=47.2529;  lon=-122.4443; city="Tacoma";        state="WA"; zip="98402"},
    @{lat=47.6588;  lon=-117.4260; city="Spokane";       state="WA"; zip="99201"},
    @{lat=47.0379;  lon=-122.9007; city="Olympia";       state="WA"; zip="98501"},
    @{lat=47.97898; lon=-122.20208;city="Everett";       state="WA"; zip="98201"},
    @{lat=48.7519;  lon=-122.4787; city="Bellingham";    state="WA"; zip="98225"},
    @{lat=45.6387;  lon=-122.6615; city="Vancouver";     state="WA"; zip="98660"},
    @{lat=47.6740;  lon=-122.1215; city="Redmond";       state="WA"; zip="98052"},
    @{lat=47.6769;  lon=-122.2060; city="Kirkland";      state="WA"; zip="98033"},
    @{lat=47.4829;  lon=-122.2171; city="Renton";        state="WA"; zip="98057"},
    @{lat=47.5301;  lon=-122.0326; city="Issaquah";      state="WA"; zip="98027"},
    @{lat=46.6021;  lon=-120.5059; city="Yakima";        state="WA"; zip="98901"},
    @{lat=47.4235;  lon=-120.3103; city="Wenatchee";     state="WA"; zip="98801"},
    @{lat=46.2112;  lon=-119.1372; city="Kennewick";     state="WA"; zip="99336"},
    # California
    @{lat=34.0522;  lon=-118.2437; city="Los Angeles";   state="CA"; zip="90001"},
    @{lat=37.7749;  lon=-122.4194; city="San Francisco"; state="CA"; zip="94102"},
    @{lat=32.7157;  lon=-117.1611; city="San Diego";     state="CA"; zip="92101"},
    @{lat=37.3382;  lon=-121.8863; city="San Jose";      state="CA"; zip="95101"},
    @{lat=37.8044;  lon=-122.2712; city="Oakland";       state="CA"; zip="94601"},
    @{lat=33.7701;  lon=-118.1937; city="Long Beach";    state="CA"; zip="90802"},
    @{lat=33.4942;  lon=-117.1484; city="Temecula";      state="CA"; zip="92590"},
    @{lat=38.5816;  lon=-121.4944; city="Sacramento";    state="CA"; zip="95814"},
    @{lat=34.1425;  lon=-118.2551; city="Pasadena";      state="CA"; zip="91101"},
    @{lat=37.5485;  lon=-121.9886; city="Fremont";       state="CA"; zip="94536"},
    @{lat=33.6846;  lon=-117.8265; city="Irvine";        state="CA"; zip="92602"},
    @{lat=36.7378;  lon=-119.7871; city="Fresno";        state="CA"; zip="93701"},
    @{lat=34.4208;  lon=-119.6982; city="Santa Barbara"; state="CA"; zip="93101"},
    @{lat=37.4419;  lon=-122.1430; city="Palo Alto";     state="CA"; zip="94301"},
    @{lat=37.9577;  lon=-122.0598; city="Walnut Creek";  state="CA"; zip="94596"},
    # New York
    @{lat=40.7128;  lon=-74.0060;  city="New York";      state="NY"; zip="10001"},
    @{lat=40.6782;  lon=-73.9442;  city="Brooklyn";      state="NY"; zip="11201"},
    @{lat=40.7282;  lon=-73.7949;  city="Queens";        state="NY"; zip="11354"},
    @{lat=40.8448;  lon=-73.8648;  city="Bronx";         state="NY"; zip="10451"},
    @{lat=40.5795;  lon=-74.1502;  city="Staten Island"; state="NY"; zip="10301"},
    @{lat=43.0481;  lon=-76.1474;  city="Syracuse";      state="NY"; zip="13202"},
    @{lat=42.8864;  lon=-78.8784;  city="Buffalo";       state="NY"; zip="14201"},
    @{lat=43.1566;  lon=-77.6088;  city="Rochester";     state="NY"; zip="14604"},
    @{lat=42.6526;  lon=-73.7562;  city="Albany";        state="NY"; zip="12207"},
    @{lat=40.9176;  lon=-73.7871;  city="Yonkers";       state="NY"; zip="10701"},
    @{lat=40.7357;  lon=-73.9950;  city="Manhattan";     state="NY"; zip="10014"},
    @{lat=41.0534;  lon=-73.5387;  city="White Plains";  state="NY"; zip="10601"},
    @{lat=40.7891;  lon=-73.1360;  city="Huntington";    state="NY"; zip="11743"}
)

function Pick($arr) { return $arr[$rng.Next($arr.Length)] }

function Invoke-WithRetry {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$Action,
        [int]$MaxAttempts = 8,
        [int]$InitialDelayMs = 1500
    )

    $attempt = 1
    $delayMs = $InitialDelayMs

    while ($true) {
        try {
            return & $Action
        } catch {
            $statusCode = $null

            if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
                $statusCode = [int]$_.Exception.Response.StatusCode
            }

            if ($statusCode -ne 429 -or $attempt -ge $MaxAttempts) {
                throw
            }

            Start-Sleep -Milliseconds $delayMs
            $attempt++
            $delayMs = [Math]::Min($delayMs * 2, 15000)
        }
    }
}

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
    $first  = $FirstNames[$index % $FirstNames.Count]
    $bucket = [Math]::Floor($index / $FirstNames.Count)
    $last   = $LastNames[$bucket % $LastNames.Count]
    $cycle  = [Math]::Floor($bucket / $LastNames.Count)
    $suffix = if ($cycle -gt 0) { $cycle.ToString() } else { "" }
    $slug   = ($first + "." + $last + $suffix).ToLowerInvariant()

    return @{
        username = "$first $last$suffix"
        email    = "$slug@triad.dev"
    }
}

function RegisterUser($adminToken, $username, $email) {
    $body = '{"username":"' + $username + '","email":"' + $email + '","password":"' + $Pass + '"}'
    return Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/admin/seed-user" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $adminToken"} -ErrorAction Stop
    }
}

function UpdateProfile($token, $bio, $ageMin, $ageMax, $intent, $lookingFor, $interests, $lat, $lon, $city, $state, $zip, $radius) {
    $intArr = ($interests | ForEach-Object { '"' + $_ + '"' }) -join ","
    $body = '{"bio":"' + $bio + '","ageMin":' + $ageMin + ',"ageMax":' + $ageMax +
            ',"intent":"' + $intent + '","lookingFor":"' + $lookingFor +
            '","interests":[' + $intArr + '],"latitude":' + $lat + ',"longitude":' + $lon +
            ',"city":"' + $city + '","state":"' + $state + '","zipCode":"' + $zip +
            '","radiusMiles":' + $radius + '}'
    Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/profile" -Method PUT -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    } | Out-Null
}

function CreateCouple($token) {
    $resp = Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/couple" -Method POST -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    }
    return $resp.inviteCode
}

function JoinCouple($token, $code) {
    $body = '{"inviteCode":"' + $code + '"}'
    Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/couple/join" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    } | Out-Null
}

$ReportReasons = @("spam","harassment","inappropriate_content","fake_profile","other")

function ReportUser($token, $targetId, $reason) {
    $body = '{"userId":"' + $targetId + '","reason":"' + $reason + '"}'
    Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/safety/report" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    } | Out-Null
}

function BlockUser($token, $targetId) {
    $body = '{"userId":"' + $targetId + '"}'
    Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/safety/block" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    } | Out-Null
}

$created = 0
$failed  = 0

Write-Host ""
Write-Host "=== Third Wheel Seed ===" -ForegroundColor Magenta
Write-Host ""

# ── PURGE EXISTING SEED DATA ─────────────────────────────────────
Write-Host "=== Purging previous seed data..." -ForegroundColor DarkCyan
try {
    $purgeLogin = Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST `
            -Body ('{"email":"' + $AdminEmail + '","password":"' + $AdminPassword + '"}') `
            -ContentType "application/json" -ErrorAction Stop
    }
    $adminTok = $purgeLogin.token
    $yasId    = $purgeLogin.user.id
    $r1 = Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/admin/seed-users" -Method DELETE `
            -Headers @{Authorization="Bearer $adminTok"} -ErrorAction Stop
    }
    Write-Host ("  Deleted users: " + $r1.deletedUsers) -ForegroundColor DarkCyan
    Write-Host ("  Deleted couples: " + $r1.deletedCouples) -ForegroundColor DarkCyan
    $r2 = Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/admin/seed-events" -Method DELETE `
            -Headers @{Authorization="Bearer $adminTok"} -ErrorAction Stop
    }
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

# ── MODERATION SEED ──────────────────────────────────────────────
# ~8% of singles get reported/blocked by a peer; couple members also included.
# Distribution: 0/1/2+ reports, 0/1/2+ blocks for varied admin scenarios.
Write-Host "=== Seeding moderation data ===" -ForegroundColor Magenta

$modCount = 0
$allSeedUsers = @()
$allSeedUsers += $SingleSeeds
$allSeedUsers += ($CoupleSeeds | ForEach-Object { $_.memberA; $_.memberB })

# Build report targets: ~5% of pool gets reported
$reportPool  = $allSeedUsers | Sort-Object { $rng.Next() } | Select-Object -First ([Math]::Max(1, [Math]::Floor($allSeedUsers.Count * 0.05)))
# Build block targets: ~4% of pool gets blocked (some overlap intentional)
$blockPool   = $allSeedUsers | Sort-Object { $rng.Next() } | Select-Object -First ([Math]::Max(1, [Math]::Floor($allSeedUsers.Count * 0.04)))
# Reporters/blockers drawn from remaining pool
$actorPool   = $allSeedUsers | Sort-Object { $rng.Next() }

foreach ($target in $reportPool) {
    $numReports = if ($rng.Next(3) -eq 0) { 2 } else { 1 }
    $reporters  = $actorPool | Where-Object { $_.userId -ne $target.userId } | Select-Object -First $numReports
    foreach ($actor in $reporters) {
        try {
            ReportUser $actor.token $target.userId (Pick $ReportReasons)
            $modCount++
        } catch {}
    }
}

foreach ($target in $blockPool) {
    $numBlocks = if ($rng.Next(4) -eq 0) { 2 } else { 1 }
    $blockers  = $actorPool | Where-Object { $_.userId -ne $target.userId } | Select-Object -First $numBlocks
    foreach ($actor in $blockers) {
        try {
            BlockUser $actor.token $target.userId
            $modCount++
        } catch {}
    }
}

Write-Host ("=== Moderation actions seeded: " + $modCount + " ===") -ForegroundColor Magenta
Write-Host ""

# ── MATCHES FOR YASVANTH ─────────────────────────────────────────
# Reuses the admin token, then for each target seed user:
#   1) seed user likes yasvanth
#   2) yasvanth likes seed user back  --> mutual = match

Write-Host "=== Seeding matches for yasvanth ===" -ForegroundColor Magenta

function LikeUser($token, $targetId) {
    $body = '{"targetUserId":"' + $targetId + '"}'
    return Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/match/like" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    }
}

$yasTok = $adminTok
Write-Host ("  yasvanth id = " + $yasId) -ForegroundColor Gray

# Pick 20 singles + 5 couple first-partners to match with
$matchTargets = @()
$matchTargets += ($SingleSeeds | Select-Object -First 20)
$matchTargets += ($CoupleSeeds | Select-Object -First 5 | ForEach-Object { $_.memberA })

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
    return Invoke-WithRetry {
        Invoke-RestMethod -Uri "$BaseUrl/event" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -ErrorAction Stop
    }
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
    },
    @{
        title       = "LA Rooftop Sunset Social"
        description = "Cocktails, city views, and an easy crowd on a downtown LA rooftop. Singles and couples welcome."
        bannerUrl   = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(6)).ToString("o")
        lat         = 34.0522
        lon         = -118.2437
        city        = "Los Angeles"
        state       = "CA"
        venue       = "Perch Rooftop Bar"
    },
    @{
        title       = "SF Ferry Building Farmer's Market Mixer"
        description = "Artisan bites, bay breezes, and a friendly Saturday crowd along the Embarcadero."
        bannerUrl   = "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(11)).ToString("o")
        lat         = 37.7955
        lon         = -122.3937
        city        = "San Francisco"
        state       = "CA"
        venue       = "Ferry Building Marketplace"
    },
    @{
        title       = "NYC Rooftop Garden Happy Hour"
        description = "Manhattan skyline views, craft cocktails, and a vibrant crowd in Midtown."
        bannerUrl   = "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(8)).ToString("o")
        lat         = 40.7549
        lon         = -73.9840
        city        = "New York"
        state       = "NY"
        venue       = "230 Fifth Rooftop"
    },
    @{
        title       = "Brooklyn Night Market Meetup"
        description = "Street food, local vendors, live DJ sets, and a relaxed open-air vibe in Williamsburg."
        bannerUrl   = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop"
        eventDate   = ([DateTime]::UtcNow.AddDays(15)).ToString("o")
        lat         = 40.7081
        lon         = -73.9571
        city        = "Brooklyn"
        state       = "NY"
        venue       = "Brooklyn Night Market"
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
