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
  isStateSearch = false,
  countryCode,
  stateName,
  apiKey,
  value,
  icon = "location-outline",
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
console.log('====================================');
console.log('value:', value);
console.log('====================================');
  const fetchPlaces = async (text) => {
    setQuery(text);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${apiKey}`;

      // ✅ ONLY STATES
      if (isStateSearch) {
        url += `&types=administrative_area_level_1`;
      }
      // ✅ ONLY CITIES
      else {
        url += `&types=(cities)`;
      }

      // ✅ Country restriction
      if (countryCode) {
        url += `&components=country:${countryCode}`;
      }

      // ✅ Bias cities inside selected state
      if (!isStateSearch && stateName) {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            stateName
          )}&key=${apiKey}`
        );
        const geoJson = await geoRes.json();
        const location = geoJson.results?.[0]?.geometry?.location;

        if (location) {
          url += `&locationbias=circle:500000@${location.lat},${location.lng}`;
        }
      }

      const response = await fetch(url);
      const json = await response.json();

      setResults(json.status === "OK" ? json.predictions : []);
    } catch (err) {
      console.log("Autocomplete Error:", err);
      setResults([]);
    }
  }; 

  const handleSelect = (item) => {
    setQuery(item.description.split(",")[0]); // 👈 sirf naam
    setResults([]);
    onSelect(item.description.split(",")[0]);
  };

  return (
    <View>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color="#595959" style={styles.inputIcon} />

        <TextInput
          placeholder={value || placeholder}
          value={query}
          onChangeText={fetchPlaces}
          style={styles.textInput}
          placeholderTextColor={value ? "#000" : "#999"}
        />
      </View>

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          style={styles.dropdownContainer}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.dropdownText}>
                {item.description.split(",")[0]}
              </Text>
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
    marginTop: 4,
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
