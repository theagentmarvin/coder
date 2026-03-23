# BIM Project Manager

A BIM-themed project management web app built with React, TypeScript, and Tailwind CSS. Features the Google Stitch UI design with full project and task management capabilities.

## Features

- **Project Management**: Create, edit, and delete BIM projects with custom categories
- **Task Management**: Add todos with status tracking (pending, in progress, completed, urgent)
- **Project Icon**: Automatic initials extraction with random background colors
- **Import/Export**: Export projects as JSON and import them back
- **Persistent Storage**: All data saved to localStorage
- **Responsive Design**: Works on desktop and mobile devices
- **Google Stitch UI**: Modern dark theme with custom color palette

## Tech Stack

- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management with localStorage persistence)
- React Router DOM (routing)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
cd bim-project-manager

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deployment

### Firebase Hosting

1. **Install Firebase CLI** (if not already installed):
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**:
```bash
firebase login
```

3. **Initialize Firebase** (first time only):
```bash
firebase init hosting
```

Select the following options:
- Select an existing Firebase project or create a new one
- What do you want to use as your public directory? → `dist`
- Configure as a single-page app? → `No`
- Set up automatic builds? → `No`

4. **Deploy**:
```bash
firebase deploy
```

The app will be deployed to `https://your-project-id.web.app`

### GitHub Pages (Alternative)

```bash
# Build the app
npm run build

# Deploy to GitHub Pages (using gh-pages or similar)
npx gh-pages -d dist
```

## Project Structure

```
bim-project-manager/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── TodoCard.tsx
│   │   └── TodoForm.tsx
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   └── ProjectDetail.tsx
│   ├── store/          # Zustand store
│   │   └── useStore.ts
│   ├── types/          # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/          # Utility functions
│   │   ├── constants.ts
│   │   └── validation.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Challenge Requirements Met

1. ✅ **Project Icon**: First two letters, uppercase, random colors
2. ✅ **Random Icon Colors**: 6 predefined colors for project icons
3. ✅ **Input Validation**: Project name must be ≥5 characters
4. ✅ **Default Date**: Automatically set to current date if not provided
5. ✅ **Update Project**: Edit project details from project detail page
6. ✅ **Create Todos**: Add tasks inside project detail page
7. ✅ **Export Project**: Download project as JSON file
8. ✅ **Import Project**: Upload JSON to import/merge projects
9. ✅ **Todo Status Colors**: Color-coded left border based on status

## Color Palette

The app uses a custom dark theme inspired by Google Stitch:

- Primary: `#a8e8ff` (light cyan)
- Primary Container: `#00d4ff`
- Secondary: `#ffb59d` (coral)
- Secondary Container: `#b83900`
- Tertiary: `#ffd9a1`
- Tertiary Container: `#feb528`
- Background: `#0f131e`
- Surface: `#0f131e`
- Surface Container: `#1b1f2b`
- Error: `#ffb4ab`

## License

MIT
