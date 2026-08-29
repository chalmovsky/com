---
title: "Samsung Magician disk utility takes 18 steps and two Recovery Mode reboots to uninstall"
date: 2026-03-29
description: "A disk utility with no uninstaller, 500 failed chown calls, an embedded Electron runtime, and four kernel extensions that survive sudo rm -rf."
---

Every time I utter the phrase "Samsung Magician," a fully formed plan for reinstating the
Inquisition is presented to me, whose sole goal is to burn this Magician at the stake.

What kind of fucking name is that anyway? "Samsung Magician" - for a disk utility? Who greenlit this? Who sat in a
meeting and said "yeah, Magician, like it does magic" ?

The actual steps are at the end, now sit back and let me take you on a wonderful journey full of wonder way down
into the Samsung shitter. We will find exactly what we expected, but more of it.

## What even is this and why did I even need to install it?

I needed to set an encryption password on my T7 Shield SSD portable drive. To take advantage of the drive's hardware encryption engine,
I needed to use Samsung's Magician software.
I installed it. It didn't work. I wanted it gone. So I started to look at how to remove this software.

## Samsung Magician's uninstaller: tries 500 things, fails 500 times, tells you nothing useful, removes nothing

First, there's no uninstaller. Samsung - a trillion-dollar company - ships Mac software with no uninstall button. No drag-to-trash.
Nothing.

So I've dug around and found a cleanup script buried six folders deep inside the app bundle. Let's try to run it:

```
sh ~/Library/'Application Support'/Samsung/'Samsung Magician'/SamsungMagician.app/Contents/Resources/CleanupMagician_Admin_Mac.sh
```

It ran. And my kitty exploded. Sweet kitty overflowed. Hundreds - literally hundreds - of lines of `chown: Operation not permitted`.
The script's grand strategy for uninstalling itself is to change the ownership of every single file, one by one, so it can
then delete them. Except macOS blocks every single attempt. Five hundred `chown` errors. The script doesn't
stop, doesn't catch the errors, doesn't try plan B. It just keeps slamming its head into the wall for every file and then finishes
like "yep, all done boss." So, at this stage the files are all still there.

## I'll do it myself

I `rm -rf` every Samsung folder I could find. The Preferences. The Caches. The LaunchAgents. The LaunchDaemons.
The kernel extensions. The crash reports. I run eight, nine, ten separate `rm -rf` commands targeting different corners
of the filesystem where normal applications would usually be:
```
~/Library/Application Support/Samsung
~/Library/Preferences/com.samsung.*
~/Library/Caches/com.samsung.*
~/Library/Logs/Samsung*
/Applications/Samsung Magician.app
~/Library/LaunchAgents/com.samsung.*
/Library/LaunchDaemons/com.samsung.*
/Library/Extensions/*amsung*
/Library/Application Support/Samsung
```

Then I run `find / -iname "*samsung*magician*"` to check. 27 files STILL THERE!!!
After the cleanup script. After nine manual delete commands, 27 files are still on my machine, scattered across locations like:

- Kernel extensions in `/Library/StagedExtensions/` (dead drivers that macOS won't let you touch)
- The same kernel extensions AGAIN in `/System/Volumes/Data/Library/StagedExtensions/` (because macOS mirrors them,
  so you get to see them twice)
- Package receipts in `/private/var/db/receipts/` (Samsung left its receipts behind like a burglar leaving a bunch
  of turds in the living room)
- Cached processes in `/private/var/folders/7v/<your username hash>/C/` (yes, Samsung is in there too)
- A crash reporter list (because of course it crashed at some point)
- And a `Samsung Magician` folder in Application Support that somehow survived everything

So I ran more `sudo rm -rf`.

I ran `find` one final time and eight files remained.


## The hateful eight in the Kernel mausoleum
And so at last, Samsung Magician performs its final and greatest trick. Behold, ladies and gentlemen!
Step right up! Watch in awe as four dead files defy deletion, survive every command thrown at them, and take up
permanent residence in the deepest, most protected vault your operating system has. `sudo rm -rf`? Pathetic.
These files aren't going anywhere.

Now, I can't stand any trace of it, you see. I want it gone.

I shut down my Mac. Held the power button. Booted into Recovery Mode. Opened Terminal. Ran `csrutil disable`. Rebooted.
Opened Terminal. Deleted the kernel extensions. Ran `find` to confirm they're gone. Shut down AGAIN.
Booted into Recovery Mode AGAIN. Ran `csrutil enable`. Rebooted AGAIN. All this just to delete four dead files
and their mirrors from a disk utility.

In other words, two reboots into Recovery Mode to remove four dead files from a disk utility
that didn't even fucking work in the first motherfucking place.



----------------------- 



## The real discovery
The most insane thing wasn't the absurd difficulty of removing it. It was the Magician's insides.

Samsung Magician comes with frame-by-frame PNG animation sequences. For a spinning circle. There are over 150 individually
numbered PNG files called things like `Circle motion_00001.png` through `Circle motion_00149.png` just to show you a
little animation that says "Health: Good." That's not a joke. A team of Samsung engineers built this,
a project manager approved it, QA tested it (allegedly), and at no point in that entire chain did a single human
being raise their hand and say: "hey, should a disk utility really ship with 150 hand-numbered PNGs of a spinning circle?"

And it gets better. There's a separate set of 150 PNGs for "Health: Critical." And another set for a "gamer" theme.
And another set for fingerprint progress animations.
And fingerprint success animations. We're talking about hundreds upon hundreds of individual PNG files for decorative
animations in a DISK UTILITY.

## But wait, there's more! Samsung Magician includes:

- An entire **Electron framework** - yes, they embedded a full Chromium browser engine to show you a pie chart of your disk space
- **Squirrel framework** - an auto-update framework, because what if this nightmare were to end too early?
- **ReactiveObjC** and **Mantle frameworks** - reactive programming frameworks, for a disk checker
- Custom **Samsung fonts** in multiple weights (200, 300, 400, 450, 500, 600, 700, 800) because apparently system fonts
  aren't good enough for displaying "128GB free"
- **Localization files for every language on Earth** - Korean, Japanese, Chinese, German, French, Italian, Russian,
  Portuguese, Spanish, Arabic, Hindi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Marathi, Urdu, Swahili, Filipino,
  Afrikaans - Samsung really wanted to make sure everyone on the planet could experience this suffering equally
- **Banner advertisement JPGs** (banner_1.jpg through banner_5.jpg) - that's right, the app that you installed to manage
  your hardware shows you ads
- Help documentation with 40+ screenshots in 10 languages

Samsung Magician is an infestation. It's a monument to bloat,
a love letter to unnecessary software and corporate bullshit, and a huge meaty middle finger to every user who just wanted to set
a password on their portable drive.

## In conclusion, the 18 steps to uninstall Samsung Magician

1. Look for an uninstall button in the app. There isn't one.
2. Find Samsung's cleanup script buried six folders deep inside the app bundle.
3. Run it. Watch 500 `chown: Operation not permitted` errors waterfall down your terminal. Nothing is removed.
4. Manually `rm -rf` the main Samsung folder in Application Support.
5. Manually delete Samsung preferences.
6. Manually delete Samsung caches.
7. Manually delete Samsung LaunchAgents.
8. Manually `sudo` delete Samsung LaunchDaemons.
9. Manually `sudo` delete Samsung kernel extensions from `/Library/Extensions`.
10. Run `find`. Discover 27 files still remaining across six different system directories.
11. Manually delete the SECOND Samsung Magician folder in Application Support (yes, there were two).
12. Manually delete crash reporter plists.
13. Manually `sudo` delete package receipts from `/private/var/db/receipts`.
14. Manually delete cached processes from `/private/var/folders`.
15. Run `find` again. Eight kernel extension files remain, protected by SIP.
16. Shut down Mac. Boot into Recovery Mode. Disable SIP. Reboot.
17. Delete the SIP-protected kernel extensions.
18. Shut down Mac. Boot into Recovery Mode AGAIN. Re-enable SIP. Reboot AGAIN.