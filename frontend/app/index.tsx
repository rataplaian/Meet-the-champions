import { View, ActivityIndicator } from "react-native";
export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "#07111F", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#F5C451" />
    </View>
  );
}
