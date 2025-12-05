import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { SliderButton } from '../components/SliderButton';
import { CustomToast } from '../helpers/CommonHelpers';

const TaxResidencyIntro = ({ navigation }) => {
    return (
        <ImageBackground
            source={require('../assets/image/introbg.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.innerCard}>


                <Image
                    source={require('../assets/image/domigo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />


                <Text style={styles.mainTitle}>Track Smart</Text>
                <Text style={styles.mainTitle}>
                    <Text style={styles.highlight}>Go</Text> Free!!
                </Text>


                <Text style={styles.desc}>
                    Your guide to Tax Compliance{"\n"}Across States
                </Text>
                <View style={{ marginTop: 35, width: '95%' }}>
                    <SliderButton
                        isClickButton={true}
                        onSubmit={() => {
                            navigation.navigate('PermissionScreen', { screenname: 'Signup' })
                        }}
                        btncolor={"#69BE7E"}
                        buttonTitle={'Sign up'}
                    />
                </View>
                {/* <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('PermissionScreen')}
                >
                    <Text style={styles.buttonText}>Sign up</Text>
                </TouchableOpacity> */}


                <TouchableOpacity onPress={() => navigation.navigate('PermissionScreen', { screenname: 'Login' })}>
                    <Text style={styles.loginText}>
                        Already Have Account? <Text style={styles.loginLink}>Log in</Text>
                    </Text>
                </TouchableOpacity>

            </View>
        </ImageBackground>
    );
};

export default TaxResidencyIntro;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        // paddingHorizontal: 18,
    },

    innerCard: {
        // backgroundColor: 'rgba(255,255,255,0.06)',
        paddingVertical: 50,
        paddingHorizontal: 20,
        borderRadius: 40,
        alignItems: 'center',
        width: '100%',
    },

    logo: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },

    mainTitle: {
        fontSize: 40,
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 5,
    },

    highlight: {
        color: '#7EE000',
    },

    desc: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        marginTop: 20,
        opacity: 0.9,
        lineHeight: 20,
    },

    button: {
        marginTop: 35,
        backgroundColor: '#6ED46E',
        paddingVertical: 14,
        borderRadius: 28,
        width: '75%',
        alignItems: 'center',
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },

    loginText: {
        color: 'white',
        marginTop: 18,
        fontSize: 14,
    },

    loginLink: {
        color: '#7EE000',
        fontWeight: '700',
    },
});
