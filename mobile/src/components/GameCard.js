import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const isWeb = Platform.OS === 'web';

function rankColor(rank) {
  if (rank === 1) return colors.gold;
  if (rank === 2) return colors.silver;
  if (rank === 3) return colors.bronze;
  return colors.muted;
}

export default function GameCard({ game, onPress }) {
  const deltaText =
    game.rankDelta === null || game.rankDelta === undefined
      ? null
      : game.rankDelta > 0
        ? `▲${game.rankDelta}`
        : game.rankDelta < 0
          ? `▼${Math.abs(game.rankDelta)}`
          : '·';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: game.image }} style={styles.image} resizeMode="cover" />
        <View style={styles.rankBadge}>
          <Text style={[styles.rankText, { color: rankColor(game.rank) }]}>#{game.rank}</Text>
        </View>
        {game.badge ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{game.badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {game.name}
        </Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>현재 동접</Text>
          <Text style={styles.statValue}>{game.currentPlayersText || '-'}명</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>오늘 최고</Text>
          <Text style={styles.statValue}>{game.peakTodayText || '-'}명</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>최고 대비</Text>
          <Text style={styles.statValue}>
            {game.fillRate !== undefined ? `${game.fillRate}%` : '-'}
          </Text>
        </View>
        {deltaText ? (
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>주간 순위</Text>
            <Text
              style={[
                styles.statValue,
                game.rankDelta > 0 && styles.up,
                game.rankDelta < 0 && styles.down,
              ]}
            >
              {deltaText}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: isWeb ? '32%' : '100%',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    marginBottom: isWeb ? 0 : 12,
  },
  pressed: {
    opacity: 0.85,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 460 / 215,
    backgroundColor: colors.cardAlt,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  rankBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankText: {
    fontWeight: '800',
    fontSize: 13,
  },
  tag: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: 12,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    minHeight: 40,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  statValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  up: {
    color: colors.positive,
  },
  down: {
    color: colors.danger,
  },
});
