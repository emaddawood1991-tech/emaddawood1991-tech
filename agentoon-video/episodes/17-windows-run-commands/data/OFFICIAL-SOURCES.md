# OFFICIAL SOURCES & VERIFICATION — Ep 17 (5 Windows Run commands), checked 2026-11-12
Sandbox limits: learn.microsoft.com and support.microsoft.com are NOT reachable from this environment. Microsoft's docs source files on GitHub were reachable for two topics only.
| Command | Opens | Verification |
|---|---|---|
| verifier | Driver Verifier Manager | VERIFIED from MicrosoftDocs/windowsserverdocs `verifier.md` and windows-driver-docs `driver-verifier.md` (copies in data/): "Running Driver Verifier can cause the computer to crash, so you should only run this utility on computers used for testing and debugging"; wizard options "Create standard settings", "Create custom settings", "Delete existing settings". |
| secpol.msc | Local Security Policy | NOT re-verified here (docs unreachable). Known behaviour: Password Policy settings such as Enforce password history, Maximum password age, Minimum password length, Password must meet complexity requirements. Not present on Windows Home editions: shown as a caveat, confirm on your edition. |
| tpm.msc | TPM Management on Local Computer | NOT re-verified here. Standard status text "The TPM is ready for use."; shown without made-up values. |
| fsmgmt.msc | Shared Folders (Shares, Sessions, Open Files) | NOT re-verified here. |
| sigverif | File Signature Verification | NOT re-verified here. |
Every window in the video is an ORIGINAL ILLUSTRATION (labelled "ILLUSTRATION · NOT A RECORDING"); no Windows logos or screenshots used.
MUST RECORD for FINAL: a real Windows 10/11 screen recording of Win+R → each command → the real window (your PC; blur any usernames/computer names). Do not run `verifier` to enable settings on a daily-use PC; opening the manager and cancelling is enough.
