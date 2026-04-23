using ThirdWheel.API.Models;

namespace ThirdWheel.API.Services;

public record GeneratedPrompt(string Category, string PromptText, string? SenderContext);

public class PromptGeneratorService
{
    private static readonly Random Rng = new();

    // Maps interest tags (case-insensitive) to (category, prompt templates[])
    private static readonly Dictionary<string, (string Category, string[] Templates)> InterestMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Outdoors & adventure
            { "hiking",       ("Outdoors",    ["Name a trail or view that completely reset your head — describe it in three sentences.", "Describe the perfect sunrise hike: where, who's with you, and what's in your bag.", "You're on a trail with no signal and three hours left. What's going through your mind?"])},
            { "camping",      ("Outdoors",    ["Tell me your best campfire story. The kind you'd only share after midnight.", "Describe your ideal camping setup — solo, couple, or a whole crew?"])},
            { "climbing",     ("Outdoors",    ["What's the hardest route you've sent, and what did it take to get there?", "Climbing is 80% mental. Walk me through how you handle a route you can't crack."])},
            { "surfing",      ("Outdoors",    ["Describe your best wave. What made it different?", "Early mornings, cold water, wax — is it worth it every time or only sometimes?"])},
            { "skiing",       ("Outdoors",    ["Black diamond or back-country — where does your comfort zone end?", "Walk me through a perfect powder day from alarm to après."])},

            // Music
            { "music",        ("Music",       ["Build the perfect 3-song playlist for our first drive. Artist, track, and why.", "Describe a concert that made you feel like time actually stopped.", "What song completely represents where you are right now — and are you brave enough to explain why?"])},
            { "concerts",     ("Music",       ["Tell me about the most electric crowd you've ever stood in.", "What artist would you travel across the country to see live?"])},
            { "guitar",       ("Music",       ["What's the first song you learned and the last one you're actually proud of?", "Write me a two-sentence intro to a song you'd dedicate to a first date."])},
            { "piano",        ("Music",       ["Name a piece you think everyone should hear at least once.", "Is playing for you cathartic, meditative, or something else entirely?"])},
            { "dj",           ("Music",       ["Walk me through how you read a room before you drop the first track.", "What's the one genre you'd never touch and why does everyone keep requesting it?"])},

            // Food & drink
            { "food",         ("Food",        ["Describe your dream meal — who made it, where, and what's the story behind it.", "You have 30 minutes and a full fridge. Walk me through exactly what you make.", "What dish instantly transports you somewhere — or back to someone?"])},
            { "cooking",      ("Food",        ["What's the dish that made you realise you could actually cook?", "Teach me one thing in the kitchen in three sentences. Go."])},
            { "coffee",       ("Food",        ["Order for both of us. Justify your choices.", "Describe your ideal coffee moment — solo ritual or shared table?"])},
            { "wine",         ("Food",        ["Pick a bottle for a first dinner. Tell me about it like you're the sommelier.", "Red, white, or something entirely different — and what does that say about tonight?"])},
            { "baking",       ("Food",        ["What's your signature bake and what does it taste like?", "Sourdough starter or timer-based precision — what kind of baker are you?"])},

            // Travel
            { "travel",       ("Travel",      ["Name a place that completely broke your expectations — positively or negatively.", "Describe a trip where something went wrong and it became the best part.", "Where would you go right now if you had a free week and zero obligations?"])},
            { "backpacking",  ("Travel",      ["What's the lightest thing you've ever packed and the one thing you cannot leave without?", "Describe the best stranger you met on a trip."])},
            { "photography",  ("Creative",    ["Describe the shot you'll never stop chasing.", "Name the image you didn't take that you still think about."])},

            // Gaming & entertainment
            { "gaming",       ("Gaming",      ["What game do you think everyone should play before they die — and why?", "Tell me about a gaming moment that genuinely surprised you.", "Co-op or competitive? What does your answer say about you?"])},
            { "chess",        ("Gaming",      ["What's your opening move and what does it say about how you think?", "Walk me through a game where you were completely out-thought."])},
            { "board games",  ("Gaming",      ["Name three games you'd bring to a first group hang.", "What game turns everyone chaotic and why do you love it anyway?"])},

            // Sports & fitness
            { "fitness",      ("Fitness",     ["What's your 5am motivation when the alarm goes off and everything says no?", "Describe the hardest physical thing you've done and what it taught you."])},
            { "yoga",         ("Fitness",     ["What's the pose you're still working toward and what's the real block?", "Is yoga physical practice or mental practice for you — or is it impossible to separate?"])},
            { "running",      ("Fitness",     ["What's on your playlist for the last mile and why that song?", "Tell me about a run that surprised you."])},
            { "cycling",      ("Fitness",     ["Describe your best ride — route, weather, feeling.", "What keeps you clipping in when your legs say stop?"])},

            // Arts & creative
            { "art",          ("Creative",    ["Name a piece that made you feel something genuinely uncomfortable.", "What do you make that you'd be embarrassed to show people — and how close are you to showing it?"])},
            { "writing",      ("Creative",    ["Write me the opening two sentences of a story that begins with us meeting.", "What's the last line you wrote that you actually liked?"])},
            { "film",         ("Creative",    ["Tell me about a scene that stuck with you long after the credits.", "What film would you make me watch on a first movie night and what are you hoping I feel?"])},
            { "dance",        ("Creative",    ["What song makes you move without thinking?", "Partner dancing or solo — which one is more honest?"])},

            // Weekend & social
            { "brunch",       ("Weekend",     ["Design the perfect Sunday morning. Walk me through it hour by hour.", "What's the one brunch order that says everything about who you are?"])},
            { "movies",       ("Weekend",     ["Name a film you'd make me watch and tell me why you picked it.", "What genre do you watch when you actually want to feel something?"])},
            { "reading",      ("Weekend",     ["What's the last book that genuinely changed how you think?", "Recommend me a book — but reverse-pitch it. Make me not want to read it."])},
            { "podcasts",     ("Weekend",     ["Give me your three-podcast starter pack for a long drive.", "What episode made you stop and replay something?"])},
        };

    private static readonly string[] FallbackPrompts =
    [
        "If our first conversation had a soundtrack, what three songs would set the vibe — and why those?",
        "Describe your ideal Saturday from 8am to midnight. Be specific.",
        "Name the moment in your life you'd most want to revisit — not to change it, just to feel it again.",
        "What's something you're quietly proud of that most people don't know about?",
        "Give me your honest first-date pitch in exactly three sentences.",
        "What does your perfect weekend look like — and what does it reveal about what you actually value?",
        "Tell me about the last thing that made you laugh so hard it was inconvenient.",
        "What's one thing on your list that you keep almost doing?",
        "If you could master one skill overnight, what would it be and why now?",
        "Describe yourself to me using only things you do, not things you are."
    ];

    public GeneratedPrompt Generate(User profileOwner)
    {
        var interests = profileOwner.Interests.Select(i => i.Tag).ToList();

        // Shuffle and try to match an interest to the template map
        foreach (var interest in interests.OrderBy(_ => Rng.Next()))
        {
            if (!InterestMap.TryGetValue(interest, out var entry))
                continue;

            var prompt = entry.Templates[Rng.Next(entry.Templates.Length)];
            var context =
                $"This challenge was picked from one of your listed interests: {interest.ToLowerInvariant()} — let that shape your reply.";
            return new GeneratedPrompt(entry.Category, prompt, context);
        }

        // Generic fallback when no interests match
        var fallback = FallbackPrompts[Rng.Next(FallbackPrompts.Length)];
        return new GeneratedPrompt("Vibe Check", fallback, null);
    }
}
