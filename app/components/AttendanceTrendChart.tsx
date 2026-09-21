"use client";

import { useState, useRef, useId } from "react";

type Punt = {
  id: number;
  label: string;
  datumLabel: string;
  aantal: number;
};

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 20, right: 16, bottom: 28, left: 30 };

function niceMax(waarde: number) {
  if (waarde <= 0) return 4;
  const stap = waarde <= 10 ? 2 : waarde <= 20 ? 5 : Math.ceil(waarde / 5 / 5) * 5;
  return Math.ceil((waarde + 1) / stap) * stap;
}

export default function AttendanceTrendChart({
  data,
  titel = "Aanwezigheidstrend",
  subtitel = "Aantal aanwezigen per lezing, chronologisch.",
  waardeLabel = "aanwezig",
}: {
  data: Punt[];
  titel?: string;
  subtitel?: string;
  waardeLabel?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gradientId = useId();

  if (data.length < 2) {
    return (
      <p className="px-5 py-10 text-center text-sm text-neutral-500">
        Nog niet genoeg lezingen voor een trend (minstens 2 nodig).
      </p>
    );
  }

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const maxAantal = niceMax(Math.max(...data.map((d) => d.aantal)));
  const stapX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const puntPositie = (i: number) => ({
    x: PADDING.left + stapX * i,
    y: PADDING.top + plotHeight * (1 - data[i].aantal / maxAantal),
  });

  const lijnPad = data
    .map((_, i) => {
      const { x, y } = puntPositie(i);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const laatste = puntPositie(data.length - 1);
  const eerste = puntPositie(0);
  const vlakPad = `${lijnPad} L${laatste.x.toFixed(1)},${PADDING.top + plotHeight} L${eerste.x.toFixed(1)},${PADDING.top + plotHeight} Z`;

  const gridWaarden = [0, maxAantal / 2, maxAantal];

  const eersteAantal = data[0].aantal;
  const laatsteAantal = data[data.length - 1].aantal;
  const verschil = laatsteAantal - eersteAantal;

  const labelInterval = Math.ceil(data.length / 7);

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let dichtsteIndex = 0;
    let dichtsteAfstand = Infinity;
    data.forEach((_, i) => {
      const afstand = Math.abs(puntPositie(i).x - relX);
      if (afstand < dichtsteAfstand) {
        dichtsteAfstand = afstand;
        dichtsteIndex = i;
      }
    });
    setHoverIndex(dichtsteIndex);
  }

  const hoverPunt = hoverIndex !== null ? puntPositie(hoverIndex) : null;
  const hoverData = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-neutral-700">{titel}</h2>
          <p className="text-xs text-neutral-500">{subtitel}</p>
        </div>
        <div
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            verschil > 0
              ? "bg-emerald-50 text-emerald-700"
              : verschil < 0
                ? "bg-neutral-100 text-neutral-600"
                : "bg-neutral-100 text-neutral-500"
          }`}
        >
          <span aria-hidden>{verschil > 0 ? "▲" : verschil < 0 ? "▼" : "→"}</span>
          {verschil === 0
            ? "gelijk gebleven"
            : `${verschil > 0 ? "+" : ""}${verschil} t.o.v. eerste`}
        </div>
      </div>

      <div className="relative mt-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          role="img"
          aria-label={`Lijngrafiek van aanwezigheid over ${data.length} lezingen, van ${eersteAantal} naar ${laatsteAantal} ${waardeLabel}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridWaarden.map((waarde) => {
            const y = PADDING.top + plotHeight * (1 - waarde / maxAantal);
            return (
              <g key={waarde}>
                <line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="#e5e5e5"
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-neutral-400 text-[10px]"
                >
                  {Math.round(waarde)}
                </text>
              </g>
            );
          })}

          {data.map((punt, i) => {
            if (i % labelInterval !== 0 && i !== data.length - 1) return null;
            const { x } = puntPositie(i);
            return (
              <text
                key={punt.id}
                x={x}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fill-neutral-400 text-[10px]"
              >
                {punt.datumLabel}
              </text>
            );
          })}

          <path d={vlakPad} fill={`url(#${gradientId})`} stroke="none" />

          <path
            d={lijnPad}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoverPunt && (
            <line
              x1={hoverPunt.x}
              x2={hoverPunt.x}
              y1={PADDING.top}
              y2={PADDING.top + plotHeight}
              stroke="#a3a3a3"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {data.map((punt, i) => {
            const { x, y } = puntPositie(i);
            const isLaatste = i === data.length - 1;
            const isHover = hoverIndex === i;
            return (
              <g key={punt.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHover ? 6 : 4}
                  fill="#10b981"
                  stroke="#fff"
                  strokeWidth={2}
                  className="transition-[r]"
                />
                {isLaatste && (
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="end"
                    className="fill-neutral-900 text-[11px] font-semibold"
                  >
                    {punt.aantal}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {data.map((punt, i) => {
          const { x, y } = puntPositie(i);
          return (
            <button
              key={punt.id}
              type="button"
              aria-label={`${punt.label}: ${punt.aantal} ${waardeLabel}`}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 focus:opacity-100 focus:outline focus:outline-2 focus:outline-emerald-500"
              style={{
                left: `${(x / WIDTH) * 100}%`,
                top: `${(y / HEIGHT) * 100}%`,
              }}
            />
          );
        })}

        {hoverData && hoverPunt && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md"
            style={{
              left: `${(hoverPunt.x / WIDTH) * 100}%`,
              top: `${(hoverPunt.y / HEIGHT) * 100}%`,
              marginTop: "-10px",
            }}
          >
            <p className="font-semibold text-neutral-900">
              {hoverData.aantal} {waardeLabel}
            </p>
            <p className="text-neutral-500">{hoverData.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}
