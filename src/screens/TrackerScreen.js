import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import colors from '../theme/colors';
import StateCard from '../components/StateCard';

export default function TrackerScreen() {
  const states = useSelector(s => s.residency.states);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={states}
        keyExtractor={item => item.code}
        contentContainerStyle={{padding:16}}
        renderItem={({item}) => <StateCard state={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor: colors.background },
});
