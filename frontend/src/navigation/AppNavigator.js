import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PurchasesScreen from '../screens/PurchasesScreen';
import AddPurchaseScreen from '../screens/AddPurchaseScreen';
import MillingScreen from '../screens/MillingScreen';
import AddMillingScreen from '../screens/AddMillingScreen';
import SalesScreen from '../screens/SalesScreen';
import AddSaleScreen from '../screens/AddSaleScreen';

const Tab = createBottomTabNavigator();
const PurchasesStack = createNativeStackNavigator();
const MillingStack = createNativeStackNavigator();
const SalesStack = createNativeStackNavigator();

function PurchasesStackScreen() {
  return (
    <PurchasesStack.Navigator>
      <PurchasesStack.Screen name="PurchasesList" component={PurchasesScreen} options={{ title: 'Maize Purchases' }} />
      <PurchasesStack.Screen name="AddPurchase" component={AddPurchaseScreen} options={{ title: 'Add Purchase' }} />
    </PurchasesStack.Navigator>
  );
}

function MillingStackScreen() {
  return (
    <MillingStack.Navigator>
      <MillingStack.Screen name="MillingList" component={MillingScreen} options={{ title: 'Milling Batches' }} />
      <MillingStack.Screen name="AddMilling" component={AddMillingScreen} options={{ title: 'Add Milling Batch' }} />
    </MillingStack.Navigator>
  );
}

function SalesStackScreen() {
  return (
    <SalesStack.Navigator>
      <SalesStack.Screen name="SalesList" component={SalesScreen} options={{ title: 'Flour Sales' }} />
      <SalesStack.Screen name="AddSale" component={AddSaleScreen} options={{ title: 'Record Sale' }} />
    </SalesStack.Navigator>
  );
}

const TAB_ICONS = { Dashboard: '📊', Purchases: '🌽', Milling: '🏭', Sales: '💰' };

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#F5A623',
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Purchases" component={PurchasesStackScreen} />
      <Tab.Screen name="Milling" component={MillingStackScreen} />
      <Tab.Screen name="Sales" component={SalesStackScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <MainTabs /> : <LoginScreen />}</NavigationContainer>;
}