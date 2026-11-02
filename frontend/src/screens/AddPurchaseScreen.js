import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// Standard maize bag weight used to auto-fill total kg from bag count.
// Keep in sync with MAIZE_BAG_WEIGHT_KG in the backend .env if you change it there.
const BAG_WEIGHT_KG = 90;

const inputClass = 'bg-mill-bg rounded-[10px] px-3.5 py-3 border border-mill-border';
const labelClass = 'text-[13px] font-semibold text-gray-700 mb-1.5 mt-3.5';

export default function AddPurchaseScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.purchase;
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [supplierName, setSupplierName] = useState(editing?.supplierName || '');
  const [bags, setBags] = useState(editing?.bags ? String(editing.bags) : '');
  const [quantityKg, setQuantityKg] = useState(editing?.quantityKg ? String(editing.quantityKg) : '');
  const [kgEditedManually, setKgEditedManually] = useState(!!editing);
  const [pricePerKg, setPricePerKg] = useState(editing?.pricePerKg ? String(editing.pricePerKg) : '');
  const [moisturePercent, setMoisturePercent] = useState(editing?.moisturePercent ? String(editing.moisturePercent) : '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Purchase' : 'Add Purchase' });
  }, [navigation, editing]);

  const handleBagsChange = (text) => {
    setBags(text);
    if (!kgEditedManually) {
      const bagCount = parseFloat(text);
      setQuantityKg(bagCount > 0 ? String(bagCount * BAG_WEIGHT_KG) : '');
    }
  };

  const handleKgChange = (text) => {
    setQuantityKg(text);
    setKgEditedManually(true);
  };

  const estimatedCost =
    quantityKg && pricePerKg ? (parseFloat(quantityKg) * parseFloat(pricePerKg)).toFixed(2) : '0.00';

  const handleSave = async () => {
    if (!supplierName.trim() || !quantityKg || !pricePerKg) {
      Alert.alert('Missing info', 'Supplier, quantity and price per kg are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplierName: supplierName.trim(),
        bags: bags ? parseFloat(bags) : undefined,
        quantityKg: parseFloat(quantityKg),
        pricePerKg: parseFloat(pricePerKg),
        moisturePercent: moisturePercent ? parseFloat(moisturePercent) : undefined,
        notes: notes.trim() || undefined,
      };
      if (editing) {
        await api.put(`/purchases/${editing._id}`, payload);
      } else {
        await api.post('/purchases', payload);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to save purchase.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete purchase?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/purchases/${editing._id}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete purchase.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4">
      <Text className={labelClass}>Supplier name</Text>
      <TextInput className={inputClass} value={supplierName} onChangeText={setSupplierName} placeholder="e.g. John Kamau Farm" />

      <Text className={labelClass}>Number of bags</Text>
      <TextInput className={inputClass} value={bags} onChangeText={handleBagsChange} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Quantity (kg){bags ? ' — auto-filled, edit if a bag is under/over weight' : ''}</Text>
      <TextInput className={inputClass} value={quantityKg} onChangeText={handleKgChange} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Price per kg (KES)</Text>
      <TextInput className={inputClass} value={pricePerKg} onChangeText={setPricePerKg} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Moisture % (optional)</Text>
      <TextInput className={inputClass} value={moisturePercent} onChangeText={setMoisturePercent} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Notes (optional)</Text>
      <TextInput className={`${inputClass} h-20`} value={notes} onChangeText={setNotes} multiline placeholder="Any remarks" />

      <View className="flex-row justify-between bg-mill-orange-light p-3.5 rounded-[10px] mt-5">
        <Text className="font-semibold text-gray-700">Total cost</Text>
        <Text className="font-bold text-mill-orange">KES {estimatedCost}</Text>
      </View>

      <TouchableOpacity className="bg-mill-orange rounded-[10px] py-3.5 items-center mt-6" onPress={handleSave} disabled={saving || deleting}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">{editing ? 'Save Changes' : 'Save Purchase'}</Text>}
      </TouchableOpacity>

      {editing && canManage && (
        <TouchableOpacity
          className="rounded-[10px] py-3.5 items-center mt-3 mb-10 border border-mill-red-light"
          onPress={handleDelete}
          disabled={saving || deleting}
        >
          {deleting ? <ActivityIndicator color="#dc2626" /> : <Text className="text-mill-red font-bold">Delete Purchase</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
