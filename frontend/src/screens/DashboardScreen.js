import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import api from '../api/api';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get('/dashboard/summary');
      setSummary(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [fetchSummary])
  );

  const salesTrend = summary?.trend?.sales || [];
  const chartData = {
    labels: salesTrend.length ? salesTrend.map((d) => d._id.slice(5)) : ['-'],
    datasets: [{ data: salesTrend.length ? salesTrend.map((d) => d.revenue) : [0] }],
  };

  return (
    <ScrollView
      className="flex-1 bg-mill-bg"
      contentContainerClassName="p-4 pb-10"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSummary} />}
    >
      {/* spacer so the header clears the Android/iOS status bar */}
      <View style={{ height: insets.top }} />
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-xl font-bold text-mill-text">Hi, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text className="text-[11px] text-mill-faint mt-0.5">{user?.role?.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text className="text-mill-red font-semibold">Log out</Text>
        </TouchableOpacity>
      </View>

      {error && <Text className="text-mill-red mb-3">{error}</Text>}

      <Text className="text-[15px] font-bold text-mill-text mt-2 mb-2.5">Current Stock</Text>
      <View className="flex-row flex-wrap justify-between">
        <StatCard label="Maize in stock" value={summary?.stock.maizeInStockBags ?? '—'} unit="bags" color="orange" />
        <StatCard label="Flour bales in stock" value={summary?.stock.flourBalesInStock ?? '—'} unit="bales" color="blue" />
        <StatCard label="Bran produced (total)" value={summary?.stock.branProducedKg ?? '—'} unit="kg" color="green" />
        <StatCard label="Outstanding balance" value={summary?.sales.outstandingBalance ?? '—'} unit="KES" color="red" />
      </View>

      <Text className="text-[15px] font-bold text-mill-text mt-2 mb-2.5">Purchases</Text>
      <View className="flex-row flex-wrap justify-between">
        <StatCard label="Total maize bought" value={summary?.purchases.totalKg ?? '—'} unit="kg" color="orange" />
        <StatCard label="Total spent" value={summary?.purchases.totalCost ?? '—'} unit="KES" color="orange" />
      </View>

      <Text className="text-[15px] font-bold text-mill-text mt-2 mb-2.5">Milling</Text>
      <View className="flex-row flex-wrap justify-between">
        <StatCard label="Flour bales produced" value={summary?.milling.totalFlourBalesProduced ?? '—'} unit="bales" color="blue" />
        <StatCard label="Bran produced" value={summary?.milling.totalBranProducedKg ?? '—'} unit="kg" color="green" />
      </View>

      <Text className="text-[15px] font-bold text-mill-text mt-2 mb-2.5">Sales</Text>
      <View className="flex-row flex-wrap justify-between">
        <StatCard label="Bales sold" value={summary?.sales.totalBalesSold ?? '—'} unit="bales" color="blue" />
        <StatCard label="Revenue" value={summary?.sales.totalRevenue ?? '—'} unit="KES" color="green" />
      </View>

      {salesTrend.length > 1 && (
        <>
          <Text className="text-[15px] font-bold text-mill-text mt-2 mb-2.5">Revenue - last 30 days</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 32}
            height={200}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(245, 166, 35, ${opacity})`,
              labelColor: () => '#6b7280',
              propsForDots: { r: '3' },
            }}
            style={{ borderRadius: 12 }}
            bezier
          />
        </>
      )}
    </ScrollView>
  );
}