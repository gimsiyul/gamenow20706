import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function InfoTable({ rows = [] }) {
  const visible = rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== '');
  if (!visible.length) return null;

  return (
    <View style={styles.table}>
      {visible.map((row, idx) => (
        <View key={row.label} style={[styles.tr, idx === visible.length - 1 && styles.last]}>
          <Text style={styles.th}>{row.label}</Text>
          <Text style={styles.td}>{String(row.value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  last: {
    borderBottomWidth: 0,
  },
  th: {
    width: 92,
    color: colors.muted,
    fontSize: 13,
  },
  td: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
