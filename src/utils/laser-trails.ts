export const LASER_DECAY_MS = 900;

type LaserPoint = [number, number, number];

type LaserStroke = {
  points: LaserPoint[];
  open: boolean;
};

type LaserTrail = {
  color: string;
  strokes: LaserStroke[];
};

export class LaserTrailStore {
  trails = new Map<string, LaserTrail>();
  private listeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  addPoint(trailId: string, x: number, y: number, color: string): void {
    let trail = this.trails.get(trailId);
    if (!trail) {
      trail = { color, strokes: [] };
      this.trails.set(trailId, trail);
    }
    trail.color = color;
    let stroke = trail.strokes[trail.strokes.length - 1];
    if (!stroke || !stroke.open) {
      stroke = { points: [], open: true };
      trail.strokes.push(stroke);
    }
    stroke.points.push([x, y, performance.now()]);
    this.listeners.forEach(listener => listener());
  }

  endStroke(trailId: string): void {
    const trail = this.trails.get(trailId);
    const stroke = trail?.strokes[trail.strokes.length - 1];
    if (stroke) stroke.open = false;
  }

  prune(now: number): void {
    for (const [id, trail] of this.trails) {
      for (const stroke of trail.strokes) {
        stroke.points = stroke.points.filter(p => now - p[2] < LASER_DECAY_MS);
      }
      trail.strokes = trail.strokes.filter(s => s.points.length > 0);
      if (trail.strokes.length === 0) this.trails.delete(id);
    }
  }

  isEmpty(): boolean {
    return this.trails.size === 0;
  }
}
