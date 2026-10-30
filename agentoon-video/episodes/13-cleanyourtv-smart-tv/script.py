"""Narration for Ep 13 (CleanYourTV). (id, scene, spoken, shown). The storyboard lines are verbatim; the extra support lines state only facts from the project README/SECURITY.md."""
PHR = [
 ("p1", "s1", "Your smart TV is packed with ads? Claude Code can help transform its home screen!", "Your smart TV is packed with ads? Claude Code can help transform its home screen!"),
 ("p2", "s2", "There's an open-source project called CleanYourTV that helps customize supported Android and Google TVs.", "There's an open-source project called CleanYourTV that helps customize supported Android and Google TVs."),
 ("p2b", "s2", "It's on GitHub under an M I T license, with an official site, cleanyour dot T V.", "It's on GitHub under an MIT license, with an official site, cleanyour.tv."),
 ("p3", "s3", "On your own TV, enable debugging, authorize your computer, and let the tool inspect what's installed.", "On your own TV, enable debugging, authorize your computer, and let the tool inspect what's installed."),
 ("p3b", "s3", "Your computer must be on the same Wi-Fi, and the TV asks you to allow it.", "Your computer must be on the same Wi-Fi, and the TV asks you to allow it."),
 ("p4", "s4", "It backs up your settings, then helps identify unwanted preinstalled apps and recommendations.", "It backs up your settings, then helps identify unwanted preinstalled apps and recommendations."),
 ("p4b", "s4", "Nothing is uninstalled. Apps are only disabled, and you decide what stays.", "Nothing is uninstalled. Apps are only disabled, and you decide what stays."),
 ("p5", "s5", "Then you can switch to a cleaner launcher, with your favorite apps and a more personalized home screen.", "Then you can switch to a cleaner launcher, with your favorite apps and a more personalized home screen."),
 ("p5b", "s5", "It's a small launcher with a dock, an app library and themes.", "It's a small launcher with a dock, an app library and themes."),
 ("p6", "s6", "And because the changes can be reversed, you can restore the previous setup if something doesn't work.", "And because the changes can be reversed, you can restore the previous setup if something doesn't work."),
 ("p6b", "s6", "It works on Android and Google TVs, not Samsung, LG or Roku. Turn debugging off afterward.", "It works on Android and Google TVs, not Samsung, LG or Roku. Turn debugging off afterward."),
 ("p7", "s7", "It won't remove every ad inside streaming apps, but it can make your TV home screen much cleaner. Follow Agentoon dot A I for more AI tools!", "It won't remove every ad inside streaming apps, but it can make your TV home screen much cleaner. Follow Agentoon.ai for more AI tools!"),
]
SCENES = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"]
GAP, SCENE_PAD, LEAD = 0.28, 0.35, 0.2
