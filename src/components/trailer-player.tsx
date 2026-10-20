import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';
import { AppText, Banner, Button } from '@/components/course-ui';
import { palette } from '@/constants/course-theme';

export function TrailerPlayer({ url }: { url: string }) {
  const player = useVideoPlayer({ uri: url, contentType: 'progressive' });
  const { status, error } = useEvent(player, 'statusChange', {
    status: player.status,
  });
  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });
  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
        contentFit="contain"
      />
      {status === 'loading' ? (
        <AppText style={styles.caption}>Đang tải trailer…</AppText>
      ) : null}
      {error || status === 'error' ? (
        <Banner message="Không phát được trailer. Kiểm tra URL MP4 và kết nối mạng." />
      ) : (
        <Button
          title={isPlaying ? 'Tạm dừng' : 'Phát video'}
          icon={isPlaying ? 'pause' : 'play'}
          onPress={() => {
            if (isPlaying) player.pause();
            else player.play();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: palette.primary,
  },
  caption: { fontSize: 13, color: palette.muted },
});
