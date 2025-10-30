import { StyleSheet, Text, View,Image } from 'react-native'
import React from 'react'
import colors from '../theme/colors'
import Icon from 'react-native-vector-icons/Ionicons';

const Header = () => {
  return (
    <View style={styles.header}>
    <View style={styles.headerLeft}>
        <Image
            source={{ uri: 'https://i.pravatar.cc/100' }}
            style={styles.avatar}
        />
        <Text style={styles.headerTitle}>Tax Residency Tracker</Text>
    </View>
    <Icon name="notifications-outline" size={24} color="#000" />
</View>
  )
}

export default Header

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // marginBottom: 20,
        elevation: 5,
        backgroundColor: colors.white,
        width: '100%',
        padding: 16,
        borderBottomWidth:0.5
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000'
    },
})