import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Header from '../components/Header';
import CustomProgressBar from '../components/CustomProgressBar';
import { connect, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { GET_STATE_WISE_METRICS } from '../redux/actions/action-creator';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FEATURES } from '../config/featureAccess';

const colors = {
    primary: '#28a0dd',
};

// const metricsData = [
//     {
//         id: 1,
//         state: 'FL',
//         bgColor: '#2ecc71',
//         taxDays: 134,
//         daysWorked: 100,
//         hoursWorked: 800,
//         travelDays: 15,
//         wages: '$100,000',
//         progress: 0.5,
//     },
//     {
//         id: 2,
//         state: 'NY',
//         bgColor: '#f39c12',
//         taxDays: 100,
//         daysWorked: 100,
//         hoursWorked: 100,
//         travelDays: 10,
//         wages: '$120,000',
//         progress: 0.5,
//     },
//     {
//         id: 3,
//         state: 'CA',
//         bgColor: '#3498db',
//         taxDays: 180,
//         daysWorked: 120,
//         hoursWorked: 950,
//         travelDays: 8,
//         wages: '$150,000',
//         progress: 0.75,
//     },
//     {
//         id: 4,
//         state: 'UT',
//         bgColor: '#27ae60',
//         taxDays: 90,
//         daysWorked: 60,
//         hoursWorked: 450,
//         travelDays: 3,
//         wages: '$85,000',
//         progress: 0.3,
//     },
//     {
//         id: 5,
//         state: 'VA',
//         bgColor: '#e74c3c',
//         taxDays: 180,
//         daysWorked: 100,
//         hoursWorked: 300,
//         travelDays: 5,
//         wages: '$90,000',
//         progress: 0.9,
//     },
// ];



//  function MetricsScreen({GET_STATE_WISE_METRICS,}) {
const MetricsScreen = ({ GET_STATE_WISE_METRICS, loginToken, stateWiseMetrics }) => {
    console.log('stateWiseMetrics>>>>', stateWiseMetrics);
    const { canAccess } = useFeatureAccess();


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

    const getBorderColorByDays = (days, threshold) => {
        const percentage = (days / threshold) * 100;

        if (percentage <= 25) {
            return '#65C466'; // safe
        } else if (percentage > 25 && percentage < 50) {
            return '#EBB408'; // warning
        } else {
            return '#EE4444'; // danger
        }
    };



    const metricsData = stateWiseMetrics.map((item, index) => {
        const daysLeft = Math.max(item.threshold - item.travelDays, 0);
        return ({
            id: index.toString(),
            state: item.state,
            daysIn: item.daysIn,
            taxDays: item.taxDays,
            daysLeft,
            daysWorked: item.daysWorked,
            hoursWorked: item.hoursWorked,
            travelDays: item.travelDays,
            wages: item.estimatedWages,
            // progress: item.progressDays / 10, // example: assuming max = 10 days
            progress: daysLeft / item.threshold,
            progressColor: getBorderColorByDays(item.travelDays, item.threshold),
            progressLabel: `${daysLeft} Days`,
            // progressLabel: `${item.progressDays} Days`,
            // bgColor: '#E6F0FF', // you can make this dynamic if needed
            bgColor: getStateColor(item.state)
        })
    });


    const dispatch = useDispatch();

    const progress = 200 / 365;
    const navigation = useNavigation();

    // useEffect(() => {

    //     dispatch(GET_STATE_WISE_METRICS())
    //     // return () => {
    //     //   stopDomigoTracking();
    //     // };
    // }, []);
    useEffect(() => {
        GET_STATE_WISE_METRICS();
    }, []);
    return (
        <LinearGradient
            colors={['#9ab1fa', '#ffffff']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title="Metrics" />

                {/* <View style={styles.tabsContainer}>
                    <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
                        <Text style={[styles.tabText, styles.activeTabText]}>Metrics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tabButton}
                     onPress={()=>navigation.navigate('Calendar')}>
                        <Text style={styles.tabText}>Calendar</Text>
                    </TouchableOpacity>
                </View> */}

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {metricsData.map((item) => {
                        // const stats = [
                        //     { label: 'Tax Days in', value: item.taxDays },
                        //     { label: 'Days Worked', value: item.daysWorked },
                        //     { label: 'Hours Worked', value: item.hoursWorked },
                        //     { label: 'Travel Days', value: item.travelDays },
                        //     { label: 'Est. Wages', value: item.wages },
                        //     { label: '', value: '' },
                        // ];
                        const stats = [
                            { label: 'Days in', value: item.daysIn },
                            { label: 'Travel Days', value: item.travelDays },
                            { label: 'Days Worked', value: item.daysWorked },
                            { label: 'Hours Worked', value: item.hoursWorked },
                            { label: 'Est Taxable Days', value: item.taxDays },
                            { label: 'Est Taxable Liability', value: canAccess(FEATURES.TAXABLE_LIABILITY) ? item.wages : '***' },
                        ];

                        return (
                            <View key={item.id} style={styles.card}>
                                {/* <View style={[styles.stateBox, { backgroundColor: item.bgColor }]}> */}
                                <View style={[styles.stateBox, { backgroundColor: "#fff" }]}>
                                    {/* <Text style={styles.stateText}>{item.state.length < 2 ? item.state : getStateCodeSafe(item.state)}</Text> */}
                                    <Text style={styles.stateText}>{item.state}</Text>
                                </View>

                                <View style={styles.cardContent}>
                                    <View style={styles.topTag}>
                                        <CustomProgressBar
                                            progress={item.progress}
                                            height={18}
                                            bgColor={item.progressColor} 
                                            label={item.progressLabel}
                                        />
                                    </View>

                                    <FlatList
                                        data={stats}
                                        numColumns={3}
                                        keyExtractor={(stat, index) => index.toString()}
                                        scrollEnabled={false}
                                        renderItem={({ item: stat }) => (
                                            <View style={styles.col}>
                                                <Text style={styles.bigValue}>{stat.value}</Text>
                                                <Text style={styles.smallLabel}>{stat.label}</Text>
                                            </View>
                                        )}
                                        contentContainerStyle={styles.statsGrid}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>

                {/* <TouchableOpacity style={styles.fab}>
                    <Text style={styles.fabPlus}>+</Text>
                </TouchableOpacity> */}
            </SafeAreaView>
        </LinearGradient>
    );
}


function mapStateToProps(state) {
    return {
        userData: state.auth.userData,
        loginToken: state.auth.loginToken,
        stateWiseMetrics: state.common.stateWiseMetrics
    };
}


const mapDispatchToProps = {
    GET_STATE_WISE_METRICS,
};

export default connect(mapStateToProps, mapDispatchToProps)(MetricsScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignSelf: 'center',
        backgroundColor: '#F3F5F8',
        borderRadius: 30,
        padding: 5,
        width: '92%',
        marginTop: 10,
    },
    tabButton: {
        paddingVertical: 8,
        borderRadius: 25,
        width: '50%',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: '#6B6B6B',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    scrollContent: {
        paddingVertical: 15,
        paddingBottom: 120,
    },
    card: {
        // flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 15,
        marginHorizontal: 15,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    stateBox: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        paddingVertical: 10,
        // borderBottomLeftRadius: 15,
        // borderRadius:15
    },
    stateText: {
        color: '#111',
        fontSize: 18,
        fontWeight: '700',
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    topTag: {
        marginBottom: 10,
        width: '100%',
    },
    statsGrid: {
        justifyContent: 'space-between',
    },
    col: {
        flex: 1 / 3,
        alignItems: 'center',
        marginVertical: 8,
    },
    bigValue: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
    },
    smallLabel: {
        fontSize: 11,
        color: '#777',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 35,
        right: 25,
        backgroundColor: colors.primary,
        width: 65,
        height: 65,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 6,
    },
    fabPlus: {
        fontSize: 38,
        color: '#fff',
        fontWeight: '700',
        lineHeight: 38,
    },
});
