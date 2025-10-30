import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'

const SettingsScreen = ({navigation}) => {
    useEffect(() => {
     navigation.navigate('TaxResidencyIntro')
    }, [])
    
  return (
    <View>
      <Text>SettingsScreen</Text>
    </View>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({})