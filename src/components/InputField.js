import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

const InputField = ({ icon, placeholder, value, onChangeText, secureTextEntry }) => {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color={colors.gray} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.gray}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E5E5EA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 15,
    backgroundColor: colors.white,
    height:50
  },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 13, color: colors.black, height:50 },
});

export default InputField;
