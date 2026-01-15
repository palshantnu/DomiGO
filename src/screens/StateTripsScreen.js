import React, { useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import Header from '../components/Header';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GET_STATE_WISE_TRIPS } from '../redux/actions/action-creator';
import { connect } from 'react-redux';


export const result = [
    {
        "id": 258,
        "type": {
            "id": 3,
            "name": "Stopover for work",
            "isActive": true,
            "createdAt": "2025-12-03T15:12:40.079Z"
        },
        "mode": {
            "id": 1,
            "name": "Flight",
            "isActive": true,
            "createdAt": "2025-11-25T14:15:41.845Z"
        },
        "typeName": "Stopover for work",
        "modeName": "Flight",
        "originCity": "New Delhi",
        "destinationCity": "Noida",
        "destinationState": "Uttar Pradesh",
        "originState": "Delhi",
        "startDate": "2026-01-13T16:18:55.000Z",
        "endDate": "2026-01-13T17:09:38.000Z",
        "daysSpent": 2,
        "impactLevel": "Low Impact",
        "residencyRisk": "Low Risk",
        "attachments": [],
        "status": "completed",
        "createdAt": "2026-01-13T17:09:39.531Z"
    },
    {
        "id": 248,
        "type": {
            "id": 6,
            "name": "Default",
            "isActive": true,
            "createdAt": "2025-12-13T17:04:50.804Z"
        },
        "mode": {
            "id": 2,
            "name": "Default",
            "isActive": true,
            "createdAt": "2025-12-17T14:15:41.845Z"
        },
        "typeName": "Default",
        "modeName": "Default",
        "originCity": "Ghaziabad",
        "destinationCity": "Ghaziabad",
        "destinationState": "Uttar Pradesh",
        "originState": "Uttar Pradesh",
        "startDate": "2026-01-11T03:22:37.000Z",
        "endDate": "2026-01-13T06:15:57.000Z",
        "daysSpent": 4,
        "impactLevel": "Low Impact",
        "residencyRisk": "Low Risk",
        "attachments": [],
        "status": "completed",
        "createdAt": "2026-01-13T06:15:58.425Z"
    },
    {
        "id": 174,
        "type": {
            "id": 1,
            "name": "Business",
            "isActive": true,
            "createdAt": "2025-11-25T14:15:51.372Z"
        },
        "mode": {
            "id": 1,
            "name": "Flight",
            "isActive": true,
            "createdAt": "2025-11-25T14:15:41.845Z"
        },
        "typeName": "Business",
        "modeName": "Flight",
        "originCity": "Noida",
        "destinationCity": "Agra",
        "destinationState": "Uttar Pradesh",
        "originState": "Uttar Pradesh",
        "startDate": "2025-01-06T09:00:00.000Z",
        "endDate": "2025-01-06T18:00:00.000Z",
        "daysSpent": 2,
        "impactLevel": "Low Impact",
        "residencyRisk": "Low Risk",
        "attachments": [],
        "status": "completed",
        "createdAt": "2026-01-06T06:31:20.281Z"
    },
    {
        "id": 173,
        "type": {
            "id": 1,
            "name": "Business",
            "isActive": true,
            "createdAt": "2025-11-25T14:15:51.372Z"
        },
        "mode": {
            "id": 1,
            "name": "Flight",
            "isActive": true,
            "createdAt": "2025-11-25T14:15:41.845Z"
        },
        "typeName": "Business",
        "modeName": "Flight",
        "originCity": "Noida",
        "destinationCity": "Agra",
        "destinationState": "Uttar Pradesh",
        "originState": "Uttar Pradesh",
        "startDate": "2025-11-20T09:00:00.000Z",
        "endDate": "2025-11-22T18:00:00.000Z",
        "daysSpent": 4,
        "impactLevel": "Low Impact",
        "residencyRisk": "Low Risk",
        "attachments": [],
        "status": "completed",
        "createdAt": "2026-01-06T06:22:23.021Z"
    }
]

const RISK_COLORS = {
    'Low Risk': '#2ecc71',
    'Moderate Risk': '#f1c40f',
    'High Risk': '#dc3c41',
};

const IMPACT_COLORS = {
    'Low Impact': '#2ecc71',
    'Moderate Impact': '#f1c40f',
    'High Impact': '#dc3c41',
};

const StateTripsScreen = ({ route,GET_STATE_WISE_TRIPS,navigation,stateWiseTrips}) => {

    console.log('stateWiseTrips',stateWiseTrips);
      const { state } = route.params;
      console.log('state>>>>>>>',state);
      

    

    
      useEffect(() => {
        const today = new Date();
        // const { start, end } = getCurrentWeekDates();
    
        // GET_STATE_WISE_TRIPS({ start, end });;
        // GET_STATE_WISE_TRIPS({ start, end });;
        GET_STATE_WISE_TRIPS({ state: state });
      }, []);


    const stateName = stateWiseTrips?.[0]?.destinationState ?? 'State';

    const totalTrips = stateWiseTrips.length;
const totalDays = stateWiseTrips.reduce((sum, i) => sum + i.daysSpent, 0);

const sortedByDate = [...stateWiseTrips].sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
);

const summary = {
    totalTrips,
    totalDays,
    firstDate: sortedByDate[0]?.startDate,
    lastDate: sortedByDate[sortedByDate.length - 1]?.endDate,
    risk: result[0]?.residencyRisk,
};

    // 🔢 Calculations for header
    // const summary = useMemo(() => {
    //     const totalTrips = stateWiseTrips.length;
    //     const totalDays = stateWiseTrips.reduce((sum, i) => sum + i.daysSpent, 0);

    //     const sortedByDate = [...stateWiseTrips].sort(
    //         (a, b) => new Date(a.startDate) - new Date(b.startDate)
    //     );

    //     return {
    //         totalTrips,
    //         totalDays,
    //         firstDate: sortedByDate[0]?.startDate,
    //         lastDate: sortedByDate[sortedByDate.length - 1]?.endDate,
    //         risk: result[0]?.residencyRisk,
    //     };
    // }, [result]);

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: 'none' }}>
                <Header title={'State Wise Trips'} />

                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.stateTitle}>{stateName}</Text>

                        <View style={styles.headerRow}>
                            <Text style={styles.headerMeta}>
                                {summary.totalTrips} Trips • {summary.totalDays} Days
                            </Text>

                            {/* <View
                                style={[
                                    styles.riskBadge,
                                    { backgroundColor: RISK_COLORS[summary.risk] + '20' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.riskText,
                                        { color: RISK_COLORS[summary.risk] },
                                    ]}
                                >
                                    {summary.risk}
                                </Text>
                            </View> */}
                        </View>

                        {/* <Text style={styles.dateRange}>
                            {dayjs(summary.firstDate).format('DD MMM YYYY')} –{' '}
                            {dayjs(summary.lastDate).format('DD MMM YYYY')}
                        </Text> */}
                    </View>

                    {/* ===== TRIPS LIST ===== */}
                    <FlatList
                        data={stateWiseTrips}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={{ padding: 16 }}
                        renderItem={({ item }) => (
                            // <View style={styles.card}>
                                      <TouchableOpacity style={styles.cardWrapper}
                                      onPress={() => navigation.navigate('DayDetail', item)}>
                                
                                        {/* ===== MAIN CARD ROW (UNCHANGED) ===== */}
                                        <View style={styles.rowContainer}>
                                            <View
                                                        style={[
                                                          styles.colorStrip,
                                                          { backgroundColor: '#289FDE' },
                                                        ]}
                                                      />
                                            <View style={styles.card}>
                                <View style={styles.cardTop}>
                                    <Text style={styles.route}>
                                        {item.originCity} → {item.destinationCity}
                                    </Text>

                                    <View
                                        style={[
                                            styles.impactBadge,
                                            {
                                                backgroundColor:
                                                    IMPACT_COLORS[item.impactLevel] + '20',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.impactText,
                                                { color: IMPACT_COLORS[item.impactLevel] },
                                            ]}
                                        >
                                            {item.impactLevel}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.date}>
                                    {dayjs(item.startDate).format('DD MMM')} –{' '}
                                    {dayjs(item.endDate).format('DD MMM YYYY')}
                                </Text>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.meta}>{item.daysSpent} Days</Text>
                                    <Text style={styles.meta}>
                                        {item.typeName} • {item.modeName}
                                    </Text>
                                </View>
                                </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};



function mapStateToProps(state) {
  return {
    userData: state.auth.userData,
    loginToken: state.auth.loginToken,
    stateWiseTrips: state.common.stateWiseTrips,
  };
}


const mapDispatchToProps = {
  GET_STATE_WISE_TRIPS,
};

export default connect(mapStateToProps, mapDispatchToProps)(StateTripsScreen);

// export default StateTripsScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },

    header: {
        backgroundColor: '#fff',
        padding: 16,
        // borderBottomLeftRadius: 20,
        // borderBottomRightRadius: 20,
        elevation: 2,
        alignItems:'center',
        justifyContent:'space-between',
        flexDirection:'row'
    },

    stateTitle: {
        fontSize: 22,
        fontWeight: '700',
    
    },

    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },

    headerMeta: {
        color: '#6e6e73',
    },

    riskBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 14,
    },

    riskText: {
        fontSize: 12,
        fontWeight: '600',
    },

    dateRange: {
        marginTop: 6,
        fontSize: 12,
        color: '#8E8E93',
    },

    card: {
        backgroundColor: '#fff',
        // borderRadius: 14,
        padding: 14,
        // paddingHorizontal:26,
        width:'100%',
        // marginBottom: 12,
        elevation: 1,
    },
      cardWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    marginBottom: 12,
    overflow: 'hidden',
  },

  rowContainer: {
    flexDirection: 'row',
  },
    colorStrip: {
    width: 8,
  },

    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    route: {
        fontSize: 15,
        fontWeight: '600',
    },

    impactBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },

    impactText: {
        fontSize: 11,
        fontWeight: '600',
    },

    date: {
        marginTop: 6,
        fontSize: 12,
        color: '#8E8E93',
    },

    cardFooter: {
        marginTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    meta: {
        fontSize: 12,
        color: '#6e6e73',
        fontWeight: '500',
    },
});
