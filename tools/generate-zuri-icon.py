"""Original Zuri geometric app mark; Pillow is only needed to regenerate icons."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / "build"
size = 1024
icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(icon)
draw.rounded_rectangle((24, 24, 1000, 1000), radius=220, fill="#1F2937")
draw.polygon([(260, 270), (770, 270), (770, 376), (411, 660), (770, 660),
              (770, 770), (250, 770), (250, 664), (609, 380), (260, 380)], fill="#F09420")
icon.save(root / "icon.png")
icon.save(root / "icon.ico", sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
icon.save(root / "icon.icns")
(root / "icon.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect x="24" y="24" width="976" height="976" rx="220" fill="#1F2937"/><path d="M260 270H770V376L411 660H770V770H250V664L609 380H260Z" fill="#F09420"/></svg>\n')
