import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const inputClass = 'bg-mill-bg rounded-[10px] px-3.5 py-3 border border-mill-border';
const labelClass = 'text-[13px] font-semibold text-gray-700 mb-1.5 mt-3.5';

export default function AddMillingScreen({ navigation, route }) {
  const { user } = useAuth();
  const editing = route.params?.batch;
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  const [batchNumber, setBatchNumber] = useState(editing?.batchNumber || '');
  const [maizeUsedKg, setMaizeUsedKg] = useState(editing?.maizeUsedKg ? String(editing.maizeUsedKg) : '');
  const [flourBaleWeightKg, setFlourBaleWeightKg] = useState(editing?.flourBaleWeightKg ? String(editing.flourBaleWeightKg) : '50');
  const [flourBalesProduced, setFlourBalesProduced] = useState(editing?.flourBalesProduced ? String(editing.flourBalesProduced) : '');
  const [branProducedKg, setBranProducedKg] = useState(editing?.branProducedKg != null ? String(editing.branProducedKg) : '');
  const [machineOperator, setMachineOperator] = useState(editing?.machineOperator || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit Milling Batch' : 'Add Milling Batch' });
  }, [navigation, editing]);

  const flourOutputKg =
    flourBalesProduced && flourBaleWeightKg ? (parseFloat(flourBalesProduced) * parseFloat(flourBaleWeightKg)).toFixed(1) : '0';
  const yieldPercent =
    maizeUsedKg && (flourOutputKg || branProducedKg)
      ? (((parseFloat(flourOutputKg) + (parseFloat(branProducedKg) || 0)) / parseFloat(maizeUsedKg)) * 100).toFixed(1)
      : null;

  const handleSave = async () => {
    if (!batchNumber.trim() || !maizeUsedKg || !flourBalesProduced || branProducedKg === '') {
      Alert.alert('Missing info', 'Batch number, maize used, flour bales and bran produced are all required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        batchNumber: batchNumber.trim(),
        maizeUsedKg: parseFloat(maizeUsedKg),
        flourBaleWeightKg: parseFloat(flourBaleWeightKg) || 50,
        flourBalesProduced: parseFloat(flourBalesProduced),
        branProducedKg: parseFloat(branProducedKg),
        machineOperator: machineOperator.trim() || undefined,
      };
      if (editing) {
        await api.put(`/milling/${editing._id}`, payload);
      } else {
        await api.post('/milling', payload);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Failed to save batch.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete this batch?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/milling/${editing._id}`);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to delete batch.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="p-4">
      <Text className={labelClass}>Batch number</Text>
      <TextInput
        className={`${inputClass} ${editing ? 'text-mill-faint' : ''}`}
        value={batchNumber}
        onChangeText={setBatchNumber}
        placeholder="e.g. B-2026-014"
        editable={!editing}
      />
      {editing && <Text className="text-[11px] text-mill-faint mt-1">Batch numbers can't be changed after creation.</Text>}

      <Text className={labelClass}>Maize used (kg)</Text>
      <TextInput className={inputClass} value={maizeUsedKg} onChangeText={setMaizeUsedKg} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Flour bale weight (kg)</Text>
      <TextInput className={inputClass} value={flourBaleWeightKg} onChangeText={setFlourBaleWeightKg} keyboardType="numeric" />

      <Text className={labelClass}>Flour bales produced</Text>
      <TextInput className={inputClass} value={flourBalesProduced} onChangeText={setFlourBalesProduced} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Bran produced (kg)</Text>
      <TextInput className={inputClass} value={branProducedKg} onChangeText={setBranProducedKg} keyboardType="numeric" placeholder="0" />

      <Text className={labelClass}>Machine operator (optional)</Text>
      <TextInput className={inputClass} value={machineOperator} onChangeText={setMachineOperator} placeholder="Name" />

      <View className="bg-mill-blue-light p-3.5 rounded-[10px] mt-5">
        <Text className="font-semibold text-mill-blue">Flour output: {flourOutputKg} kg</Text>
        {yieldPercent && <Text className="font-semibold text-mill-blue">Yield: {yieldPercent}%</Text>}
      </View>

      <TouchableOpacity className="bg-mill-blue rounded-[10px] py-3.5 items-center mt-6" onPress={handleSave} disabled={saving || deleting}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">{editing ? 'Save Changes' : 'Save Batch'}</Text>}
      </TouchableOpacity>

      {editing && canManage && (
        <TouchableOpacity
          className="rounded-[10px] py-3.5 items-center mt-3 mb-10 border border-mill-red-light"
          onPress={handleDelete}
          disabled={saving || deleting}
        >
          {deleting ? <ActivityIndicator color="#dc2626" /> : <Text className="text-mill-red font-bold">Delete Batch</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
