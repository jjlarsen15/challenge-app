import { RoomView } from "@/components/RoomView";

type RoomPageProps = {
  params: Promise<{ code: string }>;
};

export default async function RoomPage({ params }: RoomPageProps) {
  const { code } = await params;

  return <RoomView key={code.toUpperCase()} code={code.toUpperCase()} />;
}
