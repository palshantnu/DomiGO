import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import { useNavigation } from "@react-navigation/native";
import { connect } from "react-redux";
import colors from "../theme/colors";
import { GET_TERMS_OF_SERVICE } from '../redux/actions/action-creator';

const TermsOfUseScreen = ({ GET_TERMS_OF_SERVICE, termsOfService }) => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);


    // console.log("TermsOfUseScreen termsOfService:", termsOfService);

    const sections = Array.isArray(termsOfService)
        ? termsOfService.filter((item) => item?.isActive !== false)
        : [];

    const loadTerms = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            await GET_TERMS_OF_SERVICE();
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [GET_TERMS_OF_SERVICE]);

    useEffect(() => {
        loadTerms();
    }, [loadTerms]);

    const renderItem = (item, index) => (
        <View key={String(item.id ?? index)}>
            {index > 0 && <View style={styles.separator} />}
            <Pressable
                style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() =>
                    navigation.navigate("PrivacyPolicyDetails", {
                        title: item.title,
                        content: item.content,
                        headerTitle: "Terms of Use",
                    })
                }
            >
                <Text style={styles.rowText}>{item.title}</Text>
                <Text style={styles.chev}>{">"}</Text>
            </Pressable>
        </View>
    );

    const renderBody = () => {
        // Show cached terms while refreshing; only block when there is nothing to show.
        if (loading && sections.length === 0) {
            return (
                <View style={styles.stateContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.stateText}>Loading Terms of Use...</Text>
                </View>
            );
        }

        if (sections.length === 0) {
            return (
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>
                        {error
                            ? "We couldn't load the Terms of Use. Please check your connection and try again."
                            : "The Terms of Use are not available right now."}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadTerms}
                        accessibilityRole="button"
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.infoCard}>
                {sections.map(renderItem)}
            </View>
        );
    };

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
                <Header title={'Terms of Use'} showBack/>
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.container1}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Terms of Use (EULA)</Text>
                            <Text style={styles.cardBody}>
                                These terms govern your use of the Domigo app, including
                                auto-renewable subscriptions. Tap a section to read it in full.
                            </Text>
                        </View>
                        {renderBody()}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

function mapStateToProps(state) {
    return {
        termsOfService: state.common.termsOfService,
    };
}

const mapDispatchToProps = {
    GET_TERMS_OF_SERVICE,
};

export default connect(mapStateToProps, mapDispatchToProps)(TermsOfUseScreen);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    container1: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 6,
    },
    card: {
        backgroundColor: "transparent",
        borderRadius: 12,
        padding: 18,
        marginTop: 6,
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
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbb',
        paddingHorizontal: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
        borderRadius: 12,
        justifyContent: "space-between",
    },
    pressed: {
        opacity: 0.7,
    },
    rowText: {
        fontSize: 14,
        color: "#0F172A",
        flex: 1,
        marginRight: 8,
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
    stateContainer: {
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 16,
    },
    stateText: {
        fontSize: 14,
        color: "#475569",
        textAlign: "center",
        marginTop: 12,
        lineHeight: 20,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
        marginTop: 16,
    },
    retryText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});
