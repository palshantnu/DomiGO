import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../components/Header";
import colors from "../theme/colors";
import { connect } from "react-redux";
import { GET_FAQS, GET_SUPPORT_CONTACT, } from '../redux/actions/action-creator';


const FAQS = [
    {
        id: "1",
        question: "How do I track my residency days?",
        answer:
            "You can track your residency days automatically by adding your travel history. The app calculates days based on your location entries.",
    },
    {
        id: "2",
        question: "What do the color codes in histograms means?",
        answer:
            "Different colors represent different residency statuses such as resident, non-resident, and warning thresholds.",
    },
    {
        id: "3",
        question: "Can I customize residency rules?",
        answer:
            "Yes, you can customize residency rules from the settings section based on country-specific regulations.",
    },
    {
        id: "4",
        question: "How is the financial year progress calculated?",
        answer:
            "The financial year progress is calculated based on the number of elapsed days in the selected financial year.",
    },
];


const TIPS = [
    { id: "1", text: "Ensure your app is updated to the latest version." },
    { id: "2", text: "Check your internet connection for data synchronization." },
    { id: "3", text: "Restart the application if you encounter unexpected behavior." },
];

const FAQItem = ({ item, isOpen, onPress }) => {
    return (
        <View>
            <TouchableOpacity style={styles.faqRow} onPress={onPress}>
                <Text style={styles.rowText}>{item.question}</Text>
                <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#9CA3AF"
                />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                </View>
            )}
        </View>
    );
};


const HelpSupportScreen = ({ GET_FAQS, GET_SUPPORT_CONTACT, faqs, supportContact }) => {
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        GET_FAQS();
        GET_SUPPORT_CONTACT();
    }, []);


    console.log('faqs', faqs);
    console.log('supportContact', supportContact);


    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <Header title="Help & Support" />

                {supportContact?.length > 0 &&
                    faqs?.length > 0 && <ScrollView
                        contentContainerStyle={styles.container}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* FAQ */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Frequently Asked Question?</Text>

                            {FAQS.map((item, index) => (
                                <View
                                    key={item.id}
                                    style={index !== FAQS.length - 1 && styles.rowBorder}
                                >
                                    <FAQItem
                                        item={item}
                                        isOpen={openId === item.id}
                                        onPress={() =>
                                            setOpenId(openId === item.id ? null : item.id)
                                        }
                                    />
                                </View>
                            ))}
                        </View>

                        {/* Contact Support */}
                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Contact Support</Text>

                            <View style={styles.contactRow}>
                                <Ionicons name="mail-outline" size={18} color="#2563EB" />
                                <Text style={styles.contactText}>{supportContact[0]?.email}</Text>
                            </View>

                            <View style={styles.contactRow}>
                                <Ionicons name="call-outline" size={18} color="#22C55E" />
                                <Text style={styles.contactText}>+1 {supportContact[0]?.phone}</Text>
                            </View>

                            <TouchableOpacity style={styles.primaryButton}>
                                <Text style={styles.primaryButtonText}>Send Us a Message</Text>
                                <Ionicons name="send" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Troubleshooting */}
                        {/* <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Troubleshooting Tips</Text>

                        {TIPS.map((item) => (
                            <View key={item.id} style={styles.tipRow}>
                                <View style={styles.tipCircle}>
                                    <Text style={styles.tipNumber}>{item.id}</Text>
                                </View>
                                <Text style={styles.tipText}>{item.text}</Text>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>
                                View our Full Knowledge Base
                            </Text>
                        </TouchableOpacity>
                    </View> */}
                    </ScrollView>}
            </SafeAreaView>
        </LinearGradient>
    );
};
function mapStateToProps(state) {
    return {
        userData: state.auth.userData,
        loginToken: state.auth.loginToken,
        faqs: state.common.faqs,
        supportContact: state.common.supportContact,
    };
}


const mapDispatchToProps = {
    GET_FAQS,
    GET_SUPPORT_CONTACT,
};

export default connect(mapStateToProps, mapDispatchToProps)(HelpSupportScreen);
const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 18,
        paddingBottom: 30,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0F172A",
        marginBottom: 10,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
    },

    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    rowText: {
        fontSize: 14,
        color: "#0F172A",
        flex: 1,
        marginRight: 10,
    },

    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
    },

    contactText: {
        fontSize: 14,
        color: "#0F172A",
        marginLeft: 10,
    },

    primaryButton: {
        backgroundColor: colors.primary,
        marginTop: 14,
        paddingVertical: 12,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    primaryButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
        marginRight: 8,
    },

    tipRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },

    tipCircle: {
        height: 28,
        width: 28,
        borderRadius: 14,
        backgroundColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    tipNumber: {
        fontSize: 12,
        fontWeight: "700",
        color: "#0F172A",
    },

    tipText: {
        fontSize: 13,
        color: "#334155",
        flex: 1,
    },

    secondaryButton: {
        backgroundColor: "#22C55E",
        paddingVertical: 12,
        borderRadius: 22,
        marginTop: 12,
        alignItems: "center",
    },

    secondaryButtonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    faqRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
    },

    answerContainer: {
        paddingBottom: 12,
        paddingRight: 24,
    },

    answerText: {
        fontSize: 13,
        color: "#475569",
        lineHeight: 18,
    },

});
