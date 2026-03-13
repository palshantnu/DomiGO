import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Linking,
    Animated,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { connect, useDispatch } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
    GET_RESIDENCY_RECORD_DETAILS,
    DELETE_RESIDENCY_RECORD
} from "../redux/actions/action-creator";
import { CustomToast } from "../helpers/CommonHelpers";
import colors from "../theme/colors";
import FeatureGateWrapper from '../components/FeatureGateWrapper';
import { FEATURES } from '../config/featureAccess';

const SCREEN_WIDTH = Dimensions.get("window").width;

const Skeleton = ({ height, width, radius = 10 }) => {
    const opacityAnim = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={{
                height,
                width,
                borderRadius: radius,
                backgroundColor: "#E0E0E0",
                opacity: opacityAnim,
                marginVertical: 8,
            }}
        />
    );
};

const ResidencyRecordDetailsScreen = ({
    GET_RESIDENCY_RECORD_DETAILS,
    DELETE_RESIDENCY_RECORD,
    ResidencyRecordDetails,
}) => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const route = useRoute();
    const id = route.params?.id;

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetails();
    }, [id]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            await dispatch(GET_RESIDENCY_RECORD_DETAILS(id));
        } catch (err) {
            console.log("DETAIL ERROR:", err);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        try {
            await dispatch(DELETE_RESIDENCY_RECORD(id));
            CustomToast.show("Record deleted");
            navigation.goBack();
        } catch {
            CustomToast.show("Delete failed");
        }
    };

    const data = ResidencyRecordDetails;

    if (loading || !data) {
        return (
            <LinearGradient colors={["#9ab1fa", "#ffffff"]} style={styles.container}>
                <SafeAreaView style={{ flex: 1 }}>
                    <Header title="Record Details" />
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
                        <Skeleton height={90} width={"100%"} />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <View key={i} style={{ marginTop: 18 }}>
                                <Skeleton height={18} width={"40%"} />
                                <Skeleton height={22} width={"85%"} />
                            </View>
                        ))}
                        <Skeleton height={200} width={"100%"} radius={16} />
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <View style={{ flex: 1 ,paddingTop:50}}>
                <Header title="Record Details" />
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.glassCard}>
                        <View style={styles.headerRow}>
                            <View style={styles.iconWrapper}>
                                <MaterialCommunityIcons
                                    name={
                                        data.category?.name === "domicile"
                                            ? "home-outline"
                                            : "file-document-outline"
                                    }
                                    size={42}
                                    color="#4A4A4A"
                                />
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={styles.title}>{data.title}</Text>
                                <Text style={styles.categoryTag}>{data.category?.name}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.rowBetween}>
                            <Detail label="State" value={data.state} />
                            <View style={{ width: 20 }} />
                            <Detail label="City" value={data.city} />
                        </View>

                        <View style={styles.rowBetween}>
                            <Detail
                                label="Issue Date"
                                value={new Date(data.issueDate).toDateString()}
                            />
                            <View style={{ width: 20 }} />
                            <Detail
                                label="Renew Date"
                                value={new Date(data.renewDate).toDateString()}
                            />
                        </View>

                        <View style={styles.divider} />

                        <FeatureGateWrapper feature={FEATURES.DOCUMENT_MANAGEMENT} featureName="Document Management">
                            <Text style={styles.sectionLabel}>Attachment</Text>

                            {data.attachmentUrl ? (
                                data.attachmentUrl.endsWith(".pdf") ? (
                                    <TouchableOpacity
                                        style={styles.pdfButton}
                                        onPress={() => Linking.openURL(data.attachmentUrl)}
                                    >
                                        <Ionicons name="document-outline" size={22} color="#fff" />
                                        <Text style={styles.pdfText}>Open PDF</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Image
                                        source={{ uri: data.attachmentUrl }}
                                        style={styles.attachmentImage}
                                        resizeMode="contain"
                                    />
                                )
                            ) : (
                                <Text style={{ color: "#777", marginTop: 8 }}>No Attachment</Text>
                            )}
                        </FeatureGateWrapper>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.editBtn}
                                onPress={() =>
                                    navigation.navigate("CreateResidencyRecord", {
                                        editData: data,
                                    })
                                }
                            >
                                <Ionicons name="create-outline" size={18} color="#fff" />
                                <Text style={styles.actionText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={18} color="#fff" />
                                <Text style={styles.actionText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </LinearGradient>
    );
};

const Detail = ({ label, value }) => (
    <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

function mapStateToProps(state) {
    return {
        ResidencyRecordDetails: state.common.ResidencyRecordDetails,
    };
}

export default connect(mapStateToProps, {
    GET_RESIDENCY_RECORD_DETAILS,
    DELETE_RESIDENCY_RECORD,
})(ResidencyRecordDetailsScreen);

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: {
        paddingHorizontal: 16,
        paddingBottom: 0,
    },
    glassCard: {
        padding: 18,
        borderRadius: 22,
        marginTop: 12,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(240,240,240,0.8)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#000",
    },
    categoryTag: {
        fontSize: 12,
        marginTop: 4,
        color: "#4C6EF5",
        backgroundColor: "#E8ECFF",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: "flex-start",
        overflow: "hidden",
    },
    label: {
        fontSize: 13,
        color: "#777",
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        fontWeight: "600",
        color: "#000",
    },
    divider: {
        height: 1,
        backgroundColor: "#EAEAEA",
        marginVertical: 18,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 10,
        color: "#444",
    },
    attachmentImage: {
        width: SCREEN_WIDTH - 60,
        height: 220,
        borderRadius: 14,
        alignSelf: "center",
    },
    pdfButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    pdfText: { color: "#fff", marginLeft: 8, fontSize: 15 },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 28,
    },
    editBtn: {
        flexDirection: "row",
        backgroundColor: "#3C95FF",
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        width: '45%',
        justifyContent: 'center'
    },
    deleteBtn: {
        flexDirection: "row",
        backgroundColor: "#E64942",
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        width: '45%',
        justifyContent: 'center'
    },
    actionText: {
        color: "#fff",
        marginLeft: 8,
        fontWeight: "600",
        fontSize: 15,
    },
    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
    },
});
