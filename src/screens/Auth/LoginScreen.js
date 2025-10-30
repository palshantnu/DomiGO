import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import InputField from '../../components/InputField';
import colors from '../../theme/colors';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/image/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Welcome to DomiGo</Text>
      <Text style={styles.subtitle}>Your journey to smarter property management starts here.</Text>
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
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.button}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.footerText}>
        Don’t have an account?{' '}
        {/* <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
          Sign Up
        </Text> */}
      </Text>
      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.button2}>
        <Text style={styles.button2Text}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 25, justifyContent: 'center' },
  logo: { width: 200, height: 70, alignSelf: 'center', marginBottom: 10, resizeMode: 'contain' },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center', color: colors.black },
  brand: { color: colors.primary },
  subtitle: { textAlign: 'center', color: colors.gray, marginBottom: 30, marginTop: 5, fontSize: 13 },
  forgot: { alignSelf: 'flex-end', color: colors.primary, fontSize: 13, marginBottom: 15 },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12 },
  buttonText: { color: colors.white, textAlign: 'center', fontSize: 16, fontWeight: '500' },
  button2: { backgroundColor: colors.green, borderRadius: 8, paddingVertical: 12,marginTop:10 },
  button2Text: { color: colors.white, textAlign: 'center', fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 25 },
  footerText: { textAlign: 'center', fontSize: 14 },
  link: { color: colors.secondary, fontWeight: '600' },
  lable:{color:'#000',marginBottom:10,fontSize:17,fontWeight:'600'}
});

export default LoginScreen;
