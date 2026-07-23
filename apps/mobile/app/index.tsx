import { Redirect } from "expo-router";
import { useAuth } from "../src/context/auth";

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return <Redirect href={session ? "/(tabs)" : "/(auth)/sign-in"} />;
}
