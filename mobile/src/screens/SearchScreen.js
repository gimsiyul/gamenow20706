import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSearch } from '../api';
import GameRow from '../components/GameRow';
import { colors } from '../theme';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function onSubmit() {
    const q = query.trim();
    if (!q) return;
    try {
      setLoading(true);
      setError('');
      setSearched(true);
      const data = await fetchSearch(q);
      setGames(data.games || []);
    } catch (err) {
      setError(err.message || '검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <Text style={styles.title}>게임 검색</Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="게임 이름을 입력하세요"
        placeholderTextColor={colors.muted}
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {loading ? <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={games}
        keyExtractor={(item) => String(item.appid)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <GameRow
            game={item}
            onPress={() => navigation.navigate('Detail', { appid: item.appid, name: item.name })}
          />
        )}
        ListEmptyComponent={
          !loading && searched && !error ? (
            <Text style={styles.hint}>검색 결과가 없습니다.</Text>
          ) : !searched ? (
            <Text style={styles.hint}>예: Counter-Strike, PUBG, Palworld</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  list: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
  },
  hint: {
    color: colors.muted,
    marginTop: 20,
    textAlign: 'center',
  },
});
