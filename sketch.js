const CANVAS_W = 1080;
const CANVAS_H = 1440;
const INTRO_FRAMES = 70;
const REVEAL_FRAMES = 1850;
const FALL_FRAMES = 150;
const HOLD_FRAMES = 95;
const FADE_FRAMES = 95;
const FINAL_FRAMES = 99999;
const FEMALE_COLOR = [255, 232, 132];
const MALE_COLOR = [204, 210, 218];
const FINAL_MESSAGE = "125年来，990位诺奖获得者中，有67位是女性。";

let meteors = [];
let skyDots = [];
let activeYear = 1901;

function setup() {
  const canvas = createCanvas(CANVAS_W, CANVAS_H);
  canvas.parent("stage");
  pixelDensity(1);
  textFont('PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif');
  randomSeed(20250707);
  noiseSeed(20250707);
  buildSky();
  buildMeteors();
}

function draw() {
  drawNightSky();

  const frame = frameCount;
  activeYear = getActiveYear(frame);

  if (frame < INTRO_FRAMES + REVEAL_FRAMES + FALL_FRAMES + HOLD_FRAMES) {
    drawMeteors(frame);
    drawYearMark(frame);
  } else if (frame < INTRO_FRAMES + REVEAL_FRAMES + FALL_FRAMES + HOLD_FRAMES + FADE_FRAMES) {
    const fade = 1 - (frame - INTRO_FRAMES - REVEAL_FRAMES - FALL_FRAMES - HOLD_FRAMES) / FADE_FRAMES;
    drawMeteors(frame, fade);
    drawYearMark(frame, fade);
  } else {
    drawFinalMessage(frame);
  }
}

function windowResized() {
  const holder = document.getElementById("stage");
  const rect = holder.getBoundingClientRect();
  resizeCanvas(CANVAS_W, CANVAS_H, true);
  holder.style.width = `${rect.width}px`;
  holder.style.height = `${rect.height}px`;
}

function buildSky() {
  skyDots = [];
  for (let i = 0; i < 1200; i += 1) {
    skyDots.push({
      x: random(width),
      y: random(height),
      r: random(0.35, 1.25),
      a: random(18, 88)
    });
  }
}

function buildMeteors() {
  meteors = [];
  let index = 0;

  window.NOBEL_BY_YEAR.forEach((row) => {
    addYearMeteors(row.year, row.female, true, index);
    index += row.female;
    addYearMeteors(row.year, row.male, false, index);
    index += row.male;
  });

  meteors.sort((a, b) => a.start - b.start);
}

function addYearMeteors(year, count, isFemale, startIndex) {
  const progress = (year - window.NOBEL_TOTALS.startYear) /
    (window.NOBEL_TOTALS.endYear - window.NOBEL_TOTALS.startYear);

  for (let i = 0; i < count; i += 1) {
    const lane = (startIndex + i) % 41;
    const localJitter = random(-12, 12);
    const start = INTRO_FRAMES + progress * REVEAL_FRAMES + localJitter + random(0, 18);
    const angle = random(1.05, 1.27);
    const speed = isFemale ? random(12.5, 16.5) : random(10, 14);
    const length = isFemale ? random(145, 245) : random(88, 170);

    meteors.push({
      year,
      isFemale,
      start,
      x: map(lane, 0, 40, -120, width + 120) + random(-44, 44),
      y: random(-260, -40),
      angle,
      speed,
      length,
      size: isFemale ? random(4.6, 7.8) : random(1.8, 3.5),
      life: random(130, 190),
      twinkle: random(TWO_PI)
    });
  }
}

function drawNightSky() {
  background(2, 6, 17);

  for (let y = 0; y < height; y += 4) {
    const t = y / height;
    stroke(5 + 10 * t, 12 + 18 * t, 31 + 36 * t, 68);
    line(0, y, width, y);
  }

  noStroke();
  for (const dot of skyDots) {
    fill(180, 210, 225, dot.a);
    circle(dot.x, dot.y, dot.r);
  }
}

function drawMeteors(frame, globalAlpha = 1) {
  blendMode(ADD);
  for (const meteor of meteors) {
    const age = frame - meteor.start;
    if (age < 0 || age > meteor.life) continue;

    const t = age / meteor.life;
    const x = meteor.x + cos(meteor.angle) * meteor.speed * age * 0.38;
    const y = meteor.y + sin(meteor.angle) * meteor.speed * age;
    if (y < -300 || y > height + 260) continue;

    const fadeIn = constrain(age / 18, 0, 1);
    const fadeOut = constrain((meteor.life - age) / 38, 0, 1);
    const alpha = 255 * fadeIn * fadeOut * globalAlpha;
    const color = meteor.isFemale ? FEMALE_COLOR : MALE_COLOR;
    const tailX = x - cos(meteor.angle) * meteor.length;
    const tailY = y - sin(meteor.angle) * meteor.length;

    drawTail(tailX, tailY, x, y, color, alpha, meteor.isFemale);
    drawStarHead(x, y, meteor.size, color, alpha, meteor.isFemale, meteor.twinkle + t * TWO_PI);
  }
  blendMode(BLEND);
}

function drawTail(x1, y1, x2, y2, color, alpha, isFemale) {
  const steps = isFemale ? 7 : 5;
  for (let i = 0; i < steps; i += 1) {
    const w = map(i, 0, steps - 1, isFemale ? 7 : 4, 0.5);
    const a = map(i, 0, steps - 1, alpha * 0.05, alpha * 0.48);
    stroke(color[0], color[1], color[2], a);
    strokeWeight(w);
    line(
      lerp(x1, x2, i / steps),
      lerp(y1, y2, i / steps),
      x2,
      y2
    );
  }
}

function drawStarHead(x, y, size, color, alpha, isFemale, phase) {
  noStroke();
  fill(color[0], color[1], color[2], alpha);
  circle(x, y, size);

  if (!isFemale) return;

  const glow = size * (8 + sin(phase) * 1.4);
  fill(color[0], color[1], color[2], alpha * 0.12);
  circle(x, y, glow);

  stroke(color[0], color[1], color[2], alpha * 0.9);
  strokeWeight(2);
  const ray = size * 7.2;
  for (let i = 0; i < 8; i += 1) {
    const a = (TWO_PI / 8) * i + phase * 0.05;
    line(x - cos(a) * ray * 0.18, y - sin(a) * ray * 0.18, x + cos(a) * ray, y + sin(a) * ray);
  }
}

function getActiveYear(frame) {
  const t = constrain((frame - INTRO_FRAMES) / REVEAL_FRAMES, 0, 1);
  return floor(lerp(window.NOBEL_TOTALS.startYear, window.NOBEL_TOTALS.endYear, t));
}

function drawYearMark(frame, alpha = 1) {
  const shown = meteors.filter((meteor) => meteor.start <= frame).length;
  const shownFemale = meteors.filter((meteor) => meteor.start <= frame && meteor.isFemale).length;

  noStroke();
  fill(235, 240, 245, 168 * alpha);
  textAlign(LEFT, TOP);
  textSize(30);
  text(String(activeYear), 64, 64);

  textSize(18);
  fill(235, 240, 245, 100 * alpha);
  text(`${shown} / 990`, 64, 108);

  fill(FEMALE_COLOR[0], FEMALE_COLOR[1], FEMALE_COLOR[2], 145 * alpha);
  text(`${shownFemale} 颗亮星`, 64, 138);
}

function drawFinalMessage(frame) {
  const t = constrain((frame - INTRO_FRAMES - REVEAL_FRAMES - FALL_FRAMES - HOLD_FRAMES - FADE_FRAMES) / 70, 0, 1);
  const ease = 1 - pow(1 - t, 3);

  fill(255, 232, 132, 35 * ease);
  noStroke();
  circle(width / 2, height * 0.44, 480 * ease);

  fill(245, 240, 220, 255 * ease);
  textAlign(CENTER, CENTER);
  textSize(42);
  textLeading(64);
  text(FINAL_MESSAGE, width / 2, height * 0.47, width * 0.74);

  fill(215, 222, 232, 135 * ease);
  textSize(18);
  text("1901-2025 | Nobel Prize & Prize in Economic Sciences", width / 2, height * 0.58);
}
