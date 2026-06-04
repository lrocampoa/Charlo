import sys
from PIL import Image

def process_image(input_path, output_path, crop_box=None):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    # Make background transparent (black or near black)
    # Background is (0,0,0) or similar. Also (10, 15, 26) is the card background, but images have solid black.
    for item in data:
        # Check if the pixel is dark (r, g, b all < 25)
        if item[0] < 25 and item[1] < 25 and item[2] < 25:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    
    # Crop if a box is provided (left, upper, right, lower)
    if crop_box:
        img = img.crop(crop_box)
        
    # Get bounding box of non-transparent pixels to trim empty space
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")

tasks = [
    {
        "in": "/Users/fofoocampo/.gemini/antigravity/brain/505da8bd-cfe4-4aba-a066-6bc304209170/sandbox_tier_logo_1780553293791.png",
        "out": "/Users/fofoocampo/Charlo-Revamp/public/sandbox-v2.png",
        "crop": (0, 0, 1024, 800) # Remove text at bottom
    },
    {
        "in": "/Users/fofoocampo/.gemini/antigravity/brain/505da8bd-cfe4-4aba-a066-6bc304209170/starter_tier_logo_1780553315725.png",
        "out": "/Users/fofoocampo/Charlo-Revamp/public/starter-v2.png",
        "crop": (0, 0, 1024, 800) # Remove text at bottom
    },
    {
        "in": "/Users/fofoocampo/.gemini/antigravity/brain/505da8bd-cfe4-4aba-a066-6bc304209170/growth_tier_icon_1780541695546.png",
        "out": "/Users/fofoocampo/Charlo-Revamp/public/growth-v2.png",
        "crop": (0, 0, 1024, 1024) # No text
    },
    {
        "in": "/Users/fofoocampo/.gemini/antigravity/brain/505da8bd-cfe4-4aba-a066-6bc304209170/pro_tier_logo_1780553364834.png",
        "out": "/Users/fofoocampo/Charlo-Revamp/public/pro-v2.png",
        "crop": (0, 0, 600, 1024) # Text is on the right, keep left side
    }
]

for t in tasks:
    process_image(t["in"], t["out"], t["crop"])
    print(f"Processed {t['out']}")
