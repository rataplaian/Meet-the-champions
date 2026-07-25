import { Redirect } from "expo-router";
import { useAuth } from "../src/context/auth";
import { BootScreen } from "../src/components/BootScreen";
import { runtimeConfig } from "../src/services";
import { useOnboarding } from "../src/context/onboarding";

export default function Index() {
  const { session, user, loading, initializationError, retryInitialization } = useAuth();
  const { ready, onboarded } = useOnboarding();
  if (loading || initializationError || !ready) {
    return (
      <BootScreen
        mode={runtimeConfig.mode}
        error={initializationError}
        diagnosticsEnabled={runtimeConfig.diagnosticsEnabled}
        onRetry={retryInitialization}
      />
    );
  }
  if (!onboarded) return <Redirect href={"/onboarding" as never} />;
  return <Redirect href={session || user ? "/(tabs)" : "/(auth)/sign-in"} />;
}
