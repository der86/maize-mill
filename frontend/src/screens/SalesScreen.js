import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import ListItem from '../components/ListItem';

export default function SalesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get('/sales', { params: { limit: 50 } });
      setItems(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load sales.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  return (
    <View className="flex-1 bg-mill-bg">
      <FlatList
        contentContainerClassName="p-4"
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchItems} />}
        ListEmptyComponent={!loading && <Text className="text-center text-mill-faint mt-10">{error || 'No sales recorded yet.'}</Text>}
        renderItem={({ item }) => (
          <ListItem
            title={item.customerName}
            subtitle={`${item.balesSold} bales @ ${item.pricePerBale} · ${item.paymentStatus} · ${new Date(item.saleDate).toLocaleDateString()}`}
            rightTop={`KES ${item.amountSold.toLocaleString()}`}
            onPress={() => navigation.navigate('AddSale', { sale: item })}
          />
        )}
      />
      <TouchableOpacity
        className="absolute bottom-5 left-4 right-4 bg-mill-green py-3.5 rounded-xl items-center"
        onPress={() => navigation.navigate('AddSale')}
      >
        <Text className="text-white font-bold">+ Record Sale</Text>
      </TouchableOpacity>
    </View>
  );
}
