import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Check your connection and try again.';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 justify-center p-6 bg-mill-orange-light" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text className="text-[26px] font-extrabold text-center text-mill-text">🌽 Maize Mill Tracker</Text>
      <Text className="text-sm text-center text-mill-muted mb-8 mt-1">Sign in to manage plant stock</Text>

      <TextInput
        className="bg-white rounded-[10px] px-3.5 py-3 mb-3 border border-mill-border"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="bg-white rounded-[10px] px-3.5 py-3 mb-3 border border-mill-border"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity className="bg-mill-orange rounded-[10px] py-3.5 items-center mt-2" onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-[15px]">Sign In</Text>}
      </TouchableOpacity>

      <Text className="text-center text-mill-faint text-xs mt-5">Accounts are created by your plant admin.</Text>
    </KeyboardAvoidingView>
  );
}
