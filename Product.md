# Triad — Product Overview

Triad is a dating and social discovery app built for a modern reality: not everyone is a single person looking for another single person. Triad is designed for **singles, couples, and group-aware connection** — letting people find compatible matches regardless of their relationship structure.

---

## Who is Triad for?

- **Singles** looking for a partner, a couple, or a meaningful connection
- **Established couples** who want to explore connections together as a unit
- **Anyone** who wants to meet people at real local events, not just swipe endlessly

---

## The Core Idea

Most dating apps assume everyone is a single individual. Triad doesn't. A couple can create a shared profile, browse as a unit, and match with singles or other couples. The experience is built around **genuine self-expression** — profile photos, an audio bio you record in your own voice, short video highlights — and **intentional discovery** rather than infinite swiping.

---

## Getting Started

```mermaid
flowchart TD
    A([Open Triad]) --> B{Have an account?}
    B -- No --> C[Register with name, email, password]
    B -- Yes --> D[Log in]
    C --> E[Profile created with defaults]
    D --> F[Land on Discover feed]
    E --> G[Fill out your profile]
    G --> F
```

When you first sign up, Triad creates your profile with a default avatar. Before you start discovering others, you're encouraged to complete your profile so that people you encounter see the real you.

---

## Your Profile

Your profile is your identity on Triad. It's rich and expressive by design.

```mermaid
flowchart LR
    P([Your Profile]) --> PH[Photos\nAdd up to 3 photos]
    P --> AB[Audio Bio\nRecord a short voice intro]
    P --> VB[Video Bio\nA short highlight clip]
    P --> BI[Written Bio\nA few sentences about you]
    P --> PR[Preferences\nAge range, intent, looking for]
    P --> LO[Location\nCity, state, zip, radius]
    P --> IN[Interests\nTags that describe you]
    P --> RF[Red Flags\nDeal-breakers you want flagged]
    P --> DP[Dating Preferences\nEthnicity, religion, lifestyle, etc.]
```

### Couple Profiles

If you're part of a couple, one partner creates a couple account and shares an invite code with the other. Once both join, your profile represents you both. You browse and match together.

```mermaid
sequenceDiagram
    participant P1 as Partner 1
    participant App as Triad
    participant P2 as Partner 2

    P1->>App: Create couple account
    App-->>P1: Generates invite code
    P1->>P2: Shares invite code
    P2->>App: Joins couple with invite code
    App-->>P1: Couple linked ✓
    App-->>P2: Couple linked ✓
    Note over P1,P2: Both now browse as one couple profile
```

---

## Discovery

The Discover tab is where you find people. Triad shows you cards — one at a time — from people near you.

```mermaid
flowchart TD
    D([Open Discover]) --> F[Filter: All / Singles / Couples]
    F --> C[Browse profile cards]
    C --> V[View photos, bio, audio, video]
    V --> CH{What do you want to do?}
    CH -- Like --> L[Send a like]
    CH -- Save --> S[Save for later]
    CH -- Skip --> NK[Move to next card]
    CH -- Impress Me --> IM[Send an Impress Me signal]
    L --> ML{Did they like you back?}
    ML -- Yes --> M[It's a Match!]
    ML -- No --> W[Waiting...]
    M --> CH2[Start chatting]
```

Discovery is location-aware. You set a radius on your profile, and Triad only surfaces people within that distance. People you've already liked, saved, or blocked never appear again.

---

## Likes & Matching

Triad uses mutual interest to unlock conversation. You like someone, they like you back — that's a match.

```mermaid
sequenceDiagram
    participant A as You
    participant App as Triad
    participant B as Another User

    A->>App: Like B's profile
    App-->>A: Like recorded
    B->>App: Like A's profile
    App-->>A: 🎉 It's a Match!
    App-->>B: 🎉 It's a Match!
    Note over A,B: Chat thread opens for both
```

Couple-to-single and couple-to-couple matches are fully supported. When a couple matches with someone, the chat includes all members.

---

## Chat

Once matched, you and your match can chat directly inside the app. Messages are delivered in real time.

```mermaid
flowchart LR
    M([A Match]) --> T[Open chat thread]
    T --> TY[Type a message]
    TY --> S[Send]
    S --> R[Message delivered instantly]
    R --> RE[Other side replies]
    RE --> TY
    T --> PD[Tap profile to view their full profile]
    T --> UN[Unmatch if needed]
```

---

## Saved Profiles

Not ready to like someone yet? Save them. The Saved tab is your personal shortlist — people you want to come back to.

```mermaid
flowchart TD
    SV([Saved Tab]) --> SL[See your saved profiles]
    SL --> OP[Open a profile]
    OP --> ACT{Action}
    ACT -- Like --> LK[Send a like from saved]
    ACT -- Remove --> RM[Remove from saved]
    ACT -- Message --> CH[Go to chat if matched]
```

---

## Impress Me

Impress Me is Triad's way of breaking the ice before — or after — a match. Instead of a cold like, you can send a signal with a personal prompt. The other person responds, and if it sparks something, you can take it further.

```mermaid
flowchart TD
    IM([Impress Me]) --> SEND[Send a signal to someone]
    SEND --> PROMPT[They receive your prompt]
    PROMPT --> RESP[They write a response]
    RESP --> YOU[You review their response]
    YOU --> DEC{Your decision}
    DEC -- Accept --> MATCH[Match created]
    DEC -- Decline --> END[Signal closes]
    MATCH --> CHAT[Chat unlocked]
```

Impress Me works both before a match as a warm intro, and after a match as a conversation starter. It's built into your Impress tab in the app.

---

## Events

Triad connects you to real-world events happening near you — curated experiences where you might meet people in person, not just on a screen.

```mermaid
flowchart TD
    EV([Events Tab]) --> LIST[Browse upcoming events near you]
    LIST --> CARD[Tap an event]
    CARD --> DET[See date, venue, description]
    DET --> INT{Interested?}
    INT -- Yes --> JOIN[Mark as Interested]
    INT -- No --> BACK[Go back]
    JOIN --> COUNT[Interested count goes up]
    COUNT --> SOCIAL[See how many people are going]
```

Events are sorted by date and filtered by your location. You can toggle your interest on and off at any time.

---

## Safety

Triad takes safety seriously. If someone makes you uncomfortable, you have tools to protect yourself.

```mermaid
flowchart TD
    SF([Feeling Unsafe?]) --> OPT{Choose an action}
    OPT -- Block --> BL[Block the user]
    OPT -- Report --> RP[Report with a reason]
    BL --> GONE[They disappear from your feed and chat]
    RP --> REV[Triad reviews the report]
    REV --> ACT[Action taken if needed]
```

- **Blocking** someone removes them from your discovery feed, saved list, and any shared chats immediately.
- **Reporting** sends the account for review. You can include a reason and any extra detail.
- Triad also automatically detects and limits spam-like behaviour in messages and profile content.

---

## Red Flags

When you set red flags on your profile — things that are genuine deal-breakers for you — Triad highlights them when they appear in someone else's interests. It's a quiet, automatic heads-up so you can make more informed decisions without it feeling confrontational.

```mermaid
flowchart LR
    RF([You set red flags]) --> DISC[You browse Discovery]
    DISC --> CARD[A profile appears]
    CARD --> CHECK{Do their interests match your red flags?}
    CHECK -- Yes --> WARN[Flagged interests are highlighted in red]
    CHECK -- No --> NORMAL[Profile shown normally]
```

---

## Full User Journey

Here's the end-to-end experience from the moment someone downloads Triad to having a real conversation.

```mermaid
journey
    title A Day on Triad
    section Getting In
      Download and open the app: 5: User
      Register or log in: 5: User
      Complete your profile: 4: User
    section Discovering
      Browse the Discover feed: 5: User
      Listen to someone's audio bio: 5: User
      Watch a video highlight: 5: User
      Save a profile to revisit: 4: User
      Like someone you're excited about: 5: User
    section Connecting
      Receive a like back — it's a match: 5: User
      Open the chat thread: 5: User
      Send your first message: 5: User
      Exchange messages in real time: 5: User
    section Going Further
      Browse local events: 4: User
      Mark an event as interested: 4: User
      Send an Impress Me signal: 4: User
      Accept a response and match: 5: User
    section Staying Safe
      Block or report if needed: 5: User
      Red flags surface deal-breakers quietly: 4: User
```

---

## Key Principles

**Inclusive by design.** Singles and couples are first-class citizens. The app adapts to your relationship structure, not the other way around.

**Expression over swiping.** Audio bios, video highlights, and rich preferences give people a real sense of who you are before any conversation starts.

**Safety first.** Blocking, reporting, anti-spam, and red flag detection are built into every layer of the experience.

**Real-world connection.** Events bring the app into the physical world, creating opportunities to meet in person with shared context.
