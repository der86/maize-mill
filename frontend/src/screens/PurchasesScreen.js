import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import ListItem from '../components/ListItem';

export default function PurchasesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get('/purchases', { params: { limit: 50 } });
      setItems(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load purchases.');
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
        ListEmptyComponent={!loading && <Text className="text-center text-mill-faint mt-10">{error || 'No purchases recorded yet.'}</Text>}
        renderItem={({ item }) => (
          <ListItem
            title={item.supplierName}
            subtitle={`${item.bags ? item.bags + ' bags · ' : ''}${item.quantityKg} kg @ ${item.pricePerKg}/kg · ${new Date(item.purchaseDate).toLocaleDateString()}`}
            rightTop={`KES ${item.totalCost.toLocaleString()}`}
            onPress={() => navigation.navigate('AddPurchase', { purchase: item })}
          />
        )}
      />
      <TouchableOpacity
        className="absolute bottom-5 left-4 right-4 bg-mill-orange py-3.5 rounded-xl items-center"
        onPress={() => navigation.navigate('AddPurchase')}
      >
        <Text className="text-white font-bold">+ Add Purchase</Text>
      </TouchableOpacity>
    </View>
  );
}
