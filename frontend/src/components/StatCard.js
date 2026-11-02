import React from 'react';
import { View, Text } from 'react-native';

const BORDER_COLOR = {
  orange: 'border-mill-orange',
  blue: 'border-mill-blue',
  green: 'border-mill-green',
  red: 'border-mill-red',
};

export default function StatCard({ label, value, unit, color = 'orange' }) {
  return (
    <View className={`bg-white rounded-xl p-3.5 w-[48%] mb-3 border-l-4 shadow-sm ${BORDER_COLOR[color] || BORDER_COLOR.orange}`}>
      <Text className="text-xs text-mill-muted mb-1.5">{label}</Text>
      <Text className="text-xl font-bold text-mill-text">
        {value} <Text className="text-xs font-normal text-mill-muted">{unit}</Text>
      </Text>
    </View>
  );
}
