import React, { useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
    Modal,
    TextInput,
    RefreshControl,
    PermissionsAndroid,
    ActivityIndicator,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Progress from 'react-native-progress';
import colors from '../theme/colors';
import Header from '../components/Header';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { connect, useDispatch } from 'react-redux';
import startTracking, { stopTracking } from '../helpers/LocationTracker';
import { startDomigoTracking } from '../helpers/MainTracker';
import DomigoTracker from '../helpers/MainTracker';
import { GET_FINAL_YEAR_PROGRESS, GET_STATE_WISE_RESIDENCY, GET_COMPLIANCE_SCORE, UPDATE_STATE_THRESHOLD, GET_USER_LOCATIONS } from '../redux/actions/action-creator';
import { ensureLocationReady } from '../helpers/locationHandler';
import { forceEnableGPS } from '../helpers/locationGuard';
import { checkGPSStatus } from '../helpers/gpsStatus';
import { useGPSListener } from '../hooks/useGPSListener';
import { openLocationSettings } from '../helpers/locationRedirect';
import { getStateShortCode } from '../utils/getStateShortCode';
import { CustomToast } from '../helpers/CommonHelpers';
import FeatureGateWrapper from '../components/FeatureGateWrapper';
import TrialBanner from '../components/TrialBanner';
import { FEATURES } from '../config/featureAccess';
import Geolocation from '@react-native-community/geolocation';
import { GOOGLE_KEY } from "../helpers/CommonHelpers"
import AsyncStorage from '@react-native-async-storage/async-storage';





const HomeScreen = ({ GET_FINAL_YEAR_PROGRESS, GET_STATE_WISE_RESIDENCY, GET_COMPLIANCE_SCORE, UPDATE_STATE_THRESHOLD, GET_USER_LOCATIONS, loginToken, finalYearProgress, stateWiseResidency, userData, complianceScore, userLocations }) => {
    const [showStateModal, setShowStateModal] = React.useState(false);
    const [isGPSOn, setIsGPSOn] = React.useState(true);
    const [thresholdModalVisible, setThresholdModalVisible] = React.useState(false);
    const [selectedState, setSelectedState] = React.useState(null);
    const [thresholdValue, setThresholdValue] = React.useState('');
    const [refreshing, setRefreshing] = React.useState(false)
    const [locationModal, setLocationModal] = React.useState(false);
    const [currentLocation, setCurrentLocation] = React.useState(null);
    const MAX_DAILY_REFRESH = 10;

    const REFRESH_COUNT_KEY =
        "daily_location_refresh_count";

    const REFRESH_DATE_KEY =
        "daily_location_refresh_date";
    // console.log('stateWiseResidency>>>>', stateWiseResidency);
    // console.log('complianceScore>>>>', complianceScore);
    // console.log('userData>>>>', userData);
    // console.log('userLocations>>>>', userLocations);

    const dispatch = useDispatch();

    const progress = 200 / 365;
    const navigation = useNavigation();
    // useEffect(() => {
    //     DomigoTracker.startDomigoTracking();

    //     // return () => {
    //     //   stopDomigoTracking();
    //     // };
    // }, []);

    const openThresholdModal = (item) => {
        setSelectedState(item);
        setThresholdValue(String(item.threshold));
        setThresholdModalVisible(true);
    };
    const locationMap = {};

    userLocations?.forEach(loc => {
        locationMap[loc.state] = loc.type;
    });

    const onRefresh = async () => {
        setRefreshing(true);
        const allowed =
            await canRefreshLocation();

        if (!allowed) {
            CustomToast.show(
                "You have already completed your attempts for today"
            );

            setRefreshing(false);
            return;
        }
        if (!isGPSOn) {
            CustomToast.show("Please enable GPS");
            setRefreshing(false);
            return;
        }

        try {
            const coords = await getCurrentLocation();

            const locationDetails = await getAddressFromLatLong(
                coords.latitude,
                coords.longitude
            );

            const finalLocation = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                state: locationDetails.state,
                city: locationDetails.city,
                county: locationDetails.county,
                address: locationDetails.address,
            };

            console.log("FINAL LOCATION 👉", finalLocation);

            // 🔥 API me sab separate jaayega
            // await sendLocationAPI(finalLocation);
            const locationResponse =
                await sendLocationAPI(finalLocation);

            const hoursResponse =
                await sendHoursLocationAPI(finalLocation);

            if (hoursResponse) {
                await increaseRefreshCount();
            }

            if (!locationResponse && !hoursResponse) {
                CustomToast.show("Location not saved");

                setRefreshing(false);
                return;
            }

            setCurrentLocation(finalLocation);
            setLocationModal(true);


            await dispatch(GET_FINAL_YEAR_PROGRESS);
            await dispatch(GET_STATE_WISE_RESIDENCY);
            await dispatch(GET_COMPLIANCE_SCORE);
            await dispatch(GET_USER_LOCATIONS);
        } catch (e) {
            console.log('Refresh error', e);
        }

        setRefreshing(false);
        CustomToast.show("Dashboard refreshed");
    };


    useEffect(() => {
        if (userData && userData.state === null) {
            setShowStateModal(true);
        }
    }, [userData]);

    // useEffect(()=>{
    useGPSListener(setIsGPSOn);
    // },[])

    useEffect(() => {
        dispatch(GET_FINAL_YEAR_PROGRESS)
        dispatch(GET_STATE_WISE_RESIDENCY)
        dispatch(GET_COMPLIANCE_SCORE)
        dispatch(GET_USER_LOCATIONS)
        // return () => {
        //   stopDomigoTracking();
        // };
    }, []);

    const isFocused = useIsFocused();

    const getCurrentLocation = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );

            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                throw new Error("Location permission denied");
            }
        }
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;

                    const locationData = {
                        latitude,
                        longitude,
                    };

                    resolve(locationData);
                },
                error => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                }
            );
        });
    };

    const canRefreshLocation = async () => {
        try {
            const today = new Date().toISOString().split("T")[0];

            const storedDate = await AsyncStorage.getItem(
                REFRESH_DATE_KEY
            );

            let count = parseInt(
                (
                    await AsyncStorage.getItem(
                        REFRESH_COUNT_KEY
                    )
                ) || "0",
                10
            );

            // New day => reset count
            if (storedDate !== today) {
                await AsyncStorage.setItem(
                    REFRESH_DATE_KEY,
                    today
                );

                await AsyncStorage.setItem(
                    REFRESH_COUNT_KEY,
                    "0"
                );

                count = 0;
            }

            if (count >= MAX_DAILY_REFRESH) {
                return false;
            }

            return true;

        } catch (error) {
            console.log("canRefreshLocation error", error);
            return false;
        }
    };

    const increaseRefreshCount = async () => {
        try {
            const count = parseInt(
                (
                    await AsyncStorage.getItem(
                        REFRESH_COUNT_KEY
                    )
                ) || "0",
                10
            );

            await AsyncStorage.setItem(
                REFRESH_COUNT_KEY,
                String(count + 1)
            );

            console.log(
                "Refresh Count Updated =>",
                count + 1
            );

        } catch (error) {
            console.log(
                "increaseRefreshCount error",
                error
            );
        }
    };


    const getAddressFromLatLong = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`
            );

            const data = await res.json();
            if (!data.results || data.results.length === 0) {
                return {
                    address: "Unknown",
                    city: "",
                    county: "",
                    state: "",
                };
            }
            const result = data.results[0];

            let city = "";
            let state = "";
            let county = "";
            let address = result?.formatted_address || "";

            result.address_components.forEach(component => {
                if (component.types.includes("locality")) {
                    city = component.long_name;
                }

                if (component.types.includes("administrative_area_level_2")) {
                    county = component.long_name;
                }

                if (component.types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                }
            });
            if (!city) {
                const fallback = result.address_components.find(component =>
                    component.types.includes("sublocality") ||
                    component.types.includes("administrative_area_level_2")
                );

                city = fallback?.long_name || "";
            }

            return {
                address,
                city,
                county,
                state,
            };

        } catch (e) {
            console.log(e);
            return {
                address: "Unknown",
                city: "",
                county:"",
                state: "",
            };
        }
    };

    // const sendLocationAPI = async (location) => {
    //     console.log("SENDING 👉", location);
    //     try {
    //         const res = await fetch("https://stage.mydomigo.com/api/locations", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify(location),
    //         });

    //         return await res.json();
    //     } catch (e) {
    //         console.log("API error", e);
    //     }
    // };

    const sendLocationAPI = async (location) => {
        console.log("SENDING 👉", location);

        try {
            const res = await fetch("https://stage.mydomigo.com/api/locations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${loginToken}`, // ✅ token added
                },
                body: JSON.stringify(location),
            });

            const data = await res.json();
            console.log("RESPONSE 👉", data);

            return data;

        } catch (e) {
            console.log("API error", e);
        }
    };


    const sendHoursLocationAPI = async (location) => {
        try {
            const res = await fetch(
                "https://stage.mydomigo.com/api/locations/hours",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${loginToken}`,
                    },
                    body: JSON.stringify(location),
                }
            );

            const data = await res.json();

            console.log("HOURS API RESPONSE =>", data);

            return data;
        } catch (e) {
            console.log("Hours API Error", e);
            return null;
        }
    };



    const handleThresholdUpdate = async () => {
        const payload = {
            state: selectedState.state,
            threshold: Number(thresholdValue),
        };
        const res = await UPDATE_STATE_THRESHOLD(payload);
        if (res.response.message === "Success") {
            CustomToast.show("Threshold Updated Successfully!");
        }
        setThresholdModalVisible(false);
        dispatch(GET_STATE_WISE_RESIDENCY)
    };

    // const sortedStateResidency = React.useMemo(() => {
    //     if (!stateWiseResidency || !userData?.state) return stateWiseResidency;

    //     return [...stateWiseResidency].sort((a, b) => {
    //         if (a.state === userData.state) return -1;
    //         if (b.state === userData.state) return 1;
    //         return 0;
    //     });
    // }, [stateWiseResidency, userData]);
    const sortedStateResidency = React.useMemo(() => {
        if (!stateWiseResidency) return [];

        return [...stateWiseResidency].sort((a, b) => {
            const aType = locationMap[a.state];
            const bType = locationMap[b.state];

            // 1. Primary (blue home icon) first
            if (aType === "primary" && bType !== "primary") return -1;
            if (bType === "primary" && aType !== "primary") return 1;

            // 2. Other home icon cards (secondary/other)
            const aHome = !!aType;
            const bHome = !!bType;

            if (aHome && !bHome) return -1;
            if (bHome && !aHome) return 1;

            // 3. Remaining cards
            return 0;
        });
    }, [stateWiseResidency, userLocations]);



    console.log('loginToken', loginToken);

    function getStateCodeSafe(state) {
        return state
            .toLowerCase()
            .replace(/[^a-z\s]/g, "")
            .split(/\s+/)
            .map(w => w.charAt(0).toUpperCase())
            .join("");
    }


    const getFinalStateCode = (stateName, country) => {
        if (!stateName) return "";

        // 1️⃣ Try official mapping
        const officialCode = getStateShortCode(stateName, country);

        // 2️⃣ Agar mapping se actual short code mila (2 letters)
        if (
            officialCode &&
            officialCode !== stateName &&
            officialCode.length <= 3
        ) {
            return officialCode;
        }

        // 3️⃣ Fallback to safe auto code
        if (stateName.length > 2) {
            return getStateCodeSafe(stateName);
        }
        return stateName
    };


    const stringToHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };

    const getDarkPastelColor = (str) => {
        const hash = stringToHash(str);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 55%, 35%)`; // dark pastel
    };

    const getStateColor = (state) =>
        state ? getDarkPastelColor(state) : '#2C2C2C';

    const getBorderColorByDays = (days, threshold) => {
        const percentage = (days / threshold) * 100;

        if (percentage <= 25) {
            return '#65C466';
        } else if (percentage > 25 && percentage < 50) {
            return '#EBB408';
        } else {
            return '#EE4444';
        }
    };



    // console.log(getStateCodeSafe("  Uttar Pradesh ")); // UP



    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: 'none' }}>
                <Header title={'Dashboard'} navigation={navigation} />
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}      // iOS
                            colors={[colors.primary]}       // Android
                        />
                    }>

                    {/* <View
                        style={{
                            ...styles.section,
                            elevation: 2,
                            backgroundColor: '#F6F6F6',
                            borderRadius: 10,
                        }}
                    >
                        <Text style={styles.sectionTitle}>Financial Year Progress</Text>

                        <View style={styles.progressButtonRow}>
                            <View style={styles.completedBtn}>
                                <Text style={styles.completedText}>{finalYearProgress?.daysSpent} Days Completed</Text>
                            </View>

                            <View style={styles.remainingBtn}>
                                <Text style={styles.remainingText}>{finalYearProgress?.daysLeft} Days Left</Text>
                            </View>
                        </View>
                    </View> */}

                    <TrialBanner />

                    <View style={styles.metricsContainer}>

                        {/* DAYS IN */}
                        <View style={styles.metricBox}>
                            <Text style={styles.metricValue}>
                                {finalYearProgress?.daysSpent ?? 0}
                            </Text>
                            <Text style={styles.metricLabel}>Days In</Text>
                            {/* <Text style={styles.metricSub}>
                                {finalYearProgress?.missingDays ?? 0} missing days
                            </Text> */}
                        </View>

                        {/* DAYS LEFT */}
                        <View style={styles.metricBox}>
                            <Text style={styles.metricValue}>
                                {finalYearProgress?.daysLeft ?? 0}
                            </Text>
                            <Text style={styles.metricLabel}>Days Left</Text>
                            {/* <Text style={styles.metricSub}>
                                {finalYearProgress?.missingDays ?? 0} missing days
                            </Text> */}
                        </View>

                        <TouchableOpacity
                            style={styles.metricBox}
                            onPress={() => navigation.navigate('ReportsExport')}
                        >
                            <FeatureGateWrapper feature={FEATURES.READINESS_SCORE} featureName="Readiness Score">

                                <Text style={styles.metricValue}>
                                    {complianceScore?.complianceScore ?? 0}%
                                </Text>
                                <Text style={styles.metricLabel}>Readiness</Text>
                                <Text style={[styles.metricLabel, { marginTop: 0 }]}> Score</Text>
                                <Text style={styles.metricSub}>
                                    {finalYearProgress?.missingDays ?? 0} missing days
                                </Text>
                            </FeatureGateWrapper>

                        </TouchableOpacity>

                    </View>


                    {/* <View style={styles.summaryContainer}>
                        <View style={styles.summaryBox}>
                            <View style={{ flexDirection: 'row', width: '100%', }}>
                                <Icon name="calendar-outline" size={20} style={{ marginTop: 10 }} color={'#65C466'} />
                                <View style={{ marginLeft: 5 }}>
                                    <Text style={{ ...styles.summaryValue, fontSize: 15, flex: 1, marginRight: 8 }}>Total
                                        Residency
                                        Day</Text>
                                    <Text style={styles.summaryValue}>240</Text>
                                    <Text style={styles.summaryLabel}>
                                        Across all states this financial year.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.summaryBox}
                            // onPress={()=> navigation.navigate('Settings', {
                            //     screen: 'ReportsExport',
                            // })
                            // }
                            onPress={() => navigation.navigate('ReportsExport')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between' }}>
                                <Icon name="stats-chart-outline" size={20} style={{ marginTop: 0 }} color={colors.primary} />
                                <Text style={{ ...styles.summaryValue, fontSize: 15, flex: 1, marginLeft: 8 }}>
                                    Compliance
                                    Score</Text>
                            </View>
                            <Text style={styles.summaryValue}>{complianceScore?.complianceScore}%</Text>
                            <Text style={styles.summaryLabel}>
                                Your current estimated tax compliance.
                            </Text>
                        </TouchableOpacity>
                    </View> */}

                    {!isGPSOn && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={openLocationSettings}
                            style={styles.locationBanner}
                        >
                            <View style={styles.locationIcon}>
                                <Icon name="location-sharp" size={18} color="#fff" />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.locationTitle}>
                                    Please enable precise location tracking!
                                </Text>
                                <Text style={styles.locationSubtitle}>
                                    Tap here to fix
                                </Text>
                            </View>

                            <Icon name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}


                    {/* {!isGPSOn && (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => openLocationSettings(setIsGPSOn)}
                            style={styles.locationBanner}
                        >
                            <View style={styles.locationIcon}>
                                <Icon name="location-sharp" size={18} color="#fff" />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.locationTitle}>
                                    Please enable precise location tracking!
                                </Text>
                                <Text style={styles.locationSubtitle}>
                                    Tap here to fix
                                </Text>
                            </View>

                            <Icon name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    )} */}


                    <View style={{ ...styles.section, elevation: 0, backgroundColor: '#fafafa', borderRadius: 10 }}>
                        {/* <Text style={styles.sectionTitle}>Insights Menu</Text> */}

                        <View style={styles.toggleContainer}>
                            <TouchableOpacity style={styles.leftTab}
                                onPress={() => navigation.navigate('Metrics')}>
                                <Text style={styles.activeText}>Metrics</Text>
                            </TouchableOpacity>

                            {/* <TouchableOpacity style={styles.centerCircle} onPress={() => navigation.navigate('Metrics')}>
                                <View style={{
                                    backgroundColor: colors.white, padding: 1, width: 35,
                                    height: 35, borderRadius: 21,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderColor: colors.primary,
                                    borderWidth: 3
                                }}>
                                    <Text style={{ color: colors.primary, fontWeight: '700' }}>D</Text>
                                </View>
                            </TouchableOpacity> */}

                            <TouchableOpacity
                                onPress={() => navigation.navigate('Calendar')}
                                style={styles.rightTab}>
                                <Text style={styles.inactiveText}>Calendar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View style={styles.section}>
                        {/* <Text style={styles.sectionTitle}>State-wise Residency Overview</Text> */}
                        <View style={styles.stateGrid}>
                            {
                                // [
                                //     { code: 'FL', days: 134, color: '#D3D3D3', threshold: 183 },
                                //     { code: 'NY', days: 83, color: '#28a0dd', threshold: 183 },
                                //     { code: 'CA', days: 170, color: '#dc3c41', threshold: 183 },
                                //     { code: 'UT', days: 45, color: '#28a0dd', threshold: 183 },
                                // ]
                                // stateWiseResidency
                                sortedStateResidency
                                    ?.map((item, index) => {
                                        // const isHomeState = item.state === userData?.state;
                                        const locationType = locationMap[item.state]; // primary / secondary / other / undefined

                                        const isPrimary = locationType === "primary";
                                        const isUserLocation = !!locationType;
                                        const daysLeft = item.threshold - item.days;
                                        return (

                                            // <View style={styles.circleGrid}>
                                            //     {sortedStateResidency?.map((item, index) => {
                                            // const isHomeState = item.state === userData?.state;
                                            // const daysLeft = item.threshold - item.days;

                                            //         return (
                                            //             <TouchableOpacity
                                            //                 key={index}
                                            //                 activeOpacity={0.85}
                                            //                 style={styles.circleWrapper}
                                            //                 onPress={() =>
                                            //                     navigation.navigate('StateTripsScreen', { state: item.state })
                                            //                 }
                                            //             >
                                            //                 {/* LEFT THRESHOLD FLAG */}
                                            //                 <TouchableOpacity style={styles.leftFlag}
                                            //                 onPress={()=>openThresholdModal(item)}>
                                            //                     <Text style={styles.flagText}>T</Text>
                                            //                     <Text style={styles.flagValue}>{item.threshold}</Text>
                                            //                 </TouchableOpacity>

                                            //                 {/* RIGHT COUNTDOWN FLAG */}
                                            //                 <View
                                            //                     style={[
                                            //                         styles.rightFlag,
                                            //                         { backgroundColor: getBorderColorByDays(item.days, item.threshold) },
                                            //                     ]}
                                            //                 >
                                            //                     <Text style={styles.flagValue}>{daysLeft}</Text>
                                            //                     <Text style={styles.leftText}>Left</Text>
                                            //                 </View>

                                            //                 {/* MAIN CIRCLE */}
                                            //                 <View
                                            //                     style={[
                                            //                         styles.circle,
                                            //                         { borderColor: getBorderColorByDays(item.days, item.threshold) },
                                            //                     ]}
                                            //                 >
                                            //                     {isHomeState && (
                                            //                         <Icon
                                            //                             name="home"
                                            //                             size={14}
                                            //                             color="#333"
                                            //                             style={styles.homeIcon}
                                            //                         />
                                            //                     )}

                                            //                     <Text style={styles.circleCode}>
                                            //                         {getFinalStateCode(item.state, item.country || 'INDIA')}
                                            //                     </Text>

                                            //                     <Text style={styles.circleDays}>{item.days}</Text>
                                            //                     <Text style={styles.circleLabel}>Days In</Text>
                                            //                 </View>
                                            //             </TouchableOpacity>
                                            //         );
                                            //     })}
                                            // </View>

                                            <View key={index} style={[styles.stateCard, { width: Dimensions.get('window').width * 0.42, height: Dimensions.get('window').width * 0.42, elevation: 1, borderWidth: 0.5, borderColor: '#E0E0E0' }]}
                                                onPress={() => navigation.navigate('StateTripsScreen', { state: item.state })}>
                                                <TouchableOpacity
                                                    style={styles.smallCircle1}
                                                    onPress={() => openThresholdModal(item)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.smallCircleText}>{item?.threshold}</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.smallCircle1Text}>Total</Text>
                                                <TouchableOpacity
                                                    style={[styles.smallCircle, { backgroundColor: getBorderColorByDays(item.days, item.threshold) }]}
                                                    onPress={() => openThresholdModal(item)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={[styles.smallCircleText,]}>{item?.threshold - item.days}</Text>
                                                </TouchableOpacity>
                                                <Text style={styles.smallCircle1Text1}>Left</Text>
                                                {isUserLocation && (
                                                    <Icon
                                                        name="home"
                                                        size={24}
                                                        color={isPrimary ? colors.primary : "#000"}
                                                        style={styles.homeIcon}
                                                    />
                                                )}
                                                {/* <View style={{ borderRadius: 70, borderWidth: 5, borderColor: getStateColor(item.state), width: Dimensions.get('window').width * 0.35, height: Dimensions.get('window').width * 0.35, justifyContent: 'center', alignItems: 'center' }}> */}
                                                <TouchableOpacity style={{ borderRadius: 70, borderWidth: 5, borderColor: getBorderColorByDays(item.days, item.threshold), width: Dimensions.get('window').width * 0.28, height: Dimensions.get('window').width * 0.28, justifyContent: 'center', alignItems: 'center', marginTop: 20 }}
                                                    onPress={() => navigation.navigate('StateTripsScreen', { state: item.state })}>
                                                    {/* <Text style={styles.stateCode}>{item.state.length < 2 ? item.state : getStateCodeSafe(item.state)}</Text> */}
                                                    {/* <Text style={styles.stateCode}>
                                                    {getStateShortCode(item.state, item.country || "INDIA")}
                                                </Text> */}

                                                    <Text style={styles.stateCode}>
                                                        {getFinalStateCode(item.state, item.country || "INDIA")}
                                                    </Text>
                                                    <View>

                                                        <Text style={styles.stateDays}>{item.days}</Text>
                                                    </View>
                                                    <Text style={styles.daysIn}>Days in</Text>

                                                </TouchableOpacity>
                                            </View>
                                        )
                                    })
                            }
                        </View>
                    </View>
                    <Modal
                        transparent={true}
                        animationType="fade"
                        visible={showStateModal}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle}>
                                    Please add your home state or domicile
                                </Text>

                                <Text style={styles.modalSubtitle}>
                                    This is required to calculate your residency accurately.
                                </Text>

                                <TouchableOpacity
                                    style={styles.modalButton}
                                    onPress={() => {
                                        setShowStateModal(false);
                                        navigation.navigate('Settings', {
                                            screen: 'ProfileManagement',
                                        });
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>
                                        Add Now
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        transparent
                        animationType="fade"
                        visible={thresholdModalVisible}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.thresholdModal}>
                                <Text style={styles.modalTitle}>
                                    Update Threshold
                                </Text>

                                <Text style={styles.modalSubtitle}>
                                    {selectedState?.state}
                                </Text>

                                <TextInput
                                    value={thresholdValue}
                                    onChangeText={setThresholdValue}
                                    keyboardType="numeric"
                                    placeholder="Enter threshold days"
                                    style={styles.input1}
                                />

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn1}
                                        onPress={() => setThresholdModalVisible(false)}
                                    >
                                        <Text style={styles.cancelText1}>Cancel</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.saveBtn1}
                                        onPress={handleThresholdUpdate}
                                    >
                                        <Text style={styles.saveText1}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    <Modal
                        transparent
                        animationType="fade"
                        visible={locationModal}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={{
                                width: '85%',
                                backgroundColor: '#fff',
                                borderRadius: 16,
                                padding: 20,
                                alignItems: 'center'
                            }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 10 }}>
                                    📍 Your Current Location
                                </Text>

                                {currentLocation && (
                                    <>
                                        <Text style={{ textAlign: 'center', color: '#555', marginBottom: 10 }}>
                                            {currentLocation.address}
                                        </Text>

                                        {/* <Text style={{ fontSize: 12, color: '#888' }}>
                                            Lat: {currentLocation.latitude}
                                        </Text>

                                        <Text style={{ fontSize: 12, color: '#888' }}>
                                            Lng: {currentLocation.longitude}
                                        </Text> */}
                                    </>
                                )}

                                <TouchableOpacity
                                    style={{
                                        backgroundColor: colors.primary,
                                        paddingVertical: 10,
                                        paddingHorizontal: 25,
                                        borderRadius: 20
                                    }}
                                    onPress={() => setLocationModal(false)}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                                        OK
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>


                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};


function mapStateToProps(state) {
    return {
        userData: state.auth.userData,
        loginToken: state.auth.loginToken,
        finalYearProgress: state.common.finalYearProgress,
        stateWiseResidency: state.common.stateWiseResidency,
        complianceScore: state.common.complianceScore,
        userLocations: state.common.userLocations,
    };
}


const mapDispatchToProps = {
    GET_FINAL_YEAR_PROGRESS,
    GET_STATE_WISE_RESIDENCY,
    GET_COMPLIANCE_SCORE,
    UPDATE_STATE_THRESHOLD,
    GET_USER_LOCATIONS,
};

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#fff',

    },

    section: {
        // marginBottom: 24,
        padding: 16,
        // margin: 10
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressText: {
        color: '#555',
    },
    bold: {
        fontWeight: '600',
    },
    daysLeft: {
        color: colors.primary,
        fontWeight: '500',
    },
    progressBar: {
        marginTop: 4,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 2,
        borderRadius: 5
    },
    actionButton: {
        // borderWidth: 1,
        // borderColor: '#DADADA',
        // borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 24,
        // backgroundColor: '#F9F9F9',
    },
    addCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000'
    },
    stateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    stateCard: {
        width: '47%',
        height: 150,
        borderWidth: 0.5,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#fff',
    },
    stateCode: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 0,
    },
    stateDays: {
        fontSize: 26,
        fontWeight: '700',
        color: '#000',
        // marginBottom: 2,
    },
    daysIn: {
        color: '#555',
        fontSize: 14,
    },
    smallCircle: {
        position: 'absolute',
        top: 15,
        right: -1,
        width: 46,
        height: 25,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    smallCircle1: {
        position: 'absolute',
        top: 15,
        left: -1,
        width: 46,
        height: 25,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    smallCircle1Text: {
        position: 'absolute',
        fontSize: 13,
        // fontWeight: '600',
        top: 42,
        left: 2,
        // width: 46,
        // height: 25,
        // borderTopRightRadius: 18,
        // borderBottomRightRadius: 18,
        // backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        // borderWidth: 1,
        // borderColor: '#E0E0E0',

    },
    smallCircle1Text1: {
        position: 'absolute',
        fontSize: 13,
        // fontWeight: '600',
        top: 42,
        right: 2,
        // width: 46,
        height: 25,
        // borderTopRightRadius: 18,
        // borderBottomRightRadius: 18,
        // backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        // borderWidth: 1,
        // borderColor: '#E0E0E0',

    },

    smallCircleText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#fff',
    },
    progressButtonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 30,
        backgroundColor: '#fff',
        width: '100%'
    },

    completedBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 30,
        elevation: 2,
        textAlign: 'center',
        width: '50%'
    },

    remainingBtn: {
        // backgroundColor: '#E0E0E0',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 10,
        // elevation: 1,
        textAlign: 'center',
        width: '50%'
    },

    completedText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },

    remainingText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 12,
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: 30,
        overflow: 'hidden',
        elevation: 2,
        marginTop: 5,
        borderColor: '#D7D7D7',
        borderWidth: 1
    },

    leftTab: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 30,
        borderBottomLeftRadius: 30,
    },

    rightTab: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopRightRadius: 30,
        borderBottomRightRadius: 30,
    },

    centerCircle: {
        position: 'absolute',
        alignSelf: 'center',
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 12,
        borderColor: '#fff',
        zIndex: 2,
    },

    activeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },

    inactiveText: {
        color: '#000',
        fontWeight: '600',
        fontSize: 15,
    },



    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },

    modalSubtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },

    modalButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },

    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },




    locationBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E74C3C',
        marginHorizontal: 12,
        marginTop: 8,
        padding: 12,
        borderRadius: 10,
        elevation: 3,
    },

    locationIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#C0392B',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    locationTitle: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },

    locationSubtitle: {
        color: '#FFEAEA',
        fontSize: 11,
        marginTop: 2,
    },
    // SUMMARY
    summaryContainer: {
        // flexDirection: "row",
        // justifyContent: "space-between",
        marginTop: 14,
        marginHorizontal: 16,
        gap: 10,
    },
    summaryBox: {
        // flex: 1,
        // backgroundColor: "#fff",
        // borderRadius: 12,
        // padding: 12,
        // borderWidth: 1,
        // borderColor: "#eee",
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    summaryValue: { fontSize: 22, fontWeight: "700", marginTop: 4 },
    summaryLabel: { fontSize: 12, color: "#666", marginTop: 2 },
    thresholdModal: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },

    input1: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        marginVertical: 12,
        fontSize: 14,
    },

    cancelBtn1: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        backgroundColor: '#eee',
    },

    saveBtn1: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        backgroundColor: colors.primary,
    },

    cancelText1: {
        color: '#333',
        fontWeight: '600',
    },

    saveText1: {
        color: '#fff',
        fontWeight: '600',
    },
    metricsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 4,
    },

    metricBox: {
        width: '30%',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },


    metricValue: {
        fontSize: 22,
        // fontWeight: '700',
        color: '#000',
    },

    metricLabel: {
        fontSize: 13,
        // fontWeight: '600',
        marginTop: 4,
    },

    metricSub: {
        fontSize: 11,
        color: '#777',
        marginTop: 4,
        textAlign: 'center',
    },

    // new state card style

    circleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        // marginTop: 12,
    },

    circleWrapper: {
        width: '42%',
        height: 130,
        alignItems: 'center',
        justifyContent: 'center',
        // marginBottom: 16,
        position: 'relative',
        overflow: 'visible',
    },

    circle: {
        width: 100,
        height: 100,
        borderRadius: 65,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },

    circleCode: {
        fontSize: 20,
        fontWeight: '700',
    },

    circleDays: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 4,
    },

    circleLabel: {
        fontSize: 12,
        color: '#666',
    },

    // leftFlag: {
    //     position: 'absolute',
    //     left: 0,
    //     top: '50%',
    //     transform: [{ translateY: -18 }],
    //     width: 44,
    //     height: 36,
    //     borderTopRightRadius: 18,
    //     borderBottomRightRadius: 18,
    //     backgroundColor: '#555',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
    leftFlag: {
        position: 'absolute',
        left: -18,              // 🔥 circle ke bahar nikaalo
        top: '50%',
        transform: [{ translateY: -20 }],
        width: 44,
        height: 30,
        // borderTopRightRadius: 20,
        // borderBottomRightRadius: 20,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        // backgroundColor: '#555',
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        // zIndex: 5,              // 🔥 MUST
    },

    rightFlag: {
        position: 'absolute',
        right: -18,
        top: '50%',
        transform: [{ translateY: -18 }],
        width: 44,
        height: 30,
        // borderTopLeftRadius: 18,
        // borderBottomLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomRightRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    flagText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '700',
        lineHeight: 12
    },

    flagValue: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
        lineHeight: 16
    },

    leftText: {
        fontSize: 9,
        color: '#fff',
        lineHeight: 10
    },

    homeIcon: {
        position: 'absolute',
        bottom: 10,
        left: 10,
    },


});