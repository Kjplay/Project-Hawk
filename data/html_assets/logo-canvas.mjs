export function render(element, rgbColor) {
	const width = element.width;
	const height = element.height;
	const ctx = element.getContext("2d");
	ctx.save();
	ctx.fillStyle = rgbColor;
	ctx.strokeStyle = rgbColor;
	ctx.lineWidth = width * 0.03;
	ctx.translate(width * 0.5, height * 0.5);
	ctx.rotate((Math.PI / 180) * 45);
	ctx.translate(width * -0.5, height * -0.5);
	ctx.save();
	ctx.shadowColor = "#1a1a1a";
	ctx.shadowBlur = width * 0.03;
	ctx.clearRect(0, 0, width, height);
	let rx = width / Math.sqrt(2);
	let ry = height / Math.sqrt(2);
	ctx.fillRect((width - rx) / 2, (height - ry) / 2, rx, ry);
	ctx.clearRect(
		(width - rx) / 2 + width * 0.05,
		(height - ry) / 2 + height * 0.05,
		rx - width * 0.1,
		ry - height * 0.1
	);
	ctx.beginPath();
	ctx.moveTo(
		(width - rx) / 2 + width * 0.07,
		(height - ry) / 2 + height * 0.07
	); //5
	ctx.lineTo(
		(width - rx) / 2 + width * 0.07 + (rx - width * 0.14),
		(height - ry) / 2 + height * 0.07
	); //1
	ctx.lineTo(
		(width - rx) / 2 + width * 0.07 + (rx - width * 0.14),
		(height - ry) / 2 + height * 0.07 + (ry - height * 0.14)
	); //2
	ctx.lineTo(
		(width - rx) / 2 + width * 0.07 + (rx - width * 0.14) / 2,
		(height - ry) / 2 + height * 0.07 + (ry - height * 0.14)
	); //3
	ctx.lineTo(
		(width - rx) / 2 + width * 0.07 + (rx - width * 0.14),
		(height - ry) / 2 + height * 0.07
	); //1
	ctx.lineTo(
		(width - rx) / 2 + width * 0.07,
		(height - ry) / 2 + height * 0.07 + (ry - height * 0.14) / 2
	); //4
	ctx.lineTo(
		(width - rx) / 2 + width * 0.07,
		(height - ry) / 2 + height * 0.07
	); //5
	ctx.fill();
	ctx.closePath();
	ctx.restore();
	ctx.save();
	ctx.globalCompositeOperation = "destination-over";
	ctx.beginPath();
	ctx.arc(
		width * 0.45,
		height * 0.41,
		width * 0.12,
		(Math.PI / 180) * 0,
		(Math.PI / 180) * 360,
		true
	);
	ctx.stroke();
	ctx.closePath();
	ctx.beginPath();
	ctx.arc(
		width * 0.45,
		height * 0.41,
		width * 0.07,
		(Math.PI / 180) * 0,
		(Math.PI / 180) * 360,
		true
	);
	ctx.fill();
	ctx.closePath();
	ctx.restore();
	ctx.restore();
}
export function bind(...args) {
	window.requestAnimationFrame(function() {
		render(...args);
	});
	window.addEventListener("resize", function() {
		window.requestAnimationFrame(function() {
			render(...args);
		});
	});
}
