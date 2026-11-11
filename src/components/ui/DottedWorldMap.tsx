/**
 * Dotted world map with a route and the vehicle's position as last published.
 * The marker never animates on its own: it moves only when an update is
 * published (Part 1 §4.8). Continent outlines are deliberately coarse.
 */

type LonLat = [number, number];

const LAND: LonLat[][] = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 62], [-60, 55], [-52, 47], [-66, 44], [-76, 35], [-81, 25], [-97, 26], [-97, 18], [-87, 14], [-78, 8], [-84, 10], [-105, 20], [-117, 32], [-124, 40], [-125, 49], [-135, 58], [-150, 60], [-165, 62]],
  [[-55, 82], [-20, 82], [-20, 70], [-42, 60], [-52, 65], [-60, 76]],
  [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -38], [-65, -55], [-73, -50], [-72, -30], [-70, -18], [-81, -5], [-80, 2]],
  [[-10, 36], [-9, 44], [-2, 48], [-5, 58], [5, 62], [15, 70], [30, 71], [40, 66], [40, 45], [28, 41], [25, 36], [12, 38], [3, 43]],
  [[-6, 50], [2, 51], [0, 58], [-6, 58]],
  [[-17, 21], [-17, 14], [-8, 5], [8, 4], [10, -2], [13, -12], [12, -18], [18, -34], [26, -34], [35, -24], [40, -15], [40, -4], [51, 12], [43, 12], [33, 30], [25, 32], [10, 37], [-6, 36]],
  [[44, -25], [50, -15], [48, -12], [44, -17]],
  [[40, 45], [40, 66], [70, 73], [110, 77], [140, 72], [180, 68], [170, 60], [160, 52], [140, 45], [130, 35], [122, 30], [120, 22], [108, 18], [106, 10], [100, 2], [98, 10], [92, 20], [80, 10], [72, 20], [60, 25], [57, 17], [45, 12], [35, 30], [28, 41]],
  [[130, 31], [141, 36], [142, 44], [140, 41], [133, 34]],
  [[95, 5], [105, -6], [120, -9], [140, -8], [140, -2], [120, 2], [110, 2]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [131, -31], [115, -34]],
];

const W = 360;
const H = 160;
const project = ([lon, lat]: LonLat): [number, number] => [((lon + 180) / 360) * W, ((80 - lat) / 140) * H];

function inside([x, y]: LonLat, poly: LonLat[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const DOTS: Array<[number, number]> = (() => {
  const out: Array<[number, number]> = [];
  for (let lat = 78; lat > -58; lat -= 3.2) {
    for (let lon = -178; lon < 180; lon += 3.2) {
      if (LAND.some((p) => inside([lon, lat], p))) out.push(project([lon, lat]));
    }
  }
  return out;
})();

export function DottedWorldMap({
  from,
  to,
  progress,
  fromLabel,
  toLabel,
  positionLabel,
  updated,
}: {
  from: LonLat;
  to: LonLat;
  /** 0..1 along the route, from the last published update. */
  progress: number;
  fromLabel: string;
  toLabel: string;
  positionLabel: string;
  updated: string;
}) {
  const a = project(from);
  const b = project(to);
  const c: [number, number] = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 28];
  const t = Math.max(0, Math.min(1, progress));
  const pt: [number, number] = [
    (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0],
    (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1],
  ];
  const minX = Math.min(a[0], b[0]) - 60;
  const viewW = Math.abs(a[0] - b[0]) + 120;
  const minY = Math.max(0, Math.min(a[1], b[1]) - 55);

  return (
    <figure className="relative">
      <svg
        viewBox={`${minX} ${minY} ${viewW} ${viewW * 0.5}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Route from ${fromLabel} to ${toLabel}. Current position: ${positionLabel}, updated ${updated}.`}
      >
        {DOTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={0.75} fill="#B7BCC2" />
        ))}
        <path d={`M${a[0]},${a[1]} Q${c[0]},${c[1]} ${b[0]},${b[1]}`} fill="none" stroke="#24272B" strokeWidth={0.8} strokeDasharray="2 1.6" />
        <circle cx={a[0]} cy={a[1]} r={2} fill="#24272B" />
        <circle cx={b[0]} cy={b[1]} r={2} fill="#fff" stroke="#24272B" strokeWidth={0.8} />
        <circle cx={pt[0]} cy={pt[1]} r={5} fill="#C62838" opacity={0.18} />
        <circle cx={pt[0]} cy={pt[1]} r={2.6} fill="#C62838" stroke="#fff" strokeWidth={0.8} />
        <text x={a[0]} y={a[1] + 7} textAnchor="middle" fontSize={5} fill="#24272B" fontWeight={600}>
          {fromLabel}
        </text>
        <text x={b[0]} y={b[1] + 7} textAnchor="middle" fontSize={5} fill="#24272B" fontWeight={600}>
          {toLabel}
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          <span className="font-semibold">Current position · </span>
          {positionLabel}
        </span>
        <span className="text-slate">Updated {updated}</span>
      </figcaption>
    </figure>
  );
}
