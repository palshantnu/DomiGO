import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function StateCard({ state }) {
  const color = state.risk === 'green' ? '#16A34A' : state.risk === 'amber' ? '#F59E0B' : '#EF4444';
  return (
    <View style={[styles.card]}>
      <View style={[styles.left, {backgroundColor: color}]}>
        <Text style={styles.code}>{state.code}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.name}>{state.name}</Text>
        <View style={styles.row}>
          <Text style={styles.info}>{state.days} days</Text>
          <Text style={styles.info}>${state.wages.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{
    flexDirection:'row',
    backgroundColor: colors.card,
    borderRadius:10,
    overflow:'hidden',
    marginBottom:12,
    elevation:2
  },
  left:{ width:84, justifyContent:'center', alignItems:'center' },
  code:{ color:'#fff', fontWeight:'700', fontSize:20 },
  right:{ padding:12, flex:1 },
  name:{ fontSize:16, fontWeight:'700', color: colors.text },
  row:{ flexDirection:'row', justifyContent:'space-between', marginTop:8 },
  info:{ color: colors.muted }
});
