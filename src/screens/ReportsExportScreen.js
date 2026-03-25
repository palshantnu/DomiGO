import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../components/Header";
import colors from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { connect } from "react-redux";
import { GET_REPORTS, GET_WEEK_WISE_TIMELINE } from '../redux/actions/action-creator';
import FeatureGateWrapper from '../components/FeatureGateWrapper';
import { FEATURES } from '../config/featureAccess';


function ReportsExportScreen({ GET_WEEK_WISE_TIMELINE, weekWiseTimeline, GET_REPORTS, resportsList }) {
    const [selectedFilter, setSelectedFilter] = useState("Weekly");

    const filters = ["Weekly", "Monthly", "Quarterly", "Yearly"];

    const filterToTypeMap = {
        Weekly: 'weekly',
        Monthly: 'monthly',
        Quarterly: 'quarterly',
        Yearly: 'yearly',
    };

    const states = [
        { name: "Florida", days: "170 / 183", status: "Over Threshold", color: "#FF4D4D" },
        { name: "New York", days: "95 / 183", status: "Below Threshold", color: "#28C76F" },
        { name: "California", days: "120 / 183", status: "At Risk", color: "#FFC107" },
        { name: "Utah", days: "50 / 183", status: "Well Below", color: "#28C76F" },
    ];



    const getTodayDate = () => {
        return new Date().toLocaleDateString("en-CA").split('T')[0];
    };

    const onFilterChange = (item) => {
        setSelectedFilter(item);

        GET_REPORTS({
            type: filterToTypeMap[item],
            date: getTodayDate(),
        });
    };

    const getCurrentWeekDates = () => {
        const today = new Date();

        // Clone date to avoid mutation
        const current = new Date(today);

        // Get day (0 = Sunday, 1 = Monday ...)
        const day = current.getDay();

        // Monday as start of week
        const diffToMonday = day === 0 ? -6 : 1 - day;

        const startOfWeek = new Date(current);
        startOfWeek.setDate(current.getDate() + diffToMonday);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const formatDate = (date) =>
            date.toLocaleDateString("en-CA").split('T')[0]; // YYYY-MM-DD

        return {
            start: formatDate(startOfWeek),
            end: formatDate(endOfWeek),
        };
    };

    const getColorByStatus = (status) => {
        // const percentage = (days / threshold) * 100;

        if (status === "WELL_BELOW") {
            return '#65C466';
        } else if (status === "AT_RISK") {
            return '#EBB408';
        } else {
            return '#EE4444';
        }
    };

    useEffect(() => {
        const today = new Date();
        const { start, end } = getCurrentWeekDates();

        GET_WEEK_WISE_TIMELINE({ start, end });;
        GET_REPORTS({
            type: 'weekly',
            date: getTodayDate(),
        });
    }, []);

    console.log('weekWiseTimelineeeeeeeeeee', weekWiseTimeline);
    console.log('resportsList>>>>>>>>>>>>', resportsList);

    return (
        <LinearGradient
            colors={['#9ab1fa', '#ffffff']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title="Reports and Exports" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
                >
                    <View style={{ backgroundColor: "#F6F6F6", padding: 10, margin: 10, borderRadius: 10 }}>
                        <Text style={styles.topTitle}>Financial Year Progress</Text>
                        <View style={styles.filterRow}>
                            {filters.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() => onFilterChange(item)}
                                    style={[
                                        styles.filterButton,
                                        selectedFilter === item && styles.filterButtonActive,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.filterText,
                                            selectedFilter === item && styles.filterTextActive,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryBox}>
                            <View style={{ flexDirection: 'row', width: '100%', }}>
                                <Ionicons name="calendar-outline" size={20} style={{ marginTop: 10 }} color={'#65C466'} />
                                <View style={{ marginLeft: 5 }}>
                                    <Text style={{ ...styles.summaryValue, fontSize: 15, flex: 1, marginRight: 8 }}>Total
                                        Residency
                                        Day</Text>
                                    <Text style={styles.summaryValue}>{resportsList?.summary?.totalResidencyDays}</Text>
                                    <Text style={styles.summaryLabel}>
                                        Across all states this financial year.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.summaryBox}>
                            {/* <FeatureGateWrapper feature={FEATURES.COMPLIANCE_SCORE} featureName="Compliance Score"> */}
                                <View style={{ flexDirection: 'row', width: '100%', }}>
                                    <Ionicons name="stats-chart-outline" size={20} style={{ marginTop: 10 }} color={colors.primary} />
                                    <View style={{ marginLeft: 5 }}>
                                        <Text style={{ ...styles.summaryValue, fontSize: 15, flex: 1, marginRight: 8 }}>
                                            Compliance
                                            Score</Text>
                                        <Text style={styles.summaryValue}>{resportsList?.summary?.complianceScore}</Text>
                                        <Text style={styles.summaryLabel}>
                                            Your current estimated tax compliance.
                                        </Text>
                                    </View>
                                </View>
                            {/* </FeatureGateWrapper> */}
                        </View>
                    </View>
                    {/* Table */}
                    <Text style={styles.sectionTitle}>State-Wise Residency Breakdown</Text>
                    <View style={styles.card}>


                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>State</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Days</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>Status</Text>
                        </View>

                        {resportsList?.stateWise?.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableText, { flex: 1.2 }]}>{item.state}</Text>
                                <Text style={[styles.tableText, { flex: 1 }]}>{item.days} / {item.threshold}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: getColorByStatus(item.status) }]}>
                                    <Text style={styles.statusText}>{item.status}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Export */}
                    {/* <FeatureGateWrapper feature={FEATURES.EXPORT_REPORTS} featureName="Export Reports"> */}
                        <View style={styles.exportCard}>
                            <View style={{ flexDirection: 'row', width: '100%', }}>
                                <Ionicons name="document-text-outline" style={{ marginTop: 15, width: '25%' }} size={56} color={'#65C466'} />
                                <View style={{ paddingRight: 10, width: '75%' }}>
                                    <Text style={styles.exportTitle}>Generate Full Report</Text>
                                    <Text style={styles.exportDesc}>
                                        Download a comprehensive report of your tax residency history and compliance status.
                                    </Text>

                                    <TouchableOpacity style={styles.exportBtn}>
                                        <Ionicons name="download-outline" size={18} color="#fff" />
                                        <Text style={styles.exportBtnText}>Export Now</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    {/* </FeatureGateWrapper> */}

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

function mapStateToProps(state) {
    return {
        userData: state.auth.userData,
        loginToken: state.auth.loginToken,
        weekWiseTimeline: state.common.weekWiseTimeline,
        resportsList: state.common.resportsList,
    };
}


const mapDispatchToProps = {
    GET_WEEK_WISE_TIMELINE,
    GET_REPORTS,
};

export default connect(mapStateToProps, mapDispatchToProps)(ReportsExportScreen);

const styles = StyleSheet.create({
    container: { flex: 1 },

    topTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 10
    },

    // FILTER
    filterRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 16,
    },
    filterButton: {
        backgroundColor: "#fff",
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    filterButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: { color: "#000", fontSize: 13 },
    filterTextActive: { color: "#fff", fontWeight: "600" },

    // SUMMARY
    summaryContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
        marginHorizontal: 16,
        gap: 10,
    },
    summaryBox: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#eee",
    },
    summaryValue: { fontSize: 22, fontWeight: "700", marginTop: 4 },
    summaryLabel: { fontSize: 12, color: "#666", marginTop: 2 },

    // TABLE
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        marginHorizontal: 16,
        marginTop: 0,
        padding: 14,
    },
    sectionTitle: { fontSize: 17, fontWeight: "600", marginBottom: 0, marginTop: 0, padding: 14 },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#eee",
        paddingBottom: 6,
        marginBottom: 6,
    },
    tableHeaderText: { fontSize: 12, fontWeight: "600", color: "#000" },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
    },
    tableText: { fontSize: 13, color: "#000" },
    statusBadge: {
        flex: 1.2,
        alignItems: "center",
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: { fontSize: 11, fontWeight: "600", color: "#fff" },

    // EXPORT
    exportCard: {
        // backgroundColor: "#F5F9FF",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 20,
        borderWidth: 0.5,
        borderColor: '#E0E0E0'
    },
    exportTitle: { fontSize: 14, fontWeight: "600", color: "#000", marginTop: 10 },
    exportDesc: { fontSize: 13, color: "#666", marginTop: 6, marginBottom: 14 },
    exportBtn: {
        backgroundColor: colors.primary,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 13,
        borderRadius: 22,
        gap: 6,
        width: '60%'
    },
    exportBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
