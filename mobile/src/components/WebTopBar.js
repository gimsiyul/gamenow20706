import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function WebTopBar({ active, onHome, onSearch }) {
  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <Pressable onPress={onHome} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={styles.brand}>지금게임</Text>
        </Pressable>
        <View style={styles.links}>
          <NavLink label="인기 순위" active={active === 'Home'} onPress={onHome} />
          <NavLink label="검색" active={active === 'Search'} onPress={onSearch} />
        </View>
      </View>
    </View>
  );
}

function NavLink({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
      <Text style={[styles.linkText, active && styles.linkActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.header,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: 14,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  inner: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  links: {
    flexDirection: 'row',
    gap: 8,
  },
  link: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  linkActive: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
});
