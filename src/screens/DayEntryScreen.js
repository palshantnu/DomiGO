import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    ActionSheetIOS, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SelectList } from "react-native-dropdown-select-list";
import {
    launchCamera,
    launchImageLibrary,
} from "react-native-image-picker";
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
    GET_WORK_LOCATION_TYPE_LIST,
    GET_NATURE_OF_WORK_TYPE_LIST,
    GET_WORK_ACTIVITY_TYPE_LIST,
} from "../redux/actions/action-creator";
import DatePicker from "react-native-date-picker";

/* ---------------- HELPERS ---------------- */

// const formatDate = (dateStr) => {
//     const d = new Date(dateStr);
//     const day = d.toLocaleDateString("en-US", { weekday: "long" });
//     const date = d.getDate();
//     const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
//     const year = d.getFullYear();
//     return `${day} ${date}-${month}-${year}`;
// };

// const formatDate = (dateStr) => {
//     const [y, m, d] = dateStr.split('-').map(Number);
//     const dateObj = new Date(y, m - 1, d);

//     const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });
//     const date = dateObj.getDate();
//     const month = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
//     const year = dateObj.getFullYear();

//     return `${day} ${date}-${month}-${year}`;
// };
const formatDate = (dateStr) => {
    if (!dateStr) return "";

    // ✅ Handle ISO format (2026-04-03T...)
    const cleanDate = dateStr.split("T")[0];

    const [y, m, d] = cleanDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    if (isNaN(dateObj)) return "Invalid Date";

    const day = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const date = dateObj.getDate();
    const month = dateObj.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const year = dateObj.getFullYear();

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
    workLocationTypeList,
    natureOfWorkTypeList,
    workActivityTypeList,
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
    console.log('date', date);
    console.log('editData', editData);
    // console.log('data>>>>', route.params?.data.attachments);


    console.log('isTravelling', isTravelling);

    /* ---------------- STATE ---------------- */

    // 1️⃣ User Location
    const [stateId, setStateId] = useState("");

    // 2️⃣ Type of day
    const [typeOfDay, setTypeOfDay] = useState(null);

    // 3️⃣ Commission
    const [isCommissionDay, setIsCommissionDay] = useState(false);

    // 4️⃣ Remote work
    const [isRemoteWork, setIsRemoteWork] = useState(false);

    // 5️⃣ Hours worked
    const [hoursWorked, setHoursWorked] = useState("");

    // 1️⃣ User Location
    const [remoteLocation, setRemoteLocation] = useState(null);

    // 6️⃣ Travelling
    const [isTravelling, setIsTravelling] = useState(false);

    // 7️⃣ Trip Type
    const [tripType, setTripType] = useState(1);

    const [workLocationType, setWorkLocationType] = useState(1);
    const [natureOfWorkType, setNatureOfWorkType] = useState(1);
    const [workActivityType, setWorkActivityType] = useState(1);

    const [creationType, setCreationType] = useState("manual");

    // 8️⃣ Mode of travel
    const [tripMode, setTripMode] = useState(1);

    // 9️⃣ Confirmation no
    const [confirmationNo, setConfirmationNo] = useState("");

    // 🔟 Vendor
    const [vendor, setVendor] = useState("");

    // 11️⃣ Do you have proof
    const [hasProof, setHasProof] = useState(false);

    // 12️⃣ Proof type
    const [proofType, setProofType] = useState("other");

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

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const [openStartPicker, setOpenStartPicker] = useState(false);
    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [isPicking, setIsPicking] = useState(false);
    const [city, setCity] = useState("");
    const [county, setCounty] = useState("");
    const [openStartDate, setOpenStartDate] = useState(false);
    const [openStartTime, setOpenStartTime] = useState(false);

    const [openEndDate, setOpenEndDate] = useState(false);
    const [openEndTime, setOpenEndTime] = useState(false);

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
        dispatch(GET_TRIP_TYPE_LIST());
        dispatch(GET_WORK_LOCATION_TYPE_LIST());
        dispatch(GET_NATURE_OF_WORK_TYPE_LIST());
        dispatch(GET_WORK_ACTIVITY_TYPE_LIST());
        dispatch(GET_TYPE_OF_DAY_LIST());
        dispatch(GET_STATES_LIST());
    }, []);

    useEffect(() => {
        if (isTrip) {
            setIsTravelling(true);
        }
    }, [isTrip, isEdit, editData]);



    useEffect(() => {
        if (isTrip) return; // ❌ only missing day

        // ✅ ONLY automatic entries pe apply hoga
        const isAuto = editData?.creationType === "automatic" || creationType === "automatic";
        if (!isAuto) return;

        // check only when typeOfDay = 1 (default)
        if (Number(typeOfDay) !== 1) return;

        const currentDate = editData?.date || date;
        if (!currentDate) return;

        const d = new Date(currentDate);
        const day = d.getDay(); // 0 = Sunday, 6 = Saturday

        if (day === 0 || day === 6) {
            // Weekend
            setTypeOfDay(3);
        } else {
            // Weekday
            setTypeOfDay(2);
        }

    }, [typeOfDay, date, editData, isTrip]);

    /* ---------------- EDIT PREFILL ---------------- */

    // useEffect(() => {
    //     if (!isEdit || !editData || !isTrip) return;

    //     setStartLocation(
    //         `${editData.originCity}, ${editData.originState}`
    //     );
    //     setEndLocation(
    //         `${editData.destinationCity}, ${editData.destinationState}`
    //     );

    //     setStartData({
    //         city: editData.originCity,
    //         state: editData.originState,
    //         lat: editData.originLat,
    //         lng: editData.originLng,
    //     });

    //     setEndData({
    //         city: editData.destinationCity,
    //         state: editData.destinationState,
    //         lat: editData.destinationLat,
    //         lng: editData.destinationLng,
    //     });
    //     setStateId(editData.state || null);
    //     setTypeOfDay(editData.typeOfDayId || null);
    //     setIsCommissionDay(!!editData.isCommissionDay);
    //     setIsRemoteWork(!!editData.isRemoteWork);
    //     setHoursWorked(editData.remoteHours ? String(editData.remoteHours) : "");
    //     // setIsTravelling(!!editData.isTravelling);
    //     setTripType(editData.tripTypeId || null);
    //     setTripMode(editData.tripModeId || null);
    //     setConfirmationNo(editData.confirmationNo || "");
    //     setVendor(editData.vendor || "");
    //     setHasProof(!!editData.hasProof);
    //     setProofType(editData.proofType || null);
    //     setNotes(editData.notes || "");
    //     setTripType(editData.tripTypeId || null);
    //     setTripMode(editData.tripModeId || null);
    //     setRemoteLocation(editData.remoteLocation || null);
    //     setCreationType(editData.creationType || "");


    //     if (editData.attachments?.length) {
    //         setAttachment(editData.attachments[0]);
    //     }
    // }, [isEdit, editData, isTrip]);

    // const formatDateTime = (dateStr) => {
    //     if (!dateStr) return "";

    //     const d = new Date(dateStr);

    //     if (isNaN(d)) return "Invalid Date";

    //     const day = d.toLocaleDateString("en-US", { weekday: "long" });
    //     const date = d.getDate();
    //     const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    //     const year = d.getFullYear();

    //     const time = d.toLocaleTimeString("en-US", {
    //         hour: "2-digit",
    //         minute: "2-digit",
    //     });

    //     return `${day} ${date}-${month}-${year} | ${time}`;
    // };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "";

        const timezone =
            Intl.DateTimeFormat().resolvedOptions().timeZone;

        return new Date(dateStr).toLocaleString("en-US", {
            timeZone: timezone,
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        }).replace(",", "").replace(",", " |");
    };


    useEffect(() => {
        if (!isEdit || !editData) return;

        // ✅ NON-TRIP (Missing day)
        if (!isTrip) {
            setStateId(editData.state || "");
            setCity(editData?.originCity || "");
            setCounty(editData?.originCounty || "");

        }

        // ✅ TRIP
        if (isTrip) {
            const isCountyChange = editData?.kind === "county_change";

            const originName = isCountyChange
                ? editData.originCounty
                : editData.originCity;

            const destinationName = isCountyChange
                ? editData.destinationCounty
                : editData.destinationCity;

            setStartLocation(
                `${originName}, ${editData.originState}`
            );

            setEndLocation(
                `${destinationName}, ${editData.destinationState}`
            );

            setStartData({
                city: originName,
                state: editData.originState,
                lat: editData.originLat,
                lng: editData.originLng,
            });

            setEndData({
                city: destinationName,
                state: editData.destinationState,
                lat: editData.destinationLat,
                lng: editData.destinationLng,
            });
            // setStartLocation(
            //     `${editData.originCity}, ${editData.originState}`
            // );
            // setEndLocation(
            //     `${editData.destinationCity}, ${editData.destinationState}`
            // );

            // setStartData({
            //     city: editData.originCity,
            //     state: editData.originState,
            //     lat: editData.originLat,
            //     lng: editData.originLng,
            // });

            // setEndData({
            //     city: editData.destinationCity,
            //     state: editData.destinationState,
            //     lat: editData.destinationLat,
            //     lng: editData.destinationLng,
            // });
            if (editData.startDate) {
                setStartDate(new Date(editData.startDate + ""));
            }

            if (editData.endDate) {
                setEndDate(new Date(editData.endDate + ""));
            }
        }

        setTypeOfDay(editData.typeOfDayId || null);
        setIsCommissionDay(!!editData.isCommissionDay);
        setIsRemoteWork(!!editData.isRemoteWork);
        setHoursWorked(editData.remoteHours ? String(editData.remoteHours) : "");
        setTripType(editData.tripTypeId || 1);
        setTripMode(editData.tripModeId || 1);
        setWorkLocationType(editData.typeOfWorkLocationId || 1);
        setNatureOfWorkType(editData.natureOfWorkId || 1);
        setWorkActivityType(editData.workActivityId || 1);
        setConfirmationNo(editData.confirmationNo || "");
        setVendor(editData.vendor || "");
        setHasProof(!!editData.hasProof);
        setProofType(editData.proofType || null);
        setNotes(editData.notes || "");
        setRemoteLocation(editData.remoteLocation || null);
        setCreationType(editData.creationType || "manual");
        // setStartDate(new Date(editData.startDate));
        // setEndDate(new Date(editData.endDate));
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

    const openAttachment = () => {
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Cancel", "Photos", "Files"],
                    cancelButtonIndex: 0,
                },
                async (buttonIndex) => {
                    switch (buttonIndex) {
                        case 1:
                            openPhotos();
                            break;
                        case 2:
                            openFiles();
                            break;
                        case 3:
                            openCamera();
                            break;
                    }
                }
            );
        } else {
            pickDocument();
            // Android ke liye bhi ActionSheet ya BottomSheet dikha sakte ho
        }
    };

    const openCamera = async () => {
        const res = await launchCamera({
            mediaType: "photo",
        });

        if (!res.didCancel && res.assets?.length) {
            setAttachment(res.assets[0]);
        }
    };

    const openPhotos = async () => {
        const res = await launchImageLibrary({
            mediaType: "photo",
        });

        if (!res.didCancel && res.assets?.length) {
            setAttachment(res.assets[0]);
        }
    };

    const openFiles = async () => {
        try {
            const res = await pick({
                allowMultiSelection: false,
            });

            if (res?.length) {
                setAttachment(res[0]);
            }
        } catch (e) { }
    };


    const pickDocument = async () => {
        console.log("pickDocument called");
        if (isPicking) return;

        try {
            setIsPicking(true);

            const res = await pick({
                allowMultiSelection: false,
            });

            if (res?.length) {
                setAttachment(res[0]);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setIsPicking(false);
        }
    };

    /* ---------------- SAVE ---------------- */

    const handleSave = () => {

        console.log({
            workLocationType,
            natureOfWorkType,
            workActivityType,
        });
        if (!typeOfDay) {
            CustomToast.show("Please select Type of Day");
            return;
        }

        if (isTrip) {
            if (!startData || !endData) {
                CustomToast.show("Please select start and end locations");
                return;
            }

            if (!startDate || !endDate) {
                CustomToast.show("Please select start and end dates");
                return;
            }

            if (startDate > endDate) {
                CustomToast.show("Start date cannot be after End date");
                return;
            }
        }
        const payload = {
            // date: editData?.date || date || new Date().toLocaleDateString("en-CA"),
            date:
                !editData && creationType === "manual" && isTrip
                    // ? startDate.toLocaleDateString("en-CA")
                    ? startDate.toISOString()
                    : editData?.date || date || new Date().toLocaleDateString("en-CA"),
            typeOfDayId: Number(typeOfDay),
            isCommissionDay,
            kind: isTrip ? "trip" : "missing",
            isRemoteWork,
            remoteHours: isRemoteWork ? Number(hoursWorked) : 0,
            isTravelling,
            tripTypeId: tripType,
            tripModeId: tripMode,
            typeOfWorkLocationId: workLocationType,
            natureOfWorkId: natureOfWorkType,
            workActivityId: workActivityType,
            confirmationNo,
            vendor,
            hasProof,
            proofType,
            notes,
            attachments: attachment ? [attachment] : [],
            creationType,
            remoteLocation,
            isUpdated: true,
        };

        if (!isTrip) {
            payload.state = stateId;
            payload.originCity = city;
            payload.originCounty = county;
            // payload.date = new Date(date).toLocaleDateString("en-CA");
            // payload.date = new Date(date).toLocaleDateString("en-CA").split("T")[0];
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

            // payload.startDate = startDate.toLocaleDateString("en-CA");
            // payload.endDate = endDate.toLocaleDateString("en-CA");
            payload.startDate = startDate.toISOString();
            payload.endDate = endDate.toISOString();
        }

        if (isEdit) payload.id = editData.id;

        const action = isTrip
            ? isEdit ? UPDATETRIP(payload) : ADDTRIP(payload)
            // : isEdit ? UPDATEMISSINGDAY(payload) : ADDMISSINGDAY(payload);
            : isEdit ? UPDATETRIP(payload) : ADDTRIP(payload);

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

    // const handleSave = () => {
    //     const formData = new FormData();

    //     formData.append("typeOfDayId", Number(typeOfDay));
    //     formData.append("isCommissionDay", isCommissionDay);
    //     formData.append("isRemoteWork", isRemoteWork);
    //     formData.append("remoteHours", isRemoteWork ? Number(hoursWorked) : 0);
    //     formData.append("isTravelling", isTravelling);
    //     formData.append("tripTypeId", tripType);
    //     formData.append("tripModeId", tripMode);
    //     formData.append("confirmationNo", confirmationNo || "");
    //     formData.append("vendor", vendor || "");
    //     formData.append("hasProof", hasProof);
    //     formData.append("proofType", proofType || "");
    //     formData.append("notes", notes || "");
    //     formData.append("creationType", "manual");
    //     formData.append("remoteLocation", remoteLocation || "");

    //     // ✅ Attachments (File)
    //     if (attachment) {
    //         formData.append("attachments", attachment);
    //         // agar multiple ho:
    //         // attachments.forEach(file => formData.append("attachments", file));
    //     }

    //     // ✅ Non-trip fields
    //     if (!isTrip) {
    //         formData.append("stateId", stateId);
    //         formData.append(
    //             "date",
    //             new Date(date).toLocaleDateString("en-CA").split("T")[0]
    //         );
    //     }

    //     // ✅ Trip fields
    //     if (isTrip) {
    //         formData.append("originCity", startData.city);
    //         formData.append("originState", startData.state);
    //         formData.append("originLat", startData.lat);
    //         formData.append("originLng", startData.lng);

    //         formData.append("destinationCity", endData.city);
    //         formData.append("destinationState", endData.state);
    //         formData.append("destinationLat", endData.lat);
    //         formData.append("destinationLng", endData.lng);
    //     }

    //     // ✅ Edit case
    //     if (isEdit) {
    //         formData.append("id", editData.id);
    //     }

    //     const action = isTrip
    //         ? isEdit ? UPDATETRIP(formData) : ADDTRIP(formData)
    //         : isEdit ? UPDATETRIP(formData) : ADDTRIP(formData);

    //     setLoading(true);
    //     dispatch(action)
    //         .then((res) => {
    //             setLoading(false);
    //             CustomToast.show(isEdit ? "Updated Successfully" : "Saved Successfully");
    //             // navigation.goBack();
    //             console.log('e======>',res);
    //         })
    //         .catch((e) => {
    //             setLoading(false);
    //             console.log('e======>',e);
    //             CustomToast.show("Something went wrong");
    //         });
    // };


    console.log(
        "TZ",
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );

    console.log(
        "START",
        new Date(editData?.startDate).toString()
    );

    console.log("RAW START", editData?.startDate);

    const d = new Date(editData?.startDate);

    console.log("DATE OBJECT", d);

    console.log(
        "LOCAL STRING",
        d.toLocaleString("en-US", {
            timeZone: "America/New_York",
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
    );


    const workingType = typeOfDayList?.find(
        (item) => item.name === "Working"
    );
    const defaultType = typeOfDayList?.find(
        (item) => item.name === "Default"
    );

    const isWorkingDay =
        Number(typeOfDay) === workingType?.id;

    const isDefaultDay =
        Number(typeOfDay) === Number(defaultType?.id);

    const filteredTripTypeList = tripTypeList?.filter((item) => {
        // Default => saare options
        if (isDefaultDay) {
            return true;
        }
        if (isWorkingDay) {
            // Working par Personal hide, Work show
            return item.name !== "Personal";
        }

        // Working ke alawa Work hide, Personal show
        return item.name !== "Work";
    });


    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={{ flex: 1, backgroundColor: '#fff' }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <Header title={isEdit ? "Update Entry" : "Add Entry"} showBack />

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.card}>
                        {isTrip && isEdit ?
                            // <Text style={styles.dateTitle}>{new Date(startDate).toDateString()} - {new Date(endDate).toDateString()}</Text>
                            <Text style={styles.dateTitle}>
                                {formatHeaderDate(startDate)}
                                {" - "}
                                {formatHeaderDate(endDate)}
                            </Text>
                            :
                            <Text style={styles.dateTitle}>{formatDate(editData?.date || date || new Date().toLocaleDateString("en-CA"))}</Text>
                        }
                        {!isTrip && (
                            <>
                                <FieldLabel title="Location (City)" />

                                <TextInput
                                    placeholder="Enter City"
                                    value={city}
                                    onChangeText={(text) => {
                                        setCity(text);
                                        searchPlaces(text, setEndSuggestions);
                                    }}
                                    style={styles.input}
                                    placeholderTextColor="#777"
                                    editable={editData?.creationType !== "automatic"}
                                />
                                <FieldLabel title="Location (County)" />

                                <TextInput
                                    placeholder="Enter County"
                                    value={county}
                                    onChangeText={(text) => {
                                        setCounty(text);
                                        searchPlaces(text, setEndSuggestions);
                                    }}
                                    style={styles.input}
                                    placeholderTextColor="#777"
                                    editable={editData?.creationType !== "automatic"}
                                />
                                <FieldLabel title="Location (State)" />

                                <TextInput
                                    placeholder="Enter State"
                                    value={stateId}
                                    onChangeText={(text) => {
                                        setStateId(text);
                                        searchPlaces(text, setEndSuggestions);
                                    }}
                                    style={styles.input}
                                    placeholderTextColor="#777"
                                    editable={editData?.creationType !== "automatic"}
                                />

                                {endSuggestions.length > 0 && (
                                    <View style={styles.suggestionBox}>
                                        {endSuggestions.map((item) => (
                                            <TouchableOpacity
                                                key={item.place_id}
                                                onPress={async () => {
                                                    const details = await getPlaceDetails(item.place_id);

                                                    const city =
                                                        details.address_components.find(c =>
                                                            c.types.includes("locality")
                                                        )?.long_name || "";

                                                    const county =
                                                        details.address_components.find(c =>
                                                            c.types.includes("administrative_area_level_2")
                                                        )?.long_name || "";

                                                    const state =
                                                        details.address_components.find(c =>
                                                            c.types.includes("administrative_area_level_1")
                                                        )?.long_name || "";

                                                    setCity(city);
                                                    setCounty(county);
                                                    setStateId(state);

                                                    setEndSuggestions([]);
                                                }}
                                                style={styles.suggestionItem}
                                            >
                                                <Text style={{ color: "#000" }}>
                                                    {item.description}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {/* ===== FIRST BOX : START & END LOCATION (TRIP ONLY) ===== */}
                        {isTrip && (
                            <>
                                <FieldLabel title="Start Location" />

                                {/* <TextInput
                                    value={startLocation}
                                    onChangeText={(text) => {
                                    setStartLocation(text);
                                        searchPlaces(text, setStartSuggestions);
                                    }}
                                    placeholder="Enter start location"
                                    placeholderTextColor="#777"
                                    editable={editData?.creationType != "automatic"}
                                    style={styles.input}
                                /> */}
                                <TextInput
                                    placeholder="Origin Location"
                                    value={startLocation}
                                    onChangeText={(text) => {
                                        setStartLocation(text);
                                        searchPlaces(text, setStartSuggestions);
                                    }}
                                    style={styles.input}
                                    //   editable={!isAutomatic}
                                    placeholderTextColor="#777"
                                    editable={editData?.creationType != "automatic"}

                                />

                                {/* {startSuggestions.map((item) => (
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
                                ))} */}
                                {startSuggestions.length > 0 && (
                                    <View style={styles.suggestionBox}>
                                        {startSuggestions.map((item) => (
                                            <TouchableOpacity
                                                key={item.place_id}
                                                onPress={async () => {
                                                    setStartLocation(item.description);
                                                    setStartSuggestions([]);
                                                    console.log('item>>>>>>>>>>', item);
                                                    const details = await getPlaceDetails(item.place_id);

                                                    const lat = details.geometry.location.lat;
                                                    const lng = details.geometry.location.lng;

                                                    const city =
                                                        details.address_components.find((c) =>
                                                            c.types.includes("locality")
                                                        )?.long_name || "";

                                                    // const state =
                                                    //     details.address_components.find((c) =>
                                                    //         c.types.includes("administrative_area_level_1")
                                                    //     )?.short_name || "";
                                                    const state =
                                                        details.address_components.find((c) =>
                                                            c.types.includes("administrative_area_level_1")
                                                        )?.long_name || "";

                                                    setStartData({ city, state, lat, lng });
                                                }}
                                                style={styles.suggestionItem}
                                            >
                                                <Text style={{ color: "#000" }}>{item.description}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                <FieldLabel title="End Location" />

                                {/* <TextInput
                                    value={endLocation}
                                    onChangeText={(text) => {
                                        setEndLocation(text);
                                        searchPlaces(text, setEndSuggestions);
                                    }}
                                    placeholder="Enter end location"
                                    placeholderTextColor="#777"
                                    editable={editData?.creationType != "automatic"}
                                    style={styles.input}
                                /> */}
                                <TextInput
                                    placeholder="Destination Location"
                                    value={endLocation}
                                    onChangeText={(text) => {
                                        setEndLocation(text);
                                        searchPlaces(text, setEndSuggestions);
                                    }}
                                    style={styles.input}
                                    //   editable={!isAutomatic}
                                    placeholderTextColor="#777"
                                    editable={editData?.creationType != "automatic"}

                                />

                                {/* {endSuggestions.map((item) => (
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
                                ))} */}
                                {endSuggestions.length > 0 && (
                                    <View style={styles.suggestionBox}>
                                        {endSuggestions.map((item) => (
                                            <TouchableOpacity
                                                key={item.place_id}
                                                onPress={async () => {
                                                    setEndLocation(item.description);
                                                    setEndSuggestions([]);

                                                    const details = await getPlaceDetails(item.place_id);

                                                    const lat = details.geometry.location.lat;
                                                    const lng = details.geometry.location.lng;

                                                    const city =
                                                        details.address_components.find((c) =>
                                                            c.types.includes("locality")
                                                        )?.long_name || "";

                                                    // const state =
                                                    //     details.address_components.find((c) =>
                                                    //         c.types.includes("administrative_area_level_1")
                                                    //     )?.short_name || "";
                                                    const state =
                                                        details.address_components.find((c) =>
                                                            c.types.includes("administrative_area_level_1")
                                                        )?.long_name || "";

                                                    setEndData({ city, state, lat, lng });
                                                }}
                                                style={styles.suggestionItem}
                                            >
                                                <Text style={{ color: "#000" }}>{item.description}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        {isTrip && (
                            <>
                                <View style={styles.dateRow}>
                                    <FieldLabel title="Start Date" />
                                    <TouchableOpacity
                                        style={[styles.dateBox,
                                        editData?.creationType === "automatic" && { opacity: 0.6 }
                                        ]}
                                        disabled={editData?.creationType === "automatic"}
                                        // onPress={() => setOpenStartPicker(true)}
                                        onPress={() => setOpenStartDate(true)}
                                    >
                                        <Ionicons name="calendar-outline" size={18} color="#777" />
                                        <Text style={styles.dateText}>
                                            {/* {startDate.toDateString()} */}
                                            {formatDateTime(startDate)}
                                        </Text>
                                    </TouchableOpacity>
                                    <FieldLabel title="End Date" />
                                    <TouchableOpacity
                                        style={[styles.dateBox,
                                        editData?.creationType === "automatic" && { opacity: 0.6 }
                                        ]}
                                        disabled={editData?.creationType === "automatic"}
                                        // onPress={() => setOpenEndPicker(true)}
                                        onPress={() => setOpenEndDate(true)}
                                    >
                                        <Ionicons name="calendar-outline" size={18} color="#777" />
                                        {/* <Text style={styles.dateText}>{endDate.toDateString()}</Text> */}
                                        <Text style={styles.dateText}>{formatDateTime(endDate)}</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* <DatePicker
                                    modal
                                    open={openStartPicker}
                                    date={startDate}
                                    mode="datetime"
                                    onConfirm={(date) => {
                                        // date.setHours(9, 0, 0, 0);
                                        setOpenStartPicker(false);
                                        setStartDate(date);
                                    }}
                                    onCancel={() => setOpenStartPicker(false)}
                                /> */}
                                <DatePicker
                                    modal
                                    mode="date"
                                    open={openStartDate}
                                    date={startDate}
                                    minimumDate={new Date(2020, 0, 1)}
                                    maximumDate={new Date(2035, 11, 31)}
                                    onConfirm={(selectedDate) => {
                                        const newDate = new Date(startDate);

                                        newDate.setFullYear(selectedDate.getFullYear());
                                        newDate.setMonth(selectedDate.getMonth());
                                        newDate.setDate(selectedDate.getDate());

                                        setStartDate(newDate);

                                        setOpenStartDate(false);

                                        setTimeout(() => {
                                            setOpenStartTime(true);
                                        }, 250);
                                    }}
                                    onCancel={() => setOpenStartDate(false)}
                                />

                                {/* Start Time Picker */}

                                <DatePicker
                                    modal
                                    mode="time"
                                    open={openStartTime}
                                    date={startDate}
                                    onConfirm={(selectedTime) => {
                                        const newDate = new Date(startDate);

                                        newDate.setHours(selectedTime.getHours());
                                        newDate.setMinutes(selectedTime.getMinutes());

                                        setStartDate(newDate);

                                        setOpenStartTime(false);
                                    }}
                                    onCancel={() => setOpenStartTime(false)}
                                />

                                {/* <DatePicker
                                    modal
                                    open={openEndPicker}
                                    date={endDate}
                                    mode="datetime"
                                    onConfirm={(date) => {
                                        // date.setHours(18, 0, 0, 0);
                                        setOpenEndPicker(false);
                                        setEndDate(date);
                                    }}
                                    onCancel={() => setOpenEndPicker(false)}
                                /> */}

                                {/* End Date Picker */}

                                <DatePicker
                                    modal
                                    mode="date"
                                    open={openEndDate}
                                    date={endDate}
                                    minimumDate={new Date(2020, 0, 1)}
                                    maximumDate={new Date(2035, 11, 31)}
                                    onConfirm={(selectedDate) => {
                                        const newDate = new Date(endDate);

                                        newDate.setFullYear(selectedDate.getFullYear());
                                        newDate.setMonth(selectedDate.getMonth());
                                        newDate.setDate(selectedDate.getDate());

                                        setEndDate(newDate);

                                        setOpenEndDate(false);

                                        setTimeout(() => {
                                            setOpenEndTime(true);
                                        }, 250);
                                    }}
                                    onCancel={() => setOpenEndDate(false)}
                                />

                                {/* End Time Picker */}

                                <DatePicker
                                    modal
                                    mode="time"
                                    open={openEndTime}
                                    date={endDate}
                                    onConfirm={(selectedTime) => {
                                        const newDate = new Date(endDate);

                                        newDate.setHours(selectedTime.getHours());
                                        newDate.setMinutes(selectedTime.getMinutes());

                                        setEndDate(newDate);

                                        setOpenEndTime(false);
                                    }}
                                    onCancel={() => setOpenEndTime(false)}
                                />
                            </>)}


                        <FieldLabel title="Type of Day" />
                        <SelectList
                            data={typeOfDayList?.map((i) => ({ key: i.id, value: i.name }))}
                            setSelected={setTypeOfDay}
                            save="key"
                            defaultOption={getDefaultOption(typeOfDayList, typeOfDay)}
                            boxStyles={styles.dropdownBox}
                        />

                        {/* {(editData?.typeOfDay?.name == "Working" || typeOfDay == 2) && ( */}
                        {isWorkingDay && (
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

                        {isWorkingDay && (
                            <>
                                <FieldLabel title="Commission Day" />
                                <Toggle value={isCommissionDay} onChange={setIsCommissionDay} />

                                <FieldLabel title="Remote Work" />
                                <Toggle value={isRemoteWork} onChange={setIsRemoteWork} />
                            </>)}

                        {isRemoteWork && !isEdit && (
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

                        {isRemoteWork && !isTrip && (
                            <>
                                <FieldLabel title="Work (State)" />
                                <SelectList
                                    data={statesList?.map((i) => ({ key: i.id, value: i.name }))}
                                    setSelected={setRemoteLocation}
                                    save="value"
                                    defaultOption={getDefaultOption(statesList, remoteLocation)}
                                    boxStyles={styles.dropdownBox}
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
                                {/* <SelectList
                                    data={tripTypeList?.map(i => ({
                                        key: i.id,
                                        value: i.name,
                                    }))}
                                    setSelected={setTripType}
                                    save="key"
                                    defaultOption={getDefaultOption(tripTypeList, tripType)}
                                    boxStyles={styles.dropdownBox}
                                    inputStyles={styles.dropdownInput}
                                /> */}

                                <SelectList
                                    data={filteredTripTypeList?.map(i => ({
                                        key: i.id,
                                        value: i.name,
                                    }))}
                                    setSelected={setTripType}
                                    save="key"
                                    defaultOption={getDefaultOption(
                                        filteredTripTypeList,
                                        tripType
                                    )}
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
                                    defaultOption={getDefaultOption(tripModeList, tripMode)}
                                    // defaultOption={
                                    //     isEdit && tripMode?.mode
                                    //         ? { key: tripMode.mode.id, value: tripMode.mode.name }
                                    //         : null
                                    // }
                                    boxStyles={styles.dropdownBox}
                                    inputStyles={styles.dropdownInput}
                                />

                                {isWorkingDay && (
                                    <>
                                        <FieldLabel title="Work Location Type" />
                                        <SelectList
                                            data={workLocationTypeList?.map(i => ({
                                                key: i.id,
                                                value: i.name,
                                            }))}
                                            setSelected={setWorkLocationType}
                                            save="key"
                                            defaultOption={getDefaultOption(
                                                workLocationTypeList,
                                                workLocationType
                                            )}
                                            boxStyles={styles.dropdownBox}
                                            inputStyles={styles.dropdownInput}
                                        />

                                        <FieldLabel title="Nature of Work" />
                                        <SelectList
                                            data={natureOfWorkTypeList?.map(i => ({
                                                key: i.id,
                                                value: i.name,
                                            }))}
                                            setSelected={setNatureOfWorkType}
                                            save="key"
                                            defaultOption={getDefaultOption(
                                                natureOfWorkTypeList,
                                                natureOfWorkType
                                            )}
                                            boxStyles={styles.dropdownBox}
                                            inputStyles={styles.dropdownInput}
                                        />

                                        <FieldLabel title="Work Activity Type" />
                                        <SelectList
                                            data={workActivityTypeList?.map(i => ({
                                                key: i.id,
                                                value: i.name,
                                            }))}
                                            setSelected={setWorkActivityType}
                                            save="key"
                                            defaultOption={getDefaultOption(
                                                workActivityTypeList,
                                                workActivityType
                                            )}
                                            boxStyles={styles.dropdownBox}
                                            inputStyles={styles.dropdownInput}
                                        />
                                    </>
                                )}
                            </>)}

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
                                        { key: "receipt", value: "receipt" },
                                        { key: "credit_card", value: "credit_card" },
                                        { key: "other", value: "other" },
                                    ]}
                                    // defaultOption={getDefaultOption(data, proofType)}
                                    defaultOption={
                                        editData?.proofType
                                            ? { key: editData.proofType, value: editData.proofType }
                                            : null
                                    }
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
                        <TouchableOpacity disabled={isPicking} style={styles.attachBtn} onPress={openAttachment}>
                            <Text style={{ color: colors.primary }}>Add Attachment</Text>
                        </TouchableOpacity>

                        {attachment && (
                            <>
                                <Image
                                    source={{ uri: attachment.uri || attachment.signedUrl }}
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 8,
                                        marginTop: 10,
                                    }}
                                />

                                <Text style={styles.fileName}>
                                    {attachment.name || attachment.fileName}
                                </Text>
                            </>
                        )}

                        {/* // {attachment && (
                        //     <Text style={styles.fileName}>{attachment.name}</Text>
                        // )} */}
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



const formatHeaderDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

/* ---------------- REDUX ---------------- */

const mapStateToProps = (state) => ({
    tripModeList: state.common.tripModeList,
    tripTypeList: state.common.tripTypeList,
    workLocationTypeList: state.common.workLocationTypeList,
    natureOfWorkTypeList: state.common.natureOfWorkTypeList,
    workActivityTypeList: state.common.workActivityTypeList,
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
        // flexDirection: "row",
        // justifyContent: "space-between",
        marginTop: 0,
        marginBottom: 0,
    },

    dateBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F2F2F2",
        height: 55,
        borderRadius: 30,
        paddingHorizontal: 15,
        // width: "48%",
    },

    dateText: {
        marginLeft: 10,
        fontSize: 14,
        color: "#000",
    },
});
