import { ProfileDetailScreen } from "@/features/profile/profile-detail-screen";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <ProfileDetailScreen userId={userId} />;
}
