import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Progress from 'react-native-progress';
import colors from '../theme/colors';
import Header from '../components/Header';


const HomeScreen = () => {
    const progress = 200 / 365;

    return (
        <View style={{ flex: 1 }}>
            <Header />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

                <View style={{ ...styles.section, elevation: 2, backgroundColor: colors.white, borderRadius: 10 }}>
                    <Text style={styles.sectionTitle}>Financial Year Progress</Text>
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>
                            Day <Text style={styles.bold}>200</Text> of 365
                        </Text>
                        <Text style={styles.daysLeft}>165 days left</Text>
                    </View>
                    <Progress.Bar
                        progress={progress}
                        width={null}
                        color={colors.primary}
                        unfilledColor="#E6E6E6"
                        borderWidth={0}
                        height={8}
                        borderRadius={5}
                        style={styles.progressBar}
                    />
                </View>

                <View style={{ ...styles.section, elevation: 2, backgroundColor: '#fafafa', borderRadius: 10 }}>
                    <Text style={styles.sectionTitle}>Residency Actions</Text>
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionText}>Metrics</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addCircle}>
                            <Icon name="add" size={28} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Text style={styles.actionText}>Calendar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>State-wise Residency Overview</Text>
                    <View style={styles.stateGrid}>
                        {[
                            { code: 'FL', days: 134, color: '#D3D3D3', threshold: 183 },
                            { code: 'NY', days: 83, color: '#28a0dd', threshold: 183 },
                            { code: 'CA', days: 170, color: '#dc3c41', threshold: 183 },
                            { code: 'UT', days: 45, color: '#28a0dd', threshold: 183 },
                        ].map((item, index) => (
                            <View key={index} style={[styles.stateCard, { borderColor: 'grey', width: Dimensions.get('window').width * 0.42, height: Dimensions.get('window').width * 0.42, elevation: 1, borderWidth: 0.1 }]}>
                                <View style={styles.smallCircle}>
                                    <Text style={styles.smallCircleText}>{item.threshold}</Text>
                                </View>
                                <View style={{ borderRadius: 70, borderWidth: 3, borderColor: item.color, width: Dimensions.get('window').width * 0.35, height: Dimensions.get('window').width * 0.35, justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={styles.stateCode}>{item.code}</Text>
                                    <Text style={styles.stateDays}>{item.days}</Text>
                                    <Text style={styles.daysIn}>Days in</Text>

                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',

    },

    section: {
        marginBottom: 24,
        padding: 16,
        margin: 10
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressText: {
        color: '#555',
    },
    bold: {
        fontWeight: '600',
    },
    daysLeft: {
        color: colors.primary,
        fontWeight: '500',
    },
    progressBar: {
        marginTop: 4,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 2,
        borderRadius: 5
    },
    actionButton: {
        // borderWidth: 1,
        // borderColor: '#DADADA',
        // borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 24,
        // backgroundColor: '#F9F9F9',
    },
    addCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000'
    },
    stateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    stateCard: {
        width: '47%',
        height: 140,
        borderWidth: 0.5,
        borderRadius: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: '#fff',
    },
    stateCode: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    stateDays: {
        fontSize: 26,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    daysIn: {
        color: '#555',
        fontSize: 14,
    },
    smallCircle: {
        position: 'absolute',
        top: 5,
        right: 5,
        width: 36,
        height: 20,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    smallCircleText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#888',
    },
});