import pandas as pd
import os

file_path = "d:\\Linkedin Automation\\PromptForge_Final_Assets_v4.xlsx"

# 1. BANNER_CREATIVES
banner_data = [
    {
        "Category": "Hero Banner - Dresses / Ethnic Wear", 
        "Prompt Structure": "Professional e-commerce hero banner for ethnic fashion. Minimalist clean background, [Setting: e.g., soft beige studio/subtle outdoor courtyard]. Wide angle 16:9 aspect ratio. The model is positioned on the [right/left] side of the frame. Ample clean negative space on the opposite side for typography and website marketing copy. Cinematic commercial photography, soft diffused lighting, 8k resolution, ultra-detailed."
    },
    {
        "Category": "Hero Banner - Jewelry / Accessories", 
        "Prompt Structure": "Luxury e-commerce website banner for jewelry. Close-up macro photography of [Product: e.g., gold necklace] placed on a sleek marble podium. Dark rich background with warm spotlighting. 16:9 aspect ratio. The product is placed on the bottom right. Clean, empty negative space on the top left for text. High-fidelity, commercial advertising style, 8k."
    },
    {
        "Category": "Product Mockup - T-Shirts / Shirts", 
        "Prompt Structure": "Creative e-commerce product mockup banner for a t-shirt. The shirt is floating dynamically in the air against a vibrant solid [Color] background. 16:9 aspect ratio. Modern street-style aesthetic, sharp commercial lighting, sharp shadows. Large negative space area on the left side for promotional sale text. Highly detailed, 8k."
    },
    {
        "Category": "Sale / Promo Banner Background (No Model)", 
        "Prompt Structure": "Minimalist e-commerce sale banner background. Soft pastel color gradient. Clean 3D geometric podium in the center-right. 16:9 aspect ratio. Entirely empty space on the left for text overlay. Soft studio lighting, commercial 3D render style, clean and modern aesthetic. No text in the image."
    },
    {
        "Category": "Festive / Diwali Special Banner", 
        "Prompt Structure": "Festive Indian e-commerce website banner. Warm glowing diyas and marigold flowers placed in the corners. Rich maroon and gold backdrop, heavily blurred out of focus. 16:9 aspect ratio. Large clean negative space in the center for festive sale typography. Soft warm ambient lighting, highly detailed commercial photography."
    },
    {
        "Category": "Flatlay - Fashion / Apparel", 
        "Prompt Structure": "Top-down flatlay photography of fashion apparel laid neatly on a textured linen surface. Accented with subtle lifestyle props like dried flowers or sunglasses. 16:9 aspect ratio. The items are arranged on the right side. Clean, empty negative space on the left for website copy. Bright, even, diffused daylight."
    },
    {
        "Category": "Website Category Card (Square)", 
        "Prompt Structure": "E-commerce category navigation card. 1:1 square aspect ratio. Close-up detail of luxurious fabric texture and embroidery, heavily blurred background. Soft window lighting. Clean negative space at the bottom for category title text. Editorial fashion photography."
    }
]

# 2. BANNER_SOP
sop_data = [
    {
        "Step / Rule": "Aspect Ratio is King",
        "Description": "Always specify the aspect ratio for your banner. For website headers and hero sections, always use 16:9 (or 21:9 for ultra-wide). If your tool doesn't support 16:9 natively, generate 1:1 and outpaint/expand it."
    },
    {
        "Step / Rule": "Negative Space / Copy Space",
        "Description": "A banner without space for text is useless for a website. Always explicitly state: 'Ample clean negative space on the left/right for marketing copy.' Force the AI to put the subject on one side."
    },
    {
        "Step / Rule": "Negative Prompting",
        "Description": "AI loves to put fake text on banners. ALWAYS use negative prompts: 'No text, no letters, no logos, no typography, no watermarks.' You will add the real text later in Canva, Figma, or Shopify."
    },
    {
        "Step / Rule": "Consistency with Product Images",
        "Description": "If your main product images (the 600-700 catalog shots) have a warm beige studio theme, your website banners MUST use the same warm beige tones so the entire website looks like one unified brand."
    },
    {
        "Step / Rule": "Compositing Products into Banners",
        "Description": "For banners featuring specific products (like Yamuna Fashion dresses), generate an empty banner background first (e.g., 'Luxury courtyard with negative space'). Then composite the model + dress into it just like the regular catalog workflow."
    }
]

try:
    if os.path.exists(file_path):
        with pd.ExcelWriter(file_path, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            pd.DataFrame(banner_data).to_excel(writer, sheet_name="BANNER_CREATIVES", index=False)
            pd.DataFrame(sop_data).to_excel(writer, sheet_name="BANNER_SOP", index=False)
        print("Successfully added BANNER_CREATIVES and BANNER_SOP sheets to V3.")
    else:
        print(f"File {file_path} not found.")
except Exception as e:
    print(f"Error: {e}")
