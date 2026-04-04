import PaymentCallbackClientPage from "./payment-callback-client-page";

export default async function PaymentCallbackPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  return <PaymentCallbackClientPage reference={resolvedSearchParams.reference || ""} />;
}
