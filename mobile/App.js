import { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Platform, Pressable, Text, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import DetailScreen from './src/screens/DetailScreen';
import WebTopBar from './src/components/WebTopBar';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const isWeb = Platform.OS === 'web';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.header,
    text: colors.text,
    border: colors.line,
    primary: colors.accent,
  },
};

function TabIcon({ label, focused }) {
  return (
    <Text style={{ color: focused ? colors.accent : colors.muted, fontSize: 11, fontWeight: '700' }}>
      {label}
    </Text>
  );
}

function useWebDocumentFix() {
  useEffect(() => {
    if (!isWeb || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = 'site-overflow-fix';
    style.textContent = `
      html, body {
        height: auto !important;
        min-height: 100% !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        background: ${colors.bg};
      }
      #root {
        height: auto !important;
        min-height: 100vh !important;
        display: block !important;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
}

function WebChrome({ navigation, route, children }) {
  const active = route?.name === 'Search' ? 'Search' : 'Home';
  return (
    <View style={styles.webShell}>
      <WebTopBar
        active={active}
        onHome={() => navigation.navigate('Home')}
        onSearch={() => navigation.navigate('Search')}
      />
      <View style={styles.webBody}>{children}</View>
    </View>
  );
}

function WebHome(props) {
  return (
    <WebChrome {...props}>
      <HomeScreen {...props} />
    </WebChrome>
  );
}

function WebSearch(props) {
  return (
    <WebChrome {...props}>
      <SearchScreen {...props} />
    </WebChrome>
  );
}

function WebDetail(props) {
  return (
    <WebChrome {...props}>
      <DetailScreen {...props} showWebBack />
    </WebChrome>
  );
}

function WebApp() {
  useWebDocumentFix();
  return (
    <View style={styles.webShell}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Home" component={WebHome} />
          <Stack.Screen name="Search" component={WebSearch} />
          <Stack.Screen name="Detail" component={WebDetail} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.line,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '인기',
          tabBarLabel: '인기',
          tabBarIcon: ({ focused }) => <TabIcon label="TOP" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: '검색',
          tabBarLabel: '검색',
          tabBarIcon: ({ focused }) => <TabIcon label="찾기" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MobileApp() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.header },
              headerTintColor: colors.accent,
              headerTitleStyle: { fontWeight: '700', color: colors.text, fontSize: 16 },
              headerShadowVisible: true,
              contentStyle: { backgroundColor: colors.bg },
              headerTitleAlign: 'center',
            }}
          >
            <Stack.Screen name="Tabs" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={({ navigation, route }) => ({
                title: route.params?.name || '게임 정보',
                headerShown: true,
                headerBackVisible: false,
                headerLeft: () => (
                  <Pressable
                    onPress={() => navigation.goBack()}
                    style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>← 뒤로</Text>
                  </Pressable>
                ),
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  if (isWeb) return <WebApp />;
  return <MobileApp />;
}

const styles = {
  webShell: {
    flex: 1,
    minHeight: isWeb ? '100vh' : undefined,
    backgroundColor: colors.bg,
  },
  webBody: {
    flex: 1,
  },
};
