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
