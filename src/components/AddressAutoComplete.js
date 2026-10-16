import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const AddressAutoComplete = ({
  placeholder = "Enter Address",
  value,
  onSelect,
  apiKey,
  countryCode, // default India
}) => {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);

  const fetchAddresses = async (text) => {
    setQuery(text);
console.log('text',text);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${apiKey}&types=geocode&components=country:${countryCode}`;

      const res = await fetch(url);
      
      const json = await res.json();
console.log('json',json);
      if (json.status === "OK") {
        setResults(json.predictions);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.log("Address autocomplete error:", err);
      setResults([]);
    }
  };

  const handleSelect = (item) => {
    setQuery(item.description); // 👈 FULL address
    setResults([]);
    onSelect(item.description);
  };

  return (
    <View>
      <View style={styles.inputRow}>
        <Ionicons
          name="location-outline"
          size={18}
          color="#595959"
          style={styles.inputIcon}
        />
        <TextInput
          placeholder={placeholder}
          value={query}
          onChangeText={fetchAddresses}
          style={styles.textInput}
          placeholderTextColor="#999"
        />
      </View>

      {results.length > 0 && (
        // Plain View (FlatList nahi): ye ScrollView ke andar render hota hai
        // aur Google max 5 predictions hi deta hai.
        <View style={styles.dropdown}>
          {results.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              style={styles.item}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.itemText}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default AddressAutoComplete;

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  dropdown: {
    backgroundColor: "#fff",
    marginTop: 4,
    borderRadius: 10,
    elevation: 5,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemText: {
    color: "#000",
    fontSize: 13,
  },
});
