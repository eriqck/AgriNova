import MembershipPageClient from "./page-client";

export default async function MembershipPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  return <MembershipPageClient selectedPlanCode={resolvedSearchParams.plan || ""} />;
}
