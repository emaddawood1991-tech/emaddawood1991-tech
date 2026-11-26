# Episode 26 (Windows + R, Part 9): BLOCKED on real Windows 11 capture
This session runs on Linux (cloud container). No Windows machine is attached (list_computer_folders returned no folders). The brief forbids simulated Windows UI, so no Windows footage has been made and no video has been rendered.

## Unblock options
1. Attach your Windows 11 PC (Claude desktop app > Settings > Claude Code > Remote Control), then I can record on it.
2. Run `scripts/record_windows.ps1` (UNTESTED, written without a Windows machine) on your PC and give me the MP4s in `recordings/`.
3. Record the five clips yourself (list below) at 1920x1080, cursor visible.

## MUST RECORD (one clip each, 12-15 s; do NOT change any setting)
41 Win+R, type `taskschd.msc`, Enter; click Task Scheduler Library; select a harmless task; show Triggers, Actions, Status, Next Run Time. No run/disable/delete.
42 `shrpubw`; welcome page; Next to folder page only; Cancel. No share created.
43 `SystemPropertiesRemote`; Remote tab; show Remote Assistance and Remote Desktop areas; note your Windows edition (Home cannot host Remote Desktop). Cancel.
44 `ms-settings:signinoptions`; scroll to PIN and Windows Hello (fingerprint/face if present). Do not click Set up.
45 `ms-settings:windowsupdate-history`; expand Quality/Security updates; show names and dates. No uninstall.
Plus: 5 s of the keyboard (Win + R) if you want a real-keyboard shot; I will otherwise animate a keyboard graphic (clearly a graphic, not Windows).
Before recording: hide username, PC name, email, account photo, notifications (Focus assist on), private tasks/folders.

## Facts to verify on the live PC (unverified from here)
Each command opens the expected app; your Windows edition; whether fingerprint/face rows exist; Update History entries.
