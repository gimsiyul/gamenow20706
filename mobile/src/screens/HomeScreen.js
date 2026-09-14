import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPopular } from '../api';
import GameRow from '../components/GameRow';
import { colors } from '../theme';

export default function HomeScreen({ navigation }) {
  const [games, setGames] = useState([]);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.hint}>스팀 인기 게임을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
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
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <GameRow
            game={item}
            showRank
            onPress={() => navigation.navigate('Detail', { appid: item.appid, name: item.name })}
          />
        )}
        ListEmptyComponent={
          !error ? <Text style={styles.hint}>표시할 게임이 없습니다.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.bg,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sub: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    marginTop: 10,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    color: colors.muted,
    marginTop: 12,
    textAlign: 'center',
  },
});
