# LLE Reviewer

A mobile application for compiling **Librarians Licensure Examination (LLE)** reviewer materials based on the official **Table of Specifications (TOS)** from the PRC Board for Librarians.

## Features

### TOS-Aligned Organization
Browse all 6 LLE exam subjects with their official course outlines:
- **Day 1:** Library Organization & Management (20%), Reference/Bibliography/User Services (20%), Indexing & Abstracting (15%)
- **Day 2:** Cataloging & Classification (20%), Selection & Acquisition (15%), Information Technology (10%)

### Reading Material Compiler
Create reading materials for any TOS topic with a rich block-based editor:
- **Text** paragraphs and section headings (H1–H3)
- **Images** with captions (from photo library)
- **Tables** with addable rows and columns
- **Quotes** for highlighted excerpts
- **Citations** to credit authors inline

### Citation Manager
Add and manage bibliographic references with support for:
- Books, journal articles, websites, theses, and reports
- Auto-formatted citations for bibliography generation

### Book Compiler
Compile your reading materials into a complete reviewer book:
- Arrange sections in custom order
- Optional auto-generated bibliography
- **Export to PDF** and share

## Getting Started

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) app on your phone (for testing), or Android/iOS emulator

### Install & Run

```bash
npm install
npm start
```

Then scan the QR code with Expo Go (Android) or the Camera app (iOS).

### Platform Commands

```bash
npm run android   # Open on Android emulator/device
npm run ios       # Open on iOS simulator (macOS only)
npm run web       # Run in browser
```

## Workflow

1. **Browse TOS** — Navigate subjects and topics from the TOS tab
2. **Add Citations** — Register your reading sources in the Citations tab
3. **Write Materials** — Tap a TOS topic → Add Reading Material → compose with text, images, tables, and citations
4. **Compile Book** — Create a book project in the Books tab, add your materials as sections, and export as PDF

## TOS Reference

Based on PRC Board for Librarians:
- Resolution No. 07, Series of 2006 (Syllabi)
- Resolution No. 02, Series of 2009 (Table of Specifications)

## Tech Stack

- [Expo](https://expo.dev/) + React Native (cross-platform mobile)
- Expo Router (file-based navigation)
- AsyncStorage (local data persistence)
- Expo Print & Sharing (PDF export)

## License

MIT
