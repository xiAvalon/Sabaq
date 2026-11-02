export function summarize(player) {
  const attempts = player.correct + player.wrong + player.timeouts;
  return {
    ...player,
    attempts,
    accuracy: attempts ? Math.round((player.correct / attempts) * 100) : 0,
    avgSeconds: player.answered ? player.answerMs / player.answered / 1000 : 0,
  };
}

/** Players sorted by score (then accuracy), with shared ranks for ties. */
export function rankPlayers(players) {
  const rows = players.map(summarize).sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
  let rank = 0;
  return rows.map((row, i) => {
    if (i === 0 || row.score !== rows[i - 1].score) rank = i + 1;
    return { ...row, rank };
  });
}

export function winners(players) {
  if (!players.length) return [];
  const top = Math.max(...players.map((p) => p.score));
  return players.filter((p) => p.score === top);
}
