export function closest(point, pointList) {
  const closestPoint = [...pointList].sort(
    (a, b) => distance(a, point) - distance(b, point)
  );
  return closestPoint[0];
}

export function distance(p, q) {
  const dx = p.x - q.x;
  const dy = p.y - q.y;
  return Math.sqrt(dx * dx + dy * dy);
}
