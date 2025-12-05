import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import DatePicker from "react-native-date-picker";
import { pick } from "@react-native-documents/picker";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { SelectList } from "react-native-dropdown-select-list";
import Header from "../components/Header";
import { CustomToast, GOOGLE_KEY } from "../helpers/CommonHelpers";
import { connect, useDispatch } from "react-redux";
import { ADDTRIP, GET_TRIP_DETAILS, GET_TRIP_MODE_LIST, GET_TRIP_TYPE_LIST, UPDATETRIP } from '../redux/actions/action-creator';
import { useNavigation, useRoute } from "@react-navigation/native";



const AddTripScreen = ({

  tripTypeList,
  tripModeList,

  TripDetails
}) => {
  console.log(tripTypeList, tripModeList);
  const modeOptions = tripModeList?.map(item => ({
    key: item.id,
    value: item.name
  }));

  const typeOptions = tripTypeList?.map(item => ({
    key: item.id,
    value: item.name
  }));
  const navigation = useNavigation();

  const route = useRoute();
  const id = route?.params?.id ?? null;
  const isEdit = !!id;
  console.log('isEdit',isEdit,id);
  

  const dispatch = useDispatch()
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const [originData, setOriginData] = useState(null);
  const [destinationData, setDestinationData] = useState(null);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [openStartPicker, setOpenStartPicker] = useState(false);
  const [openEndPicker, setOpenEndPicker] = useState(false);

  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  useEffect(() => {
    if (isEdit) {
      dispatch(GET_TRIP_DETAILS(id));
    }
  }, [isEdit]);

  useEffect(() => {
    if (!TripDetails) return;

    setSelectedMode(TripDetails.mode?.id || null);
    setSelectedType(TripDetails.type?.id || null);

    setOrigin(`${TripDetails.originCity}, ${TripDetails.originState}`);
    setDestination(`${TripDetails.destinationCity}, ${TripDetails.destinationState}`);

    setOriginData({
      city: TripDetails.originCity,
      state: TripDetails.originState,
      lat: TripDetails.originLat,
      lng: TripDetails.originLng,
    });

    setDestinationData({
      city: TripDetails.destinationCity,
      state: TripDetails.destinationState,
      lat: TripDetails.destinationLat,
      lng: TripDetails.destinationLng,
    });

    setStartDate(new Date(TripDetails.startDate));
    setEndDate(new Date(TripDetails.endDate));

    setNotes(TripDetails.notes || "");

    if (TripDetails.attachments?.length > 0) {
      setAttachment(TripDetails.attachments[0]);
    }

  }, [TripDetails]);
  useEffect(() => {
    if (!isEdit) {
    
      setSelectedMode(null);
      setSelectedType(null);
      setOrigin("");
      setDestination("");
      setOriginSuggestions([]);
      setDestinationSuggestions([]);
      setOriginData(null);
      setDestinationData(null);
      setStartDate(new Date());
      setEndDate(new Date());
      setNotes("");
      setAttachment(null);
    }
  }, [isEdit]);
  


  const searchPlaces = async (text, setter) => {
    if (!text) return setter([]);

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=(cities)&key=${GOOGLE_KEY}`
    );

    const data = await res.json();
    setter(data.predictions || []);
  };


  const getPlaceDetails = async (place_id) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${GOOGLE_KEY}`
    );
    const data = await res.json();
    return data.result;
  };


  const pickDocument = async () => {
    try {
      const res = await pick({
        allowMultiSelection: false,
      });
      console.log("Selected File => ", res);
      setAttachment(res[0]); // res returns array
    } catch (err) {

      console.log("Unknown Error: ", err);

    }
  };


  const validateFields = () => {
    if (!origin) {
      CustomToast.show("Please enter origin location");
      return false;
    }

    if (!originData?.city) {
      CustomToast.show("Please select a valid origin from suggestions");
      return false;
    }

    if (!destination) {
      CustomToast.show("Please enter destination location");
      return false;
    }

    if (!destinationData?.city) {
      CustomToast.show("Please select a valid destination from suggestions");
      return false;
    }

    if (!startDate) {
      CustomToast.show("Please select start date");
      return false;
    }

    if (!endDate) {
      CustomToast.show("Please select end date");
      return false;
    }

    if (notes.trim().length === 0) {
      CustomToast.show("Please enter notes");
      return false;
    }
    if (!selectedMode) {
      CustomToast.show("Please select trip mode");
      return false;
    }

    if (!selectedType) {
      CustomToast.show("Please select trip type");
      return false;
    }

    return true;
  };


  const createTripPayload = () => {
    return {
      modeId: selectedMode,
      typeId: selectedType,
      originLat: originData?.lat || null,
      originLng: originData?.lng || null,
      originState: originData?.state || "",
      originCity: originData?.city || "",

      destinationLat: destinationData?.lat || null,
      destinationLng: destinationData?.lng || null,
      destinationState: destinationData?.state || "",
      destinationCity: destinationData?.city || "",

      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),

      attachments: attachment ? [attachment] : []
    };
  };


  const handleSave = () => {
    if (!validateFields()) return;

    const payload = createTripPayload();
    if (isEdit) {
      payload.id = id;
    }
    console.log("FINAL PAYLOAD =>", payload);
    const action = isEdit ? UPDATETRIP(payload) : ADDTRIP(payload);

    setIsLoading(true);
    dispatch(action).then(({ response }) => {
      console.log('response==>', response);
      navigation.goBack();
      setIsLoading(false);
      CustomToast.show(isEdit ? "Trip Updated Successfully!" : "Trip Created Successfully!");
    }).catch((error) => {
      setIsLoading(false);
      CustomToast.show(error?.toString() ?? 'something went wrong');

    });
  };

  useEffect(() => {
    dispatch(GET_TRIP_MODE_LIST());
    dispatch(GET_TRIP_TYPE_LIST());
  }, []);

  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
        <Header title={isEdit ? "Edit Trip" : "Add New Trip"} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Trip Details</Text>


            <View style={{ position: "relative" }}>
              <View style={styles.inputBox}>
                <Ionicons name="location-outline" size={18} color="#777" />
                <TextInput
                  placeholder="Origin Location"
                  value={origin}
                  onChangeText={(text) => {
                    setOrigin(text);
                    searchPlaces(text, setOriginSuggestions);
                  }}
                  style={styles.input}
                />
              </View>

              {originSuggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  {originSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      onPress={async () => {
                        setOrigin(item.description);
                        setOriginSuggestions([]);

                        const details = await getPlaceDetails(item.place_id);

                        const lat = details.geometry.location.lat;
                        const lng = details.geometry.location.lng;

                        const city =
                          details.address_components.find((c) =>
                            c.types.includes("locality")
                          )?.long_name || "";

                        const state =
                          details.address_components.find((c) =>
                            c.types.includes("administrative_area_level_1")
                          )?.short_name || "";

                        setOriginData({ city, state, lat, lng });
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text style={{ color: "#000" }}>{item.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>


            <View style={{ position: "relative", marginTop: 15 }}>
              <View style={styles.inputBox}>
                <Ionicons name="navigate-outline" size={18} color="#777" />
                <TextInput
                  placeholder="Destination Location"
                  value={destination}
                  onChangeText={(text) => {
                    setDestination(text);
                    searchPlaces(text, setDestinationSuggestions);
                  }}
                  style={styles.input}
                />
              </View>

              {destinationSuggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  {destinationSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.place_id}
                      onPress={async () => {
                        setDestination(item.description);
                        setDestinationSuggestions([]);

                        const details = await getPlaceDetails(item.place_id);

                        const lat = details.geometry.location.lat;
                        const lng = details.geometry.location.lng;

                        const city =
                          details.address_components.find((c) =>
                            c.types.includes("locality")
                          )?.long_name || "";

                        const state =
                          details.address_components.find((c) =>
                            c.types.includes("administrative_area_level_1")
                          )?.short_name || "";

                        setDestinationData({ city, state, lat, lng });
                      }}
                      style={styles.suggestionItem}
                    >
                      <Text style={{ color: "#000" }}>{item.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>


            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateBox}
                onPress={() => setOpenStartPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#777" />
                <Text style={styles.dateText}>
                  {startDate.toDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateBox}
                onPress={() => setOpenEndPicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#777" />
                <Text style={styles.dateText}>{endDate.toDateString()}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Trip Mode</Text>

              <SelectList
                setSelected={(val) => setSelectedMode(val)}
                data={modeOptions}
                save="key"
                defaultOption={
                  isEdit && TripDetails?.mode
                    ? { key: TripDetails.mode.id, value: TripDetails.mode.name }
                    : null
                }
                fontFamily="lato"
                search={false}
                arrowicon={<FontAwesome name="chevron-down" size={12} color={'black'} />}
                boxStyles={styles.dropdownBox}
                inputStyles={styles.dropdownInput}
                dropdownStyles={styles.dropdownList}
                dropdownTextStyles={styles.dropdownItem}
                placeholder="Select Trip Mode"
              />
            </View>


            <View style={{ marginBottom: 15 }}>
              <Text style={styles.label}>Trip Type</Text>

              <SelectList
                setSelected={(val) => setSelectedType(val)}
                data={typeOptions}
                save="key"
                defaultOption={
                  isEdit && TripDetails?.type
                    ? { key: TripDetails.type.id, value: TripDetails.type.name }
                    : null
                }
                fontFamily="lato"
                search={false}
                arrowicon={<FontAwesome name="chevron-down" size={12} color={'black'} />}
                boxStyles={styles.dropdownBox}
                inputStyles={styles.dropdownInput}
                dropdownStyles={styles.dropdownList}
                dropdownTextStyles={styles.dropdownItem}
                placeholder="Select Trip Type"
              />
            </View>

            <TextInput
              placeholder="Leave a Notes"
              placeholderTextColor="#777"
              style={styles.notesBox}
              value={notes}
              onChangeText={setNotes}
              multiline
            />


            <TouchableOpacity style={styles.attachBox} onPress={pickDocument}>
              <Ionicons name="attach-outline" size={18} color="#777" />
              <Text style={styles.attachText}>Add document or photo</Text>
            </TouchableOpacity>

            {attachment && (
              <Text style={styles.fileName}>{attachment.name}</Text>
            )}
          </View>


          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveText}>
              {isEdit ? "Update Trip" : "Save Trip"}
            </Text>
          </TouchableOpacity>
        </ScrollView>


        <DatePicker
          modal
          open={openStartPicker}
          date={startDate}
          mode="date"
          onConfirm={(date) => {
            setOpenStartPicker(false);
            setStartDate(date);
          }}
          onCancel={() => setOpenStartPicker(false)}
        />

        <DatePicker
          modal
          open={openEndPicker}
          date={endDate}
          mode="date"
          onConfirm={(date) => {
            setOpenEndPicker(false);
            setEndDate(date);
          }}
          onCancel={() => setOpenEndPicker(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
const mapStateToProps = (state) => ({
  tripModeList: state.common.tripModeList,
  tripTypeList: state.common.tripTypeList,
  TripDetails: state.common.TripDetails,
})



export default connect(mapStateToProps)(AddTripScreen);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  card: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 30,
    minHeight: 55,
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    color: "#000",
  },

  suggestionBox: {
    backgroundColor: "#fff",
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    borderRadius: 10,
    padding: 10,
    zIndex: 999,
    elevation: 5,
  },

  suggestionItem: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 15,
  },

  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    height: 55,
    borderRadius: 30,
    paddingHorizontal: 15,
    width: "48%",
  },

  dateText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#000",
  },

  notesBox: {
    backgroundColor: "#F2F2F2",
    minHeight: 120,
    borderRadius: 25,
    padding: 15,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 15,
  },

  attachBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    height: 55,
    borderRadius: 30,
    paddingHorizontal: 15,
  },

  attachText: { marginLeft: 10, fontSize: 14, color: "#555" },

  fileName: {
    fontSize: 13,
    color: "#333",
    marginTop: 10,
    marginLeft: 5,
  },

  saveBtn: {
    backgroundColor: "#3C9BF4",
    height: 55,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    margin: 15,
  },

  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },

  dropdownBox: {
    backgroundColor: "#F2F2F2",
    borderRadius: 30,
    // paddingHorizontal: 15,
    borderWidth: 0,
    height: 55,
    alignItems: 'center'
  },

  dropdownInput: {
    color: "#000",
    fontSize: 14,
  },

  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 10,

  },

  dropdownItem: {
    color: "#000",
    paddingVertical: 8,
    fontSize: 14,
  }

});
