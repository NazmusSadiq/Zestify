import { useSignIn } from '@clerk/clerk-expo';
import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const appIcon = require("../../assets/icons/logo.png");

const PwReset = () => {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const { signIn, setActive } = useSignIn();

  // Request a passowrd reset code by email
  const onRequestReset = async () => {
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });
      setSuccessfulCreation(true);
    } catch (err: any) {
      alert(err.errors[0].message);
    }
  };

  // Reset the password with the code and the new password
  const onReset = async () => {
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });
      console.log(result);
      alert('Password reset successfully');

      // Set the user session active, which will log in the user automatically
      await setActive({ session: result.createdSessionId });
    } catch (err: any) {
      alert(err.errors[0].message);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !successfulCreation }} />

      <View style={styles.headerContainer}>
        <Image source={appIcon} style={styles.icon} resizeMode="contain" />
        <Text style={styles.brandText}>Zestify</Text>
      </View>

      <View style={styles.formContainer}>
        {!successfulCreation ? (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>

            <TextInput 
              autoCapitalize="none" 
              placeholder="Email" 
              placeholderTextColor="#666"
              value={emailAddress} 
              onChangeText={setEmailAddress} 
              style={styles.inputField} 
            />

            <Pressable style={styles.resetButton} onPress={onRequestReset}>
              <Text style={styles.resetButtonText}>Send Reset Code</Text>
            </Pressable>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>Enter the code and your new password</Text>

            <TextInput 
              value={code} 
              placeholder="Enter reset code" 
              placeholderTextColor="#666"
              style={styles.inputField} 
              onChangeText={setCode} 
            />
            <TextInput 
              placeholder="New password" 
              placeholderTextColor="#666"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
              style={styles.inputField} 
            />

            <Pressable style={styles.resetButton} onPress={onReset}>
              <Text style={styles.resetButtonText}>Reset Password</Text>
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
  resetButton: {
    backgroundColor: '#FF0000',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resetButtonText: {
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

export default PwReset;