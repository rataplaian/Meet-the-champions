import { Redirect } from "expo-router";
import { useAuth } from "../src/context/auth";
import { BootScreen } from "../src/components/BootScreen";
import { runtimeConfig } from "../src/services";

export default function Index() {
  const { session, loading, initializationError, retryInitialization } = useAuth();
  if (loading || initializationError) {
    return (
      <BootScreen
        mode={runtimeConfig.mode}
        error={initializationError}
        diagnosticsEnabled={runtimeConfig.diagnosticsEnabled}
        onRetry={retryInitialization}
      />
    );
  }
  return <Redirect href={session ? "/(tabs)" : "/(auth)/sign-in"} />;
}
