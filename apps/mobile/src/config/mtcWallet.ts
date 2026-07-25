import AsyncStorage from "@react-native-async-storage/async-storage";

export const MTC_STORAGE_KEY = "@mc/predictions@1";
export const INITIAL_MTC_BALANCE = 680;

export async function readMtcBalance() {
  try {
    const stored = await AsyncStorage.getItem(MTC_STORAGE_KEY);
    if (!stored) return INITIAL_MTC_BALANCE;
    const parsed = JSON.parse(stored) as { balance?: unknown };
    return typeof parsed.balance === "number" && Number.isFinite(parsed.balance)
      ? Math.max(0, Math.round(parsed.balance))
      : INITIAL_MTC_BALANCE;
  } catch {
    return INITIAL_MTC_BALANCE;
  }
}

export async function spendMtcBalance(cost: number) {
  const normalizedCost = Math.max(0, Math.round(cost));

  try {
    const stored = await AsyncStorage.getItem(MTC_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) as Record<string, unknown> : {};
    const storedBalance = parsed.balance;
    const balance = typeof storedBalance === "number" && Number.isFinite(storedBalance)
      ? Math.max(0, Math.round(storedBalance))
      : INITIAL_MTC_BALANCE;

    if (balance < normalizedCost) {
      return { success: false, balance };
    }

    const nextBalance = balance - normalizedCost;
    await AsyncStorage.setItem(
      MTC_STORAGE_KEY,
      JSON.stringify({ ...parsed, balance: nextBalance }),
    );
    return { success: true, balance: nextBalance };
  } catch {
    return { success: false, balance: await readMtcBalance() };
  }
}
