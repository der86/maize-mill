import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import ListItem from '../components/ListItem';

export default function MillingScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get('/milling', { params: { limit: 50 } });
      setItems(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load milling batches.');
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
        ListEmptyComponent={!loading && <Text className="text-center text-mill-faint mt-10">{error || 'No milling batches recorded yet.'}</Text>}
        renderItem={({ item }) => (
          <ListItem
            title={`Batch ${item.batchNumber}`}
            subtitle={`${item.maizeUsedKg} kg maize → ${new Date(item.millingDate).toLocaleDateString()}`}
            rightTop={`${item.flourBalesProduced} bales`}
            rightBottom={`${item.branProducedKg} kg bran`}
            onPress={() => navigation.navigate('AddMilling', { batch: item })}
          />
        )}
      />
      <TouchableOpacity
        className="absolute bottom-5 left-4 right-4 bg-mill-blue py-3.5 rounded-xl items-center"
        onPress={() => navigation.navigate('AddMilling')}
      >
        <Text className="text-white font-bold">+ Add Milling Batch</Text>
      </TouchableOpacity>
    </View>
  );
}
