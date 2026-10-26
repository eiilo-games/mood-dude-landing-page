// Screenshot viewer. Every link in a .shots figure opens its picture full
// screen, in a carousel of that figure's pictures: swipe, the arrow buttons
// or the arrow keys move between them; Esc, the close button or a tap
// beside the picture closes it. Without JavaScript the links just open the
// image. The swipe is the browser's own scroll snapping, so it feels native
// on phones. Nothing is stored anywhere.
(() => {
	const groups = [...document.querySelectorAll(".shots")]
		.map((fig) => [...fig.querySelectorAll("a[href]")])
		.filter((links) => links.length);
	if (!groups.length || !window.HTMLDialogElement) return;

	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	const icon = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

	const box = document.createElement("dialog");
	box.className = "lightbox";
	box.innerHTML = `
		<div class="lb-track" tabindex="-1"></div>
		<button class="lb-btn lb-close" type="button" aria-label="Close">${icon("M6 6l12 12M18 6L6 18")}</button>
		<button class="lb-btn lb-prev" type="button" aria-label="Previous picture">${icon("M15 5l-7 7 7 7")}</button>
		<button class="lb-btn lb-next" type="button" aria-label="Next picture">${icon("M9 5l7 7-7 7")}</button>
		<p class="lb-bar"><span class="lb-count" aria-live="polite"></span> <span class="lb-caption"></span></p>`;
	document.body.append(box);
	const track = box.querySelector(".lb-track");
	const prev = box.querySelector(".lb-prev");
	const next = box.querySelector(".lb-next");
	const count = box.querySelector(".lb-count");
	const caption = box.querySelector(".lb-caption");

	let links = [], index = 0, opener = null;

	function show(i) {
		index = i;
		count.textContent = `${i + 1} / ${links.length}`;
		caption.textContent = links[i].querySelector("img")?.alt || "";
		prev.disabled = i === 0;
		next.disabled = i === links.length - 1;
		if (box.open && !box.contains(document.activeElement)) track.focus({ preventScroll: true });
	}

	function go(i, smooth = true) {
		i = Math.max(0, Math.min(links.length - 1, i));
		track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduced.matches ? "smooth" : "instant" });
		show(i);
	}

	function open(group, i, from) {
		links = group;
		opener = from;
		track.replaceChildren(...group.map((a) => {
			const slide = document.createElement("figure");
			slide.className = "lb-slide";
			const img = document.createElement("img");
			const thumb = a.querySelector("img");
			img.src = a.href;
			img.alt = thumb?.alt || "";
			if (thumb) { img.width = thumb.width; img.height = thumb.height; }
			slide.append(img);
			return slide;
		}));
		box.setAttribute("aria-label", galleryTitle(group[0]));
		box.classList.toggle("single", group.length === 1);
		box.showModal();
		document.documentElement.classList.add("lb-open");
		go(i, false);
		track.focus({ preventScroll: true });
	}

	// "Mood Dude: Adventures screenshots", from the game card's heading.
	function galleryTitle(link) {
		const h = link.closest(".game")?.querySelector("h3");
		return h ? `${h.textContent.trim()} screenshots` : "Screenshots";
	}

	for (const group of groups) {
		group.forEach((a, i) => a.addEventListener("click", (e) => {
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			e.preventDefault();
			open(group, i, a);
		}));
	}

	prev.addEventListener("click", () => go(index - 1));
	next.addEventListener("click", () => go(index + 1));
	box.querySelector(".lb-close").addEventListener("click", () => box.close());

	// A tap on the dark area around the picture closes, a tap on it doesn't.
	track.addEventListener("click", (e) => { if (e.target.tagName !== "IMG") box.close(); });

	// Swiping moves the track; keep the counter in step with what is shown.
	let settle = 0;
	track.addEventListener("scroll", () => {
		cancelAnimationFrame(settle);
		settle = requestAnimationFrame(() => {
			const i = Math.round(track.scrollLeft / track.clientWidth);
			if (i !== index && links[i]) show(i);
		});
	});

	// Caught on window before anything else, so the page's own keys (1 / 2 / 3
	// change the dude's mood) stay out while the viewer is open, even when
	// focus has dropped to the body (a button disables itself at either end).
	addEventListener("keydown", (e) => {
		if (!box.open) return;
		e.stopPropagation();
		const to = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: links.length - 1 }[e.key];
		if (to === undefined) return;
		e.preventDefault();
		go(to);
	}, true);

	// Rotating a phone changes the slide width: stay on the same picture.
	addEventListener("resize", () => { if (box.open) go(index, false); });

	box.addEventListener("close", () => {
		document.documentElement.classList.remove("lb-open");
		track.replaceChildren();
		opener?.focus({ preventScroll: true });
	});
})();
