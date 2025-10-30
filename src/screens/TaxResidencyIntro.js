import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import colors from '../theme/colors';


const TaxResidencyIntro = ({ navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/image/logo2.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Tax Residency Tracker</Text>
                <Text style={styles.subtitle}>
                    Track your <Text style={styles.highlight}>Residency</Text>
                </Text>
                <Text style={styles.desc}>
                    Your guide to tax compliance across states.
                </Text>

                <View style={styles.dotsContainer}>
                    <View style={[styles.dot, { opacity: 1 }]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
            </View>
            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('PermissionScreen')}
                >
                    <Text style={styles.buttonText}>Sign up</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                    <Text style={styles.loginText}>
                        Already signed up? <Text style={styles.loginLink}>Log in</Text>
                    </Text>
                </TouchableOpacity>
            </View>


        </View>
    );
};

export default TaxResidencyIntro;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    logo: {
        width: 100,
        height: 100,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 25,
        color: '#fff',
        fontWeight: '600',
        marginTop: 30,
    },
    subtitle: {
        fontSize: 30,
        color: '#fff',
        fontWeight: '700',
        marginTop: 8,
    },
    highlight: {
        color: '#7EE000',
    },
    desc: {
        fontSize: 14,
        color: '#fff',
        marginTop: 8,
        textAlign: 'center',
        opacity: 0.9,
    },
    dotsContainer: {
        flexDirection: 'row',
        marginVertical: 24,
    },
    dot: {
        width: 8,
        height: 8,
        backgroundColor: '#fff',
        borderRadius: 4,
        marginHorizontal: 4,
        opacity: 0.5,
    },
    button: {
        backgroundColor: '#47CC63',
        paddingVertical: 14,
        borderRadius: 8,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    loginText: {
        color: '#fff',
        marginTop: 14,
        fontSize: 14,
    },
    loginLink: {
        textDecorationLine: 'underline',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#2594c8',
        paddingVertical: 10,
    },
    navItem: {
        alignItems: 'center',
    },
    navLabel: {
        color: '#fff',
        fontSize: 12,
    },
});
