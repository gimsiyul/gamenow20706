import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPopular } from '../api';
import GameCard from '../components/GameCard';
import GameRow from '../components/GameRow';
import Page from '../components/Page';
import { colors } from '../theme';

const isWeb = Platform.OS === 'web';

export default function HomeScreen({ navigation }) {
  const [games, setGames] = useState([]);
  const [rising, setRising] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const data = await fetchPopular();
      setGames(data.games || []);
      setRising(data.rising || []);
    } catch (err) {
      setError(err.message || '순위를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const openDetail = (item) =>
    navigation.navigate('Detail', { appid: item.appid, name: item.name });

  if (loading) {
    const loadingView = (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.hint}>스팀 인기 게임을 불러오는 중...</Text>
      </View>
    );
    return isWeb ? <Page>{loadingView}</Page> : (
      <SafeAreaView style={styles.safe}>{loadingView}</SafeAreaView>
    );
  }

  if (isWeb) {
    return (
      <Page style={styles.webPage}>
        <View style={styles.header}>
          <Text style={styles.title}>지금 많이 하는 게임</Text>
          <Text style={styles.sub}>스팀 현재 동접 순위 · 카드에서 최고 동접·주간 변동을 함께 확인</Text>
          <Pressable onPress={() => load(true)} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>{refreshing ? '불러오는 중...' : '순위 새로고침'}</Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {rising.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>급상승 · 갑자기 뜬 게임</Text>
            <Text style={styles.sectionSub}>지난주 순위보다 많이 올라온 게임</Text>
            <View style={styles.risingRow}>
              {rising.map((g) => (
                <Pressable
                  key={`rise-${g.appid}`}
                  onPress={() => openDetail(g)}
                  style={({ pressed }) => [styles.risingChip, pressed && styles.pressed]}
                >
                  <Text style={styles.risingDelta}>▲{g.rankDelta}</Text>
                  <Text style={styles.risingName} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text style={styles.risingMeta}>{g.currentPlayersText}명</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>전체 순위</Text>
        <View style={styles.grid}>
          {games.map((item) => (
            <GameCard key={item.appid} game={item} onPress={() => openDetail(item)} />
          ))}
        </View>
        {!games.length && !error ? <Text style={styles.hint}>표시할 게임이 없습니다.</Text> : null}
      </Page>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={games}
        keyExtractor={(item) => String(item.appid)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>지금 많이 하는 게임</Text>
            <Text style={styles.sub}>스팀 현재 동접 순위 · 아래로 당겨서 새로고침</Text>
            {rising.length ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>급상승</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {rising.map((g) => (
                    <Pressable
                      key={`rise-${g.appid}`}
                      onPress={() => openDetail(g)}
                      style={styles.risingChipMobile}
                    >
                      <Text style={styles.risingDelta}>▲{g.rankDelta}</Text>
                      <Text style={styles.risingName} numberOfLines={1}>
                        {g.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <GameRow game={item} showRank onPress={() => openDetail(item)} />
        )}
        ListEmptyComponent={
          !error ? <Text style={styles.hint}>표시할 게임이 없습니다.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  webPage: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.bg,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: isWeb ? 28 : 22,
    fontWeight: '800',
  },
  sub: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 14,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    marginTop: 10,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  risingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  risingChip: {
    width: isWeb ? '32%' : undefined,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
  },
  risingChipMobile: {
    width: 160,
    marginRight: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 10,
  },
  risingDelta: {
    color: colors.positive,
    fontWeight: '800',
    fontSize: 13,
  },
  risingName: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 4,
    fontSize: 14,
  },
  risingMeta: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginTop: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  hint: {
    color: colors.muted,
    marginTop: 12,
    textAlign: 'center',
  },
});
