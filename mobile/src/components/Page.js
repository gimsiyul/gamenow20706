import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export default function Page({ children, style }) {
  return <View style={[styles.page, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1120 : undefined,
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    paddingTop: Platform.OS === 'web' ? 28 : 16,
    paddingBottom: Platform.OS === 'web' ? 80 : 32,
    flexGrow: 1,
  },
});
