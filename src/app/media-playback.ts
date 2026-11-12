const mediaPlayers = new Set<HTMLMediaElement>();

export function registerMediaPlayer(player: HTMLMediaElement) {
  mediaPlayers.add(player);
  return () => {
    mediaPlayers.delete(player);
  };
}

export function pauseOtherMediaPlayers(currentPlayer: HTMLMediaElement) {
  mediaPlayers.forEach((player) => {
    if (player !== currentPlayer) player.pause();
  });
}
