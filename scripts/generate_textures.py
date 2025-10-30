from pathlib import Path
import urllib.request
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS = ROOT / 'assets_downloads'
OUTPUT = ROOT / 'public' / 'textures'
OUTPUT.mkdir(parents=True, exist_ok=True)


def save_webp(image: Image.Image, path: Path, quality: int = 95):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, 'WEBP', quality=quality, method=6)


def ensure_floor_sources():
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    expected = DOWNLOADS / 'WoodFloor044_2K-PNG_Color.png'
    if expected.exists():
        return
    archive_path = DOWNLOADS / 'WoodFloor044_2K-PNG.zip'
    if not archive_path.exists():
        url = 'https://ambientcg.com/get?file=WoodFloor044_2K-PNG.zip'
        print('Downloading parquet source from ambientCG…')
        urllib.request.urlretrieve(url, archive_path)
    with zipfile.ZipFile(archive_path, 'r') as archive:
        for member in archive.namelist():
            if member.startswith('WoodFloor044_2K-PNG_'):
                archive.extract(member, DOWNLOADS)


def convert_floor_textures():
    ensure_floor_sources()
    mapping = {
        'floor_baseColor.webp': 'WoodFloor044_2K-PNG_Color.png',
        'floor_normal.webp': 'WoodFloor044_2K-PNG_NormalGL.png',
        'floor_roughness.webp': 'WoodFloor044_2K-PNG_Roughness.png',
        'floor_ao.webp': 'WoodFloor044_2K-PNG_AmbientOcclusion.png',
    }
    for out_name, src_name in mapping.items():
        src_path = DOWNLOADS / src_name
        if not src_path.exists():
            raise FileNotFoundError(f"Missing source texture {src_name}")
        image = Image.open(src_path)
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGB')
        save_webp(image, OUTPUT / out_name)


def tileable_noise(size: int, seed: int = 0, blur: float = 6.0):
    rng = np.random.default_rng(seed)
    noise = rng.random((size, size), dtype=np.float32)
    shift = size // 2
    noise = (
        noise
        + np.roll(noise, shift, axis=0)
        + np.roll(noise, shift, axis=1)
        + np.roll(np.roll(noise, shift, axis=0), shift, axis=1)
    ) / 4.0
    shift_small = size // 3
    noise = (
        noise
        + np.roll(noise, shift_small, axis=0)
        + np.roll(noise, shift_small, axis=1)
    ) / 3.0
    image = Image.fromarray((noise * 255).astype(np.uint8))
    image = image.filter(ImageFilter.GaussianBlur(radius=blur))
    return np.array(image, dtype=np.float32) / 255.0


def height_to_normal(height: np.ndarray, strength: float = 1.0):
    gy, gx = np.gradient(height)
    gx *= strength
    gy *= strength
    nz = np.ones_like(height)
    length = np.sqrt(gx * gx + gy * gy + nz * nz)
    nx = gx / (length + 1e-6)
    ny = gy / (length + 1e-6)
    nz = nz / (length + 1e-6)
    normal = np.stack([(nx + 1) * 127.5, (ny + 1) * 127.5, nz * 255.0], axis=-1)
    return normal.astype(np.uint8)


def create_plaster(name: str, base_color: tuple[int, int, int],
                   tint_strength: float, rough_base: int, rough_variation: float,
                   size: int = 2048, seed: int = 0):
    height_np = tileable_noise(size, seed=seed, blur=5.0)

    color = np.zeros((size, size, 3), dtype=np.float32)
    for c in range(3):
        color[..., c] = base_color[c]
    variation = (height_np - 0.5) * 2 * tint_strength
    color = np.clip(color + variation[..., None], 0, 255)
    color_img = Image.fromarray(color.astype(np.uint8), mode='RGB')

    normal = height_to_normal(height_np, strength=4.0)
    roughness = np.clip(rough_base + (height_np - 0.5) * 255 * rough_variation, 0, 255)
    rough_img = Image.fromarray(roughness.astype(np.uint8), mode='L')

    save_webp(color_img, OUTPUT / f'{name}_baseColor.webp')
    save_webp(Image.fromarray(normal, mode='RGB'), OUTPUT / f'{name}_normal.webp')
    save_webp(rough_img, OUTPUT / f'{name}_roughness.webp')


def create_ceiling(name: str, base_color: tuple[int, int, int]):
    size = 2048
    height_np = tileable_noise(size, seed=23, blur=4.5)

    gradient = np.linspace(-12, 12, size, dtype=np.float32)
    gradient = gradient[:, None]
    color = np.zeros((size, size, 3), dtype=np.float32)
    for c in range(3):
        color[..., c] = base_color[c] + gradient * (0.4 if c == 0 else 0.2)
    variation = (height_np - 0.5) * 14
    color += variation[..., None]
    color = np.clip(color, 0, 255)
    color_img = Image.fromarray(color.astype(np.uint8), mode='RGB')

    normal = height_to_normal(height_np, strength=3.0)
    rough = np.clip(180 + (height_np - 0.5) * 80, 0, 255)
    save_webp(color_img, OUTPUT / f'{name}_baseColor.webp')
    save_webp(Image.fromarray(normal, mode='RGB'), OUTPUT / f'{name}_normal.webp')
    save_webp(Image.fromarray(rough.astype(np.uint8), mode='L'), OUTPUT / f'{name}_roughness.webp')


def create_trim_strip():
    width, height = 1024, 64
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    for y in range(height):
        t = y / height
        r = int(240 - 60 * t)
        g = int(217 - 80 * t)
        b = int(180 - 95 * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
    draw.rectangle((0, height - 8, width, height), fill=(0, 0, 0, 60))
    image = image.filter(ImageFilter.GaussianBlur(radius=1.5))
    image = image.crop((0, 4, width, height - 4))
    image = image.resize((width, 48), Image.BICUBIC)
    image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=60))
    image.save(OUTPUT / 'trim_strip.png')


def create_skylight():
    width, height = 1024, 512
    image = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(image)
    for x in range(width):
        t = x / (width - 1)
        r = int(250 - 20 * abs(t - 0.5))
        g = int(247 - 30 * abs(t - 0.5))
        b = int(242 - 40 * abs(t - 0.5))
        draw.line([(x, 0), (x, height)], fill=(r, g, b))
    rib_color = (206, 210, 216)
    for y in range(32, height, 72):
        draw.line([(0, y), (width, y)], fill=rib_color, width=3)
        draw.line([(0, y + 6), (width, y + 6)], fill=(255, 255, 255), width=1)
    save_webp(image, OUTPUT / 'skylight_strip.webp', quality=90)


def create_column():
    width, height = 512, 2048
    x = np.linspace(0, 1, width, dtype=np.float32)
    base = np.array([214, 193, 163], dtype=np.float32)
    highlight = np.array([245, 233, 205], dtype=np.float32)
    shade = np.array([189, 168, 138], dtype=np.float32)
    left = shade[None, :] * (1 - (x * 2).clip(0, 1))[:, None]
    mid = base[None, :] * (1 - np.abs(x - 0.5) * 2)[:, None]
    right = highlight[None, :] * ((x - 0.5) * 2).clip(0, 1)[:, None]
    gradient = left + mid + right
    gradient = np.clip(gradient, 0, 255)
    column = np.repeat(gradient[None, :, :], height, axis=0)
    v_shade = np.linspace(1.08, 0.78, height, dtype=np.float32)[:, None, None]
    column = column * v_shade
    column = np.clip(column, 0, 255).astype(np.uint8)
    image = Image.fromarray(column, mode='RGB')
    shadow = Image.new('L', (width, height), 0)
    sdraw = ImageDraw.Draw(shadow)
    sdraw.rectangle((0, height - 220, width, height), fill=140)
    sdraw.rectangle((0, 0, width, 160), fill=70)
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=32))
    shaded = Image.composite(image, Image.new('RGB', (width, height), (140, 120, 90)), shadow)
    save_webp(shaded, OUTPUT / 'column_plaster.webp', quality=95)


def create_arch():
    width, height = 1024, 512
    image = Image.new('RGBA', (width, height), (232, 214, 182, 255))
    draw = ImageDraw.Draw(image)
    arch_outline = Image.new('L', (width, height), 0)
    adraw = ImageDraw.Draw(arch_outline)
    adraw.pieslice((0, -width, width, width), 0, 180, fill=200)
    arch_outline = arch_outline.filter(ImageFilter.GaussianBlur(radius=6))
    image = Image.composite(Image.new('RGBA', (width, height), (198, 170, 128, 255)), image, arch_outline)
    draw.line([(width * 0.05, height * 0.92), (width * 0.95, height * 0.92)], fill=(156, 126, 86), width=10)
    draw.line([(width * 0.08, height * 0.92), (width * 0.92, height * 0.92)], fill=(255, 236, 204), width=4)
    draw.line([(width * 0.5, height * 0.15), (width * 0.5, height * 0.92)], fill=(174, 148, 112, 220), width=10)
    save_webp(image.convert('RGB'), OUTPUT / 'arch_span.webp', quality=95)


def create_backboard():
    size = 1024
    image = Image.new('RGB', (size, size), (186, 158, 128))
    vignette = Image.new('L', (size, size), 0)
    vdraw = ImageDraw.Draw(vignette)
    vdraw.ellipse((-size * 0.2, -size * 0.2, size * 1.2, size * 1.2), fill=180)
    vignette = vignette.filter(ImageFilter.GaussianBlur(radius=120))
    image = Image.composite(image, Image.new('RGB', (size, size), (162, 132, 101)), vignette)
    save_webp(image, OUTPUT / 'mounting_panel.webp', quality=95)


def create_plaque():
    width, height = 1024, 256
    radius = 80
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    base_color = (64, 48, 36, 240)
    draw.rounded_rectangle((0, 0, width, height), radius=radius, fill=base_color)
    highlight = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    hdraw = ImageDraw.Draw(highlight)
    hdraw.rounded_rectangle((12, 12, width - 12, height / 2), radius=radius // 2, fill=(255, 255, 255, 40))
    highlight = highlight.filter(ImageFilter.GaussianBlur(radius=6))
    image = Image.alpha_composite(image, highlight)
    image = image.filter(ImageFilter.GaussianBlur(radius=1.2))
    image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=80))
    save_webp(image, OUTPUT / 'plaque_base.webp', quality=95)


def create_frame():
    size = 2048
    image = Image.new('RGB', (size, size), (119, 86, 46))
    draw = ImageDraw.Draw(image)
    steps = 18
    for i in range(steps):
        inset = int(i * size / (steps * 10))
        intensity = int(60 + 110 * (i / steps))
        color = (min(intensity + 70, 255), min(intensity + 30, 255), min(intensity + 10, 255))
        draw.rectangle((inset, inset, size - inset, size - inset), outline=color, width=10)
    glow = Image.new('L', (size, size), 0)
    gdraw = ImageDraw.Draw(glow)
    gdraw.rectangle((0, 0, size, size), fill=190)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=80))
    image = Image.composite(Image.new('RGB', (size, size), (186, 143, 81)), image, glow)
    save_webp(image, OUTPUT / 'frame_gilded.webp', quality=95)


def main():
    convert_floor_textures()
    create_plaster('wall_lower', (210, 179, 150), tint_strength=22.0, rough_base=180, rough_variation=0.18, seed=12)
    create_plaster('wall_upper', (241, 232, 215), tint_strength=16.0, rough_base=200, rough_variation=0.12, seed=28)
    create_ceiling('ceiling', (240, 232, 214))
    create_trim_strip()
    create_skylight()
    create_column()
    create_arch()
    create_backboard()
    create_plaque()
    create_frame()


if __name__ == '__main__':
    main()
