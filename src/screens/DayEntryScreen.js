import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { SelectList } from "react-native-dropdown-select-list";
import { pick } from "@react-native-documents/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { connect, useDispatch } from "react-redux";
import Header from "../components/Header";
import colors from "../theme/colors";
import { CustomToast, GOOGLE_KEY } from "../helpers/CommonHelpers";
import {
    ADDTRIP,
    UPDATETRIP,
    ADDMISSINGDAY,
    UPDATEMISSINGDAY,
    GET_TRIP_MODE_LIST,
    GET_TRIP_TYPE_LIST,
    GET_TYPE_OF_DAY_LIST,
    GET_STATES_LIST,
} from "../redux/actions/action-creator";

/* ---------------- HELPERS ---------------- */

const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString("en-US", { weekday: "long" });
    const date = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${date}-${month}-${year}`;
};

const FieldLabel = ({ title }) => (
    <Text style={styles.label}>{title}</Text>
);

const Toggle = ({ value, onChange }) => (
    <View style={styles.toggleRow}>
        {["Yes", "No"].map((v) => {
            const active = value === (v === "Yes");
            return (
                <TouchableOpacity
                    key={v}
                    onPress={() => onChange(v === "Yes")}
                    style={[styles.toggleBtn, active && styles.toggleActive]}
                >
                    <Text style={{ color: active ? "#fff" : "#555", fontWeight: "600" }}>
                        {v}
                    </Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

const getDefaultOption = (list, selectedId) => {
    if (!list || !selectedId) return null;
    const found = list.find((i) => i.id === selectedId);
    return found ? { key: found.id, value: found.name } : null;
};

/* ---------------- MAIN ---------------- */

const DayEntryScreen = ({
    tripModeList,
    tripTypeList,
    typeOfDayList,
    statesList,
}) => {
    const navigation = useNavigation();
    const route = useRoute();
    const dispatch = useDispatch();



    const isTrip = route.params?.mode === "TRIP";
    const isEdit = route.params?.isEdit ?? false;
    const editData = route.params?.data ?? null;
    const date = route.params?.date;

    console.log('isTrip', isTrip);


    console.log('isTravelling', isTravelling);

    /* ---------------- STATE ---------------- */

    // 1️⃣ Location
    const [stateId, setStateId] = useState(null);

    // 2️⃣ Type of day
    const [typeOfDay, setTypeOfDay] = useState(null);

    // 3️⃣ Commission
    const [isCommissionDay, setIsCommissionDay] = useState(false);

    // 4️⃣ Remote work
    const [isRemoteWork, setIsRemoteWork] = useState(false);

    // 5️⃣ Hours worked
    const [hoursWorked, setHoursWorked] = useState("");

    // 6️⃣ Travelling
    const [isTravelling, setIsTravelling] = useState(false);

    // 7️⃣ Trip Type
    const [tripType, setTripType] = useState(null);

    // 8️⃣ Mode of travel
    const [tripMode, setTripMode] = useState(null);

    // 9️⃣ Confirmation no
    const [confirmationNo, setConfirmationNo] = useState("");

    // 🔟 Vendor
    const [vendor, setVendor] = useState("");

    // 11️⃣ Do you have proof
    const [hasProof, setHasProof] = useState(false);

    // 12️⃣ Proof type
    const [proofType, setProofType] = useState(null);

    // 13️⃣ Notes
    const [notes, setNotes] = useState("");

    // 14️⃣ Attachment
    const [attachment, setAttachment] = useState(null);

    const [loading, setLoading] = useState(false);
    const [startLocation, setStartLocation] = useState("");
    const [endLocation, setEndLocation] = useState("");

    const [startSuggestions, setStartSuggestions] = useState([]);
    const [endSuggestions, setEndSuggestions] = useState([]);

    const [startData, setStartData] = useState(null);
    const [endData, setEndData] = useState(null);

    /* ---------------- MASTER DATA ---------------- */
    const searchPlaces = async (text, setter) => {
        if (!text) return setter([]);

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=(cities)&key=${GOOGLE_KEY}`
        );
        const json = await res.json();
        setter(json.predictions || []);
    };

    const getPlaceDetails = async (placeId) => {
        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_KEY}`
        );
        const json = await res.json();
        return json.result;
    };


    useEffect(() => {
        dispatch(GET_TRIP_MODE_LIST());
        dispatch(GET_TRIP_TYPE_LIST());
        dispatch(GET_TYPE_OF_DAY_LIST());
        dispatch(GET_STATES_LIST());
    }, []);

    useEffect(() => {
        if (isTrip) {
            setIsTravelling(true);
        }
    }, [isTrip,isEdit,editData]);

    /* ---------------- EDIT PREFILL ---------------- */

    useEffect(() => {
        if (!isEdit || !editData || !isTrip) return;

        setStartLocation(
            `${editData.originCity}, ${editData.originState}`
        );
        setEndLocation(
            `${editData.destinationCity}, ${editData.destinationState}`
        );

        setStartData({
            city: editData.originCity,
            state: editData.originState,
            lat: editData.originLat,
            lng: editData.originLng,
        });

        setEndData({
            city: editData.destinationCity,
            state: editData.destinationState,
            lat: editData.destinationLat,
            lng: editData.destinationLng,
        });
        setStateId(editData.stateId || null);
        setTypeOfDay(editData.typeOfDayId || null);
        setIsCommissionDay(!!editData.isCommissionDay);
        setIsRemoteWork(!!editData.isRemoteWork);
        setHoursWorked(editData.remoteHours ? String(editData.remoteHours) : "");
        // setIsTravelling(!!editData.isTravelling);
        setTripType(editData.tripTypeId || null);
        setTripMode(editData.tripModeId || null);
        setConfirmationNo(editData.confirmationNo || "");
        setVendor(editData.vendor || "");
        setHasProof(!!editData.hasProof);
        setProofType(editData.proofType || null);
        setNotes(editData.notes || "");
        setTripType(editData.tripTypeId || null);
        setTripMode(editData.tripModeId || null);


        if (editData.attachments?.length) {
            setAttachment(editData.attachments[0]);
        }
    }, [isEdit, editData, isTrip]);



    console.log('editData', editData);
    console.log('isTravelling', isTravelling);

    // const getDefaultOption = (list, selectedId) => {
    //     if (!list || !selectedId) return null;
    //     const found = list.find(i => i.id === selectedId);
    //     return found ? { key: found.id, value: found.name } : null;
    //   };

    //   useEffect(() => {
    //     if (!isEdit || !editData || !isTrip) return;

    //     setStartLocation(
    //       `${editData.originCity}, ${editData.originState}`
    //     );
    //     setEndLocation(
    //       `${editData.destinationCity}, ${editData.destinationState}`
    //     );

    //     setStartData({
    //       city: editData.originCity,
    //       state: editData.originState,
    //       lat: editData.originLat,
    //       lng: editData.originLng,
    //     });

    //     setEndData({
    //       city: editData.destinationCity,
    //       state: editData.destinationState,
    //       lat: editData.destinationLat,
    //       lng: editData.destinationLng,
    //     });
    //   }, [isEdit, editData, isTrip]);


    /* ---------------- ATTACHMENT ---------------- */

    const pickDocument = async () => {
        const res = await pick({ allowMultiSelection: false });
        setAttachment(res[0]);
    };

    /* ---------------- SAVE ---------------- */

    const handleSave = () => {
        const payload = {
            typeOfDayId: Number(typeOfDay),
            isCommissionDay,
            isRemoteWork,
            remoteHours: isRemoteWork ? Number(hoursWorked) : 0,
            isTravelling,
            tripTypeId: tripType,
            tripModeId: tripMode,
            confirmationNo,
            vendor,
            hasProof,
            proofType,
            notes,
            attachments: attachment ? [attachment] : [],
        };

        if (!isTrip) {
            payload.stateId = stateId;
            payload.date = new Date(date).toISOString().split("T")[0];
        }
        if (isTrip) {
            payload.originCity = startData.city;
            payload.originState = startData.state;
            payload.originLat = startData.lat;
            payload.originLng = startData.lng;

            payload.destinationCity = endData.city;
            payload.destinationState = endData.state;
            payload.destinationLat = endData.lat;
            payload.destinationLng = endData.lng;
        }

        if (isEdit) payload.id = editData.id;

        const action = isTrip
            ? isEdit ? UPDATETRIP(payload) : ADDTRIP(payload)
            : isEdit ? UPDATEMISSINGDAY(payload) : ADDMISSINGDAY(payload);

        setLoading(true);
        dispatch(action)
            .then(() => {
                setLoading(false);
                CustomToast.show(isEdit ? "Updated Successfully" : "Saved Successfully");
                navigation.goBack();
            })
            .catch(() => {
                setLoading(false);
                CustomToast.show("Something went wrong");
            });
    };

    /* ---------------- UI ---------------- */

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <Header title={isEdit ? "Update Entry" : "Add Entry"} />

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        <Text style={styles.dateTitle}>{formatDate(date)}</Text>

                        {!isTrip && (
                            <>
                                <FieldLabel title="Location (State)" />
                                <SelectList
                                    data={statesList?.map((i) => ({ key: i.id, value: i.name }))}
                                    setSelected={setStateId}
                                    save="key"
                                    defaultOption={getDefaultOption(statesList, stateId)}
                                    boxStyles={styles.dropdownBox}
                                />
                            </>
                        )}
                        {/* ===== FIRST BOX : START & END LOCATION (TRIP ONLY) ===== */}
                        {isTrip && (
                            <>
                                <FieldLabel title="Start Location" />

                                <TextInput
                                    value={startLocation}
                                    onChangeText={(text) => {
                                        setStartLocation(text);
                                        searchPlaces(text, setStartSuggestions);
                                    }}
                                    placeholder="Enter start location"
                                    placeholderTextColor="#777"
                                    editable={ editData?.creationType != "automatic"}
                                    style={styles.input}
                                />

                                {startSuggestions.map((item) => (
                                    <TouchableOpacity
                                        key={item.place_id}
                                        style={styles.suggestionItem}
                                        onPress={async () => {
                                            const details = await getPlaceDetails(item.place_id);

                                            const city =
                                                details.address_components.find(c =>
                                                    c.types.includes("locality")
                                                )?.long_name || "";

                                            const state =
                                                details.address_components.find(c =>
                                                    c.types.includes("administrative_area_level_1")
                                                )?.short_name || "";

                                            setStartLocation(item.description);
                                            setStartSuggestions([]);
                                            setStartData({
                                                city,
                                                state,
                                                lat: details.geometry.location.lat,
                                                lng: details.geometry.location.lng,
                                            });
                                        }}
                                    >
                                        <Text>{item.description}</Text>
                                    </TouchableOpacity>
                                ))}

                                <FieldLabel title="End Location" />

                                <TextInput
                                    value={endLocation}
                                    onChangeText={(text) => {
                                        setEndLocation(text);
                                        searchPlaces(text, setEndSuggestions);
                                    }}
                                    placeholder="Enter end location"
                                    placeholderTextColor="#777"
                                    editable={ editData?.creationType != "automatic"}
                                    style={styles.input}
                                />

                                {endSuggestions.map((item) => (
                                    <TouchableOpacity
                                        key={item.place_id}
                                        style={styles.suggestionItem}
                                        onPress={async () => {
                                            const details = await getPlaceDetails(item.place_id);

                                            const city =
                                                details.address_components.find(c =>
                                                    c.types.includes("locality")
                                                )?.long_name || "";

                                            const state =
                                                details.address_components.find(c =>
                                                    c.types.includes("administrative_area_level_1")
                                                )?.short_name || "";

                                            setEndLocation(item.description);
                                            setEndSuggestions([]);
                                            setEndData({
                                                city,
                                                state,
                                                lat: details.geometry.location.lat,
                                                lng: details.geometry.location.lng,
                                            });
                                        }}
                                    >
                                        <Text>{item.description}</Text>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}


                        <FieldLabel title="Type of Day" />
                        <SelectList
                            data={typeOfDayList?.map((i) => ({ key: i.id, value: i.name }))}
                            setSelected={setTypeOfDay}
                            save="key"
                            defaultOption={getDefaultOption(typeOfDayList, typeOfDay)}
                            boxStyles={styles.dropdownBox}
                        />

                        <FieldLabel title="Commission Day" />
                        <Toggle value={isCommissionDay} onChange={setIsCommissionDay} />

                        <FieldLabel title="Remote Work" />
                        <Toggle value={isRemoteWork} onChange={setIsRemoteWork} />

                        {isRemoteWork && (
                            <>
                                <FieldLabel title="Hours Worked" />
                                <TextInput
                                    style={styles.input}
                                    value={hoursWorked}
                                    onChangeText={setHoursWorked}
                                    keyboardType="numeric"
                                    placeholder="Enter hours"
                                    placeholderTextColor="#777"
                                />
                            </>
                        )}

                        <FieldLabel title="Travelling" />
                        {isTrip ? (
                            <View style={[styles.toggleRow, { opacity: 0.6 }]}>
                                <View style={[styles.toggleBtn, styles.toggleActive]}>
                                    <Text style={{ color: "#fff", fontWeight: "600" }}>Yes</Text>
                                </View>
                                <View style={styles.toggleBtn}>
                                    <Text style={{ color: "#999", fontWeight: "600" }}>No</Text>
                                </View>
                            </View>
                        ) : (
                            <Toggle value={isTravelling} onChange={setIsTravelling} />
                        )}
                        {/* <Toggle value={isTravelling} onChange={setIsTravelling} /> */}

                        {isTravelling && (
                            <>
                                <FieldLabel title="Trip Type" />
                                <SelectList
                                    data={tripTypeList?.map(i => ({
                                        key: i.id,
                                        value: i.name,
                                    }))}
                                    setSelected={setTripType}
                                    save="key"
                                    defaultOption={getDefaultOption(tripTypeList, tripType)}
                                    boxStyles={styles.dropdownBox}
                                    inputStyles={styles.dropdownInput}
                                />

                                <FieldLabel title="Mode of Travel" />
                                <SelectList
                                    data={tripModeList?.map(i => ({
                                        key: i.id,
                                        value: i.name,
                                    }))}
                                    setSelected={setTripMode}
                                    save="key"
                                    // defaultOption={getDefaultOption(tripModeList, tripMode)}
                                    defaultOption={
                                        isEdit && tripMode?.mode
                                          ? { key: tripMode.mode.id, value: tripMode.mode.name }
                                          : null
                                      }
                                    boxStyles={styles.dropdownBox}
                                    inputStyles={styles.dropdownInput}
                                />
                            </>
                        )}

                        <FieldLabel title="Confirmation Number" />
                        <TextInput
                            style={styles.input}
                            value={confirmationNo}
                            onChangeText={setConfirmationNo}
                            placeholder="PNR / Ref No"
                            placeholderTextColor="#777"
                        />

                        <FieldLabel title="Vendor" />
                        <TextInput
                            style={styles.input}
                            value={vendor}
                            onChangeText={setVendor}
                            placeholder="Vendor name"
                            placeholderTextColor="#777"
                        />

                        <FieldLabel title="Do you have proof?" />
                        <Toggle value={hasProof} onChange={setHasProof} />

                        {hasProof && (
                            <>
                                <FieldLabel title="Proof Type" />
                                <SelectList
                                    data={[
                                        { key: "Receipt", value: "Receipt" },
                                        { key: "Credit card statement", value: "Credit card statement" },
                                        { key: "Other", value: "Other" },
                                    ]}
                                    setSelected={setProofType}
                                    boxStyles={styles.dropdownBox}
                                />
                            </>
                        )}

                        <FieldLabel title="Notes" />
                        <TextInput
                            style={styles.notesBox}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                            placeholder="Add notes"
                            placeholderTextColor="#777"
                        />

                        <FieldLabel title="Attachment" />
                        <TouchableOpacity style={styles.attachBtn} onPress={pickDocument}>
                            <Text style={{ color: colors.primary }}>Add Attachment</Text>
                        </TouchableOpacity>

                        {attachment && (
                            <Text style={styles.fileName}>{attachment.name}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        disabled={loading}
                        onPress={handleSave}
                        style={styles.saveBtn}
                    >
                        <Text style={styles.saveText}>
                            {isEdit ? "Update" : "Save"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

/* ---------------- REDUX ---------------- */

const mapStateToProps = (state) => ({
    tripModeList: state.common.tripModeList,
    tripTypeList: state.common.tripTypeList,
    typeOfDayList: state.common.typeOfDayList,
    statesList: state.common.statesList,
});

export default connect(mapStateToProps)(DayEntryScreen);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    card: {
        margin: 15,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 15,
    },
    dateTitle: {
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
        color: "#000",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#000",
        marginBottom: 6,
        marginTop: 14,
    },
    input: {
        backgroundColor: "#F2F2F2",
        height: 55,
        borderRadius: 30,
        paddingHorizontal: 20,
        fontSize: 14,
        color: "#000",
    },
    notesBox: {
        backgroundColor: "#F2F2F2",
        minHeight: 120,
        borderRadius: 25,
        padding: 15,
        fontSize: 14,
        color: "#000",
        textAlignVertical: "top",
    },
    dropdownBox: {
        backgroundColor: "#F2F2F2",
        borderRadius: 30,
        height: 55,
        alignItems: "center",
    },
    toggleRow: {
        flexDirection: "row",
        marginTop: 6,
    },
    toggleBtn: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    toggleActive: {
        backgroundColor: colors.primary,
    },
    attachBtn: {
        marginTop: 6,
    },
    fileName: {
        fontSize: 13,
        color: "#333",
        marginTop: 6,
    },
    saveBtn: {
        backgroundColor: colors.primary,
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
});
