import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import InputField from '../../components/InputField';
import colors from '../../theme/colors';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/image/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Create Your Account</Text>
 <Text style={styles.lable}>Username</Text>
      <InputField
        icon="person-outline"
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
      />
       <Text style={styles.lable}>Email address</Text>
      <InputField
        icon="mail-outline"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
      />
       <Text style={styles.lable}>Password</Text>
      <InputField
        icon="lock-closed-outline"
        placeholder="Create a strong password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
          Log in
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 25, justifyContent: 'center' },
  logo: { width: 200, height: 70, alignSelf: 'center', marginBottom: 20, resizeMode: 'contain' },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center', marginBottom: 25, color: colors.black },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, marginTop: 10 },
  buttonText: { color: colors.white, textAlign: 'center', fontSize: 16, fontWeight: '500' },
  footerText: { textAlign: 'center', marginTop: 15, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '600' },
  lable:{color:'#000',marginBottom:10,fontSize:17,fontWeight:'600'}
});

export default SignupScreen;
