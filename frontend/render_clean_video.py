import os
import sys
import math
import time

os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import numpy as np
from PIL import Image
import cv2
import imageio.v2 as imageio

print("Rendering pure, clean cinematic hero video (no code panels)...")

W, H = 1920, 1080
FPS = 24
DURATION = 10
TOTAL_FRAMES = FPS * DURATION  # 240 frames

out_landing = r'c:\Users\Admin\Desktop\all projects\AI BASED CODE CHANGED REGRESSION TESTING\AI_CODE_CHANGE_REGRESSION\src\assets\landing\hero-cinematic.mp4'
out_public = r'c:\Users\Admin\Desktop\all projects\AI BASED CODE CHANGED REGRESSION TESTING\AI_CODE_CHANGE_REGRESSION\public\hero-cinematic.mp4'
src_bg_path = r'c:\Users\Admin\Desktop\all projects\AI BASED CODE CHANGED REGRESSION TESTING\AI_CODE_CHANGE_REGRESSION\src\assets\landing\ai-core-frame.webp'

# Base artwork: 644 x 360 scaled to 1920 x 1080
base_img = Image.open(src_bg_path).convert('RGB')
base_cv = cv2.resize(np.array(base_img), (W, H), interpolation=cv2.INTER_LANCZOS4)

# Scale constants from 644x360 reference
SCALE_X = W / 644.0
SCALE_Y = H / 360.0

LENS_X = int(273 * SCALE_X)
LENS_Y = int(168 * SCALE_Y)
SPHERE_X = int(248 * SCALE_X)
SPHERE_Y = int(165 * SCALE_Y)
SPHERE_R = int(58 * min(SCALE_X, SCALE_Y))

# BGR colors
CYAN = (255, 230, 143)
GOLD = (120, 201, 255)
RED = (106, 106, 255)
BLUE = (255, 196, 124)
WHITE = (255, 255, 255)

NODES = {
    'payment': (int(450 * SCALE_X), int(80 * SCALE_Y)),
    'userDb': (int(520 * SCALE_X), int(82 * SCALE_Y)),
    'inventory': (int(545 * SCALE_X), int(229 * SCALE_Y)),
    'docMid': (int(588 * SCALE_X), int(157 * SCALE_Y)),
    'docBottom': (int(588 * SCALE_X), int(210 * SCALE_Y)),
    'docTop': (int(582 * SCALE_X), int(93 * SCALE_Y)),
}

def ease_in_out_sine(x):
    return -(math.cos(math.pi * x) - 1.0) / 2.0

def dolly_at(t):
    p = (t % DURATION) / DURATION
    return ease_in_out_sine(p / 0.5) if p < 0.5 else ease_in_out_sine((1.0 - p) / 0.5)

# Seeded floating particles
np.random.seed(42)
NUM_FAR = 90
far_particles = []
for _ in range(NUM_FAR):
    far_particles.append({
        'x': np.random.uniform(0, W),
        'y': np.random.uniform(0, H),
        'r': np.random.uniform(1.2, 3.0),
        'ax': np.random.uniform(10, 25),
        'ay': np.random.uniform(8, 20),
        'm': np.random.choice([1, 2]),
        'phase': np.random.uniform(0, 2 * math.pi),
        'tw': np.random.choice([1, 2, 3]),
        'color': CYAN if np.random.rand() < 0.5 else (GOLD if np.random.rand() < 0.75 else WHITE)
    })

NUM_NEAR = 18
near_particles = []
for _ in range(NUM_NEAR):
    near_particles.append({
        'x': np.random.uniform(0, W),
        'y': np.random.uniform(0, H),
        'r': np.random.uniform(7.0, 16.0),
        'ax': np.random.uniform(15, 35),
        'ay': np.random.uniform(10, 25),
        'phase': np.random.uniform(0, 2 * math.pi),
        'color': CYAN if np.random.rand() < 0.6 else GOLD
    })

# Energy beams along core corridors
NUM_STREAKS = 28
streaks = []
for i in range(NUM_STREAKS):
    k = i / max(1, NUM_STREAKS - 1)
    end_x = int((398 + np.random.uniform(0, 46)) * SCALE_X)
    end_y = int((96 + k * 156 + np.random.uniform(-10, 10)) * SCALE_Y)
    streaks.append({
        'end': (end_x, end_y),
        'speed': (3.5 + np.random.randint(0, 4)) / DURATION,
        'phase': np.random.uniform(0, 1),
        'len': np.random.uniform(0.12, 0.25),
        'width': int(np.random.uniform(2, 4)),
        'color': GOLD if np.random.rand() < 0.45 else (CYAN if np.random.rand() < 0.85 else WHITE),
        'alpha': np.random.uniform(0.35, 0.7)
    })

# Setup video writer directly to public destination
writer = imageio.get_writer(
    out_public,
    fps=FPS,
    codec='libx264',
    format='FFMPEG',
    pixelformat='yuv420p',
    macro_block_size=None,
    output_params=['-crf', '15', '-preset', 'fast']
)

print(f"Rendering {TOTAL_FRAMES} frames into {out_public}...")
t0 = time.time()

for frame_idx in range(TOTAL_FRAMES):
    t = frame_idx / FPS
    dolly_progress = dolly_at(t)
    zoom = 1.0 + 0.08 * dolly_progress

    # Smooth camera dolly
    if zoom > 1.0001:
        new_w = int(W / zoom)
        new_h = int(H / zoom)
        x1 = max(0, min(W - new_w, int(LENS_X - (LENS_X / W) * new_w)))
        y1 = max(0, min(H - new_h, int(LENS_Y - (LENS_Y / H) * new_h)))
        cropped = base_cv[y1:y1+new_h, x1:x1+new_w]
        frame = cv2.resize(cropped, (W, H), interpolation=cv2.INTER_LINEAR)
    else:
        frame = base_cv.copy()

    glow_layer = np.zeros_like(frame, dtype=np.uint8)

    # 1. Inner rotating mechanical rings in AI core
    core_x = int(LENS_X + (SPHERE_X - LENS_X) * zoom)
    core_y = int(LENS_Y + (SPHERE_Y - LENS_Y) * zoom)
    core_r = int(SPHERE_R * zoom)

    ring_angles = [
        (t / DURATION) * 360 * 2 - 20,
        -(t / DURATION) * 360 * 1.5,
        (t / DURATION) * 360 * 1 + 30
    ]
    ring_radii = [
        (int(core_r * 0.90), int(core_r * 0.40)),
        (int(core_r * 0.72), int(core_r * 0.72)),
        (int(core_r * 0.55), int(core_r * 0.85))
    ]
    for (rx, ry), ang, col in zip(ring_radii, ring_angles, [CYAN, GOLD, CYAN]):
        num_dashes = 16
        for d in range(num_dashes):
            sa = ang + (d * 360.0 / num_dashes)
            ea = sa + (180.0 / num_dashes)
            cv2.ellipse(glow_layer, (core_x, core_y), (rx, ry), int(ang * 0.1), int(sa), int(ea), col, 2, cv2.LINE_AA)

    # Central lens core pulse
    lens_pulse = 0.8 + 0.2 * math.sin(math.pi * 2 * t * 2)
    cv2.circle(glow_layer, (LENS_X, LENS_Y), int(18 * lens_pulse * zoom), WHITE, -1, cv2.LINE_AA)
    cv2.circle(glow_layer, (LENS_X, LENS_Y), int(45 * lens_pulse * zoom), CYAN, -1, cv2.LINE_AA)

    # 2. Energy streaks
    for s in streaks:
        head_f = ((t * s['speed'] + s['phase']) % 1.0)
        tail_f = max(0.0, head_f - s['len'])
        hx = int(LENS_X + (s['end'][0] - LENS_X) * head_f)
        hy = int(LENS_Y + (s['end'][1] - LENS_Y) * head_f)
        tx = int(LENS_X + (s['end'][0] - LENS_X) * tail_f)
        ty = int(LENS_Y + (s['end'][1] - LENS_Y) * tail_f)
        fade = math.sin(math.pi * head_f)
        if fade > 0.05:
            col = tuple(int(c * fade * s['alpha']) for c in s['color'])
            cv2.line(glow_layer, (tx, ty), (hx, hy), col, s['width'], cv2.LINE_AA)

    # 3. Node illumination pulses
    pulses = [
        (0.2, 1.5, NODES['payment'], CYAN),
        (2.7, 1.6, NODES['userDb'], RED),
        (5.2, 1.5, NODES['inventory'], CYAN),
        (7.6, 1.4, NODES['docMid'], CYAN),
        (8.4, 0.9, NODES['docBottom'], CYAN),
        (8.5, 1.0, NODES['docTop'], CYAN),
    ]
    for p_start, p_dur, target_pt, p_col in pulses:
        local_t = (t - p_start) % DURATION
        if 0 <= local_t < p_dur:
            progress = local_t / p_dur
            px = int(LENS_X + (target_pt[0] - LENS_X) * progress)
            py = int(LENS_Y + (target_pt[1] - LENS_Y) * progress)
            cv2.circle(glow_layer, (px, py), int(6 + 8 * (1 - progress)), p_col, -1, cv2.LINE_AA)
            cv2.circle(glow_layer, (px, py), 3, WHITE, -1, cv2.LINE_AA)
        since_arrival = local_t - p_dur
        if 0 <= since_arrival < 1.8:
            wave_k = since_arrival / 1.8
            wave_r = int(12 + 35 * wave_k)
            wave_alpha = (1.0 - wave_k) ** 2
            cv2.circle(glow_layer, target_pt, int(20 * (1 - wave_k)), tuple(int(c * wave_alpha) for c in p_col), -1, cv2.LINE_AA)
            cv2.circle(glow_layer, target_pt, wave_r, tuple(int(c * wave_alpha * 0.8) for c in p_col), 2, cv2.LINE_AA)

    # 4. Fine drifting particles
    for p in far_particles:
        px = int((p['x'] + p['ax'] * math.sin((2 * math.pi * t * p['m']) / DURATION + p['phase'])) % W)
        py = int((p['y'] + p['ay'] * math.cos((2 * math.pi * t * p['m']) / DURATION + p['phase'] * 1.3)) % H)
        tw = 0.4 + 0.6 * (0.5 + 0.5 * math.sin((2 * math.pi * t * p['tw']) / DURATION + p['phase']))
        cv2.circle(glow_layer, (px, py), int(p['r']), tuple(int(c * tw * 0.6) for c in p['color']), -1, cv2.LINE_AA)

    # 5. Foreground bokeh motes (near depth parallax)
    for p in near_particles:
        px = int((p['x'] + p['ax'] * 1.8 * math.sin((2 * math.pi * t) / DURATION + p['phase'])) % W)
        py = int((p['y'] + p['ay'] * 1.8 * math.cos((2 * math.pi * t) / DURATION + p['phase'] * 0.7)) % H)
        mote_r = int(p['r'] * (1.0 + 0.15 * dolly_progress))
        cv2.circle(glow_layer, (px, py), mote_r, tuple(int(c * 0.22) for c in p['color']), -1, cv2.LINE_AA)
        cv2.circle(glow_layer, (px, py), max(2, mote_r // 2), tuple(int(c * 0.35) for c in p['color']), -1, cv2.LINE_AA)

    # Soft optical light bloom
    glow_blurred = cv2.GaussianBlur(glow_layer, (0, 0), sigmaX=3.2, sigmaY=3.2)
    frame = cv2.add(frame, glow_blurred)

    # Write frame
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    writer.append_data(frame_rgb)

writer.close()
print(f"Render completed in {time.time() - t0:.1f}s.")

# Copy to landing assets as well
import shutil
shutil.copyfile(out_public, out_landing)
print("Updated video in both public/ and src/assets/landing/")
