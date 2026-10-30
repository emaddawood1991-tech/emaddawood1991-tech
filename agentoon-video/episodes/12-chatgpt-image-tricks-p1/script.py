"""Narration script + fixed 105 s schedule for Ep 12 (single source of truth for tts_slots.py and build.py)."""
PHR = []   # (id, start_s, spoken text, shown text, max_end_s)
PHR.append(("p00", 0.30, "Fifteen ChatGPT image tricks. Watch what one prompt can do.", "15 ChatGPT image tricks. Watch what one prompt can do.", 4.9))
PHR.append(("p01", 5.05, "These aren't built-in commands. They're fifteen powerful prompts you can copy and try.", "These aren't built-in commands. They're 15 powerful prompts you can copy and try.", 9.95))
T = [
 ("One, night fix. Brighten dark photos without turning night into day.", "One, nightfix. Brighten dark photos without turning night into day."),
 ("Two, photo restore. Bring old damaged photos back to life.", "Two, photorestore. Bring old damaged photos back to life."),
 ("Three, object remove. Erase distractions and rebuild the background.", "Three, objectremove. Erase distractions and rebuild the background."),
 ("Four, B G remove. Cut out the subject with a transparent background.", "Four, bgremove. Cut out the subject with a transparent background."),
 ("Five, out zoom. Extend the photo beyond its original edges.", "Five, outzoom. Extend the photo beyond its original edges."),
 ("Six, worm's eye view. Drop the camera to the ground, looking up.", "Six, wormseyeview. Drop the camera to the ground, looking up."),
 ("Seven, golden hour. Turn flat daylight into warm sunset light.", "Seven, goldenhour. Turn flat daylight into warm sunset light."),
 ("Eight, bokeh. Keep the subject sharp, blur the background softly.", "Eight, bokeh. Keep the subject sharp, blur the background softly."),
 ("Nine, reflection. Add believable reflections to shiny surfaces.", "Nine, reflection. Add believable reflections to shiny surfaces."),
 ("Ten, motion blur. Add cinematic speed behind a sharp subject.", "Ten, motionblur. Add cinematic speed behind a sharp subject."),
 ("Eleven, pro shot. Turn a casual portrait into a professional headshot.", "Eleven, proshot. Turn a casual portrait into a professional headshot."),
 ("Twelve, B G studio. Swap any background for a clean studio.", "Twelve, bgstudio. Swap any background for a clean studio."),
 ("Thirteen, food cinematic. Make an ordinary dish look editorial.", "Thirteen, foodcinematic. Make an ordinary dish look editorial."),
 ("Fourteen, product shot. Create a clean commercial product photo.", "Fourteen, productshot. Create a clean commercial product photo."),
 ("Fifteen, sketch to real. Turn a drawing into a realistic image.", "Fifteen, sketch2real. Turn a drawing into a realistic image."),
]
for i, (sp, sh) in enumerate(T):
    s = 10.0 + 5 * i; PHR.append((f"t{i+1:02d}", s + 0.35, sp, sh, s + 4.9))
PHR.append(("p17", 85.3, "Fifteen prompts. Fifteen transformations. Copy them, paste them, and try them on your own photos.", "15 prompts. 15 transformations. Copy them, paste them, and try them on your own photos.", 96.5))
PHR.append(("p18", 97.3, "Part one is done. Follow Agentoon dot A I, and get ready for part two.", "Part one is done. Follow Agentoon.ai, and get ready for part two.", 104.6))
TOTAL = 105.0
