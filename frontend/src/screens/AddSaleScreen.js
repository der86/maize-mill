import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['paid', 'partial', 'unpaid'];
const inputClass = 'bg-mill-bg rounded-[10px] px-3.5 py-3 border border-mill-border';
const labelClass = 'text-[13px] font-semibold text-gray-700 mb-1.5 mt-3.5';

export default function AddSaleScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.sale;
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [customerName, setCustomerName] = useState(editing?.customerName || '');
  const [balesSold, setBalesSold] = useState(editing?.balesSold ? String(editing.balesSold) : '');
  const [pricePerBale, setPricePerBale] = useState(editing?.pricePerBale ? String(editing.pricePerBale) : '');
  const [paymentStatus, setPaymentStatus] = useState(editing?.paymentStatus || 'paid');
  const [amountPaid, setAmountPaid] = useState(editing?.amountPaid != null ? String(editing.amountPaid) : '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Sale' : 'Record Sale' });
  }, [navigation, editing]);

  const totalAmount = balesSold && pricePerBale ? (parseFloat(balesSold) * parseFloat(pricePerBale)).toFixed(2) : '0.00';

  const handleSave = async () => {
    if (!customerName.trim() || !balesSold || !pricePerBale) {
      Alert.alert('Missing info', 'Customer, bales sold and price per bale are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        balesSold: parseFloat(balesSold),
        pricePerBale: parseFloat(pricePerBale),
        paymentStatus,
        amountPaid: paymentStatus === 'paid' ? undefined : parseFloat(amountPaid) || 0,
      };
      if (editing) {
        await api.put(`/sales/${editing._id}`, payload);
      } else {
        await api.post('/sales', payload);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to save sale.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete this sale?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/sales/${editing._id}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete sale.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4">
      <Text className={labelClass}>Customer name</Text>
      <TextInput className={inputClass} value={customerName} onChangeText={setCustomerName} placeholder="e.g. Mama Mboga Shop" />

      <Text className={labelClass}>Bales sold</Text>
      <TextInput className={inputClass} value={balesSold} onChangeText={setBalesSold} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Price per bale (KES)</Text>
      <TextInput className={inputClass} value={pricePerBale} onChangeText={setPricePerBale} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Payment status</Text>
      <View className="flex-row gap-2">
        {STATUS_OPTIONS.map((status) => (
          <TouchableOpacity
            key={status}
            className={`py-2 px-3.5 rounded-full border ${paymentStatus === status ? 'bg-mill-green border-mill-green' : 'bg-mill-bg border-mill-border'}`}
            onPress={() => setPaymentStatus(status)}
          >
            <Text className={`font-semibold text-xs ${paymentStatus === status ? 'text-white' : 'text-gray-700'}`}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentStatus !== 'paid' && (
        <>
          <Text className={labelClass}>Amount paid so far (KES)</Text>
          <TextInput className={inputClass} value={amountPaid} onChangeText={setAmountPaid} keyboardType="numeric" placeholder="0" />
        </>
      )}

      <View className="flex-row justify-between bg-mill-green-light p-3.5 rounded-[10px] mt-5">
        <Text className="font-semibold text-gray-700">Total sale amount</Text>
        <Text className="font-bold text-mill-green">KES {totalAmount}</Text>
      </View>

      <TouchableOpacity className="bg-mill-green rounded-[10px] py-3.5 items-center mt-6" onPress={handleSave} disabled={saving || deleting}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">{editing ? 'Save Changes' : 'Save Sale'}</Text>}
      </TouchableOpacity>

      {editing && canManage && (
        <TouchableOpacity
          className="rounded-[10px] py-3.5 items-center mt-3 mb-10 border border-mill-red-light"
          onPress={handleDelete}
          disabled={saving || deleting}
        >
          {deleting ? <ActivityIndicator color="#dc2626" /> : <Text className="text-mill-red font-bold">Delete Sale</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
