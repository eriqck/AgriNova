import PaymentCallbackClientPage from "./payment-callback-client-page";

export default async function PaymentCallbackPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  return (
    <PaymentCallbackClientPage
      guestCheckoutToken={resolvedSearchParams.guestCheckoutToken || ""}
      reference={resolvedSearchParams.reference || ""}
    />
  );
}
