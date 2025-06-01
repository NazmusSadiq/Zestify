import { useSignUp } from '@clerk/clerk-expo';
import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';

const appIcon = require("../../assets/icons/logo.png");

const Register = () => {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Create the user and send the verification email
  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);

    try {
      // Create the user on Clerk
      await signUp.create({
        emailAddress,
        password,
      });

      // Send verification Email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      // change the UI to verify the email address
      setPendingVerification(true);
    } catch (err: any) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  // Verify the email address
  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      await setActive({ session: completeSignUp.createdSessionId });
    } catch (err: any) {
      alert(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !pendingVerification }} />
      <Spinner visible={loading} />

      <View style={styles.headerContainer}>
        <Image source={appIcon} style={styles.icon} resizeMode="contain" />
        <Text style={styles.brandText}>Zestify</Text>
      </View>

      <View style={styles.formContainer}>
        {!pendingVerification ? (
          <>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

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

            <Pressable style={styles.signUpButton} onPress={onSignUpPress}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </Pressable>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>Enter the code sent to your email</Text>

            <TextInput 
              value={code} 
              placeholder="Enter verification code" 
              placeholderTextColor="#666"
              style={styles.inputField} 
              onChangeText={setCode} 
            />

            <Pressable style={styles.verifyButton} onPress={onPressVerify}>
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            </Pressable>
          </>
        )}
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
  signUpButton: {
    backgroundColor: '#FF0000',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#FF0000',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF0000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Register;