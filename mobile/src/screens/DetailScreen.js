import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchGame } from '../api';
import BarChart from '../components/BarChart';
import InfoTable from '../components/InfoTable';
import Page from '../components/Page';
import { colors } from '../theme';

const isWeb = Platform.OS === 'web';

export default function DetailScreen({ route, navigation, showWebBack = false }) {
  const { appid } = route.params;
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchGame(appid);
        if (alive) setGame(data);
      } catch (err) {
        if (alive) setError(err.message || '상세 정보를 불러오지 못했습니다.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [appid]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.hint}>게임 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error || !game) {
    return (
      <View style={styles.center}>
        {showWebBack ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← 목록으로</Text>
          </Pressable>
        ) : null}
        <Text style={styles.error}>{error || '정보가 없습니다.'}</Text>
      </View>
    );
  }

  const platforms = [
    game.platforms?.windows ? 'Windows' : null,
    game.platforms?.mac ? 'Mac' : null,
    game.platforms?.linux ? 'Linux' : null,
  ]
    .filter(Boolean)
    .join(', ');

  const body = (
    <>
      {showWebBack ? (
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 목록으로</Text>
        </Pressable>
      ) : null}

      <Image
        source={{ uri: game.image }}
        style={styles.cover}
        resizeMode="contain"
      />
      <Text style={styles.name}>{game.name}</Text>
      <Text style={styles.genres}>{(game.genres || []).join(' · ') || '장르 정보 없음'}</Text>

      <View style={styles.statsRow}>
        <MiniStat label="현재 동접" value={game.currentPlayersText || '-'} />
        <MiniStat label="오늘 최고" value={game.peakTodayText || '-'} />
        <MiniStat label="가격" value={game.price?.text || '-'} />
      </View>

      {game.playtime ? (
        <>
          <Text style={styles.section}>평균 플레이 시간</Text>
          <View style={styles.statsRow}>
            <MiniStat label="평균" value={game.playtime.averageText} />
            <MiniStat label="중앙값" value={game.playtime.medianText} />
            <MiniStat label="표본" value={`${game.playtime.sampleSize}명`} />
          </View>
          <View style={styles.card}>
            <BarChart items={game.playtime.buckets} valueKey="percent" suffix="%" />
            <Text style={styles.note}>{game.playtime.note}</Text>
          </View>
        </>
      ) : null}

      <Text style={styles.section}>리뷰</Text>
      <View style={styles.card}>
        <Text style={styles.reviewTitle}>{game.review?.description || '평가 없음'}</Text>
        {game.review?.total ? (
          <>
            <View style={styles.stack}>
              <View style={[styles.stackPos, { flex: game.review.positivePercent || 1 }]} />
              <View style={[styles.stackNeg, { flex: game.review.negativePercent || 1 }]} />
            </View>
            <InfoTable
              rows={[
                { label: '전체', value: `${game.review.totalText}개` },
                { label: '긍정', value: `${game.review.positiveText} (${game.review.positivePercent}%)` },
                { label: '부정', value: `${game.review.negativeText} (${game.review.negativePercent}%)` },
              ]}
            />
          </>
        ) : (
          <Text style={styles.desc}>리뷰가 없습니다.</Text>
        )}
      </View>

      <Text style={styles.section}>게임 정보</Text>
      <InfoTable
        rows={[
          { label: '개발', value: (game.developers || []).join(', ') },
          { label: '배급', value: (game.publishers || []).join(', ') },
          { label: '출시', value: game.releaseDate },
          { label: '플랫폼', value: platforms },
          {
            label: '언어',
            value: game.languageCount
              ? `${game.hasKorean ? '한국어 포함 · ' : ''}총 ${game.languageCount}개`
              : '',
          },
          { label: '메타크리틱', value: game.metacritic ? `${game.metacritic}점` : '' },
          {
            label: '추천 수',
            value: game.recommendations ? game.recommendations.toLocaleString('ko-KR') : '',
          },
          { label: 'DLC', value: game.dlcCount ? `${game.dlcCount}개` : '' },
          { label: '보유 추정', value: game.owners },
          { label: '도전과제', value: game.achievements?.total ? `${game.achievements.total}개` : '' },
        ]}
      />

      {game.categories?.length ? (
        <>
          <Text style={styles.section}>지원 기능</Text>
          <View style={styles.chips}>
            {game.categories.map((c) => (
              <View key={c} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {game.tags?.length ? (
        <>
          <Text style={styles.section}>인기 태그</Text>
          <View style={styles.card}>
            <BarChart
              items={game.tags.map((t) => ({ label: t.name, votes: t.votes }))}
              valueKey="votes"
              suffix=""
            />
          </View>
        </>
      ) : null}

      {game.achievements?.distribution?.some((d) => d.count > 0) ? (
        <>
          <Text style={styles.section}>도전과제 달성률 분포</Text>
          <View style={styles.card}>
            <Text style={styles.note}>각 구간에 해당하는 도전과제 개수입니다.</Text>
            <BarChart items={game.achievements.distribution} valueKey="count" suffix="개" />
          </View>
        </>
      ) : null}

      {game.achievements?.highlighted?.length ? (
        <>
          <Text style={styles.section}>대표 도전과제</Text>
          {game.achievements.highlighted.map((a) => (
            <View key={a.name} style={styles.achRow}>
              {a.icon ? <Image source={{ uri: a.icon }} style={styles.achIcon} /> : null}
              <Text style={styles.achName}>{a.name}</Text>
            </View>
          ))}
        </>
      ) : null}

      {game.screenshots?.length ? (
        <>
          <Text style={styles.section}>스크린샷</Text>
          <View style={styles.shotGrid}>
            {game.screenshots.map((uri) => (
              <View key={uri} style={styles.shotWrap}>
                <Image source={{ uri }} style={styles.shot} resizeMode="contain" />
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.section}>소개</Text>
      <Text style={styles.desc}>{game.about || game.description || '설명이 없습니다.'}</Text>
    </>
  );

  if (isWeb) {
    return <Page>{body}</Page>;
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      {body}
    </ScrollView>
  );
}

function MiniStat({ label, value }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  cover: {
    width: '100%',
    aspectRatio: 460 / 215,
    borderRadius: 16,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  name: {
    color: colors.text,
    fontSize: isWeb ? 30 : 24,
    fontWeight: '800',
    marginTop: 16,
  },
  genres: {
    color: colors.accent,
    marginTop: 6,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: isWeb ? 'wrap' : 'nowrap',
  },
  mini: {
    flex: 1,
    minWidth: isWeb ? 160 : undefined,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  section: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  note: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  reviewTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  stack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
  },
  stackPos: {
    backgroundColor: colors.positive,
  },
  stackNeg: {
    backgroundColor: colors.danger,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    color: colors.text,
    fontSize: 12,
  },
  achRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  achIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.cardAlt,
  },
  achName: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  shotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    rowGap: 12,
  },
  shotWrap: {
    width: isWeb ? '49%' : '100%',
    marginBottom: isWeb ? 0 : 12,
  },
  shot: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  desc: {
    color: colors.muted,
    lineHeight: 22,
    fontSize: 14,
  },
  hint: {
    color: colors.muted,
    marginTop: 12,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 240,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
