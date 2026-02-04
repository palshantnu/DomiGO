import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

const CustomProgressBar = ({ progress = 0.3, height = 22, bgColor = colors.primary, label = "" }) => {
    return (
        <View style={[styles.parent, { height }]}>
            <View style={[styles.child, { width: `${progress * 100}%`, backgroundColor: bgColor }]}>
                <Text style={styles.progressText}>{label}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    parent: {
        width: '100%',
        backgroundColor: "#EEE3FF",
        borderRadius: 40,
        overflow: 'hidden'
    },
    child: {
        height: '100%',
        borderRadius: 40,
        justifyContent: 'center',
        paddingLeft: 10
    },
    progressText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff'
    }
});

export default CustomProgressBar;
