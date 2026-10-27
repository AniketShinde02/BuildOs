import pandas as pd
import os

file_path = "d:\\Linkedin Automation\\PromptForge_Final_Assets_v3.xlsx"

troubleshooting_data = [
    {
        "Issue / Topic": "Safety Filter Blocked (NSFW)", 
        "Why it happens": "Google Flow has strict filters. Words like 'form-fitting', 'cleavage', or 'bodysuit' trigger blocks.", 
        "Exact Fix / Prompt Follow-up": "Use safe words. Say: 'modest elegant long plain kurti, fully covered, loose trousers.' Avoid mentioning body shapes."
    },
    {
        "Issue / Topic": "Face Changes When Swapping Dress", 
        "Why it happens": "The AI tries to generate a new person to match the new dress instead of keeping your saved model.", 
        "Exact Fix / Prompt Follow-up": "Always include: 'Maintain the exact facial features, hairstyle, and skin tone of the uploaded reference model.' Use character reference features if available."
    },
    {
        "Issue / Topic": "Lighting Looks Fake or 'Pasted On'", 
        "Why it happens": "The model was generated with bright studio light, but the background has warm sunset light. They don't blend.", 
        "Exact Fix / Prompt Follow-up": "Follow-up Prompt: 'Blend the subject seamlessly into the environment. Ensure the lighting on the model perfectly matches the lighting of the background. Cast realistic shadows on the floor.'"
    },
    {
        "Issue / Topic": "Dress Pattern/Embroidery is Distorted", 
        "Why it happens": "AI struggles with complex Indian ethnic wear embroidery and patterns.", 
        "Exact Fix / Prompt Follow-up": "Use Image-to-Image mode specifically on the dress area. Prompt: 'Keep the exact intricate embroidery pattern and fabric texture as shown in the uploaded dress image.'"
    },
    {
        "Issue / Topic": "Hands or Fingers Look Weird", 
        "Why it happens": "A common AI struggle when generating complex poses involving hands.", 
        "Exact Fix / Prompt Follow-up": "Follow-up Prompt: 'Fix hands, ensure natural realistic fingers.' If it keeps failing, generate poses where hands are hidden: 'hands behind back' or 'holding a dupatta to obscure hands'."
    },
    {
        "Issue / Topic": "Rate Limit Hit / Too Many Credits Consumed", 
        "Why it happens": "You tried to generate 50-100 images in one hour. Google Flow restricts rapid bulk generations.", 
        "Exact Fix / Prompt Follow-up": "Batch your work. Do 20 images in the morning, 20 afternoon. REUSE your saved base models and backgrounds to save credits."
    },
    {
        "Issue / Topic": "Dress Color Changes in Output", 
        "Why it happens": "AI sometimes alters the color based on the background lighting (e.g. making a white dress look yellow in sunset).", 
        "Exact Fix / Prompt Follow-up": "Follow-up Prompt: 'Strictly maintain the exact [COLOR] of the dress from the reference image, do not alter the garment color.'"
    },
    {
        "Issue / Topic": "Background is Distracting from the Dress", 
        "Why it happens": "You used a background prompt that is too complex, sharp, or colorful.", 
        "Exact Fix / Prompt Follow-up": "Follow-up Prompt: 'Make the background heavily blurred (bokeh effect, f/1.8 lens) so the focus remains entirely on the model and the dress.'"
    }
]

try:
    if os.path.exists(file_path):
        with pd.ExcelWriter(file_path, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
            pd.DataFrame(troubleshooting_data).to_excel(writer, sheet_name="TROUBLESHOOTING_&_TIPS", index=False)
        print("Successfully added TROUBLESHOOTING_&_TIPS sheet to V3.")
    else:
        print(f"File {file_path} not found. Ensure you are targeting the correct V3 file.")
except Exception as e:
    print(f"Error: {e}")
