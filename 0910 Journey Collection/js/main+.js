const STADIA_KEY = 'a31838ed-3a9d-453e-8eea-1dca4d8ffa6f';
const map = L.map('map').setView([34.0, 113.5], 4);
L.tileLayer(`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${STADIA_KEY}`, {
  maxZoom: 20,
  attribution: '&copy; Stadia Maps & OpenMapTiles & OpenStreetMap'
}).addTo(map);

let centerLatLng = [34.0, 113.5];
const layerGroup = L.layerGroup().addTo(map);

map.on('click', e => {
  centerLatLng = [e.latlng.lat, e.latlng.lng];
  updateMapping();
});

// 计算两点距离平方
function getDistanceSq(lat1, lng1, lat2, lng2) {
  const dLat = lat1 - lat2, dLng = lng1 - lng2;
  return dLat * dLat + dLng * dLng;
}

// 寻找最近城市
function findNearestCity(targetLat, targetLng) {
  let nearest = null, minDist = Infinity;
  for (let i = 0; i < CHINA_CITIES.length; i++) {
    const [name, lat, lng] = CHINA_CITIES[i];
    const dist = getDistanceSq(targetLat, targetLng, lat, lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = { name, coords: [lat, lng] };
    }
  }
  return nearest;
}

// 【补齐缺失的关键算法】：Douglas-Peucker 骨架提纯简化
function simplifyPoints(points, tolerance) {
  if (points.length <= 2) return points;
  const sqTol = tolerance * tolerance;

  function getSqDist(p, p1, p2) {
    let x = p1[0], y = p1[1], dx = p2[0] - x, dy = p2[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = p2[0]; y = p2[1]; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p[0] - x; dy = p[1] - y;
    return dx * dx + dy * dy;
  }

  function step(first, last, res) {
    let maxDist = sqTol, index = -1;
    for (let i = first + 1; i < last; i++) {
      const dist = getSqDist(points[i], points[first], points[last]);
      if (dist > maxDist) { index = i; maxDist = dist; }
    }
    if (maxDist > sqTol) {
      if (index - first > 1) step(first, index, res);
      res.push(points[index]);
      if (last - index > 1) step(index, last, res);
    }
  }

  const res = [points[0]];
  step(0, points.length - 1, res);
  res.push(points[points.length - 1]);
  return res;
}

let currentSentenceRoutes = [];

// 1. 批量加载整行字的骨架矢量
async function renderSentenceOnMap() {
  const charInput = document.getElementById('charInput');
  const text = charInput ? charInput.value.trim() : '大';
  if (!text) return;

  currentSentenceRoutes = [];
  const chars = Array.from(text);
  const svgNS = "http://www.w3.org/2000/svg";

  try {
    const promises = chars.map(async char => {
      const res = await fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`);
      if (!res.ok) return { char, paths: [] };
      const data = await res.json();
      const medians = data.medians || [];
      const paths = medians.map(pts => {
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' '));
        return path;
      });
      return { char, paths };
    });

    window.loadedSentence = await Promise.all(promises);
    updateMapping();
  } catch (err) {
    alert('批量加载字形失败: ' + err.message);
  }
}

// 2. 核心排版与地理批量吸附
function updateMapping() {
  if (!window.loadedSentence || !window.loadedSentence.length) return;

  layerGroup.clearLayers();

  const spanEl = document.getElementById('spanRange');
  const span = spanEl ? parseFloat(spanEl.value) : 5;

  const tolEl = document.getElementById('toleranceRange');
  const tolerance = tolEl ? parseFloat(tolEl.value) : 25;

  // 防御性读取排版方向：若没有该下拉框默认横排
  const layoutDirEl = document.getElementById('layoutDir');
  const layoutDir = layoutDirEl ? layoutDirEl.value : 'horizontal';

  const [cLat, cLng] = centerLatLng;
  const latCorrection = Math.cos(cLat * Math.PI / 180);

  const N = window.loadedSentence.length;
  const GAP_RATIO = 1.05;
  const allStrokesSummary = [];
  currentSentenceRoutes = [];

  window.loadedSentence.forEach((item, charIdx) => {
    if (!item.paths.length) return;

    const offsetIndex = charIdx - (N - 1) / 2;
    let charLat = cLat;
    let charLng = cLng;

    if (layoutDir === 'horizontal') {
      charLng = cLng + offsetIndex * (span * GAP_RATIO);
    } else {
      charLat = cLat - offsetIndex * ((span * GAP_RATIO) / latCorrection);
    }

    // 绘制字框外边界辅助框
    const hLng = span / 2, hLat = (span / 2) / latCorrection;
    L.rectangle([[charLat - hLat, charLng - hLng], [charLat + hLat, charLng + hLng]], {
      color: '#0066ff', weight: 1, dashArray: '2, 4', fill: false, opacity: 0.4
    }).addTo(layerGroup);

    const charStrokesData = [];

    item.paths.forEach((path, strokeIdx) => {
      const totalLen = path.getTotalLength();
      if (!totalLen) return;

      const densePts = [];
      for (let i = 0; i <= 35; i++) {
        const pt = path.getPointAtLength((i / 35) * totalLen);
        densePts.push([pt.x, pt.y]);
      }
      const simplified = simplifyPoints(densePts, tolerance);

      const matchedCities = [];

      simplified.forEach(pt => {
        const u = (pt[0] - 512) / 1024;
        const v = (pt[1] - 512) / 1024;
        const lat = charLat + (v * span) / latCorrection;
        const lng = charLng + u * span;

        const city = findNearestCity(lat, lng);
        if (city && (!matchedCities.length || matchedCities[matchedCities.length - 1].name !== city.name)) {
          matchedCities.push(city);
        }
      });

      if (matchedCities.length >= 2) {
        L.polyline(matchedCities.map(c => c.coords), {
          color: '#0055ff', weight: 3.5, opacity: 0.85, lineCap: 'round', lineJoin: 'round'
        }).addTo(layerGroup);

        matchedCities.forEach(city => {
          L.circleMarker(city.coords, { radius: 4, color: '#0033aa', fillColor: '#fff', fillOpacity: 1, weight: 1.5 })
            .addTo(layerGroup)
            .bindTooltip(`${city.name} (${item.char})`, { direction: 'top', offset: [0, -5] });
        });

        charStrokesData.push({
          strokeNum: strokeIdx + 1,
          cities: matchedCities.map(c => ({ name: c.name, coords: c.coords }))
        });
      }
    });

    if (charStrokesData.length) {
      currentSentenceRoutes.push({
        char: item.char,
        strokes: charStrokesData
      });
      allStrokesSummary.push(`<b>「${item.char}」</b>: 生成 ${charStrokesData.length} 条笔画`);
    }
  });

  const listEl = document.getElementById('routeList');
  if (listEl) {
    listEl.innerHTML = allStrokesSummary.join('<br>') || '<i>未生成有效轨迹</i>';
  }
}

// 3. 一键导出整句轨迹
function exportToRoutesJson() {
  if (!currentSentenceRoutes || !currentSentenceRoutes.length) {
    alert('当前没有可导出的多字轨迹！');
    return;
  }

  const fileContent = `const SAVED_ROUTES = ${JSON.stringify(currentSentenceRoutes, null, 2)};\n`;

  navigator.clipboard.writeText(fileContent).then(() => {
    alert(`全句共 ${currentSentenceRoutes.length} 个汉字已打包并复制到剪贴板！\n直接打开 routes.js 粘贴覆盖即可。`);
  }).catch(() => {
    const blob = new Blob([fileContent], { type: 'text/javascript' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'routes.js';
    a.click();
  });
}

window.onload = renderSentenceOnMap;