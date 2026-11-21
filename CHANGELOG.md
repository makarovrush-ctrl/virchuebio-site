# VirchueBio X changelog

What changed in each version of the platform at www.virchuebio.com. The newest version is at the top. The same list is on the website's "What's new" page and in both GitHub repositories (`virchuebio-site-source` and `virchuebio-site`). Dates are Sydney time.

How versions are numbered:

- **X.0** (for example 3.0): a new module, or a big change to how the platform works.
- **X.Y** (for example 2.1): new options or improvements to tools that already exist.
- **X.Y.Z** (for example 2.0.1): fixes, wording, and website-only updates such as the team page, translations or the legal pages.

Every update that changes what the website shows gets a new version number and an entry here before it is published. Set the same number in `site-config.json` (`platform.version`). `tools/publish.mjs` refuses to publish if the two don't match, or if the content changed but the version didn't. See the README, "Versions and the changelog".

## X 2.1 — 2026-11-21

One front door: "Open VirchueBio X" now opens a start page that takes your scan, your STL or your saved case.

### New

- **Start page.** "Open VirchueBio X" (top of every page and in the footer) opens a start page instead of going straight to the flow solver. Drop a CT or MR scan (a folder of DICOM slices), an STL or a saved case, and the page recognises it and opens the stage it belongs to: DICOM extraction, vessel preparation or the flow solver. If a drop holds both a scan and an STL, it asks which one to open. The files are read in your browser and are not uploaded. Under the drop zone, four cards open each stage directly.
- **Four-step bar.** Scan, Prepare, Flow and Thrombosis now appear at the top of every stage (in the header, or in a thin strip under it in the flow solver) and on the start page, so you can see where you are and move between stages. On narrow screens the bar is hidden; the start page has the same four stages as cards. The VirchueBio name in the DICOM and vessel-preparation headers now returns to the start page.

### Changed

- Each stage keeps its own file chooser and works on its own as before. The stages remain separate pages: the start page only recognises the file and passes it on (`tools/start.mjs`). The ForgeFlow build and the DICOM module are not edited; the hand-over and the bar are added when the site is built.
- The home page's "Start from a DICOM scan", "Load an STL" and "Run the demo" buttons still go straight to their stage.

### Record

- X 2.0.2's release record lists the original poster image for the workflow video. The poster that was uploaded was re-encoded on the way (same picture, 71,341 bytes instead of the original), so one file's hash differed from that record. This version's record carries the hash of the file that is actually served.

## X 2.0.2 — 2026-11-21

The home page now has a one-minute video of the whole workflow.

### Website

- New section "See the whole workflow" right under the headline: a 1 min 2 s video that follows one example from a CT scan (DICOM) to the 3D vessel, the prepared vessel, the blood-flow simulation and the Θ map. It has music and text on screen, and plays only when you press play. The existing getting-started video stays in "Start here".
- The video says plainly that the example is a synthetic scan, that run times depend on the vessel, and that the Θ risk bands are proposed and not yet calibrated.
- The same section is on the Chinese home page.

## X 2.0.1 — 2026-11-21

The home page now starts from a scan.

### Website

- **DICOM first.** The home page headline is now "From a CT scan to thrombosis insight", and its main button, "Start from a DICOM scan", opens DICOM vessel extraction. "Load an STL" stays next to it for anyone who already has a vessel surface.
- **Four stages instead of three.** "What the platform does" now starts with "Extract the vessel" (DICOM), followed by preparing the vessel, simulating blood flow and the thrombosis maps.
- **Six steps for your own case** now start with extracting the vessel from DICOM; step 2 prepares the vessel and its openings. "Patient geometry" in "How it works" says the same.
- The footer lists "Vessel from a DICOM scan" before "Prepare a vessel". The Chinese pages say all of this too.

## X 2.0 — 2026-11-21

Vessels straight from CT and MR angiography scans.

### New

- **DICOM vessel extraction** (built by Allan). Open a folder of CT or MR angiography slices and the page finds the vessel for you. It thresholds each slice, joins the slices into 3D structures, picks the most tube-like structure that isn't bone, and builds a smooth surface in millimetres, open where the vessel leaves the scan. Click structures in the list or on the image to add or remove them. Everything runs in the browser: the scan is never uploaded.
- **Example scan** to try it: a synthetic CT angiogram of the abdomen, with the aorta splitting into the two iliac arteries. It is computer-generated, not patient data.
- **Straight into vessel preparation.** "Open in vessel preparation" hands the surface over with its units set to millimetres, ready for you to review the openings. Vessel preparation also has a "Have a DICOM scan?" box that opens the new page.

### Fixed before release

- The surface came out as a mirror image of the anatomy, with left and right swapped. It now keeps the scan's orientation. Flow and Θ values were not affected.
- Voxel sizes are shown to two decimal places. A 0.75 mm slice spacing used to read as 0.8 mm; the calculation always used the exact value.

### Website

- This changelog, as the "What's new" page and as `CHANGELOG.md` on GitHub, with a version number for every update from now on.
- The home page, the footer and the Chinese pages point to the DICOM tool. The Privacy policy says that DICOM scans stay on the visitor's computer.

### Known limits

- Compressed DICOM and multi-frame ("enhanced") files can't be read yet. Export the series uncompressed, one file per slice.
- Research use only. The extracted surface depends on the brightness range and the scan quality: check it on the slices before you use it.

## X 1.0 — 2026-11-13

The first public version: vessel preparation, ForgeFlow rapid CFD and the FGT thrombosis number Θ in the browser, free for research use. Updates published while the platform was at 1.0 are listed by date; they did not have their own version numbers.

### 21 November 2026

- Republished the 18 November update. GitHub's deploy step had failed, so the English pages kept showing the previous version for two days while the Chinese pages were already up to date.

### 18 November 2026

- **Submit to VirchueBio.** Users can send their vessel, settings, latest results and report to the team's private Google Cloud storage. A dialog first says what will be sent, asks where the geometry comes from (a scan needs the "de-identified, and I may share it" tick) and asks for agreement to the Terms. Nothing is sent otherwise. Privacy policy and Terms updated, effective 18 November 2026.
- The report buttons in Experimental validation and Feedback say "Save my work", because they only save a file.
- Marking observed clots is easier to find: a "Mark clots" button in the header, a "Did clots form in this vessel?" card under the Θ result, and three numbered steps in the annotation view. Marks are kept until the mesh changes.
- Stop keeps the results so far instead of discarding the run.
- Getting-started video: three starter cases, from one minute to 45 minutes.
- Chinese website (简体中文) for Home, Our team, Community and Contact, with an EN | 中文 switch at the top right. The Chinese site name is 為楚生物科技.
- The platform is called VirchueBio everywhere (one word).
- Our team: Dr Yunduo (Charles) Zhao and Dr Haimei (Helen) Zhao joined; all five members in one row on wide screens; profile and LinkedIn links; Mackenzie's titles and her RTP scholarship acknowledgement.

### 17 November 2026

- Allan's 3D changes: the convergence chart is the first results panel, wall results are drawn on the smooth STL surface, and the voxel boundary is off by default.
- The 3D view no longer shakes during a run.
- Visit counts with GoatCounter: no cookies, no IP addresses kept.
- Terms and Privacy list the team's university email addresses.

### 16 November 2026

- Review fixes in the app: Θ works on the built-in examples and plain STL files; the wall-shear factor is applied only where it belongs; no false gradient next to openings; five library vessels ran at one thousandth of their intended flow; a false outlet in the Coronary LAD example; more ways to enter the inlet flow; clearer messages for STL files that can't be meshed directly and for STL units; pulsatile runs warn when the iteration limit is too low; Clinician mode asks before clearing a run.
- An Info tab collects the explanatory notes, "Run the demo" walks through every step, and a "Results & Θ" button opens the results column in narrow windows.

### 13 November 2026

- The platform's name and version, VirchueBio X v1.0, with the website's styling in the app.
- The FGT preprint is cited on the home and team pages.
- The app is built from ForgeFlow build `c2e3ebea`.

### 12 November 2026

- The website opened at www.virchuebio.com: home, team, community and contact pages, the "How it works" animation, Terms of use and Privacy policy, and the app under /app with the method details removed from the public copy.
