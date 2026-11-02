import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ListItem({ title, subtitle, rightTop, rightBottom, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper className="flex-row bg-white p-3.5 rounded-[10px] mb-2 items-center" onPress={onPress}>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-mill-text">{title}</Text>
        {!!subtitle && <Text className="text-xs text-mill-muted mt-0.5">{subtitle}</Text>}
      </View>
      <View className="items-end">
        {!!rightTop && <Text className="text-[15px] font-bold text-mill-text">{rightTop}</Text>}
        {!!rightBottom && <Text className="text-xs text-mill-muted mt-0.5">{rightBottom}</Text>}
      </View>
    </Wrapper>
  );
}
