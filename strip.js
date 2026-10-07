// The running strip on the home page: the dude runs on his own over the
// game's own tiles, tap (or Space while the strip has focus) to jump, and the
// mood buttons (or keys 1 / 2 / 3, handled by dude.js) change his mood. The
// ground and the page accent follow his mood. Nothing is stored anywhere.
(() => {
	const canvas = document.querySelector(".strip");
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	const buttons = [...document.querySelectorAll(".mood-btn")];
	const MOODS = ["blue", "red", "green"];

	const TILE = 32;          // game pixels
	const VIEW_H = 130;       // game pixels shown vertically
	const GROUND_Y = 96;      // top of the ground in game pixels
	const SPEED = 90;         // px/s, a calm version of the dude's run
	const JUMP_V = -330;
	const GRAVITY = 980;
	const RIPPLE = 0.035;     // seconds per column for the mood ripple

	const reduced = matchMedia("(prefers-reduced-motion: reduce)");

	const load = (src) => { const i = new Image(); i.onload = () => draw(); i.src = src; return i; };
	const img = { hills: load("img/tiles/hills.png"), cloud: load("img/tiles/cloud.png"), tiles: {}, dude: {} };
	for (const m of MOODS) {
		img.tiles[m] = load(`img/tiles/${m}.png`);
		img.dude[m] = { walk1: load(`img/dude/${m}-walk1.png`), walk2: load(`img/dude/${m}-walk2.png`), jump: load(`img/dude/${m}-jump.png`) };
	}

	let mood = document.documentElement.dataset.mood || "green";
	let scale = 2, viewW = 600;
	let scroll = 0;           // distance run, game px
	let cols = [];            // ground columns: { mood, at } where at = time the colour lands
	let firstCol = 0;         // index of cols[0] in world columns
	let y = 0, vy = 0;        // dude height above ground (negative is up)
	let t = 0, last = 0, running = false, visible = true;
	const clouds = [{ x: 60, y: 14 }, { x: 330, y: 30 }, { x: 610, y: 8 }, { x: 900, y: 24 }];

	function resize() {
		const r = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.round(r.width * dpr);
		canvas.height = Math.round(r.height * dpr);
		scale = canvas.height / VIEW_H;
		viewW = canvas.width / scale;
		ctx.imageSmoothingEnabled = false;
		draw();
	}

	function dudeX() { return Math.round(Math.min(viewW * 0.22, 220)); }

	function column(i) {
		while (firstCol + cols.length <= i) cols.push({ mood, prev: mood, at: 0 });
		return cols[i - firstCol];
	}

	function setMood(next) {
		if (!MOODS.includes(next) || next === mood) return;
		mood = next;
		if (document.documentElement.dataset.mood !== next) document.documentElement.dataset.mood = next;
		for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.mood === next));
		// Recolour the ground outward from under the dude.
		const under = Math.floor((scroll + dudeX() + 20) / TILE);
		const end = Math.floor((scroll + viewW) / TILE) + 1;
		const start = Math.floor(scroll / TILE);
		for (let i = start; i <= end; i++) {
			column(i).mood = next;
			column(i).at = t + Math.abs(i - under) * RIPPLE;
		}
		kick();
	}

	function jump() {
		if (y < 0) return;
		vy = JUMP_V;
		y = -0.01;
		kick();
	}

	function step(dt) {
		t += dt;
		if (!reduced.matches) scroll += SPEED * dt;
		if (y < 0 || vy < 0) {
			vy += GRAVITY * dt;
			y += vy * dt;
			if (y >= 0) { y = 0; vy = 0; }
		}
		// Forget columns that scrolled off the left.
		const first = Math.floor(scroll / TILE);
		while (firstCol < first - 1) { cols.shift(); firstCol++; }
	}

	function draw() {
		const W = viewW;
		ctx.setTransform(scale, 0, 0, scale, 0, 0);
		ctx.fillStyle = "#d0f4f7";
		ctx.fillRect(0, 0, W, VIEW_H);

		// Hills: the game's backdrop, scrolling slower than the ground.
		const h = img.hills;
		if (h.complete && h.naturalWidth) {
			const sy = 150, sh = 330, dh = GROUND_Y + 34, dw = 1024 * (dh / sh);
			let x = -((scroll * 0.3) % dw);
			for (; x < W; x += dw) ctx.drawImage(h, 0, sy, 1024, sh, Math.floor(x), 0, Math.ceil(dw) + 1, dh);
		}
		if (img.cloud.complete) {
			for (const c of clouds) {
				const span = W + 80;
				const x = ((c.x - scroll * 0.12) % span + span) % span - 70;
				ctx.drawImage(img.cloud, Math.round(x), c.y);
			}
		}

		// Ground: each column wears the colour it had until its ripple lands.
		const start = Math.floor(scroll / TILE);
		const end = Math.floor((scroll + W) / TILE) + 1;
		for (let i = start; i <= end; i++) {
			const col = column(i);
			const shown = t >= col.at ? col.mood : (col.prev || col.mood);
			if (t >= col.at) col.prev = col.mood;
			const tile = img.tiles[shown];
			if (!tile.complete) continue;
			const sx = (i % 2) * TILE;           // face tile, then plain
			const x = Math.round(i * TILE - scroll);
			const pop = t < col.at + 0.12 && t >= col.at ? -3 : 0;
			ctx.drawImage(tile, sx, 0, TILE, TILE, x, GROUND_Y + pop, TILE, TILE);
			ctx.drawImage(tile, (sx + TILE) % (2 * TILE), 0, TILE, TILE, x, GROUND_Y + TILE, TILE, TILE);
		}

		// The dude.
		const set = img.dude[mood];
		const frame = y < 0 ? set.jump : (reduced.matches || Math.floor(t * 8) % 2 ? set.walk1 : set.walk2);
		if (frame.complete) ctx.drawImage(frame, dudeX(), Math.round(GROUND_Y - 56 + 2 + y));
	}

	function loop(now) {
		// A frame's timestamp can be slightly older than performance.now() taken
		// just before requesting it, so never let time run backwards.
		const dt = Math.max(0, Math.min(0.05, (now - last) / 1000 || 0));
		last = now;
		step(dt);
		draw();
		const settling = y < 0 || cols.some((c) => t < c.at + 0.15);
		if (visible && (!reduced.matches || settling)) requestAnimationFrame(loop);
		else running = false;
	}

	function kick() {
		if (running || !visible) return;
		running = true;
		last = performance.now();
		requestAnimationFrame(loop);
	}

	// The click focuses the strip the normal way (so Space jumps next), which shows
	// no outline; only Tab focus does.
	canvas.addEventListener("pointerdown", jump);
	canvas.addEventListener("keydown", (e) => {
		if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); jump(); }
	});
	for (const b of buttons) b.addEventListener("click", () => setMood(b.dataset.mood));
// Mood changes made elsewhere (keys 1 / 2 / 3, clicking the walking dude) land here.
	new MutationObserver(() => setMood(document.documentElement.dataset.mood))
		.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood"] });

	new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); }).observe(canvas);
	document.addEventListener("visibilitychange", () => { visible = !document.hidden; kick(); });
	reduced.addEventListener("change", kick);
	new ResizeObserver(resize).observe(canvas);
	addEventListener("load", () => { draw(); kick(); });
	resize();
	kick();
})();
