import MembershipCallbackClientPage from "./page-client";

export default async function MembershipCallbackPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  return <MembershipCallbackClientPage reference={resolvedSearchParams.reference || ""} />;
}
