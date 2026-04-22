import SwiftUI

struct EventsView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var events: [EventItem] = []
    @State private var isLoading = false
    @State private var activeEventID: UUID?

    var body: some View {
        ScreenContainer(title: "Events") {
            if isLoading {
                ProgressView("Loading nearby events...")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if events.isEmpty, !isLoading {
                EmptyStateCard(
                    title: "No events nearby",
                    message: "Seed a few events or expand the user radius in the backend profile."
                )
            } else {
                ForEach(events) { event in
                    VStack(alignment: .leading, spacing: 14) {
                        RemoteMediaView(path: event.bannerUrl, height: 180)

                        VStack(alignment: .leading, spacing: 6) {
                            Text(event.title)
                                .font(.title3.weight(.bold))
                                .foregroundStyle(BrandStyle.textPrimary)

                            Text(event.description)
                                .font(.subheadline)
                                .foregroundStyle(BrandStyle.textSecondary)
                        }

                        HStack(spacing: 8) {
                            SectionBadge(text: event.eventDate.formatted(date: .abbreviated, time: .shortened), color: BrandStyle.accent)
                            SectionBadge(text: "\(event.city), \(event.state)", color: .blue)
                            if let distance = event.distanceKm {
                                SectionBadge(text: String(format: "%.0f km", distance), color: BrandStyle.secondary)
                            }
                        }

                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(event.venue)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(BrandStyle.textPrimary)

                                Text("\(event.interestedCount) people interested")
                                    .font(.footnote)
                                    .foregroundStyle(BrandStyle.textSecondary)
                            }

                            Spacer()

                            Button {
                                Task {
                                    await toggleInterest(for: event)
                                }
                            } label: {
                                HStack {
                                    if activeEventID == event.id {
                                        ProgressView()
                                            .tint(.white)
                                    }

                                    Text(event.isInterested ? "Interested" : "Join")
                                        .fontWeight(.semibold)
                                }
                                .padding(.horizontal, 14)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(event.isInterested ? BrandStyle.secondary : BrandStyle.accent)
                            .disabled(activeEventID == event.id)
                        }
                    }
                    .triadCard()
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await reload()
        }
        .refreshable {
            await reload()
        }
    }

    private func reload() async {
        isLoading = true
        defer { isLoading = false }

        do {
            events = try await session.loadEvents()
        } catch {
            session.presentError(error)
        }
    }

    private func toggleInterest(for event: EventItem) async {
        activeEventID = event.id
        defer { activeEventID = nil }

        do {
            let response = try await session.toggleInterest(eventId: event.id)
            events = events.map { current in
                guard current.id == event.id else { return current }
                return EventItem(
                    id: current.id,
                    title: current.title,
                    description: current.description,
                    bannerUrl: current.bannerUrl,
                    eventDate: current.eventDate,
                    city: current.city,
                    state: current.state,
                    venue: current.venue,
                    latitude: current.latitude,
                    longitude: current.longitude,
                    distanceKm: current.distanceKm,
                    interestedCount: response.interestedCount,
                    isInterested: response.isInterested
                )
            }
        } catch {
            session.presentError(error)
        }
    }
}
