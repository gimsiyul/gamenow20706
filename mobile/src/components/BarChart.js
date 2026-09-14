import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function BarChart({ items = [], valueKey = 'percent', suffix = '%' }) {
  const max = Math.max(...items.map((i) => Number(i[valueKey]) || 0), 1);

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = `${Math.max(4, (value / max) * 100)}%`;
        return (
          <View key={item.label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width }]} />
            </View>
            <Text style={styles.value}>
              {value}
              {suffix}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    width: 92,
    color: colors.muted,
    fontSize: 12,
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.cardAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: colors.chart,
  },
  value: {
    width: 48,
    color: colors.text,
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '700',
  },
});
