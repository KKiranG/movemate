import { getCustomerProfileForUser } from "@/lib/data/profiles";

export async function resolveSearchRecoveryCustomerId(
  userId: string | null,
  lookupCustomerId = async (nextUserId: string) => {
    const customer = await getCustomerProfileForUser(nextUserId);
    return customer?.id ?? null;
  },
) {
  if (!userId) {
    return null;
  }

  return lookupCustomerId(userId);
}
