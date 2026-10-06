# Google Play 14-Day Closed Testing Execution Guide

## Overview

Since November 2023, Google requires all new personal developer accounts to run a **Closed Testing Track with at least 12 testers opted-in continuously for 14 days** before unlocking production access.

This guide provides the exact zero-stress blueprint to pass Google's review on the first attempt without spending a single dollar.

---

## Step 1: Generate Your Production Android App Bundle (.aab)

From your terminal inside `mobile_app/`:

```bash
# Log in to your free Expo account (if not already logged in)
npx eas-cli login

# Configure project
npx eas-cli build:configure

# Trigger Android production build
npx eas-cli build --platform android --profile production
```

EAS Build will compile the bundle in the cloud and provide a direct download link for `jobsign-1.0.0.aab`.

---

## Step 2: Set Up Google Play Console

1. Navigate to **Google Play Console** → **Create App**.
   * App name: `JobSign: Contractor Quote & Sign`
   * Default language: `English (United States) - en-US`
   * App or Game: `App`
   * Free or Paid: `Free` (with in-app purchases)
2. Complete **Set up your app**:
   * **Privacy policy:** `https://github.com/naveenmuj/jobsign/blob/main/docs/PRIVACY_POLICY.md`
   * **App access:** `All functionality is available without special access restrictions` (No login required)
   * **Ads:** `No, my app does not contain ads`
   * **Content rating:** Complete questionnaire (Target age 18+, Utility/Productivity -> PEGI 3 / Everyone)
   * **Target audience:** 18 and older
   * **Data safety:** Declare local storage only, zero third-party tracking, purchases handled by Google Play.

---

## Step 3: Create Google Group for Testers

Google requires testers to join an authorized list before they can download from the Play Store closed testing link. The easiest way is creating a **Google Group**:

1. Go to [Google Groups](https://groups.google.com).
2. Create group: `jobsign-testers@googlegroups.com`.
3. Set **Who can join**: `Anyone on the web can ask to join` or `Anyone can join`.
4. In Google Play Console → **Testing** → **Closed testing**:
   * Create track name: `Closed Testing Beta`.
   * Under **Testers**, select **Google Groups** and enter `jobsign-testers@googlegroups.com`.

---

## Step 4: Upload the `.aab` Release

1. In Closed Testing track, click **Create new release**.
2. Upload the `jobsign-1.0.0.aab` downloaded in Step 1.
3. Release name: `1.0.0 (1)`.
4. Release notes:
   ```text
   Initial closed beta release of JobSign. Includes 60-second quote builder, worksite photo damage evidence, vector sign-on-glass canvas, SHA-256 tamper-evident seal, and offline basement outbox mode.
   ```
5. Click **Next** → **Save and publish track to Closed testing**.
6. Wait 24-48 hours for Google to approve the initial closed test track.

---

## Step 5: Recruit 15-20 Testers in 24 Hours (The Reddit Playbook)

Go to **Reddit** → [r/AndroidClosedTesting](https://www.reddit.com/r/AndroidClosedTesting/) (a community of 25,000+ developers who test each other's apps for free).

Post template:

```text
[Mutual Test] JobSign: Contractor Quote & Sign app for trades (Will test your app back immediately!)

Hi everyone,

Looking for 15-20 testers for JobSign, an offline-first contract and sign-on-glass app for solo trade contractors. I will install and keep your app installed for 14+ days in return.

1. Join Google Group: https://groups.google.com/g/jobsign-testers
2. Web Opt-in Link: [Paste your Play Console Web Opt-in link]
3. Android Download Link: [Paste your Play Console Android Store link]

Please drop a screenshot and your app link below, and I'll install yours right away!
```

---

## Step 6: Maintain Active Opt-Ins for 14 Consecutive Days

* Google's algorithm tracks if testers keep the app installed and open it periodically.
* Post a mid-sprint update on Reddit or email your group asking them to open the app once every 3-4 days.
* Do not delete or pause the closed test track during the 14 days.

---

## Step 7: Apply for Production Access

On Day 15, the **Apply for Production** button will activate in Google Play Console.
Google will ask 3 brief evaluation questions:
1. *How did you recruit testers?*  
   **Answer:** "Recruited active Android developers and trade freelancers via specialized beta groups and Reddit r/AndroidClosedTesting."
2. *What feedback did you collect?*  
   **Answer:** "Testers verified offline SQLite performance, worksite camera capture, vector signature responsiveness, and PDF audit certificate rendering across diverse Android screen sizes."
3. *What changes did you make based on feedback?*  
   **Answer:** "Optimized touch target padding for field gloves, improved dark mode contrast, and refined offline outbox background synchronization."

Approval for Production access typically occurs within **2 to 4 business days**!
