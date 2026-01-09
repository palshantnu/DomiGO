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
import { GET_FINAL_YEAR_PROGRESS, GET_STATE_WISE_RESIDENCY } from '../redux/actions/action-creator';
import { handleLocationAccess } from '../helpers/locationPermission';
import { ensureLocationReady } from '../helpers/locationHandler';
import { forceEnableGPS } from '../helpers/locationGuard';
import { checkGPSStatus } from '../helpers/gpsStatus';
import { useGPSListener } from '../hooks/useGPSListener';
import { openLocationSettings } from '../helpers/locationRedirect';



const HomeScreen = ({ GET_FINAL_YEAR_PROGRESS, GET_STATE_WISE_RESIDENCY, loginToken, finalYearProgress, stateWiseResidency, userData }) => {
    const [showStateModal, setShowStateModal] = React.useState(false);
    const [isGPSOn, setIsGPSOn] = React.useState(true);
    console.log('stateWiseResidency>>>>', stateWiseResidency);
    console.log('userData>>>>', userData);

    const dispatch = useDispatch();

    const progress = 200 / 365;
    const navigation = useNavigation();
    // useEffect(() => {
    //     DomigoTracker.startDomigoTracking();

    //     // return () => {
    //     //   stopDomigoTracking();
    //     // };
    // }, []);

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
        // return () => {
        //   stopDomigoTracking();
        // };
    }, []);

    // useEffect(() => {
    //     handleLocationAccess().then((enabled) => {
    //       console.log('Location Ready:', enabled);
    //     });
    //   }, []);

    //       useEffect(() => {
    //   setTimeout(() => {
    //     handleLocationAccess();
    //   }, 1000);
    // }, []);
    // useEffect(() => {
    //   // 🔥 Delay is MUST
    //   setTimeout(() => {
    //     ensureLocationReady();
    //   }, 1500);
    // }, []);

    const isFocused = useIsFocused();

    // useEffect(() => {
    //     if (isFocused) {
    //         const timer = setTimeout(() => {
    //             forceEnableGPS();
    //         }, 800); // 👈 small delay only
    //         return () => clearTimeout(timer);
    //     }
    // }, [isFocused]);

    // useEffect(() => {
    //     if (isFocused) {
    //         setTimeout(async () => {
    //             const gps = await checkGPSStatus();
    //             setIsGPSOn(gps);
    //         }, 500);
    //     }
    // }, [isFocused])


    console.log('loginToken', loginToken);

    function getStateCodeSafe(state) {
        return state
            .toLowerCase()
            .replace(/[^a-z\s]/g, "")
            .split(/\s+/)
            .map(w => w.charAt(0).toUpperCase())
            .join("");
    }

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


    // console.log(getStateCodeSafe("  Uttar   Pradesh ")); // UP



    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: 'none' }}>
                <Header title={'Dashboard'} />
                <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                    <View
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
                    </View>

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


                    <View style={{ ...styles.section, elevation: 2, backgroundColor: '#fafafa', borderRadius: 10 }}>
                        <Text style={styles.sectionTitle}>Insights Menu</Text>

                        <View style={styles.toggleContainer}>
                            <TouchableOpacity style={styles.leftTab}>
                                <Text style={styles.activeText}>Metrics</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.centerCircle} onPress={() => navigation.navigate('Metrics')}>
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
                            </TouchableOpacity>

                            <TouchableOpacity
                                // onPress={()=>DomigoTracker.startDomigoTracking()}
                                style={styles.rightTab}>
                                <Text style={styles.inactiveText}>Calendar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>


                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>State-wise Residency Overview</Text>
                        <View style={styles.stateGrid}>
                            {
                                // [
                                //     { code: 'FL', days: 134, color: '#D3D3D3', threshold: 183 },
                                //     { code: 'NY', days: 83, color: '#28a0dd', threshold: 183 },
                                //     { code: 'CA', days: 170, color: '#dc3c41', threshold: 183 },
                                //     { code: 'UT', days: 45, color: '#28a0dd', threshold: 183 },
                                // ]
                                stateWiseResidency
                                    ?.map((item, index) => (
                                        <View key={index} style={[styles.stateCard, { borderColor: '#E0E0E0', width: Dimensions.get('window').width * 0.42, height: Dimensions.get('window').width * 0.42, elevation: 1, borderWidth: 0.5 }]}>
                                            <View style={styles.smallCircle}>
                                                <Text style={styles.smallCircleText}>{'10'}</Text>
                                            </View>
                                            <View style={{ borderRadius: 70, borderWidth: 5, borderColor: getStateColor(item.state), width: Dimensions.get('window').width * 0.35, height: Dimensions.get('window').width * 0.35, justifyContent: 'center', alignItems: 'center' }}>
                                                <Text style={styles.stateCode}>{item.state.length < 2 ? item.state : getStateCodeSafe(item.state)}</Text>
                                                <Text style={styles.stateDays}>{item.days}</Text>
                                                <Text style={styles.daysIn}>Days in</Text>

                                            </View>
                                        </View>
                                    ))}
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
                                        navigation.navigate('Profile'); // ya jis screen pe state add hoti ho
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>
                                        Add Now
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
        stateWiseResidency: state.common.stateWiseResidency
    };
}


const mapDispatchToProps = {
    GET_FINAL_YEAR_PROGRESS,
    GET_STATE_WISE_RESIDENCY
};

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#fff',

    },

    section: {
        marginBottom: 24,
        padding: 16,
        margin: 10
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
        height: 140,
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
        marginBottom: 4,
    },
    stateDays: {
        fontSize: 26,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    daysIn: {
        color: '#555',
        fontSize: 14,
    },
    smallCircle: {
        position: 'absolute',
        top: 15,
        right: -1,
        width: 36,
        height: 20,
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
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



});