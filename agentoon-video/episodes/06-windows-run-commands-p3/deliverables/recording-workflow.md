# Recording workflow: 4 real Windows clips (about 6 minutes, nothing is changed)

I cannot run Windows here (Linux sandbox), so the preview uses a labeled schematic. Real recordings replace it.

Setup: Windows 10/11, display 1920x1080 or larger, Game Bar (Win+G) or OBS, mouse pointer visible, notifications off (Focus assist), close other windows, no personal files or emails visible.

Record 5 short clips (landscape is fine; I crop to the window):
1. win_r (6 s): desktop, press WIN+R, Run dialog opens (empty).
2. power (6 s): in Run type `powercfg.cpl`, Enter, wait 3 s with the plans visible. (If only "Balanced" shows, click "Show additional plans", it only changes the view.)
3. reliability (7 s): Run `perfmon /rel`, Enter, wait 4 s on the chart; click a red X day only if you like (it only selects).
4. restore (6 s): Run `rstrui.exe`, Enter, wait 3 s on the first wizard page. Then press Cancel. DO NOT click Next or Finish.
5. memdiag (6 s): Run `mdsched.exe`, Enter, wait 3 s on the dialog. Then close it with X. DO NOT click "Restart now".

Safety: never start a restore, never restart, never run the diagnostic. If UAC appears, you may record the prompt and choose Yes (rstrui/mdsched) or No.
Send the clips (mp4). I set each slot in data/slots.json to verified, add the highlight rectangle, rebuild and render.
