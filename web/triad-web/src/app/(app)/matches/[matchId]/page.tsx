import { MatchChatScreen } from "@/features/matches/match-chat-screen";

export default async function MatchChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return <MatchChatScreen matchId={matchId} />;
}
