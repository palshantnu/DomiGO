import React, { useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    FlatList,
    Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import { useNavigation } from "@react-navigation/native";
import { connect } from "react-redux";
import { getPersonalProfileDataAction } from "../redux/actions/action-creator";
import { getUserPersonalDataSelelctor } from "../redux/selectors/common";
import colors from "../theme/colors";
import { GET_PRIVACY_POLICY, } from '../redux/actions/action-creator';



const PrivacyPolicyScreen = ({GET_PRIVACY_POLICY, privacyPolicy}) => {
    const navigation = useNavigation();

    useEffect(() => {
        GET_PRIVACY_POLICY();
      }, []);

      
  console.log('privacypolicy', privacyPolicy);


    const { width } = Dimensions.get("window");

    const SETTINGS = [
        { id: "1", title: "Information We Collect" },
        { id: "2", title: "How We Use Your Data" },
        { id: "3", title: "Data Security" },
        { id: "4", title: "Permissions" },
        { id: "5", title: "Your Rights" },
        { id: "6", title: "Contact Us" },
    ];
    const renderItem = ({ item }) => (
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Text style={styles.rowText}>{item.title}</Text>
            <Text style={styles.chev}>{">"}</Text>
        </Pressable>
    );

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title={'Privacy Policy'} />
                <ScrollView
                    // contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* <View style={styles.profileWrapper}>
                        <View>
                            <Image
                                source={{ uri: "https://i.pravatar.cc/150" }}
                                style={styles.profileImage}
                            />
                            <TouchableOpacity style={styles.plusButton}>
                                <Ionicons name="add" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.profileName}>{userPersonalData?.name ?? 'user'}</Text>
                        <Text style={styles.profileEmail}>{userPersonalData?.email ?? 'user@gmail.com'}</Text>
                    </View> */}

                    <View style={styles.container1}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Welcome to Domingo!</Text>
                            <Text style={styles.cardBody}>
                                Your privacy is important to us. This Privacy Policy explains how we collect, use,
                                and protect your information when you use our Tax Residency Tracker app.
                            </Text>
                        </View>
                        {/* <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Personal Info</Text>
                            <View style={styles.infoCard}>
                                <InfoRow icon="person-outline" value={userPersonalData?.name ?? 'user'} />
                                <InfoRow
                                    icon="location-outline"
                                    value={userPersonalData?.address ?? '**********'}
                                />
                                <InfoRow icon="call-outline" value={userPersonalData?.mobile ?? '**********'} />
                                <InfoRow icon="lock-closed-outline" value="xxxxxxxxxxxxx" isLast />
                            </View>
                        </View> */}
                        <View style={styles.infoCard}>
                        <FlatList
                            data={SETTINGS}
                            keyExtractor={(i) => i.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContainer}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};


const InfoRow = ({ icon, value, isLast }) => (
    <View
        style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: "#eee" }]}
    >
        <Ionicons name={icon} size={18} color="#595959" style={{ marginRight: 10, backgroundColor: '#E9E9E9', borderRadius: 50, padding: 10 }} />
        <Text style={styles.infoText}>{value}</Text>
    </View>
);

function mapStateToProps(state) {
    return {
      userData: state.auth.userData,
      loginToken: state.auth.loginToken,
      privacyPolicy: state.common.privacyPolicy,
    };
  }
  
  
  const mapDispatchToProps = {
    GET_PRIVACY_POLICY,
  };
  
  export default connect(mapStateToProps, mapDispatchToProps)(PrivacyPolicyScreen);

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
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 6,
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
        backgroundColor:'#bbb'
    },

});



