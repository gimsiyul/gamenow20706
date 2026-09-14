import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

function rankColor(rank) {
  if (rank === 1) return colors.gold;
  if (rank === 2) return colors.silver;
  if (rank === 3) return colors.bronze;
  return colors.muted;
}

export default function GameRow({ game, onPress, showRank = false }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {showRank ? (
        <Text style={[styles.rank, { color: rankColor(game.rank) }]}>
          {String(game.rank).padStart(2, '0')}
        </Text>
      ) : null}
      <Image source={{ uri: game.image }} style={styles.thumb} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {game.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {game.currentPlayersText
            ? `현재 ${game.currentPlayersText}명 플레이 중`
            : game.priceText || '정보 보기'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.8,
  },
  rank: {
    width: 36,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  thumb: {
    width: 84,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
  },
  body: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
});
