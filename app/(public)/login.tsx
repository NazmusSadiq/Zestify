import { useSignIn } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

const appIcon = require("../../assets/icons/logo.png");

const Login = () => {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });
    } catch (err: any) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Spinner visible={loading} />

      <View style={styles.headerContainer}>
        <Image source={appIcon} style={styles.icon} resizeMode="contain" />
        <Text style={styles.brandText}>Zestify</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput 
          autoCapitalize="none" 
          placeholder="Email" 
          placeholderTextColor="#666"
          value={emailAddress} 
          onChangeText={setEmailAddress} 
          style={styles.inputField} 
        />
        <TextInput 
          placeholder="Password" 
          placeholderTextColor="#666"
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
          style={styles.inputField} 
        />

        <Pressable style={styles.loginButton} onPress={onSignInPress}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </Pressable>

        <Link href="/reset" asChild>
          <Pressable style={styles.linkButton}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>
        </Link>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.registerLink}>Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  icon: {
    width: 40,
    height: 40,
  },
  brandText: {
    color: '#FF0000',
    fontSize: 24,
    marginLeft: 8,
    fontFamily: 'sans-serif-light',
    fontWeight: '300',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    marginBottom: 32,
  },
  inputField: {
    marginVertical: 8,
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#111',
    color: '#FFF',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#FF0000',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Login;