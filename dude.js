// The dude who wanders along the bottom of every page. He walks, idles and
// hops on his own, stands on the footer when it scrolls into view, and wears
// the page's mood (data-mood on <html>). Click him to jump and change to the
// next mood; keys 1 / 2 / 3 pick blue / red / green, like in the games.
// On the home page he steps aside while the running strip is on screen.
// The dude in the header wears the same mood.
// Nothing is stored anywhere.
(() => {
	const root = document.documentElement;
	const MOODS = ["blue", "red", "green"];
	const W = 40, H = 56;            // sprite size in CSS pixels
	const WALK = 70;                 // px/s
	const GRAVITY = 1600, HOP = -420, BIG_HOP = -560;
	const EDGE = 8;

	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	const sprites = {};
	for (const m of MOODS) {
		sprites[m] = {};
		for (const f of ["walk1", "walk2", "jump", "still"]) {
			const i = new Image();
			i.src = `/img/dude/${m}-${f}.png`;
			sprites[m][f] = i.src;
		}
	}

	const el = document.createElement("button");
	el.type = "button";
	el.className = "walker";
	el.setAttribute("aria-label", "Change the dude’s mood");
	el.innerHTML = `<img src="" alt="" width="${W}" height="${H}">`;
	const img = el.firstChild;
	document.body.append(el);

	const mood = () => (MOODS.includes(root.dataset.mood) ? root.dataset.mood : "green");
	const setMood = (m) => { if (MOODS.includes(m)) root.dataset.mood = m; };

	let x = Math.max(EDGE, innerWidth * 0.7), dir = -1;
	let y = 0, vy = 0;               // height above the ground (negative is up) and its speed
	let ground = innerHeight;
	let idle = 0.8, nextIdle = 3 + Math.random() * 4, t = 0, last = 0;
	let hidden = false;

	function groundLine() {
		const footer = document.querySelector("footer");
		const top = footer ? footer.getBoundingClientRect().top : Infinity;
		return Math.min(innerHeight, top);
	}

	function hop(v) {
		if (y < 0) return;
		vy = v;
		y = -0.01;
	}

	function step(dt) {
		t += dt;
		const g = groundLine();
		// The ground moved under him: lifted when it rises, falls when it drops.
		y += ground - g;
		ground = g;
		if (y > 0) { y = 0; vy = 0; }
		if (y < 0 || vy < 0) {
			vy += GRAVITY * dt;
			y += vy * dt;
			if (y >= 0) { y = 0; vy = 0; }
		}
		if (reduced.matches) return;

		if (idle > 0) {
			idle -= dt;
			if (idle <= 0 && Math.random() < 0.4) dir = -dir;
			return;
		}
		x += dir * WALK * dt;
		const max = innerWidth - W - EDGE;
		if (x <= EDGE) { x = EDGE; dir = 1; }
		if (x >= max) { x = max; dir = -1; }
		nextIdle -= dt;
		if (nextIdle <= 0) {
			nextIdle = 3 + Math.random() * 5;
			if (Math.random() < 0.35) hop(HOP); else idle = 0.8 + Math.random() * 2;
		}
	}

	function draw() {
		const set = sprites[mood()];
		const frame = y < 0 ? set.jump : idle > 0 || reduced.matches ? set.still : Math.floor(t * 8) % 2 ? set.walk1 : set.walk2;
		if (img.getAttribute("src") !== frame) img.src = frame;
		el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(ground - H + y)}px, 0)`;
		img.style.transform = dir < 0 ? "scaleX(-1)" : "";
	}

	function loop(now) {
		// A frame's timestamp can be slightly older than performance.now() taken
		// just before requesting it, so never let time run backwards.
		const dt = Math.max(0, Math.min(0.05, (now - last) / 1000 || 0));
		last = now;
		if (!document.hidden && !hidden) { step(dt); draw(); }
		requestAnimationFrame(loop);
	}

	el.addEventListener("click", (e) => {
		const i = MOODS.indexOf(mood());
		setMood(MOODS[(i + 1) % MOODS.length]);
		// A mouse or touch click shouldn't leave a focus box walking around with him.
		if (e.detail > 0) el.blur();
	});

	// Every mood change, from here, the strip or the switcher, gets a little hop.
	// The dude in the header wears the mood too, and gives a little hop.
	const brand = document.querySelector(".brand img");
	function dressBrand(pop) {
		if (!brand) return;
		const src = sprites[mood()].still;
		if (brand.src !== src) brand.src = src;
		if (!pop) return;
		brand.classList.remove("pop");
		void brand.offsetWidth;          // restart the animation
		brand.classList.add("pop");
	}
	dressBrand(false);

	let shown = mood();
	new MutationObserver(() => {
		if (mood() === shown) return;
		shown = mood();
		dressBrand(true);
		idle = 0;
		hop(BIG_HOP);
		draw();
	}).observe(root, { attributes: true, attributeFilter: ["data-mood"] });

	document.addEventListener("keydown", (e) => {
		if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea, select, [contenteditable]")) return;
		const i = ["1", "2", "3"].indexOf(e.key);
		if (i >= 0) setMood(MOODS[i]);
	});

	addEventListener("resize", () => { x = Math.min(x, innerWidth - W - EDGE); });

	const strip = document.querySelector(".strip");
	if (strip) {
		new IntersectionObserver(([entry]) => {
			hidden = entry.isIntersecting;
			el.classList.toggle("away", hidden);
			if (!hidden) { ground = groundLine(); y = -200; vy = 0; }   // drops in when the strip leaves
		}).observe(strip);
	}

	if (reduced.matches) x = innerWidth - W - 24;
	draw();
	requestAnimationFrame(loop);
})();
