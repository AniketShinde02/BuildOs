import pandas as pd

file_path = "d:\\Linkedin Automation\\PromptForge_Final_Assets_v5.xlsx"

# 1. Pipeline Sheet
pipeline_data = [
    {"Step": "STEP 1", "Action": "Analyze Client Product"},
    {"Step": "STEP 2", "Action": "Classify Garment"},
    {"Step": "STEP 3", "Action": "Research Similar Fashion Campaigns"},
    {"Step": "STEP 4", "Action": "Choose Matching Background"},
    {"Step": "STEP 5", "Action": "Generate Premium Indian Model"},
    {"Step": "STEP 6", "Action": "Generate Matching Background"},
    {"Step": "STEP 7", "Action": "Composite Product"},
    {"Step": "STEP 8", "Action": "Shadow Matching"},
    {"Step": "STEP 9", "Action": "Perspective Matching"},
    {"Step": "STEP 10", "Action": "Color Harmonization"},
    {"Step": "STEP 11", "Action": "Fabric Inspection"},
    {"Step": "STEP 12", "Action": "Realism Validation"},
    {"Step": "STEP 13", "Action": "Export"}
]

# 2. Background Library
# Generating 50 high-end commercial backgrounds
locations = [
    "Luxury Villa Courtyard", "Mediterranean Villa Balcony", "Jaipur Haveli", "Modern Boutique", "Hotel Lobby", 
    "Glass Corridor", "Stone Verandah", "Arched Walkway", "Museum Hall", "European Alley", 
    "Old Wooden Door", "Minimal Concrete Wall", "Soft Curtain Room", "Luxury Bedroom", "Cafe", 
    "Resort Balcony", "Garden Path", "Pool Deck", "Marble Hallway", "Royal Staircase", 
    "Wood Pavilion", "Terracotta Patio", "Colonial House", "Library", "Tea Estate", 
    "Palace Courtyard", "Textured Lime Wall", "Natural Clay Wall", "Greenhouse", "Whitewashed Village", 
    "Courtyard Cafe", "Farmhouse", "Courtyard Temple", "Sandstone Passage", "Luxury Apartment", 
    "Art Gallery", "Designer Studio", "Rustic Courtyard", "Boho Home", "Window Seat", 
    "Luxury Dressing Room", "Old Market Street", "Minimal Hotel Room", "Rain Balcony", "Fog Garden", 
    "Sunlit Terrace", "Indoor Courtyard", "Botanical Garden", "Desert Resort", "Mountain Lodge", "Lakeside Deck"
]
bg_library = []
for i, loc in enumerate(locations, start=1):
    bg_library.append({
        "ID": f"BG_{i:03d}",
        "Background Name": loc,
        "Indoor/Outdoor": "Outdoor" if "Garden" in loc or "Courtyard" in loc or "Deck" in loc or "Terrace" in loc or "Balcony" in loc else "Indoor",
        "Architecture": "Heritage" if "Haveli" in loc or "Palace" in loc else "Modern/Contemporary",
        "Wall Texture": "Stone/Marble/Plaster",
        "Floor Texture": "Marble/Wood/Tile",
        "Lighting": "Natural Golden Hour" if "Outdoor" else "Soft Diffused Studio",
        "Luxury Score": "9/10",
        "Works Best For": "Bridal, Heavy Ethnic" if "Heritage" in loc else "Casual, Pret, Modern Ethnic",
        "Avoid With": "Casual Western" if "Heritage" in loc else "Heavy Bridal"
    })

# 3. Dress vs Background Matrix
matrix_data = [
    {"Dress": "Black Floral Kurti", "Best BG": "Stone Courtyard", "Avoid BG": "Green Garden", "Reason": "Dress disappears into greenery"},
    {"Dress": "Ivory Anarkali", "Best BG": "Marble Hall", "Avoid BG": "Dark Cafe", "Reason": "Loss of elegance"},
    {"Dress": "Green Kurta", "Best BG": "Beige Villa", "Avoid BG": "Dense Garden", "Reason": "No subject separation"},
    {"Dress": "Red Festive Lehenga", "Best BG": "Royal Courtyard", "Avoid BG": "Bright Red Wall", "Reason": "Color conflict / Subject bleeding"}
]

# 4. Background Prompt Library
bg_prompts = []
for loc in locations[:10]: # Sample first 10 for deep prompts
    bg_prompts.append({
        "Positive Prompt": f"Professional e-commerce fashion background, {loc}, elegant composition",
        "Negative Prompt": "People, models, blurry, low resolution, CGI, fake, text, logo",
        "Lighting Prompt": "Soft directional natural sunlight, glowing ambient light",
        "Camera Prompt": "Shot on 35mm lens, f/2.8, professional DSLR",
        "Texture Prompt": "Highly detailed wall textures, realistic floor reflections",
        "Environment Prompt": "Clean foreground, subtle leading lines",
        "DOF Prompt": "Shallow depth of field, blurred background",
        "Realism Prompt": "Photorealistic, 8k, raw photography",
        "Color Prompt": "Warm natural color palette, cinematic grading"
    })

# 5. Model Prompt Library
model_prompts = [
    {
        "Category": "Premium Bridal",
        "Prompt Structure": "Photorealistic image of a beautiful young Indian female fashion model. Age 24. Beautiful expressive eyes, natural lips, soft blush. EXTREME REALISM: Visible skin pores, baby hair on hairline, ear shadows, collarbone shadows, eye reflections, slight skin texture variations. Minimal elegant makeup. Thick healthy hair. Natural asymmetry in facial features. Natural fabric gravity and wrinkles on clothing. Confident yet approachable. Luxury Indian fashion catalogue style, 8K, no AI artifacts."
    },
    {
        "Category": "Modern Pret",
        "Prompt Structure": "Photorealistic image of a beautiful young Indian female fashion model. Age 21. Natural wheatish skin. EXTREME REALISM: Visible skin pores, baby hair on hairline, ear shadows, collarbone shadows, eye reflections, slight skin texture variations. Messy soft waves. Natural asymmetry. Natural fabric gravity and wrinkles on clothing. Relaxed walking pose with weight shift. Luxury Indian fashion catalogue style, 8K, no AI artifacts."
    }
]

# 6. Human Realism Checklist
checklist_data = [
    {"Checklist Item": "Skin pores visible?", "Status": "[ ]"},
    {"Checklist Item": "Hair flyaways present?", "Status": "[ ]"},
    {"Checklist Item": "Ear shadows accurate?", "Status": "[ ]"},
    {"Checklist Item": "Collar shadows accurate?", "Status": "[ ]"},
    {"Checklist Item": "Ground shadow matches lighting?", "Status": "[ ]"},
    {"Checklist Item": "Contact shadow present under feet?", "Status": "[ ]"},
    {"Checklist Item": "Correct perspective?", "Status": "[ ]"},
    {"Checklist Item": "Fabric gravity looks natural?", "Status": "[ ]"},
    {"Checklist Item": "Natural clothing wrinkles?", "Status": "[ ]"},
    {"Checklist Item": "Ambient Occlusion correct?", "Status": "[ ]"},
    {"Checklist Item": "Slight chromatic aberration?", "Status": "[ ]"},
    {"Checklist Item": "Subtle film grain / sensor noise?", "Status": "[ ]"}
]

# Write to Excel
try:
    with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
        pd.DataFrame(pipeline_data).to_excel(writer, sheet_name="PIPELINE_SOP", index=False)
        pd.DataFrame(bg_library).to_excel(writer, sheet_name="BACKGROUND_LIBRARY", index=False)
        pd.DataFrame(matrix_data).to_excel(writer, sheet_name="DRESS_VS_BG_MATRIX", index=False)
        pd.DataFrame(bg_prompts).to_excel(writer, sheet_name="BG_PROMPT_LIBRARY", index=False)
        pd.DataFrame(model_prompts).to_excel(writer, sheet_name="MODEL_PROMPT_LIBRARY", index=False)
        pd.DataFrame(checklist_data).to_excel(writer, sheet_name="HUMAN_REALISM_CHECKLIST", index=False)
    print(f"Successfully created {file_path}")
except Exception as e:
    print(f"Error: {e}")
