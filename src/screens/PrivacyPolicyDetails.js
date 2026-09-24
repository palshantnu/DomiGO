import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import colors from "../theme/colors";

const PrivacyPolicyDetails = ({ route }) => {
    const { title, content, headerTitle } = route.params;

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title={headerTitle || "Privacy Policy Details"} showBack/>

                <ScrollView
                    contentContainerStyle={styles.container1}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>
                        {title}
                    </Text>

                    <Text style={styles.content}>
                        {content}
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

export default PrivacyPolicyDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: colors.background,
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomColor: "#eee",
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textDark,
    },
    backIcon: {
        padding: 6,
    },
    bellIcon: {
        padding: 6,
    },
    profileWrapper: {
        alignItems: "center",
        marginTop: 25,
    },
    profileImage: {
        height: 100,
        width: 100,
        borderRadius: 50,
    },
    plusButton: {
        position: "absolute",
        bottom: 4,
        right: 2,
        backgroundColor: colors.primary,
        borderRadius: 12,
        height: 24,
        width: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    profileName: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textDark,
        marginTop: 8,
    },
    profileEmail: {
        fontSize: 14,
        color: colors.textLight,
    },
    section: {
        marginTop: 30,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.textDark,
        marginBottom: 8,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbb',
        paddingHorizontal: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
    },
    infoText: {
        fontSize: 14,
        color: colors.textDark,
        flex: 1,
    },
    editButton: {
        backgroundColor: colors.primary,
        marginTop: 30,
        marginHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: "center",
    },
    editButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },




    container1: {
        paddingHorizontal: 18,
        paddingTop: 6,
        paddingBottom: 30,
        // paddingHorizontal: 18,
        // paddingTop: 6,
    },

    card: {
        // backgroundColor: "#fff",
        backgroundColor: "transparent",
        borderRadius: 12,
        padding: 18,
        marginTop: 6,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 10,
        // elevation: 3,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#0F172A",
        marginBottom: 8,
    },
    cardBody: {
        fontSize: 14,
        color: "#475569",
        lineHeight: 18,
    },

    listContainer: {
        // marginTop: 18,
        // paddingBottom: 120,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
        borderRadius: 12,
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 6,
        // elevation: 1,
    },
    pressed: {
        opacity: 0.7,
    },
    rowText: {
        fontSize: 14,
        color: "#0F172A",
    },
    chev: {
        color: "#9CA3AF",
        fontSize: 18,
        fontWeight: "600",
    },
    separator: {
        height: 1,
        backgroundColor: '#bbb'
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 15,
        alignSelf: "center",
    },

    content: {
        fontSize: 16,
        color: "#4B5563",
        lineHeight: 26,
    },


});