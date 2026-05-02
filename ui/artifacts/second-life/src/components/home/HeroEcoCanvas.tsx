import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState, type RefObject } from "react";
import { useLocation } from "wouter";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type HeroCategoryPin = {
  id: string;
  name: string;
  href: string;
};

const SMALL_SPHERE_COLOR = "#5fae88";
const SMALL_SPHERE_EMISSIVE = "#1e4d38";

/** Tốc độ quả cầu nhỏ chạy trên vòng — đường quỹ đạo tách riêng, không xoay */
const RING_ORBIT_SPEEDS = [0.11, 0.145, 0.088] as const;

const CLUSTER_ICO_RADIUS = 1.15;

/** R_orbit = 1.25 * R — cả 3 vòng cùng bán kính */
const ORBIT_RADIUS = 1.25 * CLUSTER_ICO_RADIUS;

/** Độ dày hình học của vòng quỹ đạo (torus tube); chỉ geometry */
const ORBIT_TUBE_RADIUS = 0.005;

const ORB_HIT_RADIUS = 0.14;

/**
 * Ba mặt phẳng đại viên cầu qua tâm (0,0,0), chứa trụ Z; pháp tuyến trên mặt phẳng XY lệch 0° / 120° / 240°
 * → ba vòng cắt nhau tại tâm, góc giữa hai mặt kề = 120°.
 */
function ringPlaneQuaternions(): THREE.Quaternion[] {
  const xAxis = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const qBase = new THREE.Quaternion().setFromAxisAngle(xAxis, -Math.PI / 2);
  return [0, 1, 2].map((k) => {
    const qZ = new THREE.Quaternion().setFromAxisAngle(zAxis, (k * 2 * Math.PI) / 3);
    return qZ.clone().multiply(qBase);
  });
}

function splitIntoThreeRings(pins: HeroCategoryPin[]): [HeroCategoryPin[], HeroCategoryPin[], HeroCategoryPin[]] {
  const a: HeroCategoryPin[] = [];
  const b: HeroCategoryPin[] = [];
  const c: HeroCategoryPin[] = [];
  pins.forEach((pin, i) => {
    if (i % 3 === 0) a.push(pin);
    else if (i % 3 === 1) b.push(pin);
    else c.push(pin);
  });
  return [a, b, c];
}

function ringPositions(items: HeroCategoryPin[]): { pin: HeroCategoryPin; angle: number }[] {
  const n = items.length;
  if (n === 0) return [];
  return items.map((pin, k) => ({
    pin,
    angle: (k / n) * Math.PI * 2 - Math.PI / 2,
  }));
}

function RingCircleLine({ radius }: { radius: number }) {
  return (
    <mesh>
      <torusGeometry args={[radius, ORBIT_TUBE_RADIUS, 12, 96]} />
      <meshBasicMaterial color="#3f3f3f" transparent opacity={0.62} depthWrite={false} />
    </mesh>
  );
}

function EcoClusterMeshes({ innerRef }: { innerRef: RefObject<THREE.Mesh | null> }) {
  return (
    <>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[CLUSTER_ICO_RADIUS, 1]} />
        <meshStandardMaterial
          color="#5fae88"
          metalness={0.28}
          roughness={0.36}
          emissive="#1e3d2f"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.28, 1]} />
        <meshBasicMaterial color="#7dcca6" wireframe transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </>
  );
}

type OrbProps = {
  pin: HeroCategoryPin;
  position: [number, number, number];
  active: boolean;
  sharedColor: THREE.Color;
  emissiveBase: THREE.Color;
  onHoverChange: (pin: HeroCategoryPin | null) => void;
};

function CategoryOrb({ pin, position, active, sharedColor, emissiveBase, onHoverChange }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [, setLocation] = useLocation();

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || active) return;
    mesh.rotation.y += delta * 1.15;
    mesh.rotation.x += delta * 0.26;
  });

  const pointerHandlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
      onHoverChange(pin);
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "auto";
      onHoverChange(null);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setLocation(pin.href);
    },
  };

  return (
    <group position={position}>
      <mesh {...pointerHandlers}>
        <sphereGeometry args={[ORB_HIT_RADIUS, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.072, 20, 20]} />
        <meshStandardMaterial
          color={sharedColor}
          metalness={0.42}
          roughness={0.3}
          emissive={emissiveBase}
          emissiveIntensity={active ? 0.52 : 0.26}
        />
      </mesh>
    </group>
  );
}

type RingProps = {
  ringIndex: 0 | 1 | 2;
  planeQuat: THREE.Quaternion;
  entries: { pin: HeroCategoryPin; angle: number }[];
  activeId: string | null;
  sharedColor: THREE.Color;
  emissiveBase: THREE.Color;
  onHoverChange: (pin: HeroCategoryPin | null) => void;
};

function OrbitingRing({
  ringIndex,
  planeQuat,
  entries,
  activeId,
  sharedColor,
  emissiveBase,
  onHoverChange,
}: RingProps) {
  const beadsRef = useRef<THREE.Group>(null);
  const speed = RING_ORBIT_SPEEDS[ringIndex];

  useFrame((_, delta) => {
    const g = beadsRef.current;
    if (!g) return;
    g.rotation.z += delta * speed;
  });

  return (
    <group quaternion={planeQuat}>
      <RingCircleLine radius={ORBIT_RADIUS} />
      <group ref={beadsRef}>
        {entries.map(({ pin, angle }) => (
          <CategoryOrb
            key={pin.id}
            pin={pin}
            position={[Math.cos(angle) * ORBIT_RADIUS, Math.sin(angle) * ORBIT_RADIUS, 0]}
            active={activeId === pin.id}
            sharedColor={sharedColor}
            emissiveBase={emissiveBase}
            onHoverChange={onHoverChange}
          />
        ))}
      </group>
    </group>
  );
}

function HeroSphereAndRings({
  ringData,
  activeId,
  sharedColor,
  emissiveBase,
  onHoverChange,
}: {
  ringData: {
    ringIndex: 0 | 1 | 2;
    planeQuat: THREE.Quaternion;
    entries: { pin: HeroCategoryPin; angle: number }[];
  }[];
  activeId: string | null;
  sharedColor: THREE.Color;
  emissiveBase: THREE.Color;
  onHoverChange: (pin: HeroCategoryPin | null) => void;
}) {
  const tiltRef = useRef<THREE.Group>(null);
  const innerIcoRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const g = tiltRef.current;
    const m = innerIcoRef.current;
    if (!g || !m) return;
    const t = state.clock.elapsedTime;
    const mx = state.pointer.x;
    const my = state.pointer.y;
    g.rotation.y = t * 0.12 + mx * 0.45;
    g.rotation.x = my * 0.35;
    m.rotation.y = -t * 0.25;
    m.rotation.z = t * 0.08;
  });

  return (
    <group ref={tiltRef}>
      <EcoClusterMeshes innerRef={innerIcoRef} />
      {ringData.map(({ ringIndex, planeQuat, entries }) => (
        <OrbitingRing
          key={ringIndex}
          ringIndex={ringIndex}
          planeQuat={planeQuat}
          entries={entries}
          activeId={activeId}
          sharedColor={sharedColor}
          emissiveBase={emissiveBase}
          onHoverChange={onHoverChange}
        />
      ))}
    </group>
  );
}

function Scene({
  pins,
  onHoverPin,
}: {
  pins: HeroCategoryPin[];
  onHoverPin: (pin: HeroCategoryPin | null) => void;
}) {
  const rings = useMemo(() => splitIntoThreeRings(pins), [pins]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sharedColor = useMemo(() => new THREE.Color(SMALL_SPHERE_COLOR), []);
  const emissiveBase = useMemo(() => new THREE.Color(SMALL_SPHERE_EMISSIVE), []);

  const planeQuats = useMemo(() => ringPlaneQuaternions(), []);

  const ringData = useMemo(
    () =>
      rings.map((items, i) => ({
        ringIndex: i as 0 | 1 | 2,
        planeQuat: planeQuats[i],
        entries: ringPositions(items),
      })),
    [rings, planeQuats],
  );

  const onHoverChange = (pin: HeroCategoryPin | null) => {
    setActiveId(pin?.id ?? null);
    onHoverPin(pin);
  };

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 6]} intensity={1.05} />
      <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#a8e0c5" />

      <HeroSphereAndRings
        ringData={ringData}
        activeId={activeId}
        sharedColor={sharedColor}
        emissiveBase={emissiveBase}
        onHoverChange={onHoverChange}
      />
    </>
  );
}

export default function HeroEcoCanvas({
  pins = [],
  categoriesLoading = false,
  className,
}: {
  pins?: HeroCategoryPin[];
  categoriesLoading?: boolean;
  className?: string;
}) {
  const shown = useMemo(() => pins.slice(0, 12), [pins]);
  const [hoverPin, setHoverPin] = useState<HeroCategoryPin | null>(null);

  return (
    <div
      className={cn(
        "relative h-[min(420px,52vh)] w-full overflow-hidden rounded-3xl ring-1 ring-primary/25 shadow-[0_18px_60px_-34px_hsl(var(--primary)/0.22)]",
        className,
      )}
      style={{
        backgroundColor: `rgb(var(--hero-ecanvas-bg) / var(--hero-ecanvas-bg-alpha, 0.45))`,
      }}
    >
      <Canvas
        className="absolute inset-0 z-[2] h-full w-full touch-none"
        camera={{ position: [0, 0.35, 4.4], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Scene pins={shown} onHoverPin={setHoverPin} />
      </Canvas>

      {hoverPin ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[4] max-w-[min(92%,280px)] -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-950/92 px-3 py-1.5 text-center text-[10px] font-semibold leading-snug text-emerald-50 shadow-md sm:text-[11px]">
          <span className="line-clamp-2">{hoverPin.name}</span>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center p-6 text-center text-sm font-medium text-emerald-950/90 [text-shadow:0_1px_1px_rgba(255,255,255,0.6)] dark:text-emerald-100/95 dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.55)]">
          {categoriesLoading ? "Đang tải danh mục…" : "Chưa có danh mục để hiển thị."}
        </div>
      ) : null}
    </div>
  );
}
