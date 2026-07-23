import { Redirect } from "expo-router";
// Legacy route — the new landing embeds sign-up inside /(auth)/sign-in.
export default function SignUp() {
  return <Redirect href="/(auth)/sign-in" />;
}
