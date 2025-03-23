# To-Do App

A personal to-do app with a dark theme built with Tailwind CSS, Express.js, and SQLite.

## Features

- Modern dark UI with bright accents
- Three priority columns: Urgent, Later, and Someday
- Drag and drop tasks between columns
- Task tags and due dates
- Task pinning for important items

## Local Development

1. Clone the repository
2. Navigate to the project directory
   ```
   cd todo-app
   ```
3. Install dependencies
   ```
   npm install
   ```
4. Build the CSS
   ```
   npm run build:css
   ```
5. Start the development server
   ```
   npm run dev:all
   ```
6. Open http://localhost:3000 in your browser

## Project Structure

```
todo-app/
├── public/
│   ├── css/
│   │   └── tailwind.css
│   ├── js/
│   │   ├── app.js
│   │   └── dragDrop.js
│   ├── index.html
├── server/
│   ├── database/
│   │   ├── schema.sql
│   │   └── db.js
│   ├── routes/
│   │   └── tasks.js
│   └── server.js
├── package.json
└── tailwind.config.js
```

## Deployment

This app can be deployed on Render using the included `render.yaml` configuration:

1. Connect your GitHub repository to Render
2. Render will automatically use the configuration in render.yaml
3. The application will be built and deployed automatically

## Running in PowerShell

If you're using PowerShell and encountering execution policy issues, you can run:

```
PowerShell -ExecutionPolicy Bypass -Command "npm run dev:all"
```
