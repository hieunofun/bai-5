import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText, Icon } from '@/components/course-ui';
import { palette } from '@/constants/course-theme';

export function CourseCover({
  uri,
  title,
  style,
}: {
  uri: string;
  title: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri === uri;
  return (
    <View style={[styles.cover, style]}>
      {!uri || failed ? (
        <View style={styles.fallback}>
          <Icon name="image" size={26} />
          <AppText style={styles.caption}>
            {failed ? 'Không tải được ảnh' : 'Chưa có ảnh bìa'}
          </AppText>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={uri}
          accessibilityLabel={`Ảnh bìa ${title}`}
          transition={150}
          onError={() => setFailedUri(uri)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: palette.secondary,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  caption: { color: palette.muted, fontSize: 13, textAlign: 'center' },
});
