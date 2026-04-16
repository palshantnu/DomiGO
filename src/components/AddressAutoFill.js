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

const AddressAutoFill = ({ apiKey, onSelect, value }) => {
    const [query, setQuery] = useState(value || "");
    const [results, setResults] = useState([]);

    const fetchPlaces = async (text) => {
        setQuery(text);

        if (text.length < 2) {
            setResults([]);
            return;
        }

        try {
            const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                text
            )}&key=${apiKey}`;

            const response = await fetch(url);
            const json = await response.json();

            setResults(json.status === "OK" ? json.predictions : []);
        } catch (err) {
            console.log("Autocomplete error:", err);
        }
    };

    const handleSelect = async (item) => {
        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${apiKey}`
            );

            const json = await res.json();
            const result = json.result;

            let city = "";
            let state = "";
            let country = "";

            result.address_components.forEach((component) => {
                if (component.types.includes("locality")) {
                    city = component.long_name;
                }
                if (component.types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                }
                if (component.types.includes("country")) {
                    country = component.long_name;
                }

                // fallback
                if (!city && component.types.includes("administrative_area_level_2")) {
                    city = component.long_name;
                }
            });

            setQuery(result.formatted_address);
            setResults([]);

            onSelect({
                address: result.formatted_address,
                city,
                state,
                country,
            });

        } catch (e) {
            console.log("Place details error:", e);
        }
    };

    return (
        <View>
            <View style={styles.inputRow}>
                {/* <Ionicons name="location-outline" size={18} color="#595959" /> */}
                <TextInput
                    placeholder="Search Address"
                    value={query}
                    onChangeText={fetchPlaces}
                    style={styles.input}
                />
            </View>

            {results.length > 0 && (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.place_id}
                    style={styles.dropdown}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.item}
                            onPress={() => handleSelect(item)}
                        >
                            <Text>{item.description}</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
};

export default AddressAutoFill;

const styles = StyleSheet.create({
    inputRow: {
        flexDirection: "row",
        // alignItems: "center",
        // backgroundColor: "#F2F2F2",
        backgroundColor: "#FFF",
        borderRadius: 10,
        // padding: 10,
        borderWidth:1,
        borderColor:'#ccc'
    },
    input: {
        // marginLeft: 10,
        flex: 1,
    },
    dropdown: {
        backgroundColor: "#fff",
        marginTop: 5,
        borderRadius: 10,
        maxHeight: 200,
    },
    item: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },
});