import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function GoogleAutoComplete({
  placeholder,
  onSelect,
  type,
  country,
  apiKey,
  icon = "location-outline", // default icon
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const fetchPlaces = async (text) => {
    setQuery(text);
    if (text.length < 2) return;

    try {
      const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=${type}&components=country:${country}&key=${apiKey}`;
      const response = await fetch(endpoint);
      const json = await response.json();
      setResults(json.predictions || []);
    } catch (err) {
      console.log("Autocomplete Error:", err);
    }
  };

  return (
    <View style={{}}>
      {/* SAME UI AS InfoInput */}
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color="#595959" style={styles.inputIcon} />

        <TextInput
          placeholder={placeholder}
          value={query}
          onChangeText={fetchPlaces}
          style={styles.textInput}
          placeholderTextColor="#999"
        />
      </View>

      {/* Dropdown List */}
      {results.length > 0 && (
        <FlatList
          data={results}
          style={styles.dropdownContainer}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(item.description);
                setQuery(item.description);
                setResults([]);
              }}
            >
              <Text style={styles.dropdownText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
  },
  inputIcon: { padding: 8, marginRight: 10 },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },

  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginTop: -8,
    elevation: 5,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  dropdownText: {
    color: "#000",
  },
});
