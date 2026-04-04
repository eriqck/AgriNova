import ListingDetailsPage from "./listing-details-page";

export default async function ListingPage({ params }) {
  const resolvedParams = await params;

  return <ListingDetailsPage listingId={resolvedParams.id} />;
}
