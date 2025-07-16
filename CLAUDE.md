# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a notes application built with React and Vite, featuring a German interface ("Notizen" means "Notes" in German). The app allows users to create, store, and manage notes with a sidebar for folder organization and a main content area for note creation and viewing.

## Development Commands

### Root Level Scripts
- `npm run dev` - Start development server with Vite
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview the production build locally
- `npm run install:frontend` - Install frontend dependencies

### Common Development Tasks
- **Development server**: `npm run dev` (from root)
- **Linting**: `npm run lint` (from root)
- **Production build**: `npm run build` (from root)
- **Install dependencies**: `npm run install:frontend` (from root)

## Technology Stack
- **Frontend Framework**: React 19.1.0
- **Build Tool**: Vite 7.0.4
- **Styling**: Tailwind CSS 4.1.11 with @tailwindcss/forms plugin
- **Code Quality**: ESLint with React Hooks and React Refresh plugins
- **Language**: JavaScript (JSX)

## Project Structure
```
mynotes-app/
├── frontend/        - React frontend application
│   ├── src/
│   │   ├── App.jsx          - Main application component with Sidebar and MainContent
│   │   ├── main.jsx         - React application entry point
│   │   ├── index.css        - Tailwind CSS imports and custom styles
│   │   └── assets/          - Static assets (React logo)
│   ├── public/              - Public assets
│   ├── package.json         - Frontend dependencies and scripts
│   ├── vite.config.js       - Vite configuration
│   ├── tailwind.config.js   - Tailwind CSS configuration
│   ├── postcss.config.js    - PostCSS configuration
│   └── eslint.config.js     - ESLint configuration
├── package.json             - Root package.json with proxy scripts
├── README.md               - Project documentation
└── CLAUDE.md               - This file
```

## Architecture Notes

### Component Structure
- **App.jsx**: Contains the main application logic with two primary components:
  - `Sidebar`: Navigation component with folder structure (Persönlich, Arbeit, Projekte)
  - `MainContent`: Main note creation and display area
- **State Management**: Uses React hooks (useState) for local state
- **Responsive Design**: Mobile-first approach with sidebar toggle functionality

### Styling System
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Theme**: Extended with chat-themed colors:
  - `chat-dark: #202123`
  - `chat-main: #343541`
  - `chat-input: #40414f`
- **Forms Plugin**: Uses @tailwindcss/forms for better form styling

### Data Structure
Notes are stored as objects with:
- `id`: Timestamp-based unique identifier
- `title`: Note title
- `content`: Note content
- `synced`: Boolean flag (currently unused)
- `updatedAt`: ISO string timestamp

## Configuration Files
- **vite.config.js**: Vite configuration with React plugin
- **tailwind.config.js**: Tailwind CSS configuration with custom theme and forms plugin
- **eslint.config.js**: ESLint configuration with React-specific rules
- **postcss.config.js**: PostCSS configuration for Tailwind

## UI/UX Notes
- **Language**: German interface
- **Color Scheme**: Dark theme with chat-inspired colors
- **Typography**: Inter font family loaded from Google Fonts
- **Responsive**: Sidebar collapses on mobile devices
- **Form Handling**: Real-time input updates with controlled components