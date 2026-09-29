import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  blue: '#2D7BEA',
  red: '#FA3D3F',
  yellow: '#FFDA20',
  green: '#2BAE6C',
  purple: '#7D3BDD',
  orange: '#FF7914',
};

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const fontSize = width > 0 ? Math.max(28, Math.min(48, (width * 48) / 600)) : 48;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.board}>
          <View
            accessible
            accessibilityLabel="Ô số 1, màu xanh dương"
            style={[styles.block, styles.bar, { backgroundColor: COLORS.blue }]}
          >
            <Text style={[styles.number, { fontSize }]}>1</Text>
          </View>

          <View
            accessible
            accessibilityLabel="Ô số 2, màu đỏ"
            style={[styles.block, styles.bar, { backgroundColor: COLORS.red }]}
          >
            <Text style={[styles.number, { fontSize }]}>2</Text>
          </View>

          <View style={styles.middleRow}>
            <View
              accessible
              accessibilityLabel="Ô số 3, màu vàng"
              style={[styles.block, styles.middleBlock, { backgroundColor: COLORS.yellow }]}
            >
              <Text style={[styles.number, styles.blackNumber, { fontSize }]}>3</Text>
            </View>
            <View
              accessible
              accessibilityLabel="Ô số 4, màu xanh lá"
              style={[styles.block, styles.middleBlock, { backgroundColor: COLORS.green }]}
            >
              <Text style={[styles.number, { fontSize }]}>4</Text>
            </View>
            <View
              accessible
              accessibilityLabel="Ô số 5, màu tím"
              style={[styles.block, styles.middleBlock, { backgroundColor: COLORS.purple }]}
            >
              <Text style={[styles.number, { fontSize }]}>5</Text>
            </View>
          </View>

          <View
            accessible
            accessibilityLabel="Ô số 6, màu cam"
            style={[styles.block, styles.bottom, { backgroundColor: COLORS.orange }]}
          >
            <Text style={[styles.number, { fontSize }]}>6</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  board: {
    width: '100%',
    maxWidth: 600,
    gap: 10,
  },
  bar: {
    aspectRatio: 600 / 116,
  },
  middleRow: {
    flexDirection: 'row',
    aspectRatio: 600 / 240,
    gap: 10,
  },
  middleBlock: {
    width: '24.1667%',
    height: '100%',
  },
  bottom: {
    aspectRatio: 3,
  },
  block: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: '#FFFFFF',
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center',
  },
  blackNumber: {
    color: '#000000',
  },
});
