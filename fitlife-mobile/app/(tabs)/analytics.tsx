import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function AnalyticsScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">Analytics</ThemedText>
      <ThemedText>Analytics content coming soon.</ThemedText>
    </ThemedView>
  );
} 