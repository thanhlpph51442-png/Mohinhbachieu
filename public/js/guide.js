// Guide Page Interactive Simulator & Pipeline Walkthrough

document.addEventListener('DOMContentLoaded', () => {
  initOverlapSimulator();
  initOrbitCanvas();
  initStepAccordion();
});

// 1. Interactive Overlap Simulator
function initOverlapSimulator() {
  const slider = document.getElementById('overlap-slider');
  const valDisplay = document.getElementById('overlap-val-display');
  const countDisplay = document.getElementById('overlap-count-display');
  const statusDisplay = document.getElementById('overlap-status-display');
  const visualOverlay = document.getElementById('overlap-visual-intersection');

  if (!slider) return;

  function updateSimulation() {
    const overlap = parseInt(slider.value, 10);
    valDisplay.textContent = `${overlap}%`;

    // Calculate angle step and camera counts for 3 tiers
    // Overlap = 1 - (step / fov) -> step = fov * (1 - overlap)
    // Assuming effective FOV = 60 degrees
    const stepAngle = Math.max(8, Math.round(60 * (1 - (overlap / 100))));
    const photosPerRing = Math.round(360 / stepAngle);
    const totalPhotos = photosPerRing * 3 + 8; // 3 tiers + top angles

    countDisplay.textContent = `${totalPhotos} bức ảnh (khoảng ${photosPerRing} ảnh / vòng tròn)`;

    if (visualOverlay) {
      visualOverlay.style.width = `${overlap}%`;
    }

    if (overlap < 60) {
      statusDisplay.innerHTML = `<span style="color: #ef4444; font-weight: 700;">⚠️ Độ phủ yếu (${overlap}%):</span> Rủi ro xuất hiện lỗ thủng (holes) hoặc mất chi tiết hoa văn khi phần mềm tính toán đám mây điểm.`;
    } else if (overlap <= 80) {
      statusDisplay.innerHTML = `<span style="color: #4ade80; font-weight: 700;">✓ Độ phủ Lý Tưởng (${overlap}%):</span> Đạt chuẩn bảo tàng số; phần mềm nhận diện tối thiểu 3-5 điểm trùng lặp trên mỗi milimet bề mặt hiện vật.`;
    } else {
      statusDisplay.innerHTML = `<span style="color: #f59e0b; font-weight: 700;">ℹ️ Độ phủ Rất Cao (${overlap}%):</span> Cho độ chính xác cực cao nhưng sẽ kéo dài thời gian xử lý và tạo nhiều đa giác thừa nếu không tối ưu.`;
    }
  }

  slider.addEventListener('input', updateSimulation);
  updateSimulation();
}

// 2. Interactive Orbit Canvas Simulator
function initOrbitCanvas() {
  const canvas = document.getElementById('orbit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let angle = 0;
  const numCams = 16;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 120;

    // Draw Orbit track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Central Artifact
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#3a2a1d';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f5e6c8';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HIỆN VẬT', cx, cy - 6);
    ctx.fillStyle = '#c5a059';
    ctx.font = '9px system-ui';
    ctx.fillText('(Bàn xoay)', cx, cy + 8);

    // Draw Camera Positions
    for (let i = 0; i < numCams; i++) {
      const a = (i / numCams) * Math.PI * 2 + angle;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;

      // Draw light ray towards center
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = (i === 0) ? 'rgba(245, 158, 11, 0.5)' : 'rgba(212, 175, 55, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw camera icon dot
      ctx.beginPath();
      ctx.arc(x, y, (i === 0) ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = (i === 0) ? '#f59e0b' : '#1c1612';
      ctx.fill();
      ctx.strokeStyle = (i === 0) ? '#fff' : '#c5a059';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    angle += 0.005;
    requestAnimationFrame(draw);
  }

  draw();
}

// 3. Step Accordion
function initStepAccordion() {
  const stepCards = document.querySelectorAll('.pipeline-step-card');
  stepCards.forEach(card => {
    const header = card.querySelector('.step-card-header');
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = card.classList.contains('active');
        stepCards.forEach(c => c.classList.remove('active'));
        if (!isOpen) {
          card.classList.add('active');
        }
      });
    }
  });
}

