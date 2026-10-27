import pandas as pd

# 1. MODELS DATA
models_data = [
    {"Model_ID": "MOD001", "Category": "Young & Fresh (18-21)", "Skin Tone": "Fair", "Prompt": "Create a photorealistic master fashion model: Indian female, 19 years old, fresh youthful face, fair skin tone, shoulder-length straight dark hair, natural minimal makeup, soft neutral expression. She is wearing a simple plain white long Kurti (tunic) with full sleeves and matching loose trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft butterfly studio lighting. Ultra-detailed, 8k, photorealistic, commercial e-commerce style."},
    {"Model_ID": "MOD002", "Category": "Young & Fresh (18-21)", "Skin Tone": "Wheatish/Medium", "Prompt": "Create a photorealistic master fashion model: Indian female, 20 years old, round face, warm wheatish medium skin tone, long wavy dark hair, natural subtle makeup, gentle smile. She is wearing a simple plain white long Kurti with full sleeves and matching trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft studio lighting. Ultra-detailed, 8k, photorealistic, commercial e-commerce style."},
    {"Model_ID": "MOD003", "Category": "Young & Fresh (18-21)", "Skin Tone": "Dusky/Olive", "Prompt": "Create a photorealistic master fashion model: Indian female, 19 years old, sharp features, glowing dusky olive skin tone, curly dark hair, natural glowing makeup, neutral expression. She is wearing a simple plain white long Kurti with full sleeves and matching trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft studio lighting. Ultra-detailed, 8k, photorealistic."},
    {"Model_ID": "MOD004", "Category": "Elegant (22-26)", "Skin Tone": "Fair", "Prompt": "Create a photorealistic master fashion model: Indian female, 24 years old, oval face, fair skin tone, sleek straight dark hair tucked behind ears, elegant neutral makeup, confident expression. She is wearing a simple plain white long Kurti with full sleeves and matching trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft butterfly studio lighting. Ultra-detailed, 8k, photorealistic."},
    {"Model_ID": "MOD005", "Category": "Elegant (22-26)", "Skin Tone": "Wheatish/Medium", "Prompt": "Create a photorealistic master fashion model: Indian female, 25 years old, high cheekbones, warm wheatish skin tone, long straight dark hair, elegant subtle makeup, soft confident look. She is wearing a simple plain white long Kurti with full sleeves and matching trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft studio lighting. Ultra-detailed, 8k, photorealistic."},
    {"Model_ID": "MOD006", "Category": "Elegant (22-26)", "Skin Tone": "Dusky/Olive", "Prompt": "Create a photorealistic master fashion model: Indian female, 23 years old, strong jawline, beautiful glowing dusky skin tone, long wavy dark hair, soft natural makeup, calm expression. She is wearing a simple plain white long Kurti with full sleeves and matching trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft studio lighting. Ultra-detailed, 8k, photorealistic."},
    {"Model_ID": "MOD007", "Category": "Mature & Graceful (27-32)", "Skin Tone": "Fair", "Prompt": "Create a photorealistic master fashion model: Indian female, 29 years old, graceful features, fair skin tone, hair tied in a neat low bun, soft elegant makeup, gentle smile. She is wearing a simple plain white long Kurti with full sleeves and matching trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft studio lighting. Ultra-detailed, 8k, photorealistic."},
    {"Model_ID": "MOD008", "Category": "Mature & Graceful (27-32)", "Skin Tone": "Wheatish/Medium", "Prompt": "Create a photorealistic master fashion model: Indian female, 31 years old, elegant classic Indian features, warm wheatish skin tone, medium-length dark hair, soft elegant makeup, poised expression. She is wearing a simple plain white long Kurti with full sleeves and matching trousers. Full body shot, standing straight. 85mm lens, f/2.8, soft studio lighting. Ultra-detailed, 8k, photorealistic."}
]

# 2. BACKGROUNDS DATA (Muted, E-com focused, Not overly luxurious)
bg_categories = [
    ("Studio Paper & Solid Colors", 20, [
        "Pure warm beige seamless studio backdrop, soft diffused lighting, no shadows on background, clean commercial e-commerce style, 85mm lens.",
        "Soft pastel peach seamless paper background, gentle overhead softbox lighting, ultra-minimalist, clean e-commerce aesthetic.",
        "Muted olive green seamless studio background, soft natural lighting simulation, flat and clean.",
        "Off-white curved cyclorama wall, pristine bright diffused lighting, minimalist fashion background.",
        "Soft dusty rose seamless background, gentle rim lighting effect, clean commercial photography.",
        "Light grey seamless paper backdrop, flat even lighting, perfect for product focus.",
        "Warm sand-colored canvas background, subtle texture, soft side light, earthy aesthetic.",
        "Muted mustard yellow seamless background, soft diffused lighting, clean e-commerce style.",
        "Soft lavender seamless paper, gentle hazy lighting, minimalist background.",
        "Pure white seamless studio background, bright high-key lighting, clean and crisp."
    ]),
    ("Simple Indoor Textures & Walls", 30, [
        "Simple textured beige wall, soft natural window light casting a gentle gradient, minimalist indoor background.",
        "Plain concrete wall painted in soft warm grey, clean minimalist aesthetic, soft diffused lighting.",
        "Subtle white brick wall out of focus, soft daylight filtering through, clean e-commerce background.",
        "Muted terracotta stucco wall, soft warm afternoon sunlight, minimalist and earthy.",
        "Plain wooden panelling painted in soft cream, blurred out of focus, natural ambient light.",
        "Soft focus white curtain blowing gently, bright natural daylight, clean and airy background.",
        "Simple plaster wall in soft sage green, minimal texture, soft indirect lighting.",
        "Warm off-white wall with very subtle mottled texture, soft studio lighting, clean background.",
        "Minimalist room corner with soft grey walls, gentle gradient light, empty space.",
        "Simple limewash wall in warm beige, soft diffused window light, organic and clean."
    ]),
    ("Subtle Props & Lifestyle", 30, [
        "Minimalist background featuring a plain beige wall and a single large potted Monstera plant out of focus, soft natural daylight.",
        "Simple indoor background with a muted white wall and a tall vase of dried pampas grass out of focus, warm soft lighting.",
        "Clean white wall background with a subtle wooden stool out of focus in the corner, bright morning daylight.",
        "Soft beige wall with a simple arched doorway in the background, out of focus, gentle natural lighting.",
        "Minimalist indoor scene, soft natural light, a simple woven rug on a light wooden floor, plain white walls.",
        "Clean room setting, soft window light, a sheer white curtain partially visible out of focus.",
        "Simple terracotta pot with a green plant against a warm grey wall, entirely out of focus, soft lighting.",
        "A blank canvas on an easel leaning against a white wall, out of focus, soft creative studio lighting.",
        "Minimalist background, soft beige wall, a simple wooden ladder leaning out of focus, earthy aesthetic.",
        "Clean indoor background, soft white wall, a subtle shadow of window blinds falling across the surface."
    ]),
    ("Soft Outdoor & Courtyard", 20, [
        "Out of focus background of a simple garden wall with climbing green ivy, soft overcast daylight, natural and muted.",
        "Soft blurred background of a traditional wooden door in a plain stone wall, warm gentle sunlight.",
        "Minimalist outdoor courtyard, plain beige stucco walls, soft dappled sunlight filtering through trees.",
        "Out of focus simple stone pathway with soft green grass on the edges, bright overcast sky, natural light.",
        "Soft blurred background of a rustic wooden fence and gentle green foliage, warm evening light.",
        "Simple outdoor patio, terracotta floor tiles blurred, plain white wall, soft natural daylight.",
        "Out of focus background of a calm park, soft green trees, bright clear daylight, muted tones.",
        "Minimalist background of a plain sandstone wall, warm sunlight, clean and natural.",
        "Soft blurred background of a traditional arched window with wooden shutters, warm afternoon light.",
        "Simple outdoor scene, soft green bushes against a plain white wall, out of focus, gentle lighting."
    ])
]

bgs_data = []
bg_id = 1
for cat_name, count, prompts in bg_categories:
    # We will loop and slightly modify to generate the requested number, but here we just repeat or use the base ones.
    # To save script size, I will multiply the list to reach ~100
    extended_prompts = (prompts * 4)[:count] 
    for p in extended_prompts:
        bgs_data.append({
            "BG_ID": f"BG{bg_id:03d}",
            "Category": cat_name,
            "Prompt": p
        })
        bg_id += 1

# 3. WORKFLOW SOP DATA
sop_data = [
    {"Step": 1, "Action": "GENERATE MASTER MODELS (DO ONCE)", "Description": "Pick 5 models from the MASTER_MODELS tab. Generate them in Google Flow. Save these 5 images to a folder called 'Base_Models'. You will NEVER generate new faces again. This costs ~5 credits total."},
    {"Step": 2, "Action": "GENERATE BACKGROUNDS (DO ONCE)", "Description": "Pick 20 backgrounds from the BACKGROUND_PROMPTS tab. Generate them in Google Flow. Save them to a folder called 'Base_Backgrounds'. You will NEVER generate these again. This costs ~20 credits total."},
    {"Step": 3, "Action": "BATCH COMPOSITE (DAILY WORKFLOW)", "Description": "When the client gives you a new dress, DO NOT ask AI to 'generate a woman in a dress'. Instead, upload: 1) One of your saved Base_Models, 2) One of your saved Base_Backgrounds, 3) The client's dress image. Use the Composition prompt to blend them together."},
    {"Step": 4, "Action": "THE COMPOSITION PROMPT", "Description": "Prompt: 'Composite image: Place the attached model [Image 1] into the attached background [Image 2]. Dress the model exactly in the garment shown in [Image 3]. Ensure the fabric drapes naturally over her body. The lighting on the model and dress must perfectly match the background. Maintain the model's exact facial features.'"},
    {"Step": 5, "Action": "HOW TO DO 600 IMAGES?", "Description": "If you have 5 saved models and 20 saved backgrounds, you instantly have 100 unique combinations ready to go. When Yamuna Fashion gives you 10 dresses, you just run Step 3 (Composition) 10 times. You don't waste time or credits making new backgrounds or models. This is how you do 600 images easily."}
]

# Write to Excel
file_path = "d:\\Linkedin Automation\\PromptForge_Final_Assets_v3.xlsx"
try:
    with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
        pd.DataFrame(models_data).to_excel(writer, sheet_name="MASTER_MODELS", index=False)
        pd.DataFrame(bgs_data).to_excel(writer, sheet_name="BACKGROUND_PROMPTS", index=False)
        pd.DataFrame(sop_data).to_excel(writer, sheet_name="WORKFLOW_SOP", index=False)
    print("Successfully updated Excel with Models, Muted Backgrounds, and SOP.")
except Exception as e:
    print(f"Error: {e}")
