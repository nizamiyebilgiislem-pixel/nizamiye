import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SponsorStudentPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/sponsor?student=${id}`);
}
