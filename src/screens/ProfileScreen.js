import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import { useNavigation } from "@react-navigation/native";

const colors = {
    primary: "#28A0DD",
    background: "#FFFFFF",
    card: "#FFFFFF",
    textDark: "#000",
    textLight: "#666",
    border: "#E5E5EA",
};

const ProfileScreen = () => {
    const navigation = useNavigation();
    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title={'My Profile'} />
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Image */}
                    <View style={styles.profileWrapper}>
                        <View>
                            <Image
                                source={{ uri: "https://i.pravatar.cc/150" }}
                                style={styles.profileImage}
                            />
                            <TouchableOpacity style={styles.plusButton}>
                                <Ionicons name="add" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.profileName}>Jim Wilkes</Text>
                        <Text style={styles.profileEmail}>jim@jimwilkes.me</Text>
                    </View>

                    {/* Personal Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Info</Text>
                        <View style={styles.infoCard}>
                            <InfoRow icon="person-outline" value="Jim Wilkes" />
                            <InfoRow
                                icon="location-outline"
                                value="123 Harmony Lane, Suite 4B, Melbourne"
                            />
                            <InfoRow icon="call-outline" value="+1 4668 5863 456" />
                            <InfoRow icon="lock-closed-outline" value="xxxxxxxxxxxxx" isLast />
                        </View>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity onPress={()=>navigation.navigate('ProfileManagement')} style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

// Reusable row for info items
const InfoRow = ({ icon, value, isLast }) => (
    <View
        style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: "#eee" }]}
    >
        <Ionicons name={icon} size={18} color="#595959" style={{ marginRight: 10, backgroundColor: '#E9E9E9', borderRadius: 50, padding: 10 }} />
        <Text style={styles.infoText}>{value}</Text>
    </View>
);

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
        borderColor: colors.border,
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
});

export default ProfileScreen;
