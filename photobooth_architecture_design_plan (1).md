# Photobooth Application Project Plan

## 1. Project Overview
This project aims to build a standalone, kiosk-style photobooth application designed to run on tablets or mobile devices. Unlike traditional photobooth software that requires complex laptop setups and heavy dye-sublimation printers, this app interfaces directly with affordable, pocket-sized thermal mini-printers. The goal is to provide a seamless, highly optimized experience from photo capture to physical print within a single native application.

## 2. Architecture
The application will be built using a **React + Capacitor** technology stack.

*   **Frontend Framework:** React handles the UI state, template composition, image processing (Canvas API), and overall application logic.
*   **Native Bridge:** Capacitor wraps the React application, providing direct access to native device APIs (Bluetooth and Camera).
*   **Zero-Latency Camera Rendering:** Standard HTML5 `<video>` tags introduce unacceptable latency for high-resolution live feeds. We will utilize the `@capacitor-community/camera-preview` plugin. This architecture launches the native OS camera directly *beneath* the Capacitor webview. By setting the React application's background to `transparent`, the webview acts as an invisible UI layer floating over a perfectly smooth, zero-latency native camera feed.

## 3. Hardware & BLE Bypass Strategy
Interfacing with proprietary thermal mini-printers (such as the MXW01, C17, GT01) requires bypassing their official companion apps and communicating directly with the hardware via Bluetooth Low Energy (BLE).

*   **1-Bit Monochrome Rasterization:** These printers lack standard ESC/POS text support or grayscale capabilities. All outputs must be rendered in memory via an HTML5 Canvas, locked to a width of **384px** (standard 57mm thermal paper).
*   **Floyd-Steinberg Dithering:** Because thermal printers only understand binary dot states (burn or don't burn), standard thresholding would turn photos into unrecognizable black silhouettes. We will implement a Floyd-Steinberg error-diffusion algorithm to convert captured photos into a 1-bit stippled dot pattern that simulates continuous grayscale shading.
*   **The V5X Hardware Handshake:** The application connects via the GATT Service `0xAE30`. To unlock the hardware, the app must intercept a cryptographic challenge (`0x2221b3...`) upon connection and immediately respond with an **HMAC-SHA256** signature generated via Web Crypto.
*   **Pacing and Thermal Load Management:** Printing dense, dithered photos demands significantly more power than printing text receipts. To prevent battery voltage sag, hardware stalling, or printhead overheating:
    *   The thermal heating density command will be lowered from High/Medium to a safer threshold (e.g., 75-80).
    *   The LSB-first bit-packed raster data will be streamed in **384-byte chunks**, with the transmission delay intentionally increased to ~40-50ms between chunks to give the microcontroller time to burn the dense graphics.

## 4. UI/UX Design Inspiration
The user interface is heavily inspired by the companion app **"Fun Print"**. Fun Print is highly regarded for its clean, pastel-colored grid system and approachable hardware status indicators. 

We will adopt this highly accessible, foolproof structural layout but pivot the content strictly toward a Kiosk Photobooth Experience. Furthermore, we will elevate the aesthetic by stripping away emojis and relying entirely on bold typography, clean vector icons, and minimalist layouts for a more professional look.

## 5. Design Plan
The application will consist of five primary UI components:

1.  **Persistent Top Status Bar:**
    *   Visible across the application.
    *   Displays a pill-shaped indicator for BLE connection status (e.g., `[Connected: MXW01]` with a green dot, or `[Disconnected: Tap to Pair]`).
    *   Displays hardware vitals, specifically a battery gauge icon and percentage to monitor the rapid drain caused by thermal printing.
2.  **Home Screen Grid:**
    *   A two-column card layout displaying the core capture modes.
    *   Cards include: **Classic Strip** (3 vertical photos), **Polaroid Style** (Single square photo with writable border), **Themed Frames** (Custom event overlays), and **Operator Settings** (PIN-protected).
    *   Designed with large touch targets and distinct typography for immediate legibility in varying lighting conditions.
3.  **Guided Capture Screen:**
    *   Utilizes the transparent webview over the native camera feed.
    *   Features minimalist bounding boxes to guide subject placement.
    *   Displays a massive, high-contrast numerical countdown (3, 2, 1) followed by a screen flash effect.
4.  **Thermal Filter Preview Screen:**
    *   Sets guest expectations by running the captured photo through the live Floyd-Steinberg dithering algorithm, showing exactly what the thermal print will look like (pure black and white pixels).
    *   Includes essential **Brightness** and **Contrast** slider controls at the bottom, allowing guests to salvage photos taken in poor lighting before committing them to paper.
5.  **Print Bottom Sheet:**
    *   A bottom-sheet dialog that slides up for final confirmation.
    *   Includes a simple counter `[-] 1 [+]` to control print copies.
    *   Includes a segmented control for Print Density `[Low] [Medium] [High]`.
    *   Features a dominant primary action button ("Print Memory").
    *   Transitions into a clear progress indicator while the BLE chunks are streamed to the hardware.