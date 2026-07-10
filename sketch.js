const CANVAS_W = 1080;
const CANVAS_H = 1440;
const INTRO_FRAMES = 26;
const YEARS_PER_SEGMENT = 10;
const SEGMENT_DURATION = 30;
const MAX_FALL_FRAMES = 152;
const DEFAULT_OVERLAY_FADE_FRAMES = 60;
const PILE_REVEAL_Y_RATIO = 0.5;
const PILE_COLUMNS = 31;
const PILE_LEFT = 70;
const PILE_RIGHT = 1010;
const PILE_FLOOR_Y = 1265;
const PILE_ROW_GAP = 34;
const TOP_BACKGROUND = [44, 71, 218];
const MID_BACKGROUND = [45, 96, 229];
const BOTTOM_BACKGROUND = [48, 135, 238];
const FEMALE_COLOR = [255, 218, 55];
const MALE_COLOR = [255, 255, 255];
const TRAIL_COLOR = [214, 232, 255];
const FEMALE_GLOW = [255, 238, 122];
const MALE_GLOW = [235, 244, 255];
const TEXT_FONT = '"Songti SC", STSong, "Noto Serif CJK SC", SimSun, serif';
const WATERMARK_LINES = ["爱可视化的简女士", "Jane of Visual Stories"];
const WATERMARK_COLOR = [255, 255, 255];
const WATERMARK_CENTER_ALPHA = 9;
const WATERMARK_CORNER_ALPHA = 28;

const visualConfig = {
  starMinScale: 0.35,
  starMaxScale: 1.55,
  layoutChaos: 0.6,
  settledMotion: 4,
  bounceStrength: 3,
  tailThickness: 2.5,
  tailLength: 2.5,
  whiteStarOpacity: 5,
  whiteStarGlow: 0,
  yellowStarGlow: 0,
  textSize: 50,
  textTracking: 0,
  textLineGap: 64,
  textBoxAlpha: 0.05,
  textBoxHeight: 1,
  overlayFadeFrames: 60,
  canvasWidth: 1080,
  canvasHeight: 1440,
  canvasColor: "#2d60e5",
  watermarkSize: 3,
  watermarkAlpha: 1
};

let meteors = [];
let skyDots = [];
let timeSegments = [];
let activeYear = 1901;
let textBackdropBounds = null;
let overlayRevealFrame = null;
let overlayRevealHeight = null;
let isPlaying = false;
let playbackStartFrame = 0;

function setup() {
  const canvas = createCanvas(visualConfig.canvasWidth, visualConfig.canvasHeight);
  canvas.parent("stage");
  pixelDensity(1);
  textFont(TEXT_FONT);
  randomSeed(20250707);
  noiseSeed(20250707);
  buildTimeSegments();
  setupControls();
  updateStageSize();
  buildSky();
  buildMeteors();
}

function draw() {
  drawNightSky();

  const frame = getPlaybackFrame();
  activeYear = getActiveYear(frame);

  const overlayAlpha = getOverlayAlpha(frame);
  drawMeteors(frame);
  drawCenterStatement(frame, overlayAlpha);
  drawWatermark(overlayAlpha);
}

function windowResized() {
  updateStageSize();
}

function updateStageSize() {
  const holder = document.getElementById("stage");
  if (!holder) return;

  const canvasW = visualConfig.canvasWidth;
  const canvasH = visualConfig.canvasHeight;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const scale = min(viewportW / canvasW, viewportH / canvasH);
  holder.style.width = `${canvasW * scale}px`;
  holder.style.height = `${canvasH * scale}px`;
  resizeCanvas(canvasW, canvasH, true);
}

function buildSky() {
  skyDots = [];
  for (let i = 0; i < 520; i += 1) {
    const isWarm = random() < 0.08;
    const x = random(width);
    const y = random(height);
    const quietDistance = dist(x, y, width / 2, height * 0.36);
    const quietScale = constrain(map(quietDistance, 90, 360, 0.12, 1), 0.12, 1);
    skyDots.push({
      x,
      y,
      r: random(0.35, 1.7),
      a: random(14, 78) * quietScale,
      color: isWarm ? FEMALE_COLOR : MALE_COLOR
    });
  }
}

function buildTimeSegments() {
  timeSegments = [];

  for (
    let startYear = window.NOBEL_TOTALS.startYear;
    startYear <= window.NOBEL_TOTALS.endYear;
    startYear += YEARS_PER_SEGMENT
  ) {
    const endYear = min(startYear + YEARS_PER_SEGMENT - 1, window.NOBEL_TOTALS.endYear);
    const rows = window.NOBEL_BY_YEAR.filter((row) => row.year >= startYear && row.year <= endYear);
    const totals = rows.reduce(
      (acc, row) => {
        acc.segmentTotal += row.total;
        acc.segmentFemale += row.female;
        acc.cumulativeTotal += row.total;
        acc.cumulativeFemale += row.female;
        return acc;
      },
      {
        segmentTotal: 0,
        segmentFemale: 0,
        cumulativeTotal: timeSegments.length > 0 ? timeSegments[timeSegments.length - 1].cumulativeTotal : 0,
        cumulativeFemale: timeSegments.length > 0 ? timeSegments[timeSegments.length - 1].cumulativeFemale : 0
      }
    );

    timeSegments.push({
      index: timeSegments.length,
      startYear,
      endYear,
      ...totals
    });
  }
}

function buildMeteors() {
  meteors = [];
  overlayRevealFrame = null;
  overlayRevealHeight = null;
  let index = 0;
  randomSeed(20250707);

  window.NOBEL_BY_YEAR.forEach((row) => {
    addYearMeteors(row.year, row.female, true, index);
    index += row.female;
    addYearMeteors(row.year, row.male, false, index);
    index += row.male;
  });

  meteors.sort((a, b) => a.start - b.start);
}

function addYearMeteors(year, count, isFemale, startIndex) {
  const segment = getSegmentForYear(year);
  const segmentProgress = (year - segment.startYear) / max(1, segment.endYear - segment.startYear + 1);
  const segmentStart = INTRO_FRAMES + segment.index * SEGMENT_DURATION;

  for (let i = 0; i < count; i += 1) {
    const pile = getPilePosition(startIndex + i);
    const localJitter = random(-6, 6);
    const start = segmentStart + segmentProgress * SEGMENT_DURATION + localJitter + random(0, 14);
    const travelX = random(690, 1090);
    const travelY = random(1240, 1760);
    const startX = pile.x - travelX + random(-70, 70);
    const startY = pile.y - travelY + random(-90, 45);
    const angle = atan2(pile.y - startY, pile.x - startX);
    const size = isFemale ? random(4.5, 7.2) : random(3.5, 6.2);
    const alphaScale = isFemale ? random(1.05, 1.28) : random(0.1, 0.34);
    const hasSoftTail = isFemale && random() < 0.2;
    const fallDuration = isFemale ? random(108, MAX_FALL_FRAMES) : random(96, 136);
    const drift = random(-22, 22);
    const arcLift = random(18, 46);
    const enterOffset = getEnterOffset(startX, startY, pile.x, pile.y, fallDuration, drift, arcLift);

    meteors.push({
      year,
      isFemale,
      start,
      enterFrame: ceil(start + enterOffset),
      impactFrame: start + fallDuration,
      x: startX,
      y: startY,
      settleX: pile.x,
      settleY: pile.y,
      angle,
      length: hasSoftTail ? random(270, 430) : isFemale ? random(145, 285) : random(85, 205),
      size,
      sizeSeed: random(),
      alphaScale,
      hasSoftTail,
      sparkleStretch: random(1.65, 2.55),
      diagonalScale: random(0.36, 0.66),
      rotation: random(TWO_PI),
      coreRatio: random(0.62, 1.08),
      fallDuration,
      drift,
      arcLift,
      bounceSide: random([-1, 1]),
      bouncePhase: random(0.82, 1.18),
      twinkle: random(TWO_PI)
    });
  }
}

function getSegmentForYear(year) {
  return timeSegments.find((segment) => year >= segment.startYear && year <= segment.endYear) || timeSegments[0];
}

function getEnterOffset(startX, startY, settleX, settleY, fallDuration, drift, arcLift) {
  for (let age = 0; age <= fallDuration; age += 1) {
    const position = getFlyingPosition(startX, startY, settleX, settleY, fallDuration, drift, arcLift, age);
    if (isInsideCanvas(position.x, position.y)) {
      return age;
    }
  }
  return fallDuration;
}

function getFlyingPosition(startX, startY, settleX, settleY, fallDuration, drift, arcLift, age) {
  const t = constrain(age / fallDuration, 0, 1);
  const ease = 1 - pow(1 - t, 2.15);
  return {
    x: lerp(startX, settleX, ease) + sin(t * PI) * drift,
    y: lerp(startY, settleY, ease) - sin(t * PI) * arcLift
  };
}

function isInsideCanvas(x, y) {
  return x >= 0 && x <= width && y >= 0 && y <= height;
}

function buildRayLengths(count, isFemale) {
  const lengths = [];
  for (let i = 0; i < count; i += 1) {
    const mainRay = i % 4 === 0;
    const base = mainRay ? random(6.8, 10.8) : random(2.8, 6.7);
    lengths.push(base * (isFemale ? random(1.28, 1.72) : random(0.62, 0.96)));
  }
  return lengths;
}

function getPilePosition(index) {
  const row = floor(index / PILE_COLUMNS);
  const rawCol = index % PILE_COLUMNS;
  const col = row % 2 === 0 ? rawCol : PILE_COLUMNS - 1 - rawCol;
  const pile = getPileArea();
  const chaos = visualConfig.layoutChaos;
  const cellW = (pile.right - pile.left) / max(1, PILE_COLUMNS - 1);
  const base = {
    x: map(col, 0, PILE_COLUMNS - 1, pile.left, pile.right) +
      random(-5, 5) +
      random(-cellW * 1.45, cellW * 1.45) * chaos,
    y: pile.floorY -
      row * pile.rowGap +
      random(-5, 5) +
      random(-pile.rowGap * 0.82, pile.rowGap * 0.82) * chaos
  };
  return avoidTextBackdropLanding(base, index);
}

function getPileArea() {
  return {
    left: width * (PILE_LEFT / CANVAS_W),
    right: width * (PILE_RIGHT / CANVAS_W),
    floorY: height * (PILE_FLOOR_Y / CANVAS_H),
    rowGap: height * (PILE_ROW_GAP / CANVAS_H)
  };
}

function getTextBackdropLines(segment = null, counts = null) {
  const textSegment = segment || timeSegments[timeSegments.length - 1] || window.NOBEL_TOTALS;
  const textCounts = counts || {
    shown: window.NOBEL_TOTALS.totalIndividuals,
    shownFemale: window.NOBEL_TOTALS.femaleIndividuals
  };
  return [
    `从 1901 到 ${textSegment.endYear || window.NOBEL_TOTALS.endYear} 年`,
    `共有 ${textCounts.shown} 位诺奖得主`,
    `其中 ${textCounts.shownFemale} 位是女性`
  ];
}

function getTextBackdropBounds(lines = getTextBackdropLines(), extraPad = 0) {
  applyCanvasTextStyle();
  const fixedWidthLines = getTextBackdropLines();
  const maxLineWidth = Math.max(...fixedWidthLines.map((line) => measureTrackedText(line)));
  const charPad = visualConfig.textSize * 0.5;
  const rectW = maxLineWidth + charPad * 2 + extraPad * 2;
  const baseH = visualConfig.textLineGap * 2 + visualConfig.textSize + charPad * 2;
  const rectH = baseH * visualConfig.textBoxHeight + extraPad * 2;
  const cx = width / 2;
  const cy = height * 0.36;

  return {
    cx,
    cy,
    w: rectW,
    h: rectH,
    left: cx - rectW / 2,
    right: cx + rectW / 2,
    top: cy - rectH / 2,
    bottom: cy + rectH / 2
  };
}

function isInsideBounds(point, bounds) {
  return point.x >= bounds.left && point.x <= bounds.right && point.y >= bounds.top && point.y <= bounds.bottom;
}

function avoidTextBackdropLanding(point, index) {
  const bounds = getTextBackdropBounds(getTextBackdropLines(), 56);
  const pile = getPileArea();
  const topY = max(height * 0.12, pile.floorY - pile.rowGap * 31.5);
  const safePoint = {
    x: constrain(point.x, pile.left, pile.right),
    y: constrain(point.y, topY, pile.floorY)
  };
  if (!isInsideBounds(safePoint, bounds)) return safePoint;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = {
      x: lerp(pile.left, pile.right, hashUnit(index + attempt * 997, 11)),
      y: lerp(topY, pile.floorY, hashUnit(index + attempt * 997, 37))
    };
    if (!isInsideBounds(candidate, bounds)) return candidate;
  }

  const verticalGap = min(abs(safePoint.y - bounds.top), abs(safePoint.y - bounds.bottom));
  const horizontalGap = min(abs(safePoint.x - bounds.left), abs(safePoint.x - bounds.right));
  if (verticalGap < horizontalGap) {
    return {
      x: safePoint.x,
      y: safePoint.y < bounds.cy ? bounds.top - 34 : bounds.bottom + 34
    };
  }

  return {
    x: safePoint.x < bounds.cx ? bounds.left - 34 : bounds.right + 34,
    y: safePoint.y
  };
}

function hashUnit(value, salt) {
  const raw = sin(value * 12.9898 + salt * 78.233) * 43758.5453;
  return raw - floor(raw);
}

function drawNightSky() {
  const base = color(visualConfig.canvasColor);
  const topColor = lerpColor(color(30, 58, 190), base, 0.62);
  const midColor = base;
  const bottomColor = lerpColor(base, color(58, 150, 248), 0.42);

  noFill();
  for (let y = 0; y < height; y += 2) {
    const t = y / height;
    const c = t < 0.58
      ? lerpColor(topColor, midColor, t / 0.58)
      : lerpColor(midColor, bottomColor, (t - 0.58) / 0.42);
    stroke(c);
    line(0, y, width, y);
  }

  blendMode(ADD);
  drawRadialGlow(width * 0.18, height * 0.24, 420, 280, [105, 116, 255], 11);
  drawRadialGlow(width * 0.82, height * 0.7, 520, 380, [86, 175, 255], 12);
  drawRadialGlow(width * 0.5, height * 0.84, 640, 280, [76, 166, 255], 8);
  blendMode(BLEND);

  noStroke();
  for (const dot of skyDots) {
    fill(dot.color[0], dot.color[1], dot.color[2], dot.a);
    circle(dot.x, dot.y, dot.r);
  }
}

function drawRadialGlow(x, y, radiusX, radiusY, rgb, alpha) {
  const ctx = drawingContext;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(radiusX / radiusY, 1);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusY);
  gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha / 255})`);
  gradient.addColorStop(0.62, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha / 720})`);
  gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radiusY, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMeteors(frame) {
  for (const femalePass of [false, true]) {
    blendMode(BLEND);
    for (const meteor of meteors) {
      if (meteor.isFemale !== femalePass) continue;

      const age = frame - meteor.start;
      if (age < 0) continue;

      const color = meteor.isFemale ? FEMALE_COLOR : MALE_COLOR;

      if (age >= meteor.fallDuration) {
        drawSettledStar(meteor, color, frame);
        continue;
      }

      const t = age / meteor.fallDuration;
      const position = getFlyingPosition(
        meteor.x,
        meteor.y,
        meteor.settleX,
        meteor.settleY,
        meteor.fallDuration,
        meteor.drift,
        meteor.arcLift,
        age
      );
      const x = position.x;
      const y = position.y;

      const fadeIn = easeOutCubic(constrain(age / 24, 0, 1));
      const tailFade = constrain((0.96 - t) / 0.26, 0, 1);
      const alpha = (meteor.isFemale ? 235 : 145) * meteor.alphaScale * fadeIn;
      const tailX = x - cos(meteor.angle) * meteor.length * tailFade * visualConfig.tailLength;
      const tailY = y - sin(meteor.angle) * meteor.length * tailFade * visualConfig.tailLength;

      if (tailFade > 0.04) {
        drawTail(tailX, tailY, x, y, color, alpha * tailFade, meteor);
      }
      if (age < 30) {
        drawIgnitionGlow(x, y, color, alpha, meteor, age);
      }
      drawMeteorCore(meteor, x, y, color, alpha, t);
    }
  }
  blendMode(BLEND);
}

function drawSettledStar(meteor, color, frame) {
  const settledAge = frame - meteor.start - meteor.fallDuration;
  const maleSettledScale = map(meteor.alphaScale, 0.1, 0.34, 0.55, 1, true);
  const baseAlpha = meteor.isFemale ? 248 : 62 * visualConfig.whiteStarOpacity;
  const breath = meteor.isFemale
    ? sin(settledAge * 0.026 + meteor.twinkle) * 28
    : sin(settledAge * 0.023 + meteor.twinkle) * 9 * visualConfig.whiteStarOpacity;
  const settleFade = easeOutCubic(constrain(settledAge / 18, 0, 1));
  const targetAlpha = meteor.isFemale
    ? (baseAlpha + breath) * meteor.alphaScale
    : (baseAlpha + breath) * maleSettledScale;
  const flightEndAlpha = (meteor.isFemale ? 235 : 145) * meteor.alphaScale;
  const alpha = lerp(flightEndAlpha, targetAlpha, settleFade);
  const phase = meteor.twinkle + frame * (meteor.isFemale ? 0.016 : 0.012);
  const motionFade = easeOutCubic(constrain(settledAge / 24, 0, 1));
  const microMove = visualConfig.settledMotion * (meteor.isFemale ? 2.4 : 1.5);
  const driftX = sin(frame * 0.018 + meteor.twinkle) * microMove * motionFade;
  const driftY = cos(frame * 0.015 + meteor.twinkle * 1.3) * microMove * 0.7 * motionFade;
  const bounce = getLandingBounce(meteor, settledAge);
  const starReveal = easeOutCubic(constrain(settledAge / 14, 0, 1));

  drawStarHead(
    meteor,
    meteor.settleX + driftX + bounce.x,
    meteor.settleY + driftY + bounce.y,
    color,
    alpha,
    phase,
    lerp(0.52, 1, starReveal)
  );
}

function getLandingBounce(meteor, settledAge) {
  const strength = visualConfig.bounceStrength;
  if (strength <= 0 || settledAge <= 0 || settledAge > 54) {
    return { x: 0, y: 0 };
  }

  const t = constrain(settledAge / 54, 0, 1);
  const decay = pow(1 - t, 2.2);
  const size = getMeteorSize(meteor);
  const amp = strength * size * (meteor.isFemale ? 1.45 : 1.1);
  const wobble = sin(t * PI * 3.4 * meteor.bouncePhase) * decay;
  const hop = abs(sin(t * PI * 2.15 * meteor.bouncePhase)) * decay;

  return {
    x: meteor.bounceSide * wobble * amp * 0.55,
    y: -hop * amp
  };
}

function drawTail(x1, y1, x2, y2, color, alpha, meteor) {
  const steps = meteor.hasSoftTail ? 12 : 8;
  const tailWeight = visualConfig.tailThickness;
  for (let i = 0; i < steps; i += 1) {
    const t1 = i / steps;
    const t2 = (i + 1) / steps;
    const w = map(i, 0, steps - 1, 0.12, meteor.hasSoftTail ? 1.35 : meteor.isFemale ? 1.25 : 0.75);
    const a = map(i, 0, steps - 1, alpha * 0.035, alpha * (meteor.hasSoftTail ? 0.34 : 0.48));
    stroke(color[0], color[1], color[2], a);
    strokeWeight(w * tailWeight);
    line(
      lerp(x1, x2, t1),
      lerp(y1, y2, t1),
      lerp(x1, x2, t2),
      lerp(y1, y2, t2)
    );
  }

  stroke(TRAIL_COLOR[0], TRAIL_COLOR[1], TRAIL_COLOR[2], alpha * (meteor.hasSoftTail ? 0.08 : 0.12));
  strokeWeight((meteor.hasSoftTail ? 0.42 : meteor.isFemale ? 0.5 : 0.32) * tailWeight);
  line(x1, y1, x2, y2);
}

function drawIgnitionGlow(x, y, color, alpha, meteor, age) {
  const t = constrain(age / 30, 0, 1);
  const bloom = sin(t * PI);
  const size = getMeteorSize(meteor);
  noStroke();
  fill(color[0], color[1], color[2], alpha * bloom * (meteor.isFemale ? 0.18 : 0.08));
  circle(x, y, size * (meteor.isFemale ? 8.4 : 5.8) * (0.5 + t));
  fill(255, 246, 185, alpha * bloom * (meteor.isFemale ? 0.32 : 0.1));
  circle(x, y, size * 2.2 * (1 - t * 0.45));
}

function drawMeteorCore(meteor, x, y, color, alpha, progress) {
  const size = getMeteorSize(meteor);
  const coreSize = size * (meteor.isFemale ? 0.78 : 0.62);
  const coreAlpha = alpha * (meteor.isFemale ? 0.42 : 0.34);
  const twinkle = 0.82 + sin(meteor.twinkle + progress * TWO_PI * 1.6) * 0.12;

  noStroke();
  fill(color[0], color[1], color[2], coreAlpha * 0.12);
  circle(x, y, coreSize * 5.4 * twinkle);
  fill(color[0], color[1], color[2], coreAlpha * 0.34);
  circle(x, y, coreSize * 2.2 * twinkle);
  fill(255, 250, 226, coreAlpha * 0.72);
  circle(x, y, coreSize * 0.88 * twinkle);
}

function drawStarHead(meteor, x, y, color, alpha, phase, sizeScale = 1) {
  drawStar(x, y, getMeteorSize(meteor) * sizeScale, color, alpha, meteor.isFemale, phase);
}

function getMeteorSize(meteor) {
  const minScale = min(visualConfig.starMinScale, visualConfig.starMaxScale);
  const maxScale = max(visualConfig.starMinScale, visualConfig.starMaxScale);
  return meteor.size * lerp(minScale, maxScale, meteor.sizeSeed);
}

function drawStar(x, y, size, color, alpha, isFemale, phase = 0) {
  const pulse = 1 + sin(phase) * (isFemale ? 0.08 : 0.06);
  const shapeScale = isFemale ? 1 : 0.9 + (sin(phase * 1.7) + 1) * 0.1;
  const brightnessScale = isFemale ? 1 : 0.82 + (sin(phase * 2.3) + 1) * 0.14;
  const outerRadius = size * (isFemale ? 2.19 : 2.12) * pulse * shapeScale;
  const innerRadius = outerRadius * 0.46;
  const rotation = -HALF_PI + sin(phase * 0.35) * 0.04;
  const visibleAlpha = constrain(alpha * (isFemale ? 1 : 0.72) * brightnessScale, 0, 255);
  const glow = isFemale ? FEMALE_GLOW : MALE_GLOW;

  noStroke();
  if (isFemale && visualConfig.yellowStarGlow > 0) {
    const edgeGlow = visualConfig.yellowStarGlow;
    fill(glow[0], glow[1], glow[2], visibleAlpha * 0.11 * edgeGlow);
    drawFivePointStar(x, y, outerRadius * 1.62, innerRadius * 1.62, rotation);

    fill(glow[0], glow[1], glow[2], visibleAlpha * 0.055 * edgeGlow);
    drawFivePointStar(x, y, outerRadius * (1.9 + edgeGlow * 0.24), innerRadius * (1.9 + edgeGlow * 0.24), rotation);
  } else if (!isFemale && visualConfig.whiteStarGlow > 0) {
    const edgeGlow = visualConfig.whiteStarGlow;
    fill(glow[0], glow[1], glow[2], visibleAlpha * 0.1 * edgeGlow);
    drawFivePointStar(x, y, outerRadius * 1.72, innerRadius * 1.72, rotation);

    fill(glow[0], glow[1], glow[2], visibleAlpha * 0.06 * edgeGlow);
    drawFivePointStar(x, y, outerRadius * (2.1 + edgeGlow * 0.25), innerRadius * (2.1 + edgeGlow * 0.25), rotation);
  }

  if (isFemale) {
    drawGradientFivePointStar(x, y, outerRadius, innerRadius, rotation, visibleAlpha);
  } else {
    fill(color[0], color[1], color[2], visibleAlpha);
    drawFivePointStar(x, y, outerRadius, innerRadius, rotation);
  }

  fill(255, 245, 190, visibleAlpha * (isFemale ? 0.28 : 0.13));
  drawFivePointStar(x - outerRadius * 0.12, y - outerRadius * 0.16, outerRadius * 0.48, innerRadius * 0.48, rotation);
}

function drawGradientFivePointStar(x, y, outerRadius, innerRadius, rotation, alpha) {
  const ctx = drawingContext;
  const a = constrain(alpha, 0, 255) / 255;
  ctx.save();
  ctx.beginPath();

  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (TWO_PI * i) / 10;
    const px = x + cos(angle) * radius;
    const py = y + sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.closePath();
  ctx.clip();

  const gradient = ctx.createLinearGradient(
    x - outerRadius * 0.85,
    y + outerRadius * 0.9,
    x + outerRadius * 0.62,
    y - outerRadius * 0.9
  );
  gradient.addColorStop(0, `rgba(205, 132, 0, ${a})`);
  gradient.addColorStop(0.48, `rgba(255, 209, 38, ${a})`);
  gradient.addColorStop(1, `rgba(255, 248, 176, ${a})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(
    x - outerRadius * 1.08,
    y - outerRadius * 1.08,
    outerRadius * 2.16,
    outerRadius * 2.16
  );
  ctx.restore();
}

function drawFivePointStar(x, y, outerRadius, innerRadius, rotation) {
  beginShape();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = rotation + (TWO_PI * i) / 10;
    vertex(x + cos(angle) * radius, y + sin(angle) * radius);
  }
  endShape(CLOSE);
}

function randomLikeWeight(size, index, scale) {
  const rhythm = 0.72 + ((index * 37) % 11) / 28;
  return constrain(size * 0.2 * scale * rhythm, 0.35, 2.8);
}

function drawTaperedRay(x, y, angle, length, color, alpha, weight) {
  const segments = 5;
  for (let i = 0; i < segments; i += 1) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;
    const inner = length * (0.08 + t1 * 0.92);
    const outer = length * (0.08 + t2 * 0.92);
    stroke(color[0], color[1], color[2], alpha * pow(1 - t1, 1.45));
    strokeWeight(lerp(weight, 0.12, t1));
    line(
      x + cos(angle) * inner,
      y + sin(angle) * inner,
      x + cos(angle) * outer,
      y + sin(angle) * outer
    );
  }

  stroke(color[0], color[1], color[2], alpha * 0.16);
  strokeWeight(0.25);
  line(x, y, x + cos(angle) * length * 1.14, y + sin(angle) * length * 1.14);
}

function getActiveYear(frame) {
  return getActiveSegment(frame).endYear;
}

function getShownCounts(frame) {
  const segment = getActiveSegment(frame);
  return {
    shown: segment.cumulativeTotal,
    shownFemale: segment.cumulativeFemale
  };
}

function getOverlayAlpha(frame) {
  const revealFrame = getOverlayRevealFrame();
  const fadeFrames = max(1, visualConfig.overlayFadeFrames || DEFAULT_OVERLAY_FADE_FRAMES);
  return easeOutCubic(constrain((frame - revealFrame) / fadeFrames, 0, 1));
}

function getOverlayRevealFrame() {
  if (overlayRevealFrame !== null && overlayRevealHeight === height) {
    return overlayRevealFrame;
  }

  const revealY = height * PILE_REVEAL_Y_RATIO;
  let firstRevealFrame = Infinity;

  for (const meteor of meteors) {
    if (meteor.settleY <= revealY) {
      firstRevealFrame = min(firstRevealFrame, ceil(meteor.impactFrame));
    }
  }

  overlayRevealHeight = height;
  overlayRevealFrame = Number.isFinite(firstRevealFrame) ? firstRevealFrame : INTRO_FRAMES;
  return overlayRevealFrame;
}

function drawCenterStatement(frame, overlayAlpha) {
  if (overlayAlpha <= 0) return;

  const counts = getShownCounts(frame);
  const segment = getActiveSegment(frame);
  const textAlpha = 235 * overlayAlpha;
  const [lineOne, lineTwo, lineThree] = getTextBackdropLines(segment, counts);
  const textY = height * 0.36;
  const lineGap = visualConfig.textLineGap;

  noStroke();
  fill(255, 255, 255, textAlpha);
  textAlign(CENTER, CENTER);
  applyCanvasTextStyle();
  textLeading(lineGap);
  drawTextBackdrop([lineOne, lineTwo, lineThree], textAlpha);

  fill(26, 48, 172, textAlpha * 0.55);
  drawTrackedText(lineOne, width / 2 + 2, textY - lineGap + 2);
  drawTrackedText(lineTwo, width / 2 + 2, textY + 2);
  drawTrackedText(lineThree, width / 2 + 2, textY + lineGap + 2);

  fill(255, 255, 255, textAlpha);
  drawTrackedText(lineOne, width / 2, textY - lineGap);
  drawTrackedText(lineTwo, width / 2, textY);

  fill(FEMALE_COLOR[0], FEMALE_COLOR[1], FEMALE_COLOR[2], textAlpha);
  drawTrackedText(lineThree, width / 2, textY + lineGap);
}

function measureTrackedText(line) {
  applyCanvasTextStyle();
  const chars = Array.from(line);
  const tracking = visualConfig.textTracking;
  if (chars.length <= 1) return drawingContext.measureText(line).width;

  const charWidth = chars.reduce((total, char) => total + drawingContext.measureText(char).width, 0);
  return charWidth + tracking * (chars.length - 1);
}

function drawTrackedText(line, x, y) {
  applyCanvasTextStyle();
  const chars = Array.from(line);
  const tracking = visualConfig.textTracking;
  if (chars.length <= 1 || tracking === 0) {
    drawingContext.fillText(line, x, y);
    return;
  }

  let cursor = x - measureTrackedText(line) / 2;
  for (const char of chars) {
    const charW = drawingContext.measureText(char).width;
    drawingContext.fillText(char, cursor + charW / 2, y);
    cursor += charW + tracking;
  }
}

function applyCanvasTextStyle() {
  textFont(TEXT_FONT);
  textSize(visualConfig.textSize);
  drawingContext.font = `${visualConfig.textSize}px ${TEXT_FONT}`;
  drawingContext.textAlign = "center";
  drawingContext.textBaseline = "middle";
}

function drawTextBackdrop(lines, textAlpha) {
  const bounds = getTextBackdropBounds(lines);
  textBackdropBounds = bounds;

  noStroke();
  fill(226, 239, 255, textAlpha * visualConfig.textBoxAlpha);
  rectMode(CENTER);
  rect(bounds.cx, bounds.cy, bounds.w, bounds.h, 18);
  rectMode(CORNER);
}

function drawWatermark(overlayAlpha = 1) {
  if (overlayAlpha <= 0) return;

  drawCenterWatermark(overlayAlpha);
  drawCornerWatermark(overlayAlpha);
}

function drawCenterWatermark(overlayAlpha) {
  const sizeScale = visualConfig.watermarkSize;
  const fontSize = max(6, min(width, height) * 0.008) * sizeScale;
  const lineGap = max(9, min(width, height) * 0.013) * sizeScale;
  drawWatermarkText(width / 2, height / 2, fontSize, lineGap, WATERMARK_CENTER_ALPHA, "center", "middle", overlayAlpha);
}

function drawCornerWatermark(overlayAlpha) {
  const sizeScale = visualConfig.watermarkSize;
  const fontSize = max(5.5, min(width, height) * 0.0065) * sizeScale;
  const lineGap = max(8, min(width, height) * 0.01) * sizeScale;
  drawWatermarkText(width - 30, height - 28, fontSize, lineGap, WATERMARK_CORNER_ALPHA, "right", "bottom", overlayAlpha);
}

function drawWatermarkText(x, y, fontSize, lineGap, alpha, align, baseline, overlayAlpha) {
  const ctx = drawingContext;
  const visibleAlpha = constrain(alpha * visualConfig.watermarkAlpha * overlayAlpha, 0, 255) / 255;

  ctx.save();
  ctx.font = `${fontSize}px ${TEXT_FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = `rgba(${WATERMARK_COLOR[0]}, ${WATERMARK_COLOR[1]}, ${WATERMARK_COLOR[2]}, ${visibleAlpha})`;

  if (baseline === "middle") {
    ctx.fillText(WATERMARK_LINES[0], x, y - lineGap / 2);
    ctx.fillText(WATERMARK_LINES[1], x, y + lineGap / 2);
  } else {
    ctx.fillText(WATERMARK_LINES[0], x, y - lineGap);
    ctx.fillText(WATERMARK_LINES[1], x, y);
  }

  ctx.restore();
}

function getActiveSegment(frame) {
  const age = max(0, frame - INTRO_FRAMES);
  const index = constrain(floor(age / SEGMENT_DURATION), 0, timeSegments.length - 1);
  return timeSegments[index];
}

function getSegmentAge(frame) {
  if (frame < INTRO_FRAMES) return 0;
  const age = frame - INTRO_FRAMES;
  const index = floor(age / SEGMENT_DURATION);
  if (index >= timeSegments.length - 1) return min(age - (timeSegments.length - 1) * SEGMENT_DURATION, SEGMENT_DURATION);
  return age % SEGMENT_DURATION;
}

function setupControls() {
  const panel = document.getElementById("control-panel");
  const panelToggle = document.getElementById("panel-toggle");
  const playButton = document.getElementById("play-button");
  const inputs = document.querySelectorAll("[data-config-key]");

  panelToggle?.addEventListener("click", () => {
    setPanelCollapsed(!panel?.classList.contains("is-collapsed"));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key.toLowerCase() === "p") {
      setPanelHidden(false);
      setPanelCollapsed(false);
    }
  });

  playButton?.addEventListener("click", () => {
    isPlaying = true;
    playbackStartFrame = frameCount;
    setPanelHidden(true);
    playButton.textContent = "重播";
  });

  inputs.forEach((input) => {
    const key = input.dataset.configKey;
    if (!(key in visualConfig)) return;

    visualConfig[key] = getControlValue(input);
    const applyControlValue = () => {
      visualConfig[key] = getControlValue(input);
      syncControlOutputs();

      if (["canvasWidth", "canvasHeight"].includes(key)) {
        updateStageSize();
        buildSky();
        buildMeteors();
      }

      if ([
        "layoutChaos",
        "textBoxHeight",
        "textSize",
        "textTracking",
        "textLineGap"
      ].includes(key)) {
        buildMeteors();
      }
    };

    input.addEventListener("input", applyControlValue);
    input.addEventListener("change", applyControlValue);
  });

  syncControlOutputs();
}

function setPanelCollapsed(collapsed) {
  const panel = document.getElementById("control-panel");
  const panelToggle = document.getElementById("panel-toggle");
  if (!panel || !panelToggle) return;

  panel.classList.remove("is-recording-hidden");
  panel.classList.toggle("is-collapsed", collapsed);
  panelToggle.textContent = collapsed ? "展开" : "收起";
  panelToggle.setAttribute("aria-expanded", String(!collapsed));
}

function setPanelHidden(hidden) {
  const panel = document.getElementById("control-panel");
  if (!panel) return;
  panel.classList.toggle("is-recording-hidden", hidden);
}

function getPlaybackFrame() {
  if (!isPlaying) return 0;
  return frameCount - playbackStartFrame;
}

function getControlValue(input) {
  if (input.type === "color") return input.value;

  const value = Number(input.value);
  if (!Number.isFinite(value)) {
    return visualConfig[input.dataset.configKey];
  }

  return value;
}

function syncControlOutputs() {
  Object.entries(visualConfig).forEach(([key, value]) => {
    const output = document.querySelector(`[data-config-value="${key}"]`);
    if (!output) return;
    output.textContent = typeof value === "number"
      ? (Number.isInteger(value) ? String(value) : value.toFixed(2))
      : value;
  });
}

function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}
